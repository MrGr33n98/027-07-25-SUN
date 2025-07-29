import { redis } from './redis'
import { NextRequest } from 'next/server'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyPrefix: string // Prefix for Redis keys
  identifier?: (req: NextRequest) => string // Custom identifier function
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter: number
  message?: string
}

export class SlidingWindowRateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      identifier: (req) => this.getClientIdentifier(req),
      ...config
    }
  }

  /**
   * Check if request is within rate limit using sliding window algorithm
   */
  async checkLimit(req: NextRequest, customIdentifier?: string): Promise<RateLimitResult> {
    if (!redis) {
      // If Redis is not available, allow all requests but log warning
      console.warn('Redis not configured, rate limiting disabled')
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
        retryAfter: 0
      }
    }

    const identifier = customIdentifier || this.config.identifier!(req)
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    const key = `${this.config.keyPrefix}:${identifier}`

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline()
      
      // Remove expired entries
      pipeline.zremrangebyscore(key, 0, windowStart)
      
      // Count current requests in window
      pipeline.zcard(key)
      
      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`)
      
      // Set expiration
      pipeline.expire(key, Math.ceil(this.config.windowMs / 1000))
      
      const results = await pipeline.exec()
      
      if (!results || results.length < 4) {
        throw new Error('Redis pipeline execution failed')
      }

      const currentCount = results[1][1] as number
      const remaining = Math.max(0, this.config.maxRequests - currentCount - 1)
      const resetTime = now + this.config.windowMs
      const retryAfter = Math.ceil(this.config.windowMs / 1000)

      if (currentCount >= this.config.maxRequests) {
        // Remove the request we just added since it exceeds limit
        await redis.zrem(key, `${now}-${Math.random()}`)
        
        return {
          success: false,
          limit: this.config.maxRequests,
          remaining: 0,
          resetTime,
          retryAfter,
          message: `Rate limit exceeded. Maximum ${this.config.maxRequests} requests per ${this.config.windowMs / 1000} seconds.`
        }
      }

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining,
        resetTime,
        retryAfter: 0
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // On error, allow the request to proceed to avoid blocking legitimate users
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
        retryAfter: 0
      }
    }
  }

  /**
   * Get remaining requests for an identifier
   */
  async getRemainingRequests(req: NextRequest, customIdentifier?: string): Promise<number> {
    if (!redis) return this.config.maxRequests

    const identifier = customIdentifier || this.config.identifier!(req)
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    const key = `${this.config.keyPrefix}:${identifier}`

    try {
      await redis.zremrangebyscore(key, 0, windowStart)
      const currentCount = await redis.zcard(key)
      return Math.max(0, this.config.maxRequests - currentCount)
    } catch (error) {
      console.error('Error getting remaining requests:', error)
      return this.config.maxRequests
    }
  }

  /**
   * Reset rate limit for an identifier (admin function)
   */
  async resetLimit(identifier: string): Promise<boolean> {
    if (!redis) return true

    try {
      const key = `${this.config.keyPrefix}:${identifier}`
      await redis.del(key)
      return true
    } catch (error) {
      console.error('Error resetting rate limit:', error)
      return false
    }
  }

  private getClientIdentifier(req: NextRequest): string {
    // Try to get IP from various headers (works with different hosting providers)
    const forwarded = req.headers.get('x-forwarded-for')
    const realIP = req.headers.get('x-real-ip')
    const cfConnectingIP = req.headers.get('cf-connecting-ip')
    
    let ip = 'unknown'
    
    if (cfConnectingIP) {
      ip = cfConnectingIP
    } else if (forwarded) {
      ip = forwarded.split(',')[0].trim()
    } else if (realIP) {
      ip = realIP
    } else if (req.ip) {
      ip = req.ip
    }
    
    return ip
  }
}

/**
 * Authentication-specific rate limiters with different tiers
 */
export const authRateLimiters = {
  // Login attempts - strict limiting to prevent brute force
  login: new SlidingWindowRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes per IP
    keyPrefix: 'auth:login',
  }),

  // Registration - moderate limiting
  registration: new SlidingWindowRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registrations per hour per IP
    keyPrefix: 'auth:register',
  }),

  // Password reset requests - strict limiting to prevent abuse
  passwordReset: new SlidingWindowRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 password reset requests per hour per email
    keyPrefix: 'auth:password_reset',
    identifier: (req) => {
      // Use email from request body for password reset limiting
      const email = req.headers.get('x-email') || req.url.split('email=')[1]?.split('&')[0]
      return email || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    }
  }),

  // Email verification - moderate limiting
  emailVerification: new SlidingWindowRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 verification emails per hour per email
    keyPrefix: 'auth:email_verify',
    identifier: (req) => {
      // Use email from request for email verification limiting
      const email = req.headers.get('x-email') || req.url.split('email=')[1]?.split('&')[0]
      return email || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    }
  }),

  // Password change - moderate limiting for authenticated users
  passwordChange: new SlidingWindowRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 password changes per hour per user
    keyPrefix: 'auth:password_change',
    identifier: (req) => {
      // Use user ID for authenticated password changes
      const userId = req.headers.get('x-user-id')
      return userId || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    }
  }),

  // General authentication API - broader limiting
  authAPI: new SlidingWindowRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50, // 50 auth API calls per 15 minutes per IP
    keyPrefix: 'auth:api',
  }),
}

/**
 * Middleware function to apply rate limiting to API routes
 */
export async function withAuthRateLimit(
  req: NextRequest,
  limiterType: keyof typeof authRateLimiters,
  customIdentifier?: string
): Promise<Response | null> {
  const limiter = authRateLimiters[limiterType]
  const result = await limiter.checkLimit(req, customIdentifier)

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: result.message,
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.resetTime,
        retryAfter: result.retryAfter
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': result.retryAfter.toString(),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  }

  return null
}

/**
 * Helper function to extract email from request body for email-based rate limiting
 */
export async function getEmailFromRequest(req: NextRequest): Promise<string | null> {
  try {
    const contentType = req.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const body = await req.clone().json()
      return body.email || null
    }
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await req.clone().formData()
      return formData.get('email') as string || null
    }
    
    return null
  } catch (error) {
    console.error('Error extracting email from request:', error)
    return null
  }
}

/**
 * Advanced rate limiting with user-specific limits
 */
export class UserAwareRateLimiter extends SlidingWindowRateLimiter {
  private userLimits: Map<string, number> = new Map()

  constructor(config: RateLimitConfig, userLimits?: Record<string, number>) {
    super(config)
    if (userLimits) {
      this.userLimits = new Map(Object.entries(userLimits))
    }
  }

  async checkLimit(req: NextRequest, customIdentifier?: string): Promise<RateLimitResult> {
    const userId = req.headers.get('x-user-id')
    
    // If user has custom limits, create a temporary limiter with those limits
    if (userId && this.userLimits.has(userId)) {
      const userLimit = this.userLimits.get(userId)!
      const userLimiter = new SlidingWindowRateLimiter({
        ...this.config,
        maxRequests: userLimit,
        keyPrefix: `${this.config.keyPrefix}:user:${userId}`
      })
      return userLimiter.checkLimit(req, userId)
    }

    return super.checkLimit(req, customIdentifier)
  }
}

/**
 * Rate limiter for suspicious activity detection
 */
export const suspiciousActivityLimiter = new SlidingWindowRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 20, // 20 requests per 5 minutes before flagging as suspicious
  keyPrefix: 'security:suspicious',
})

/**
 * Cleanup function to remove expired rate limit entries
 */
export async function cleanupExpiredRateLimits(): Promise<void> {
  if (!redis) return

  try {
    const patterns = [
      'auth:login:*',
      'auth:register:*',
      'auth:password_reset:*',
      'auth:email_verify:*',
      'auth:password_change:*',
      'auth:api:*',
      'security:suspicious:*'
    ]

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern)
      const now = Date.now()
      
      for (const key of keys) {
        // Remove entries older than their respective windows
        await redis.zremrangebyscore(key, 0, now - (24 * 60 * 60 * 1000)) // 24 hours ago
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired rate limits:', error)
  }
}