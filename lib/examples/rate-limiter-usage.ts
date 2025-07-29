/**
 * Example usage of the authentication rate limiter in API routes
 * 
 * This file demonstrates how to integrate the rate limiter into Next.js API routes
 * for different authentication endpoints.
 */

import { NextRequest, NextResponse } from 'next/server'
import { RateLimitMiddleware, withRateLimit } from '../middleware/rate-limit-middleware'
import { authRateLimiters } from '../auth-rate-limiter'

// Example 1: Using the middleware class methods
export async function loginHandler(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await RateLimitMiddleware.login(req)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Your login logic here
  try {
    // ... authentication logic ...
    return NextResponse.json({ success: true, message: 'Login successful' })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 401 }
    )
  }
}

// Example 2: Using the higher-order function wrapper
export const registrationHandler = withRateLimit('registration', async (req: NextRequest) => {
  // Your registration logic here
  try {
    // ... registration logic ...
    return NextResponse.json({ success: true, message: 'Registration successful' })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 400 }
    )
  }
})

// Example 3: Manual rate limiting with custom logic
export async function passwordResetHandler(req: NextRequest) {
  // Extract email for more accurate rate limiting
  const body = await req.json()
  const email = body.email

  // Check rate limit using email as identifier
  const result = await authRateLimiters.passwordReset.checkLimit(req, email)
  
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: result.message,
        retryAfter: result.retryAfter
      },
      { 
        status: 429,
        headers: {
          'Retry-After': result.retryAfter.toString(),
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString()
        }
      }
    )
  }

  // Your password reset logic here
  try {
    // ... password reset logic ...
    return NextResponse.json({ success: true, message: 'Password reset email sent' })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to send password reset email' },
      { status: 500 }
    )
  }
}

// Example 4: Using rate limiter in middleware.ts
export function createAuthMiddleware() {
  return async (req: NextRequest) => {
    const { pathname } = req.nextUrl

    // Apply different rate limits based on the endpoint
    if (pathname.startsWith('/api/auth/login')) {
      const rateLimitResponse = await RateLimitMiddleware.login(req)
      if (rateLimitResponse) return rateLimitResponse
    }
    
    if (pathname.startsWith('/api/auth/register')) {
      const rateLimitResponse = await RateLimitMiddleware.registration(req)
      if (rateLimitResponse) return rateLimitResponse
    }
    
    if (pathname.startsWith('/api/auth/password-reset')) {
      const rateLimitResponse = await RateLimitMiddleware.passwordReset(req)
      if (rateLimitResponse) return rateLimitResponse
    }
    
    if (pathname.startsWith('/api/auth/verify-email')) {
      const rateLimitResponse = await RateLimitMiddleware.emailVerification(req)
      if (rateLimitResponse) return rateLimitResponse
    }
    
    if (pathname.startsWith('/api/auth/change-password')) {
      const rateLimitResponse = await RateLimitMiddleware.passwordChange(req)
      if (rateLimitResponse) return rateLimitResponse
    }

    // Continue to the next middleware or route handler
    return NextResponse.next()
  }
}

// Example 5: Rate limiting with user-specific limits
export async function premiumUserHandler(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const userTier = req.headers.get('x-user-tier') || 'free'

  // Different limits based on user tier
  const limits = {
    free: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
    premium: { windowMs: 15 * 60 * 1000, maxRequests: 50 },
    enterprise: { windowMs: 15 * 60 * 1000, maxRequests: 200 }
  }

  const limit = limits[userTier as keyof typeof limits] || limits.free

  // Create a custom rate limiter for this user tier
  const customLimiter = new (require('../auth-rate-limiter').SlidingWindowRateLimiter)({
    ...limit,
    keyPrefix: `api:${userTier}`,
    identifier: () => userId || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  })

  const result = await customLimiter.checkLimit(req)
  
  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `${userTier} tier limit: ${result.message}`,
        retryAfter: result.retryAfter
      },
      { status: 429 }
    )
  }

  // Your API logic here
  return NextResponse.json({ success: true, data: 'API response' })
}

// Example 6: Monitoring and alerting integration
export async function monitoredHandler(req: NextRequest) {
  const rateLimitResponse = await RateLimitMiddleware.authAPI(req)
  if (rateLimitResponse) {
    // Log rate limit exceeded event for monitoring
    console.warn('Rate limit exceeded', {
      ip: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
      endpoint: req.nextUrl.pathname,
      timestamp: new Date().toISOString()
    })
    
    return rateLimitResponse
  }

  // Your API logic here
  return NextResponse.json({ success: true })
}

/**
 * Example API route file structure:
 * 
 * // app/api/auth/login/route.ts
 * import { loginHandler } from '@/lib/examples/rate-limiter-usage'
 * export const POST = loginHandler
 * 
 * // app/api/auth/register/route.ts
 * import { registrationHandler } from '@/lib/examples/rate-limiter-usage'
 * export const POST = registrationHandler
 * 
 * // app/api/auth/password-reset/route.ts
 * import { passwordResetHandler } from '@/lib/examples/rate-limiter-usage'
 * export const POST = passwordResetHandler
 */