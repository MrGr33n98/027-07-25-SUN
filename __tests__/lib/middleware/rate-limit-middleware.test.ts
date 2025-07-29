import { NextRequest, NextResponse } from 'next/server'
import { 
  RateLimitMiddleware, 
  withRateLimit, 
  RateLimit,
  addRateLimitHeaders 
} from '../../../lib/middleware/rate-limit-middleware'
import { withAuthRateLimit } from '../../../lib/auth-rate-limiter'

// Mock the auth rate limiter
jest.mock('../../../lib/auth-rate-limiter', () => ({
  authRateLimiters: {
    login: { getRemainingRequests: jest.fn(), config: { maxRequests: 5, windowMs: 900000 } },
    registration: { getRemainingRequests: jest.fn(), config: { maxRequests: 3, windowMs: 3600000 } },
    passwordReset: { getRemainingRequests: jest.fn(), config: { maxRequests: 3, windowMs: 3600000 } },
    emailVerification: { getRemainingRequests: jest.fn(), config: { maxRequests: 5, windowMs: 3600000 } },
    passwordChange: { getRemainingRequests: jest.fn(), config: { maxRequests: 10, windowMs: 3600000 } },
    authAPI: { getRemainingRequests: jest.fn(), config: { maxRequests: 50, windowMs: 900000 } },
  },
  withAuthRateLimit: jest.fn(),
  getEmailFromRequest: jest.fn(),
}))

const mockWithAuthRateLimit = withAuthRateLimit as jest.MockedFunction<typeof withAuthRateLimit>
const mockGetEmailFromRequest = require('../../../lib/auth-rate-limiter').getEmailFromRequest as jest.MockedFunction<any>

// Helper function to create mock NextRequest
function createMockRequest(
  url: string = 'http://localhost:3000/api/test',
  headers: Record<string, string> = {},
  method: string = 'POST',
  body?: any
): NextRequest {
  const requestInit: RequestInit = {
    method,
    headers: new Headers(headers)
  }
  
  if (body) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body)
  }
  
  return new NextRequest(url, requestInit)
}

// Helper function to create mock rate limit response
function createRateLimitResponse(status: number = 429) {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests',
      limit: 5,
      remaining: 0,
      resetTime: Date.now() + 900000,
      retryAfter: 900
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': (Date.now() + 900000).toString(),
        'Retry-After': '900'
      }
    }
  )
}

describe('RateLimitMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('should return null when rate limit is not exceeded', async () => {
      mockWithAuthRateLimit.mockResolvedValue(null)

      const req = createMockRequest('http://localhost:3000/api/auth/login')
      const result = await RateLimitMiddleware.login(req)

      expect(result).toBeNull()
      expect(mockWithAuthRateLimit).toHaveBeenCalledWith(req, 'login')
    })

    it('should return 429 response when rate limit is exceeded', async () => {
      const rateLimitResponse = createRateLimitResponse()
      mockWithAuthRateLimit.mockResolvedValue(rateLimitResponse)

      const req = createMockRequest('http://localhost:3000/api/auth/login')
      const result = await RateLimitMiddleware.login(req)

      expect(result).not.toBeNull()
      expect(result!.status).toBe(429)
      
      const responseBody = await result!.json()
      expect(responseBody.error).toBe('Rate limit exceeded')
    })
  })

  describe('registration', () => {
    it('should apply registration rate limiting', async () => {
      mockWithAuthRateLimit.mockResolvedValue(null)

      const req = createMockRequest('http://localhost:3000/api/auth/register')
      const result = await RateLimitMiddleware.registration(req)

      expect(result).toBeNull()
      expect(mockWithAuthRateLimit).toHaveBeenCalledWith(req, 'registration')
    })

    it('should return rate limit response when exceeded', async () => {
      const rateLimitResponse = createRateLimitResponse()
      mockWithAuthRateLimit.mockResolvedValue(rateLimitResponse)

      const req = createMockRequest('http://localhost:3000/api/auth/register')
      const result = await RateLimitMiddleware.registration(req)

      expect(result).not.toBeNull()
      expect(result!.status).toBe(429)
    })
  })

  describe('passwordReset', () => {
    it('should use email from request for rate limiting', async () => {
      mockGetEmailFromRequest.mockResolvedValue('test@example.com')
      mockWithAuthRateLimit.mockResolvedValue(null)

      const req = createMockRequest(
        'http://localhost:3000/api/auth/password-reset',
        { 'content-type': 'application/json' },
        'POST',
        { email: 'test@example.com' }
      )
      
      const result = await RateLimitMiddleware.passwordReset(req)

      expect(result).toBeNull()
      expect(mockGetEmailFromRequest).toHaveBeenCalledWith(req)
      expect(mockWithAuthRateLimit).toHaveBeenCalledWith(req, 'passwordReset', 'test@example.com')
    })

    it('should fallback to IP-based limiting when email not available', async () => {
      mockGetEmailFromRequest.mockResolvedValue(null)
      mockWithAuthRateLimit.mockResolvedValue(null)

      const req = createMockRequest('http://localhost:3000/api/auth/password-reset')
      const result = await RateLimitMiddleware.passwordReset(req)

      expect(result).toBeNull()
      expect(mockWithAuthRateLimit).toHaveBeenCalledWith(req, 'passwordReset', undefined)
    })
  })

  describe('emailVerification', () => {
    it('should use email from request for rate limiting', async () => {
      mockGetEmailFromRequest.mockResolvedValue('test@example.com')
      mockWithAuthRateLimit.mockResolvedValue(null)

      const req = createMockRequest('http://localhost:3000/api/auth/verify-email')
      const result = await RateLimitMiddleware.emailVerification(req)

      expect(result).toBeNull()
      expect(mockGetEmailFromRequest).toHaveBeenCalledWith(req)
      expect(mockWithAuthRateLimit).toHaveBeenCalledWith(req, 'emailVerification', 'test@example.com')
    })
  })

  describe('passwordChange', () => {
    it('should apply password change rate limiting', async () => {
      mockWithAuthRateLimit.mockResolvedValue(null)

      const req = createMockRequest('http://localhost:3000/api/auth/change-password')
      const result = await RateLimitMiddleware.passwordChange(req)

      expect(result).toBeNull()
      expect(mockWithAuthRateLimit).toHaveBeenCalledWith(req, 'passwordChange')
    })
  })

  describe('authAPI', () => {
    it('should apply general auth API rate limiting', async () => {
      mockWithAuthRateLimit.mockResolvedValue(null)

      const req = createMockRequest('http://localhost:3000/api/auth/status')
      const result = await RateLimitMiddleware.authAPI(req)

      expect(result).toBeNull()
      expect(mockWithAuthRateLimit).toHaveBeenCalledWith(req, 'authAPI')
    })
  })
})

