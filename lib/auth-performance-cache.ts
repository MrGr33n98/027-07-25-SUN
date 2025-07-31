import { redis } from './redis'
import { logger } from './logger'
import { performanceMonitor } from './performance'
import { dbPool } from './database-connection-pool'

interface CacheMetrics {
  hits: number
  misses: number
  totalRequests: number
  averageResponseTime: number
  errorRate: number
}

interface AuthCacheConfig {
  userSessionTTL: number
  loginAttemptsTTL: number
  accountLockoutTTL: number
  securityEventsTTL: number
  tokenTTL: number
  enableCompression: boolean
  enableMetrics: boolean
}

export class AuthPerformanceCache {
  private static instance: AuthPerformanceCache
  private metrics: CacheMetrics
  private config: AuthCacheConfig

  private constructor() {
    this.metrics = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0
    }

    this.config = {
      userSessionTTL: 3600, // 1 hour
      loginAttemptsTTL: 900, // 15 minutes
      accountLockoutTTL: 1800, // 30 minutes
      securityEventsTTL: 86400, // 24 hours
      tokenTTL: 3600, // 1 hour
      enableCompression: true,
      enableMetrics: true
    }
  }

  static getInstance(): AuthPerformanceCache {
    if (!AuthPerformanceCache.instance) {
      AuthPerformanceCache.instance = new AuthPerformanceCache()
    }
    return AuthPerformanceCache.instance
  }

  // High-performance user session caching
  async cacheUserSession(sessionId: string, userData: any): Promise<void> {
    const startTime = Date.now()
    
    try {
      if (!redis) {
        logger.warn('AUTH_CACHE', 'Redis not available for session caching')
        return
      }

      const key = `auth:session:${sessionId}`
      const data = this.config.enableCompression 
        ? JSON.stringify(userData)
        : JSON.stringify(userData)

      await redis.setex(key, this.config.userSessionTTL, data)
      
      // Cache user profile separately for quick access
      const profileKey = `auth:user:${userData.userId}`
      await redis.setex(profileKey, this.config.userSessionTTL, JSON.stringify({
        id: userData.userId,
        email: userData.email,
        role: userData.role,
        emailVerified: userData.emailVerified,
        lastActivity: new Date().toISOString()
      }))

      this.recordMetric(startTime, true)
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Failed to cache user session', error)
    }
  }

  async getUserSession(sessionId: string): Promise<any | null> {
    const startTime = Date.now()
    
    try {
      if (!redis) {
        this.recordMetric(startTime, false)
        return null
      }

      const key = `auth:session:${sessionId}`
      const cached = await redis.get(key)
      
      if (cached) {
        this.recordMetric(startTime, true)
        return JSON.parse(cached as string)
      }

      this.recordMetric(startTime, false)
      return null
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Failed to get user session', error)
      return null
    }
  }

  // Optimized login attempts tracking
  async incrementLoginAttempts(email: string): Promise<number> {
    const startTime = Date.now()
    
    try {
      if (!redis) {
        this.recordMetric(startTime, false)
        return 1
      }

      const key = `auth:attempts:${email}`
      const pipeline = redis.pipeline()
      
      pipeline.incr(key)
      pipeline.expire(key, this.config.loginAttemptsTTL)
      
      const results = await pipeline.exec()
      const attempts = results?.[0]?.[1] as number || 1

      this.recordMetric(startTime, true)
      return attempts
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Failed to increment login attempts', error)
      return 1
    }
  }

  async getLoginAttempts(email: string): Promise<number> {
    const startTime = Date.now()
    
    try {
      if (!redis) {
        this.recordMetric(startTime, false)
        return 0
      }

      const key = `auth:attempts:${email}`
      const attempts = await redis.get(key)
      
      this.recordMetric(startTime, true)
      return attempts ? parseInt(attempts as string) : 0
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Failed to get login attempts', error)
      return 0
    }
  }

  async resetLoginAttempts(email: string): Promise<void> {
    const startTime = Date.now()
    
    try {
      if (!redis) {
        this.recordMetric(startTime, false)
        return
      }

      const key = `auth:attempts:${email}`
      await redis.del(key)
      
      this.recordMetric(startTime, true)
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Failed to reset login attempts', error)
    }
  }

  // Account lockout caching with performance optimization
  async setAccountLockout(email: string, lockoutUntil: Date, reason: string): Promise<void> {
    const startTime = Date.now()
    
    try {
      if (!redis) {
        this.recordMetric(startTime, false)
        return
      }

      const key = `auth:lockout:${email}`
      const ttl = Math.ceil((lockoutUntil.getTime() - Date.now()) / 1000)
      
      if (ttl > 0) {
        const lockoutData = {
          lockoutUntil: lockoutUntil.toISOString(),
          reason,
          lockedAt: new Date().toISOString()
        }
        
        await redis.setex(key, ttl, JSON.stringify(lockoutData))
        
        // Also cache in a sorted set for admin queries
        await redis.zadd('auth:lockouts:active', Date.now(), email)
        
        this.recordMetric(startTime, true)
      }
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Failed to set account lockout', error)
    }
  }

  async getAccountLockout(email: string): Promise<any | null> {
    const startTime = Date.now()
    
    try {
      if (!redis) {
        this.recordMetric(startTime, false)
        return null
      }

      const key = `auth:lockout:${email}`
      const cached = await redis.get(key)
      
      if (cached) {
        this.recordMetric(startTime, true)
        const lockoutData = JSON.parse(cached as string)
        return {
          ...lockoutData,
          lockoutUntil: new Date(lockoutData.lockoutUntil),
          lockedAt: new Date(lockoutData.lockedAt)
        }
      }

      this.recordMetric(startTime, false)
      return null
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Failed to get account lockout', error)
      return null
    }
  }

  async clearAccountLockout(email: string): Promise<void> {
    const startTime = Date.now()
    
    try {
      if (!redis) {
        this.recordMetric(startTime, false)
        return
      }

      const pipeline = redis.pipeline()
      pipeline.del(`auth:lockout:${email}`)
      pipeline.zrem('auth:lockouts:active', email)
      
      await pipeline.exec()
      this.recordMetric(startTime, true)
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Failed to clear account lockout', error)
    }
  }

  // High-performance rate limiting
  async checkRateLimit(
    identifier: string, 
    action: string, 
    limit: number, 
    windowSeconds: number
  ): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    totalHits: number
  }> {
    const startTime = Date.now()
    
    try {
      if (!redis) {
        this.recordMetric(startTime, false)
        return {
          allowed: true,
          remaining: limit - 1,
          resetTime: Date.now() + windowSeconds * 1000,
          totalHits: 1
        }
      }

      const key = `rate:${action}:${identifier}`
      const now = Date.now()
      const window = now - (windowSeconds * 1000)

      // Use sliding window with sorted sets for accurate rate limiting
      const pipeline = redis.pipeline()
      
      // Remove old entries
      pipeline.zremrangebyscore(key, 0, window)
      
      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`)
      
      // Count current requests
      pipeline.zcard(key)
      
      // Set expiry
      pipeline.expire(key, windowSeconds)
      
      const results = await pipeline.exec()
      const totalHits = results?.[2]?.[1] as number || 0
      
      const allowed = totalHits <= limit
      const remaining = Math.max(0, limit - totalHits)
      const resetTime = now + windowSeconds * 1000

      this.recordMetric(startTime, true)
      
      return {
        allowed,
        remaining,
        resetTime,
        totalHits
      }
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Rate limit check failed', error)
      
      // Fail open for availability
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: Date.now() + windowSeconds * 1000,
        totalHits: 1
      }
    }
  }

  // Token caching for email verification and password reset
  async cacheToken(
    token: string, 
    type: 'email_verification' | 'password_reset',
    userId: string,
    email: string,
    expiresAt: Date
  ): Promise<void> {
    const startTime = Date.now()
    
    try {
      if (!redis) {
        this.recordMetric(startTime, false)
        return
      }

      const key = `auth:token:${type}:${token}`
      const ttl = Math.ceil((expiresAt.getTime() - Date.now()) / 1000)
      
      if (ttl > 0) {
        const tokenData = {
          userId,
          email,
          type,
          expiresAt: expiresAt.toISOString(),
          createdAt: new Date().toISOString()
        }
        
        await redis.setex(key, ttl, JSON.stringify(tokenData))
        
        // Index by user for quick lookup
        const userTokenKey = `auth:user_tokens:${userId}:${type}`
        await redis.setex(userTokenKey, ttl, token)
        
        this.recordMetric(startTime, true)
      }
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Failed to cache token', error)
    }
  }

  async getToken(token: string, type: 'email_verification' | 'password_reset'): Promise<any | null> {
    const startTime = Date.now()
    
    try {
      if (!redis) {
        this.recordMetric(startTime, false)
        return null
      }

      const key = `auth:token:${type}:${token}`
      const cached = await redis.get(key)
      
      if (cached) {
        this.recordMetric(startTime, true)
        const tokenData = JSON.parse(cached as string)
        return {
          ...tokenData,
          expiresAt: new Date(tokenData.expiresAt),
          createdAt: new Date(tokenData.createdAt)
        }
      }

      this.recordMetric(startTime, false)
      return null
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Failed to get token', error)
      return null
    }
  }

  async invalidateToken(token: string, type: 'email_verification' | 'password_reset'): Promise<void> {
    const startTime = Date.now()
    
    try {
      if (!redis) {
        this.recordMetric(startTime, false)
        return
      }

      const key = `auth:token:${type}:${token}`
      
      // Get token data to find user ID for cleanup
      const tokenData = await redis.get(key)
      if (tokenData) {
        const parsed = JSON.parse(tokenData as string)
        const userTokenKey = `auth:user_tokens:${parsed.userId}:${type}`
        
        const pipeline = redis.pipeline()
        pipeline.del(key)
        pipeline.del(userTokenKey)
        await pipeline.exec()
      } else {
        await redis.del(key)
      }
      
      this.recordMetric(startTime, true)
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Failed to invalidate token', error)
    }
  }

  // Security events caching for performance
  async cacheSecurityEvent(userId: string, eventData: any): Promise<void> {
    const startTime = Date.now()
    
    try {
      if (!redis) {
        this.recordMetric(startTime, false)
        return
      }

      const key = `auth:security_events:${userId}`
      const eventWithTimestamp = {
        ...eventData,
        timestamp: new Date().toISOString(),
        id: `${Date.now()}-${Math.random()}`
      }
      
      // Use list for chronological order, keep last 100 events
      await redis.lpush(key, JSON.stringify(eventWithTimestamp))
      await redis.ltrim(key, 0, 99) // Keep only last 100 events
      await redis.expire(key, this.config.securityEventsTTL)
      
      this.recordMetric(startTime, true)
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Failed to cache security event', error)
    }
  }

  async getUserSecurityEvents(userId: string, limit: number = 50): Promise<any[]> {
    const startTime = Date.now()
    
    try {
      if (!redis) {
        this.recordMetric(startTime, false)
        return []
      }

      const key = `auth:security_events:${userId}`
      const events = await redis.lrange(key, 0, limit - 1)
      
      this.recordMetric(startTime, true)
      
      return events.map(event => {
        const parsed = JSON.parse(event)
        return {
          ...parsed,
          timestamp: new Date(parsed.timestamp)
        }
      })
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Failed to get security events', error)
      return []
    }
  }

  // Bulk operations for performance
  async bulkCacheUserProfiles(users: Array<{id: string, email: string, role: string, emailVerified: boolean}>): Promise<void> {
    const startTime = Date.now()
    
    try {
      if (!redis || users.length === 0) {
        this.recordMetric(startTime, false)
        return
      }

      const pipeline = redis.pipeline()
      
      users.forEach(user => {
        const key = `auth:user:${user.id}`
        const data = JSON.stringify({
          ...user,
          lastActivity: new Date().toISOString()
        })
        pipeline.setex(key, this.config.userSessionTTL, data)
      })
      
      await pipeline.exec()
      this.recordMetric(startTime, true)
    } catch (error) {
      this.recordMetric(startTime, false)
      logger.error('AUTH_CACHE', 'Failed to bulk cache user profiles', error)
    }
  }

  // Cache warming for frequently accessed data
  async warmCache(): Promise<void> {
    try {
      logger.info('AUTH_CACHE', 'Starting authentication cache warm-up')

      // Warm up with recent active users
      const recentUsers = await dbPool.executeQuery('warm_cache_recent_users', async (prisma) => {
        return prisma.user.findMany({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          select: {
            id: true,
            email: true,
            role: true,
            emailVerified: true
          },
          take: 100
        })
      })

      if (recentUsers.length > 0) {
        await this.bulkCacheUserProfiles(recentUsers)
      }

      // Pre-populate rate limit structures
      const commonActions = ['login', 'register', 'password_reset', 'email_verification']
      const warmUpTasks = commonActions.map(action => 
        this.checkRateLimit('warmup', action, 100, 3600)
      )

      await Promise.all(warmUpTasks)
      
      logger.info('AUTH_CACHE', 'Authentication cache warm-up completed', {
        usersWarmed: recentUsers.length,
        actionsWarmed: commonActions.length
      })
    } catch (error) {
      logger.error('AUTH_CACHE', 'Authentication cache warm-up failed', error)
    }
  }

  // Performance monitoring and metrics
  private recordMetric(startTime: number, success: boolean): void {
    if (!this.config.enableMetrics) return

    const responseTime = Date.now() - startTime
    this.metrics.totalRequests++
    
    if (success) {
      this.metrics.hits++
    } else {
      this.metrics.misses++
    }

    // Update average response time (simple moving average)
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests

    // Update error rate
    this.metrics.errorRate = this.metrics.misses / this.metrics.totalRequests
  }

  getMetrics(): CacheMetrics & { hitRate: number } {
    return {
      ...this.metrics,
      hitRate: this.metrics.totalRequests > 0 ? this.metrics.hits / this.metrics.totalRequests : 0
    }
  }

  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0
    }
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    redis: boolean
    responseTime: number
    metrics: CacheMetrics & { hitRate: number }
    errors: string[]
  }> {
    const startTime = Date.now()
    const errors: string[] = []
    let redisHealthy = false

    try {
      if (redis) {
        await redis.ping()
        redisHealthy = true
      } else {
        errors.push('Redis not configured')
      }
    } catch (error) {
      errors.push(`Redis error: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    const responseTime = Date.now() - startTime
    const metrics = this.getMetrics()
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (!redisHealthy) {
      status = 'unhealthy'
    } else if (responseTime > 1000 || metrics.errorRate > 0.1) {
      status = 'degraded'
    }

    return {
      status,
      redis: redisHealthy,
      responseTime,
      metrics,
      errors
    }
  }

  // Cache cleanup and maintenance
  async cleanup(): Promise<{
    expiredTokens: number
    expiredSessions: number
    expiredLockouts: number
  }> {
    const startTime = Date.now()
    let expiredTokens = 0
    let expiredSessions = 0
    let expiredLockouts = 0

    try {
      if (!redis) {
        return { expiredTokens, expiredSessions, expiredLockouts }
      }

      // Clean up expired lockouts from sorted set
      const now = Date.now()
      const expiredLockoutEmails = await redis.zrangebyscore(
        'auth:lockouts:active', 
        0, 
        now - (30 * 60 * 1000) // 30 minutes ago
      )
      
      if (expiredLockoutEmails.length > 0) {
        await redis.zrem('auth:lockouts:active', ...expiredLockoutEmails)
        expiredLockouts = expiredLockoutEmails.length
      }

      logger.info('AUTH_CACHE', 'Cache cleanup completed', {
        expiredTokens,
        expiredSessions,
        expiredLockouts,
        duration: Date.now() - startTime
      })
    } catch (error) {
      logger.error('AUTH_CACHE', 'Cache cleanup failed', error)
    }

    return { expiredTokens, expiredSessions, expiredLockouts }
  }
}

export const authPerformanceCache = AuthPerformanceCache.getInstance()