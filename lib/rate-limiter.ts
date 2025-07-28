import { redis } from './redis'
import { NextRequest } from 'next/server'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  message?: string
}

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req) => this.getClientIP(req),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests, please try again later.',
      ...config
    }
  }

  async checkLimit(req: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator!(req)
    const windowKey = `ratelimit:${key}:${Math.floor(Date.now() / this.config.windowMs)}`

    try {
      const current = await redis.incr(windowKey)
      
      if (current === 1) {
        // First request in this window, set expiration
        await redis.expire(windowKey, Math.ceil(this.config.windowMs / 1000))
      }

      const remaining = Math.max(0, this.config.maxRequests - current)
      const resetTime = Math.ceil(Date.now() / this.config.windowMs) * this.config.windowMs + this.config.windowMs

      if (current > this.config.maxRequests) {
        return {
          success: false,
          limit: this.config.maxRequests,
          remaining: 0,
          resetTime,
          message: this.config.message
        }
      }

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining,
        resetTime
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // On error, allow the request to proceed
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs
      }
    }
  }

  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const realIP = req.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    return req.ip || 'unknown'
  }
}

// Predefined rate limiters for different endpoints
export const rateLimiters = {
  // General API rate limiter
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please try again in 15 minutes.'
  }),

  // Authentication rate limiter
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again in 15 minutes.'
  }),

  // Search rate limiter
  search: new RateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many search requests, please slow down.'
  }),

  // Contact/Email rate limiter
  contact: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many contact requests, please try again in 1 hour.'
  }),

  // Admin actions rate limiter
  admin: new RateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60,
    keyGenerator: (req) => {
      // Use user ID for admin actions if available
      const userId = req.headers.get('x-user-id')
      return userId || req.ip || 'unknown'
    },
    message: 'Too many admin actions, please slow down.'
  }),

  // File upload rate limiter
  upload: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: 'Too many file uploads, please try again in 15 minutes.'
  }),

  // Password reset rate limiter
  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts, please try again in 1 hour.'
  })
}

// Middleware helper function
export async function withRateLimit(
  req: NextRequest,
  limiter: RateLimiter
): Promise<Response | null> {
  const result = await limiter.checkLimit(req)

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: result.message,
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.resetTime
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
        }
      }
    )
  }

  return null
}

// Advanced rate limiting with different tiers
export class TieredRateLimiter {
  private limiters: Map<string, RateLimiter> = new Map()

  constructor(private tiers: Record<string, RateLimitConfig>) {
    Object.entries(tiers).forEach(([tier, config]) => {
      this.limiters.set(tier, new RateLimiter(config))
    })
  }

  async checkLimit(req: NextRequest, tier: string = 'default'): Promise<RateLimitResult> {
    const limiter = this.limiters.get(tier)
    if (!limiter) {
      throw new Error(`Rate limiter tier '${tier}' not found`)
    }

    return limiter.checkLimit(req)
  }
}

// User tier-based rate limiting
export const userTierLimiter = new TieredRateLimiter({
  free: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50,
    message: 'Free tier limit exceeded. Upgrade for higher limits.'
  },
  premium: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200,
    message: 'Premium tier limit exceeded.'
  },
  enterprise: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'Enterprise tier limit exceeded.'
  }
})

// Utility function to get user tier from request
export function getUserTier(req: NextRequest): string {
  const userTier = req.headers.get('x-user-tier')
  return userTier || 'free'
}