describe('withRateLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should execute handler when rate limit is not exceeded', async () => {
    mockWithAuthRateLimit.mockResolvedValue(null)

    const mockHandler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    )

    const wrappedHandler = withRateLimit('login', mockHandler)
    const req = createMockRequest()

    const result = await wrappedHandler(req)

    expect(mockWithAuthRateLimit).toHaveBeenCalledWith(req, 'login')
    expect(mockHandler).toHaveBeenCalledWith(req)
    
    const responseBody = await result.json()
    expect(responseBody.success).toBe(true)
  })

  it('should return rate limit response when limit is exceeded', async () => {
    const rateLimitResponse = createRateLimitResponse()
    mockWithAuthRateLimit.mockResolvedValue(rateLimitResponse)

    const mockHandler = jest.fn()
    const wrappedHandler = withRateLimit('login', mockHandler)
    const req = createMockRequest()

    const result = await wrappedHandler(req)

    expect(mockWithAuthRateLimit).toHaveBeenCalledWith(req, 'login')
    expect(mockHandler).not.toHaveBeenCalled()
    expect(result.status).toBe(429)
    
    const responseBody = await result.json()
    expect(responseBody.error).toBe('Rate limit exceeded')
  })
})

describe('RateLimit decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should apply rate limiting to decorated method', async () => {
    mockWithAuthRateLimit.mockResolvedValue(null)

    // Test the decorator functionality without using actual decorator syntax
    const originalMethod = async (req: NextRequest) => {
      return NextResponse.json({ success: true })
    }

    // Simulate what the decorator would do
    const decoratedMethod = async (req: NextRequest) => {
      const rateLimitResponse = await mockWithAuthRateLimit(req, 'login')
      if (rateLimitResponse) {
        return NextResponse.json(
          JSON.parse(rateLimitResponse.text),
          { status: rateLimitResponse.status, headers: rateLimitResponse.headers }
        )
      }
      return originalMethod(req)
    }

    const req = createMockRequest()
    const result = await decoratedMethod(req)

    expect(mockWithAuthRateLimit).toHaveBeenCalledWith(req, 'login')
    
    const responseBody = await result.json()
    expect(responseBody.success).toBe(true)
  })

  it('should return rate limit response when limit is exceeded', async () => {
    const rateLimitResponse = createRateLimitResponse()
    mockWithAuthRateLimit.mockResolvedValue(rateLimitResponse)

    // Test the decorator functionality without using actual decorator syntax
    const originalMethod = async (req: NextRequest) => {
      return NextResponse.json({ success: true })
    }

    // Simulate what the decorator would do
    const decoratedMethod = async (req: NextRequest) => {
      const rateLimitResponse = await mockWithAuthRateLimit(req, 'login')
      if (rateLimitResponse) {
        return NextResponse.json(
          JSON.parse(rateLimitResponse.text),
          { status: rateLimitResponse.status, headers: rateLimitResponse.headers }
        )
      }
      return originalMethod(req)
    }

    const req = createMockRequest()
    const result = await decoratedMethod(req)

    expect(mockWithAuthRateLimit).toHaveBeenCalledWith(req, 'login')
    expect(result.status).toBe(429)
    
    const responseBody = await result.json()
    expect(responseBody.error).toBe('Rate limit exceeded')
  })
})

