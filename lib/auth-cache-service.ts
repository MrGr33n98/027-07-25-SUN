import { cache, CacheKeys, CacheTags } from './cache-manager'
import { redis } from './redis'
import { logger } from './logger'
import { performanceMonitor } from './performance'

interface AuthCacheOptions {
  ttl?: number
  skipCache?: boolean
}

interface UserSessionData {
  userId: string
  email: string
  role: string
  emailVerified: boolean
  lastActivity: Date
  ipAddress: string
  userAgent: string
}

interface SecurityEventData {
  eventType: string
  success: boolean
  ipAddress: string
  userAgent: string
  timestamp: Date
  details?: Record<string, any>
}

interface RateLimitData {
  count: number
  resetTime: number
  blocked: boolean
}

export class AuthCacheService {
  private static instance: AuthCacheService

  static getInstance(): AuthCacheService {
    if (!AuthCacheService.instance) {
      AuthCacheService.instance = new AuthCacheService()
    }
    return AuthCacheService.instance
  }

  // User session caching
  async cacheUserSession(
    sessionId: string,
    sessionData: UserSessionData,
    options: AuthCacheOptions = {}
  ): Promise<void> {
    const { ttl = 3600 } = options // 1 hour default
    
    await performanceMonitor.measureDbQuery('cache_user_session', async () => {
      await cache.set(
        CacheKeys.users.session(sessionId),
        sessionData,
        { ttl, tags: [CacheTags.SESSIONS, CacheTags.AUTH] }
      )
    })
  }

  async getUserSession(
    sessionId: string,
    options: AuthCacheOptions = {}
  ): Promise<UserSessionData | null> {
    if (options.skipCache) return null

    return performanceMonitor.measureDbQuery('get_user_session', async () => {
      return cache.get(
        CacheKeys.users.session(sessionId),
        async () => null, // No fallback for sessions
        { revalidate: true }
      )
    })
  }

  async invalidateUserSession(sessionId: string): Promise<void> {
    await cache.delete(CacheKeys.users.session(sessionId))
  }

  // Login attempts caching for rate limiting
  async incrementLoginAttempts(
    email: string,
    windowMinutes: number = 15
  ): Promise<number> {
    const key = CacheKeys.users.loginAttempts(email)
    const ttl = windowMinutes * 60

    try {
      if (!redis) {
        logger.warn('Redis not available for login attempts tracking')
        return 1
      }

      const current = await redis.incr(key)
      if (current === 1) {
        await redis.expire(key, ttl)
      }

      return current
    } catch (error) {
      logger.error('Failed to increment login attempts', error)
      return 1
    }
  }

  async getLoginAttempts(email: string): Promise<number> {
    const key = CacheKeys.users.loginAttempts(email)

    try {
      if (!redis) return 0
      const attempts = await redis.get(key)
      return attempts ? parseInt(attempts as string) : 0
    } catch (error) {
      logger.error('Failed to get login attempts', error)
      return 0
    }
  }

  async resetLoginAttempts(email: string): Promise<void> {
    const key = CacheKeys.users.loginAttempts(email)
    await cache.delete(key)
  }

  // Account lockout caching
  async setAccountLockout(
    email: string,
    lockoutUntil: Date,
    reason: string = 'failed_attempts'
  ): Promise<void> {
    const key = CacheKeys.users.lockout(email)
    const ttl = Math.ceil((lockoutUntil.getTime() - Date.now()) / 1000)

    if (ttl > 0) {
      await cache.set(
        key,
        { lockoutUntil, reason, lockedAt: new Date() },
        { ttl, tags: [CacheTags.AUTH] }
      )
    }
  }

  async getAccountLockout(email: string): Promise<{
    lockoutUntil: Date
    reason: string
    lockedAt: Date
  } | null> {
    const key = CacheKeys.users.lockout(email)
    return cache.get(key, async () => null)
  }

  async clearAccountLockout(email: string): Promise<void> {
    const key = CacheKeys.users.lockout(email)
    await cache.delete(key)
  }

  // Rate limiting cache
  async checkRateLimit(
    ip: string,
    action: string,
    limit: number,
    windowSeconds: number
  ): Promise<RateLimitData> {
    const key = CacheKeys.auth.rateLimits(ip, action)

    try {
      if (!redis) {
        return { count: 0, resetTime: Date.now() + windowSeconds * 1000, blocked: false }
      }

      const current = await redis.incr(key)
      
      if (current === 1) {
        await redis.expire(key, windowSeconds)
      }

      const ttl = await redis.ttl(key)
      const resetTime = Date.now() + (ttl * 1000)
      const blocked = current > limit

      return {
        count: current,
        resetTime,
        blocked
      }
    } catch (error) {
      logger.error('Rate limit check failed', error)
      return { count: 0, resetTime: Date.now() + windowSeconds * 1000, blocked: false }
    }
  }

  // Security events caching
  async cacheSecurityEvent(
    userId: string,
    event: SecurityEventData
  ): Promise<void> {
    const key = CacheKeys.auth.securityEvents(userId)
    
    try {
      // Get existing events
      const existingEvents = await cache.get(key, async () => [])
      const events = Array.isArray(existingEvents) ? existingEvents : []
      
      // Add new event
      events.unshift(event)
      
      // Keep only last 50 events per user
      const limitedEvents = events.slice(0, 50)
      
      // Cache for 24 hours
      await cache.set(
        key,
        limitedEvents,
        { ttl: 86400, tags: [CacheTags.SECURITY_EVENTS, CacheTags.AUTH] }
      )
    } catch (error) {
      logger.error('Failed to cache security event', error)
    }
  }

