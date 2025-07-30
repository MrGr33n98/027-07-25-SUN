import { performanceBenchmarks, runPerformanceBenchmarks } from '../../lib/performance-benchmarks'
import { databaseOptimizer } from '../../lib/database-optimizer'
import { performanceMonitor } from '../../lib/performance'
import { db } from '../../lib/db'

// Mock database for testing
jest.mock('../../lib/db', () => ({
  db: {
    $queryRaw: jest.fn(),
    user: {
      findUnique: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    companyProfile: {
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  },
}))

// Type assertion for mocked database
const mockDb = db as any;

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    performanceBenchmarks.clearResults()
  })

  describe('Database Connection Performance', () => {
    it('should handle database connections efficiently', async () => {
      // Mock successful database connections
      mockDb.$queryRaw.mockResolvedValue([{ result: 1 }])

      const result = await performanceBenchmarks.benchmarkDatabaseConnection(10)

      expect(result.success).toBe(true)
      expect(result.operations).toBe(10)
      expect(result.opsPerSecond).toBeGreaterThan(0)
      expect(result.duration).toBeGreaterThan(0)
      expect(mockDb.$queryRaw).toHaveBeenCalledTimes(10)
    })

    it('should handle database connection failures gracefully', async () => {
      // Mock database connection failures
      mockDb.$queryRaw.mockRejectedValue(new Error('Connection failed'))

      const result = await performanceBenchmarks.benchmarkDatabaseConnection(5)

      expect(result.success).toBe(false)
      expect(result.operations).toBe(5)
      expect(result.opsPerSecond).toBe(0)
      expect(result.error).toBe('Connection failed')
    })
  })

  describe('User Query Performance', () => {
    it('should perform user queries efficiently', async () => {
      // Mock user operations
      mockDb.user.createMany.mockResolvedValue({ count: 10 })
      mockDb.user.deleteMany.mockResolvedValue({ count: 10 })
      mockDb.user.findUnique.mockResolvedValue({
        id: 'test-id',
        email: 'test@example.com',
        passwordHash: 'hash',
      })

      const result = await performanceBenchmarks.benchmarkUserQueries(5)

      expect(result.success).toBe(true)
      expect(result.operations).toBe(5)
      expect(result.opsPerSecond).toBeGreaterThan(0)
    })

    it('should measure memory usage during user queries', async () => {
      mockDb.user.createMany.mockResolvedValue({ count: 10 })
      mockDb.user.deleteMany.mockResolvedValue({ count: 10 })
      mockDb.user.findUnique.mockResolvedValue({
        id: 'test-id',
        email: 'test@example.com',
      })

      const result = await performanceBenchmarks.benchmarkUserQueries(3)

      expect(result.memoryUsage).toBeDefined()
      expect(result.memoryUsage.before).toBeDefined()
      expect(result.memoryUsage.after).toBeDefined()
      expect(typeof result.memoryUsage.delta).toBe('number')
    })
  })

  describe('Company Search Performance', () => {
    it('should perform company searches efficiently', async () => {
      const mockCompanies = [
        {
          id: '1',
          name: 'Test Company',
          slug: 'test-company',
          verified: true,
          rating: 4.5,
        },
      ]

      mockDb.companyProfile.findMany.mockResolvedValue(mockCompanies)

      const result = await performanceBenchmarks.benchmarkCompanySearch(5)

      expect(result.success).toBe(true)
      expect(result.operations).toBe(5)
      expect(result.opsPerSecond).toBeGreaterThan(0)
    })

    it('should handle company search errors', async () => {
      mockDb.companyProfile.findMany.mockRejectedValue(new Error('Search failed'))

      const result = await performanceBenchmarks.benchmarkCompanySearch(3)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Search failed')
    })
  })

  describe('Product Search Performance', () => {
    it('should perform product searches efficiently', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Test Product',
          price: 100,
          category: 'PAINEL_SOLAR',
          company: { id: '1', name: 'Test Company', verified: true },
        },
      ]

      mockDb.product.findMany.mockResolvedValue(mockProducts)

      const result = await performanceBenchmarks.benchmarkProductSearch(5)

      expect(result.success).toBe(true)
      expect(result.operations).toBe(5)
      expect(result.opsPerSecond).toBeGreaterThan(0)
    })
  })

  describe('Cache Performance', () => {
    it('should demonstrate cache performance improvements', async () => {
      const mockCompanies = [
        {
          id: '1',
          name: 'Cached Company',
          slug: 'cached-company',
          verified: true,
        },
      ]

      mockDb.companyProfile.findMany.mockResolvedValue(mockCompanies)

      const result = await performanceBenchmarks.benchmarkCachePerformance(10)

      expect(result.success).toBe(true)
      expect(result.operations).toBe(10)
      // Cache should improve performance, so ops/second should be high
      expect(result.opsPerSecond).toBeGreaterThan(0)
    })
  })

  describe('Performance Monitor Integration', () => {
    it('should record performance metrics', () => {
      const metricName = 'test_operation'
      
      performanceMonitor.startTimer(metricName)
      
      // Simulate some work
      const start = Date.now()
      while (Date.now() - start < 10) {
        // Wait 10ms
      }
      
      const duration = performanceMonitor.endTimer(metricName)
      
      expect(duration).toBeGreaterThan(0)
      expect(duration).toBeLessThan(100) // Should be reasonable
    })

    it('should generate performance reports', () => {
      // Record some test metrics
      performanceMonitor.recordMetric({
        name: 'test_metric',
        value: 100,
        unit: 'ms',
        timestamp: Date.now(),
      })

      const report = performanceMonitor.generateReport()
      
      expect(report).toBeDefined()
      expect(report.summary).toBeDefined()
      expect(report.slowQueries).toBeDefined()
      expect(typeof report.errorRate).toBe('number')
    })
  })

  describe('Database Optimizer', () => {
    it('should provide optimized user queries', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        passwordHash: 'hash',
        emailVerified: true,
        failedLoginAttempts: 0,
        role: 'CUSTOMER',
      }

      mockDb.user.findUnique.mockResolvedValue(mockUser)

      const result = await databaseOptimizer.findUserByEmail('test@example.com')

      expect(result).toEqual(mockUser)
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: expect.objectContaining({
          id: true,
          email: true,
          passwordHash: true,
        }),
      })
    })

    it('should provide cache statistics', () => {
      const stats = databaseOptimizer.getCacheStats()
      
      expect(stats).toBeDefined()
      expect(typeof stats.size).toBe('number')
      expect(Array.isArray(stats.keys)).toBe(true)
    })
  })

  describe('Full Benchmark Suite', () => {
    it('should run complete benchmark suite', async () => {
      // Mock all database operations
      mockDb.$queryRaw.mockResolvedValue([{ result: 1 }])
      mockDb.user.createMany.mockResolvedValue({ count: 10 })
      mockDb.user.deleteMany.mockResolvedValue({ count: 10 })
      mockDb.user.findUnique.mockResolvedValue({ id: 'test' })
      mockDb.companyProfile.findMany.mockResolvedValue([])
      mockDb.product.findMany.mockResolvedValue([])

      const suite = await runPerformanceBenchmarks()

      expect(suite).toBeDefined()
      expect(suite.name).toContain('Performance Benchmark Suite')
      expect(suite.results).toHaveLength(5) // 5 different benchmarks
      expect(suite.totalDuration).toBeGreaterThan(0)
      expect(suite.successRate).toBeGreaterThan(0)
      expect(suite.averageOpsPerSecond).toBeGreaterThan(0)
    })

    it('should generate performance report', async () => {
      // Mock all database operations
      mockDb.$queryRaw.mockResolvedValue([{ result: 1 }])
      mockDb.user.createMany.mockResolvedValue({ count: 10 })
      mockDb.user.deleteMany.mockResolvedValue({ count: 10 })
      mockDb.user.findUnique.mockResolvedValue({ id: 'test' })
      mockDb.companyProfile.findMany.mockResolvedValue([])
      mockDb.product.findMany.mockResolvedValue([])

      const suite = await runPerformanceBenchmarks()
      const report = performanceBenchmarks.generatePerformanceReport(suite)

      expect(report).toContain('Performance Benchmark Report')
      expect(report).toContain('Summary')
      expect(report).toContain('Individual Benchmarks')
      expect(report).toContain('Recommendations')
    })
  })

  describe('Performance Thresholds', () => {
    it('should meet minimum performance requirements', async () => {
      mockDb.$queryRaw.mockResolvedValue([{ result: 1 }])

      const result = await performanceBenchmarks.benchmarkDatabaseConnection(10)

      // Performance requirements
      expect(result.duration).toBeLessThan(5000) // Should complete in under 5 seconds
      expect(result.opsPerSecond).toBeGreaterThan(1) // At least 1 operation per second
      expect(result.memoryUsage.delta).toBeLessThan(100 * 1024 * 1024) // Less than 100MB memory increase
    })

    it('should identify slow operations', async () => {
      // Mock slow database operation
      mockDb.$queryRaw.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([{ result: 1 }]), 100))
      )

      const result = await performanceBenchmarks.benchmarkDatabaseConnection(5)

      expect(result.duration).toBeGreaterThan(400) // Should take at least 400ms for 5 operations
      expect(result.success).toBe(true)
    })
  })
})