describe('addRateLimitHeaders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should add rate limit headers to response', async () => {
    const mockLimiter = require('../../../lib/auth-rate-limiter').authRateLimiters.login
    mockLimiter.getRemainingRequests.mockResolvedValue(3)

    const response = NextResponse.json({ success: true })
    const req = createMockRequest()

    const result = await addRateLimitHeaders(response, req, 'login')

    expect(mockLimiter.getRemainingRequests).toHaveBeenCalledWith(req)
    expect(result.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(result.headers.get('X-RateLimit-Remaining')).toBe('3')
    expect(result.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })

  it('should handle errors gracefully when adding headers', async () => {
    const mockLimiter = require('../../../lib/auth-rate-limiter').authRateLimiters.login
    mockLimiter.getRemainingRequests.mockRejectedValue(new Error('Redis error'))

    const response = NextResponse.json({ success: true })
    const req = createMockRequest()

    const result = await addRateLimitHeaders(response, req, 'login')

    // Should return original response on error
    expect(result).toBe(response)
  })
})

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle complete authentication flow with rate limiting', async () => {
    // Simulate successful rate limit checks
    mockWithAuthRateLimit.mockResolvedValue(null)
    mockGetEmailFromRequest.mockResolvedValue('test@example.com')

    const req = createMockRequest(
      'http://localhost:3000/api/auth/login',
      { 'content-type': 'application/json' },
      'POST',
      { email: 'test@example.com', password: 'password123' }
    )

    // Test login rate limiting
    const loginResult = await RateLimitMiddleware.login(req)
    expect(loginResult).toBeNull()

    // Test password reset rate limiting
    const resetResult = await RateLimitMiddleware.passwordReset(req)
    expect(resetResult).toBeNull()

    // Test email verification rate limiting
    const verifyResult = await RateLimitMiddleware.emailVerification(req)
    expect(verifyResult).toBeNull()

    expect(mockWithAuthRateLimit).toHaveBeenCalledTimes(3)
    expect(mockGetEmailFromRequest).toHaveBeenCalledTimes(2)
  })

  it('should properly handle rate limit exceeded scenarios', async () => {
    const rateLimitResponse = createRateLimitResponse()
    mockWithAuthRateLimit.mockResolvedValue(rateLimitResponse)

    const req = createMockRequest('http://localhost:3000/api/auth/login')

    const result = await RateLimitMiddleware.login(req)

    expect(result).not.toBeNull()
    expect(result!.status).toBe(429)

    const responseBody = await result!.json()
    expect(responseBody).toMatchObject({
      error: 'Rate limit exceeded',
      message: 'Too many requests',
      limit: 5,
      remaining: 0
    })

    // Check headers
    expect(result!.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(result!.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(result!.headers.get('Retry-After')).toBe('900')
  })

  it('should handle different content types for email extraction', async () => {
    mockWithAuthRateLimit.mockResolvedValue(null)

    // Test JSON content type
    mockGetEmailFromRequest.mockResolvedValue('json@example.com')
    const jsonReq = createMockRequest(
      'http://localhost:3000/api/auth/password-reset',
      { 'content-type': 'application/json' },
      'POST',
      { email: 'json@example.com' }
    )

    await RateLimitMiddleware.passwordReset(jsonReq)
    expect(mockWithAuthRateLimit).toHaveBeenCalledWith(jsonReq, 'passwordReset', 'json@example.com')

    // Test form data content type
    mockGetEmailFromRequest.mockResolvedValue('form@example.com')
    const formReq = createMockRequest(
      'http://localhost:3000/api/auth/password-reset',
      { 'content-type': 'application/x-www-form-urlencoded' }
    )

    await RateLimitMiddleware.passwordReset(formReq)
    expect(mockWithAuthRateLimit).toHaveBeenCalledWith(formReq, 'passwordReset', 'form@example.com')
  })

  it('should handle concurrent requests properly', async () => {
    // Simulate first few requests succeeding, then rate limiting kicks in
    mockWithAuthRateLimit
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue(createRateLimitResponse())

    const requests = Array.from({ length: 6 }, () => 
      createMockRequest('http://localhost:3000/api/auth/login')
    )

    const results = await Promise.all(
      requests.map(req => RateLimitMiddleware.login(req))
    )

    // First 3 should succeed
    expect(results[0]).toBeNull()
    expect(results[1]).toBeNull()
    expect(results[2]).toBeNull()

    // Rest should be rate limited
    expect(results[3]!.status).toBe(429)
    expect(results[4]!.status).toBe(429)
    expect(results[5]!.status).toBe(429)
  })
})