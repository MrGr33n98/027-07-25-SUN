import { cache } from './redis'
import { RateLimitError } from './api-error'

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: Request) => string
}

export class RateLimiter {
  private windowMs: number
  private maxRequests: number
  private keyGenerator: (request: Request) => string

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs
    this.maxRequests = options.maxRequests
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator
  }

  private defaultKeyGenerator(request: Request): string {
    // Extract IP from headers (works with Vercel, Netlify, etc.)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown'
    return `rate_limit:${ip}`
  }

  async checkLimit(request: Request): Promise<void> {
    const key = this.keyGenerator(request)
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Get current request count
    const currentCount = await cache.get<number>(key) || 0

    if (currentCount >= this.maxRequests) {
      throw new RateLimitError(`Rate limit exceeded. Maximum ${this.maxRequests} requests per ${this.windowMs / 1000} seconds.`)
    }

    // Increment counter
    const ttl = Math.ceil(this.windowMs / 1000)
    await cache.set(key, currentCount + 1, ttl)
  }
}

// Predefined rate limiters
export const apiRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
})

export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
})

export const searchRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 searches per minute
})

export const uploadRateLimit = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 uploads per hour
})

// Middleware wrapper
export function withRateLimit(rateLimiter: RateLimiter) {
  return (handler: Function) => {
    return async (request: Request, ...args: any[]) => {
      await rateLimiter.checkLimit(request)
      return handler(request, ...args)
    }
  }
}