  async getUserSecurityEvents(userId: string): Promise<SecurityEventData[]> {
    const key = CacheKeys.auth.securityEvents(userId)
    return cache.get(key, async () => [])
  }

  // Token caching for email verification and password reset
  async cacheEmailVerificationToken(
    token: string,
    userId: string,
    email: string,
    expiresAt: Date
  ): Promise<void> {
    const key = CacheKeys.users.emailVerification(token)
    const ttl = Math.ceil((expiresAt.getTime() - Date.now()) / 1000)

    if (ttl > 0) {
      await cache.set(
        key,
        { userId, email, expiresAt, type: 'email_verification' },
        { ttl, tags: [CacheTags.AUTH] }
      )
    }
  }

  async getEmailVerificationToken(token: string): Promise<{
    userId: string
    email: string
    expiresAt: Date
    type: string
  } | null> {
    const key = CacheKeys.users.emailVerification(token)
    return cache.get(key, async () => null)
  }

  async invalidateEmailVerificationToken(token: string): Promise<void> {
    const key = CacheKeys.users.emailVerification(token)
    await cache.delete(key)
  }

  async cachePasswordResetToken(
    token: string,
    userId: string,
    email: string,
    expiresAt: Date
  ): Promise<void> {
    const key = CacheKeys.users.passwordReset(token)
    const ttl = Math.ceil((expiresAt.getTime() - Date.now()) / 1000)

    if (ttl > 0) {
      await cache.set(
        key,
        { userId, email, expiresAt, type: 'password_reset' },
        { ttl, tags: [CacheTags.AUTH] }
      )
    }
  }

  async getPasswordResetToken(token: string): Promise<{
    userId: string
    email: string
    expiresAt: Date
    type: string
  } | null> {
    const key = CacheKeys.users.passwordReset(token)
    return cache.get(key, async () => null)
  }

  async invalidatePasswordResetToken(token: string): Promise<void> {
    const key = CacheKeys.users.passwordReset(token)
    await cache.delete(key)
  }

  // User profile caching with authentication data
  async cacheUserProfile(
    userId: string,
    profileData: {
      id: string
      email: string
      emailVerified: boolean
      role: string
      lastLoginAt?: Date
      failedLoginAttempts: number
      accountLockedUntil?: Date
    },
    options: AuthCacheOptions = {}
  ): Promise<void> {
    const { ttl = 1800 } = options // 30 minutes default
    
    await cache.set(
      CacheKeys.users.profile(userId),
      profileData,
      { ttl, tags: [CacheTags.USERS, CacheTags.AUTH] }
    )
  }

  async getUserProfile(userId: string): Promise<any> {
    return cache.get(
      CacheKeys.users.profile(userId),
      async () => null
    )
  }

  async invalidateUserProfile(userId: string): Promise<void> {
    await cache.delete(CacheKeys.users.profile(userId))
  }

  // Bulk cache operations for performance
  async invalidateUserAuthCache(userId: string, email: string): Promise<void> {
    const keys = [
      CacheKeys.users.profile(userId),
      CacheKeys.users.loginAttempts(email),
      CacheKeys.users.lockout(email),
    ]

    await Promise.all(keys.map(key => cache.delete(key)))
    
    // Invalidate by tags
    await cache.invalidateByTags([CacheTags.AUTH, CacheTags.SESSIONS])
  }

  // Performance monitoring
  async getCachePerformanceStats(): Promise<{
    hitRate: number
    totalRequests: number
    averageResponseTime: number
    memoryUsage: any
  }> {
    const stats = await cache.getStats()
    const performanceReport = performanceMonitor.generateReport()

    return {
      hitRate: 0.85, // Placeholder - implement actual hit rate tracking
      totalRequests: stats.totalKeys,
      averageResponseTime: performanceReport.summary.avgResponseTime || 0,
      memoryUsage: stats.memoryUsage
    }
  }

  // Cache warming for frequently accessed data
  async warmAuthCache(): Promise<void> {
    try {
      logger.info('Starting authentication cache warm-up')

      // Warm up rate limit structures
      const commonActions = ['login', 'register', 'password_reset']
      const warmUpTasks = commonActions.map(action => 
        this.checkRateLimit('127.0.0.1', action, 5, 900)
      )

      await Promise.all(warmUpTasks)
      
      logger.info('Authentication cache warm-up completed')
    } catch (error) {
      logger.error('Authentication cache warm-up failed', error)
    }
  }

  // Health check for cache system
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    redis: boolean
    cacheManager: boolean
    responseTime: number
    errors: string[]
  }> {
    const startTime = Date.now()
    const errors: string[] = []
    let redisHealthy = false
    let cacheManagerHealthy = false

    try {
      // Test Redis connection
      if (redis) {
        await redis.ping()
        redisHealthy = true
      } else {
        errors.push('Redis not configured')
      }
    } catch (error) {
      errors.push(`Redis error: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    try {
      // Test cache manager
      const testKey = 'health_check_test'
      await cache.set(testKey, { test: true }, { ttl: 10 })
      const result = await cache.get(testKey, async () => null)
      if (result) {
        cacheManagerHealthy = true
      }
      await cache.delete(testKey)
    } catch (error) {
      errors.push(`Cache manager error: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    const responseTime = Date.now() - startTime
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (errors.length > 0) {
      status = redisHealthy || cacheManagerHealthy ? 'degraded' : 'unhealthy'
    }

    return {
      status,
      redis: redisHealthy,
      cacheManager: cacheManagerHealthy,
      responseTime,
      errors
    }
  }
}

export const authCacheService = AuthCacheService.getInstance()