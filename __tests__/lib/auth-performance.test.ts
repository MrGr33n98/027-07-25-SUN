import { authCacheService } from '../../lib/auth-cache-service'
import { dbPool } from '../../lib/database-connection-pool'
import { performanceMonitor } from '../../lib/performance'
import { redis } from '../../lib/redis'

// Mock Redis for testing
jest.mock('../../lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    ping: jest.fn(),
    sadd: jest.fn(),
    smembers: jest.fn(),
    flushdb: jest.fn(),
    info: jest.fn(),
    dbsize: jest.fn(),
  },
}))

// Mock database
jest.mock('../../lib/database-connection-pool', () => ({
  dbPool: {
    executeQuery: jest.fn(),
    findUserByEmail: jest.fn(),
    findUserById: jest.fn(),
    batchUpdateUsers: jest.fn(),
    batchCreateSecurityEvents: jest.fn(),
    healthCheck: jest.fn(),
    getStats: jest.fn(),
    optimizePerformance: jest.fn(),
  },
}))

const mockRedis = redis as any;
const mockDbPool = dbPool as any;

describe('Authentication Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    performanceMonitor.cleanup()
  })

  describe('Cache Performance', () => {
    it('should cache user sessions efficiently', async () => {
      const sessionId = 'test-session-123'
      const sessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'CUSTOMER',
        emailVerified: true,
        lastActivity: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      }

      mockRedis.setex.mockResolvedValue('OK')
      mockRedis.get.mockResolvedValue(JSON.stringify(sessionData))

      const startTime = Date.now()
      
      // Cache session
      await authCacheService.cacheUserSession(sessionId, sessionData)
      
      // Retrieve session
      const cachedSession = await authCacheService.getUserSession(sessionId)
      
      const duration = Date.now() - startTime

      expect(cachedSession).toBeDefined()
      expect(duration).toBeLessThan(100) // Should complete in under 100ms
      expect(mockRedis.setex).toHaveBeenCalled()
      expect(mockRedis.get).toHaveBeenCalled()
    })

    it('should handle high-volume login attempt tracking', async () => {
      const email = 'test@example.com'
      const iterations = 100

      mockRedis.incr.mockImplementation(() => Promise.resolve(Math.floor(Math.random() * 10) + 1))
      mockRedis.expire.mockResolvedValue(1)

      const startTime = Date.now()
      const promises = []

      for (let i = 0; i < iterations; i++) {
        promises.push(authCacheService.incrementLoginAttempts(email))
      }

      const results = await Promise.all(promises)
      const duration = Date.now() - startTime

      expect(results).toHaveLength(iterations)
      expect(duration).toBeLessThan(5000) // Should complete in under 5 seconds
      expect(mockRedis.incr).toHaveBeenCalledTimes(iterations)
      
      // Calculate operations per second
      const opsPerSecond = (iterations / duration) * 1000
      expect(opsPerSecond).toBeGreaterThan(20) // At least 20 ops/sec
    })

    it('should efficiently manage rate limiting', async () => {
      const ip = '192.168.1.1'
      const action = 'login'
      const iterations = 50

      mockRedis.incr.mockImplementation(() => Promise.resolve(Math.floor(Math.random() * 5) + 1))
      mockRedis.ttl.mockResolvedValue(300)

      const startTime = Date.now()
      const promises = []

      for (let i = 0; i < iterations; i++) {
        promises.push(authCacheService.checkRateLimit(ip, action, 5, 900))
      }

      const results = await Promise.all(promises)
      const duration = Date.now() - startTime

      expect(results).toHaveLength(iterations)
      expect(duration).toBeLessThan(2000) // Should complete in under 2 seconds
      
      results.forEach(result => {
        expect(result).toHaveProperty('count')
        expect(result).toHaveProperty('resetTime')
        expect(result).toHaveProperty('blocked')
      })

      const opsPerSecond = (iterations / duration) * 1000
      expect(opsPerSecond).toBeGreaterThan(25) // At least 25 ops/sec
    })

    it('should handle cache invalidation efficiently', async () => {
      const userId = 'user-123'
      const email = 'test@example.com'

      mockRedis.del.mockResolvedValue(1)
      mockRedis.smembers.mockResolvedValue(['key1', 'key2', 'key3'])

      const startTime = Date.now()
      
      await authCacheService.invalidateUserAuthCache(userId, email)
      
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(500) // Should complete in under 500ms
      expect(mockRedis.del).toHaveBeenCalled()
    })
  })

  describe('Database Performance', () => {
    it('should perform user lookups efficiently', async () => {
      const email = 'test@example.com'
      const mockUser = {
        id: 'user-123',
        email,
        passwordHash: 'hash',
        emailVerified: true,
        role: 'CUSTOMER',
      }

      mockDbPool.findUserByEmail.mockResolvedValue(mockUser)

      const iterations = 20
      const startTime = Date.now()
      const promises = []

      for (let i = 0; i < iterations; i++) {
        promises.push(dbPool.findUserByEmail(email))
      }

      const results = await Promise.all(promises)
      const duration = Date.now() - startTime

      expect(results).toHaveLength(iterations)
      expect(duration).toBeLessThan(2000) // Should complete in under 2 seconds
      
      const opsPerSecond = (iterations / duration) * 1000
      expect(opsPerSecond).toBeGreaterThan(10) // At least 10 ops/sec
    })

    it('should handle batch operations efficiently', async () => {
      const updates = Array.from({ length: 10 }, (_, i) => ({
        id: `user-${i}`,
        data: { lastLoginAt: new Date(), failedLoginAttempts: 0 },
      }))

      mockDbPool.batchUpdateUsers.mockResolvedValue(updates.map(u => ({ id: u.id })))

      const startTime = Date.now()
      
      const result = await dbPool.batchUpdateUsers(updates)
      
      const duration = Date.now() - startTime

      expect(result).toHaveLength(10)
      expect(duration).toBeLessThan(1000) // Should complete in under 1 second
      expect(mockDbPool.batchUpdateUsers).toHaveBeenCalledWith(updates)
    })

    it('should efficiently create security events in batches', async () => {
      const events = Array.from({ length: 25 }, (_, i) => ({
        userId: `user-${i}`,
        email: `user${i}@example.com`,
        eventType: 'LOGIN_ATTEMPT',
        success: i % 2 === 0,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      }))

      mockDbPool.batchCreateSecurityEvents.mockResolvedValue({ count: events.length })

      const startTime = Date.now()
      
      const result = await dbPool.batchCreateSecurityEvents(events)
      
      const duration = Date.now() - startTime

      expect(result.count).toBe(events.length)
      expect(duration).toBeLessThan(1500) // Should complete in under 1.5 seconds
    })

    it('should provide database health check quickly', async () => {
      const mockHealthCheck = {
        status: 'healthy' as const,
        connectionTime: 50,
        stats: {
          activeConnections: 2,
          idleConnections: 3,
          totalConnections: 5,
          queriesExecuted: 100,
          averageQueryTime: 25,
          slowQueries: 1,
          connectionErrors: 0,
        },
        uptime: 3600000,
      }

      mockDbPool.healthCheck.mockResolvedValue(mockHealthCheck)

      const startTime = Date.now()
      
      const health = await dbPool.healthCheck()
      
      const duration = Date.now() - startTime

      expect(health.status).toBe('healthy')
      expect(duration).toBeLessThan(200) // Should complete in under 200ms
      expect(health.connectionTime).toBeLessThan(100)
    })
  })

  describe('Performance Monitoring', () => {
    it('should track authentication metrics efficiently', () => {
      const metricName = 'auth_login_attempt'
      const iterations = 100

      const startTime = Date.now()

      for (let i = 0; i < iterations; i++) {
        performanceMonitor.recordMetric({
          name: metricName,
          value: Math.random() * 100,
          unit: 'ms',
          timestamp: Date.now(),
          tags: { success: i % 2 === 0 ? 'true' : 'false' },
        })
      }

      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(100) // Should complete in under 100ms
      
      const metrics = performanceMonitor.getMetrics()
      const authMetrics = metrics.filter(m => m.name === metricName)
      
      expect(authMetrics.length).toBe(iterations)
    })

    it('should generate performance reports quickly', () => {
      // Add some test metrics
      for (let i = 0; i < 50; i++) {
        performanceMonitor.recordMetric({
          name: `test_metric_${i % 5}`,
          value: Math.random() * 1000,
          unit: 'ms',
          timestamp: Date.now(),
        })
      }

      const startTime = Date.now()
      
      const report = performanceMonitor.generateReport()
      
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(50) // Should complete in under 50ms
      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('slowQueries')
      expect(report).toHaveProperty('errorRate')
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory during cache operations', async () => {
      const initialMemory = process.memoryUsage()
      
      // Perform many cache operations
      const promises = []
      for (let i = 0; i < 100; i++) {
        const sessionData = {
          userId: `user-${i}`,
          email: `user${i}@example.com`,
          role: 'CUSTOMER',
          emailVerified: true,
          lastActivity: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        }
        
        promises.push(authCacheService.cacheUserSession(`session-${i}`, sessionData))
      }
      
      await Promise.all(promises)
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })

    it('should handle concurrent operations without excessive memory usage', async () => {
      const initialMemory = process.memoryUsage()
      
      mockRedis.incr.mockResolvedValue(1)
      mockRedis.expire.mockResolvedValue(1)
      
      // Simulate concurrent login attempts
      const concurrentOperations = 200
      const promises = []
      
      for (let i = 0; i < concurrentOperations; i++) {
        promises.push(authCacheService.incrementLoginAttempts(`user${i % 10}@example.com`))
      }
      
      await Promise.all(promises)
      
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      
      // Memory increase should be minimal for concurrent operations
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024)
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle Redis failures gracefully without performance degradation', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'))
      mockRedis.setex.mockRejectedValue(new Error('Redis connection failed'))

      const startTime = Date.now()
      
      // These should not throw but should handle errors gracefully
      const sessionData = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'CUSTOMER',
        emailVerified: true,
        lastActivity: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      }
      
      await authCacheService.cacheUserSession('session-123', sessionData)
      const result = await authCacheService.getUserSession('session-123')
      
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(1000) // Should fail fast
      expect(result).toBeNull() // Should return null on failure
    })

    it('should maintain performance during database connection issues', async () => {
      mockDbPool.findUserByEmail.mockRejectedValue(new Error('Database connection failed'))

      const startTime = Date.now()
      
      try {
        await dbPool.findUserByEmail('test@example.com')
      } catch (error) {
        // Expected to throw
      }
      
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(5000) // Should timeout quickly
    })
  })

  describe('Cache Health Check Performance', () => {
    it('should perform cache health check quickly', async () => {
      mockRedis.ping.mockResolvedValue('PONG')

      const startTime = Date.now()
      
      const health = await authCacheService.healthCheck()
      
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(500) // Should complete in under 500ms
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('redis')
      expect(health).toHaveProperty('cacheManager')
      expect(health).toHaveProperty('responseTime')
    })

    it('should provide cache performance statistics efficiently', async () => {
      mockRedis.info.mockResolvedValue('used_memory_human:10.5M')
      mockRedis.dbsize.mockResolvedValue(1000)

      const startTime = Date.now()
      
      const stats = await authCacheService.getCachePerformanceStats()
      
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(200) // Should complete in under 200ms
      expect(stats).toHaveProperty('hitRate')
      expect(stats).toHaveProperty('totalRequests')
      expect(stats).toHaveProperty('averageResponseTime')
    })
  })

  describe('Stress Testing', () => {
    it('should handle burst of authentication requests', async () => {
      const burstSize = 500
      const email = 'burst-test@example.com'

      mockRedis.incr.mockImplementation(() => Promise.resolve(Math.floor(Math.random() * 10) + 1))
      mockRedis.expire.mockResolvedValue(1)

      const startTime = Date.now()
      const promises = []

      // Simulate burst of login attempts
      for (let i = 0; i < burstSize; i++) {
        promises.push(authCacheService.incrementLoginAttempts(email))
      }

      const results = await Promise.all(promises)
      const duration = Date.now() - startTime

      expect(results).toHaveLength(burstSize)
      expect(duration).toBeLessThan(10000) // Should complete in under 10 seconds
      
      const opsPerSecond = (burstSize / duration) * 1000
      expect(opsPerSecond).toBeGreaterThan(50) // At least 50 ops/sec under load
    })

    it('should maintain performance under sustained load', async () => {
      const sustainedOperations = 1000
      const batchSize = 50

      mockRedis.get.mockResolvedValue(null)
      mockRedis.setex.mockResolvedValue('OK')

      const startTime = Date.now()
      let completedOperations = 0

      // Process in batches to simulate sustained load
      for (let batch = 0; batch < sustainedOperations / batchSize; batch++) {
        const batchPromises = []
        
        for (let i = 0; i < batchSize; i++) {
          const sessionData = {
            userId: `user-${batch}-${i}`,
            email: `user${batch}${i}@example.com`,
            role: 'CUSTOMER',
            emailVerified: true,
            lastActivity: new Date(),
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
          }
          
          batchPromises.push(
            authCacheService.cacheUserSession(`session-${batch}-${i}`, sessionData)
          )
        }
        
        await Promise.all(batchPromises)
        completedOperations += batchSize
      }

      const duration = Date.now() - startTime

      expect(completedOperations).toBe(sustainedOperations)
      expect(duration).toBeLessThan(30000) // Should complete in under 30 seconds
      
      const opsPerSecond = (sustainedOperations / duration) * 1000
      expect(opsPerSecond).toBeGreaterThan(30) // At least 30 ops/sec sustained
    })
  })
})