import { NextRequest, NextResponse } from 'next/server'
import { authRateLimiters, withAuthRateLimit, getEmailFromRequest } from '../auth-rate-limiter'

/**
 * Rate limiting middleware for different authentication endpoints
 */
export class RateLimitMiddleware {
  /**
   * Apply rate limiting to login endpoints
   */
  static async login(req: NextRequest): Promise<NextResponse | null> {
    const rateLimitResponse = await withAuthRateLimit(req, 'login')
    if (rateLimitResponse) {
      const responseBody = JSON.parse(await rateLimitResponse.text())
      return NextResponse.json(responseBody, { 
        status: rateLimitResponse.status, 
        headers: rateLimitResponse.headers 
      })
    }
    return null
  }

  /**
   * Apply rate limiting to registration endpoints
   */
  static async registration(req: NextRequest): Promise<NextResponse | null> {
    const rateLimitResponse = await withAuthRateLimit(req, 'registration')
    if (rateLimitResponse) {
      const responseBody = JSON.parse(await rateLimitResponse.text())
      return NextResponse.json(responseBody, { 
        status: rateLimitResponse.status, 
        headers: rateLimitResponse.headers 
      })
    }
    return null
  }

  /**
   * Apply rate limiting to password reset endpoints
   */
  static async passwordReset(req: NextRequest): Promise<NextResponse | null> {
    // Try to get email from request for more accurate rate limiting
    const email = await getEmailFromRequest(req)
    const rateLimitResponse = await withAuthRateLimit(req, 'passwordReset', email || undefined)
    if (rateLimitResponse) {
      const responseBody = JSON.parse(await rateLimitResponse.text())
      return NextResponse.json(responseBody, { 
        status: rateLimitResponse.status, 
        headers: rateLimitResponse.headers 
      })
    }
    return null
  }

  /**
   * Apply rate limiting to email verification endpoints
   */
  static async emailVerification(req: NextRequest): Promise<NextResponse | null> {
    // Try to get email from request for more accurate rate limiting
    const email = await getEmailFromRequest(req)
    const rateLimitResponse = await withAuthRateLimit(req, 'emailVerification', email || undefined)
    if (rateLimitResponse) {
      const responseBody = JSON.parse(await rateLimitResponse.text())
      return NextResponse.json(responseBody, { 
        status: rateLimitResponse.status, 
        headers: rateLimitResponse.headers 
      })
    }
    return null
  }

  /**
   * Apply rate limiting to password change endpoints
   */
  static async passwordChange(req: NextRequest): Promise<NextResponse | null> {
    const rateLimitResponse = await withAuthRateLimit(req, 'passwordChange')
    if (rateLimitResponse) {
      const responseBody = JSON.parse(await rateLimitResponse.text())
      return NextResponse.json(responseBody, { 
        status: rateLimitResponse.status, 
        headers: rateLimitResponse.headers 
      })
    }
    return null
  }

  /**
   * Apply rate limiting to general auth API endpoints
   */
  static async authAPI(req: NextRequest): Promise<NextResponse | null> {
    const rateLimitResponse = await withAuthRateLimit(req, 'authAPI')
    if (rateLimitResponse) {
      const responseBody = JSON.parse(await rateLimitResponse.text())
      return NextResponse.json(responseBody, { 
        status: rateLimitResponse.status, 
        headers: rateLimitResponse.headers 
      })
    }
    return null
  }
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit(
  limiterType: keyof typeof authRateLimiters,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Apply rate limiting
    const rateLimitResponse = await withAuthRateLimit(req, limiterType)
    if (rateLimitResponse) {
      const responseBody = JSON.parse(await rateLimitResponse.text())
      return NextResponse.json(responseBody, { 
        status: rateLimitResponse.status, 
        headers: rateLimitResponse.headers 
      })
    }

    // If rate limit passed, execute the handler
    return handler(req)
  }
}

/**
 * Decorator function for API route handlers
 */
export function RateLimit(limiterType: keyof typeof authRateLimiters) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (req: NextRequest, ...args: any[]) {
      const rateLimitResponse = await withAuthRateLimit(req, limiterType)
      if (rateLimitResponse) {
        const responseBody = JSON.parse(await rateLimitResponse.text())
        return NextResponse.json(responseBody, { 
          status: rateLimitResponse.status, 
          headers: rateLimitResponse.headers 
        })
      }

      return method.apply(this, [req, ...args])
    }

    return descriptor
  }
}

/**
 * Utility function to add rate limit headers to successful responses
 */
export async function addRateLimitHeaders(
  response: NextResponse,
  req: NextRequest,
  limiterType: keyof typeof authRateLimiters
): Promise<NextResponse> {
  try {
    const limiter = authRateLimiters[limiterType]
    const remaining = await limiter.getRemainingRequests(req)
    
    response.headers.set('X-RateLimit-Limit', limiter['config'].maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', (Date.now() + limiter['config'].windowMs).toString())
    
    return response
  } catch (error) {
    console.error('Error adding rate limit headers:', error)
    return response
  }
}

/**
 * Example usage in API routes:
 * 
 * // app/api/auth/login/route.ts
 * import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'
 * 
 * export const POST = withRateLimit('login', async (req: NextRequest) => {
 *   // Your login logic here
 *   return NextResponse.json({ success: true })
 * })
 * 
 * // Or using the class methods:
 * export async function POST(req: NextRequest) {
 *   const rateLimitResponse = await RateLimitMiddleware.login(req)
 *   if (rateLimitResponse) return rateLimitResponse
 *   
 *   // Your login logic here
 *   return NextResponse.json({ success: true })
 * }
 */