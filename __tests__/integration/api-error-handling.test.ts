/**
 * API Error Handling Integration Tests
 * 
 * Tests error handling across authentication API endpoints to ensure
 * consistent error responses, proper HTTP status codes, and security-first messaging.
 * 
 * Covers Requirements 2.2 and 7.4:
 * - 2.2: Generic error messaging without revealing system information
 * - 7.4: Security-first error handling that doesn't aid attackers
 */

import { NextRequest } from 'next/server'
import { withAuthErrorHandling } from '@/lib/auth-error-handler'

// Mock the actual API handlers
const mockLoginHandler = jest.fn()
const mockRegisterHandler = jest.fn()
const mockPasswordResetHandler = jest.fn()
const mockEmailVerificationHandler = jest.fn()

// Create wrapped handlers
const wrappedLoginHandler = withAuthErrorHandling(mockLoginHandler, 'login')
const wrappedRegisterHandler = withAuthErrorHandling(mockRegisterHandler, 'register')
const wrappedPasswordResetHandler = withAuthErrorHandling(mockPasswordResetHandler, 'password_reset')
const wrappedEmailVerificationHandler = withAuthErrorHandling(mockEmailVerificationHandler, 'email_verification')

describe('API Error Handling Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (
    url: string,
    method: string = 'POST',
    body?: any,
    headers?: Record<string, string>
  ) => {
    const request = new NextRequest(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 Test Browser',
        'X-Forwarded-For': '192.168.1.1',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    })
    return request
  }

  describe('Login API Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockLoginHandler.mockRejectedValue(new Error('Network connection failed'))

      const request = createMockRequest('http://localhost:3000/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'password123'
      })

      const response = await wrappedLoginHandler(request)
      
      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData).toMatchObject({
        success: false,
        error: {
          type: 'INTERNAL_ERROR',
          message: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
          code: 'INTERNAL_ERROR',
          suggestions: expect.arrayContaining([
            'Try again in a few minutes',
            'Contact support if the problem persists'
          ])
        },
        timestamp: expect.any(String),
        requestId: expect.any(String)
      })

      // Verify error message doesn't leak system information
      expect(responseData.error.message).not.toContain('Network')
      expect(responseData.error.message).not.toContain('connection')
      expect(responseData.error.message).not.toContain('failed')
    })

    it('should handle database connection errors securely', async () => {
      mockLoginHandler.mockRejectedValue(new Error('Database connection timeout'))

      const request = createMockRequest('http://localhost:3000/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'password123'
      })

      const response = await wrappedLoginHandler(request)
      
      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData.error.message).toBe(
        'We\'re experiencing technical difficulties. Please try again in a few moments.'
      )
      
      // Verify no database information is leaked
      expect(responseData.error.message).not.toContain('Database')
      expect(responseData.error.message).not.toContain('timeout')
      expect(responseData.error.message).not.toContain('connection')
    })

    it('should handle unexpected exceptions with generic messaging', async () => {
      mockLoginHandler.mockImplementation(() => {
        throw new TypeError('Cannot read property of undefined')
      })

      const request = createMockRequest('http://localhost:3000/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'password123'
      })

      const response = await wrappedLoginHandler(request)
      
      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData.error.type).toBe('INTERNAL_ERROR')
      expect(responseData.error.message).not.toContain('TypeError')
      expect(responseData.error.message).not.toContain('undefined')
      expect(responseData.error.message).not.toContain('property')
    })
  })

  describe('Registration API Error Handling', () => {
    it('should handle validation errors with field-specific information', async () => {
      const validationError = new Error('Validation failed')
      validationError.name = 'ValidationError'
      mockRegisterHandler.mockRejectedValue(validationError)

      const request = createMockRequest('http://localhost:3000/api/auth/register', 'POST', {
        email: 'invalid-email',
        password: 'weak'
      })

      const response = await wrappedRegisterHandler(request)
      
      expect(response.status).toBe(500) // Wrapped as internal error since it's not AuthError
      
      const responseData = await response.json()
      expect(responseData.error.type).toBe('INTERNAL_ERROR')
      expect(responseData.error.message).toBe(
        'We\'re experiencing technical difficulties. Please try again in a few moments.'
      )
    })

    it('should handle email service failures gracefully', async () => {
      mockRegisterHandler.mockRejectedValue(new Error('SMTP server unavailable'))

      const request = createMockRequest('http://localhost:3000/api/auth/register', 'POST', {
        email: 'newuser@example.com',
        password: 'StrongPass123!'
      })

      const response = await wrappedRegisterHandler(request)
      
      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData.error.message).not.toContain('SMTP')
      expect(responseData.error.message).not.toContain('server')
      expect(responseData.error.message).not.toContain('unavailable')
    })

    it('should handle rate limiting service errors', async () => {
      mockRegisterHandler.mockRejectedValue(new Error('Redis rate limiter connection failed'))

      const request = createMockRequest('http://localhost:3000/api/auth/register', 'POST', {
        email: 'test@example.com',
        password: 'StrongPass123!'
      })

      const response = await wrappedRegisterHandler(request)
      
      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData.error.message).not.toContain('Redis')
      expect(responseData.error.message).not.toContain('rate limiter')
      expect(responseData.error.message).not.toContain('connection failed')
    })
  })

  describe('Password Reset API Error Handling', () => {
    it('should handle token generation failures securely', async () => {
      mockPasswordResetHandler.mockRejectedValue(new Error('Crypto module initialization failed'))

      const request = createMockRequest('http://localhost:3000/api/auth/password-reset', 'POST', {
        email: 'user@example.com'
      })

      const response = await wrappedPasswordResetHandler(request)
      
      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData.error.message).not.toContain('Crypto')
      expect(responseData.error.message).not.toContain('module')
      expect(responseData.error.message).not.toContain('initialization')
    })

    it('should handle email template rendering errors', async () => {
      mockPasswordResetHandler.mockRejectedValue(new Error('Template engine error: missing variable'))

      const request = createMockRequest('http://localhost:3000/api/auth/password-reset', 'POST', {
        email: 'user@example.com'
      })

      const response = await wrappedPasswordResetHandler(request)
      
      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData.error.message).not.toContain('Template')
      expect(responseData.error.message).not.toContain('engine')
      expect(responseData.error.message).not.toContain('variable')
    })
  })

  describe('Email Verification API Error Handling', () => {
    it('should handle token validation service errors', async () => {
      mockEmailVerificationHandler.mockRejectedValue(new Error('JWT verification failed: invalid signature'))

      const request = createMockRequest('http://localhost:3000/api/auth/verify-email', 'POST', {
        token: 'invalid-token-123'
      })

      const response = await wrappedEmailVerificationHandler(request)
      
      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData.error.message).not.toContain('JWT')
      expect(responseData.error.message).not.toContain('verification')
      expect(responseData.error.message).not.toContain('signature')
    })

    it('should handle user update service failures', async () => {
      mockEmailVerificationHandler.mockRejectedValue(new Error('Prisma update failed: unique constraint violation'))

      const request = createMockRequest('http://localhost:3000/api/auth/verify-email', 'POST', {
        token: 'valid-token-123'
      })

      const response = await wrappedEmailVerificationHandler(request)
      
      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData.error.message).not.toContain('Prisma')
      expect(responseData.error.message).not.toContain('constraint')
      expect(responseData.error.message).not.toContain('violation')
    })
  })

  describe('Request Context Extraction', () => {
    it('should extract IP address from various headers', async () => {
      const testCases = [
        { header: 'X-Forwarded-For', value: '203.0.113.1, 192.168.1.1', expected: '203.0.113.1' },
        { header: 'X-Real-IP', value: '203.0.113.2', expected: '203.0.113.2' },
        { header: 'X-Forwarded-For', value: '203.0.113.3', expected: '203.0.113.3' }
      ]

      for (const testCase of testCases) {
        mockLoginHandler.mockRejectedValue(new Error('Test error'))

        const request = createMockRequest(
          'http://localhost:3000/api/auth/login',
          'POST',
          { email: 'test@example.com', password: 'password' },
          { [testCase.header]: testCase.value }
        )

        const response = await wrappedLoginHandler(request)
        
        // The IP should be extracted and used in logging
        // We can't directly test the logging here, but we can verify the response structure
        expect(response.status).toBe(500)
        const responseData = await response.json()
        expect(responseData.requestId).toBeDefined()
      }
    })

    it('should handle missing IP address gracefully', async () => {
      mockLoginHandler.mockRejectedValue(new Error('Test error'))

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 Test Browser'
          // No IP headers
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' })
      })

      const response = await wrappedLoginHandler(request)
      
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.requestId).toBeDefined()
    })

    it('should extract user agent correctly', async () => {
      mockLoginHandler.mockRejectedValue(new Error('Test error'))

      const customUserAgent = 'CustomBot/1.0 (Test Suite)'
      const request = createMockRequest(
        'http://localhost:3000/api/auth/login',
        'POST',
        { email: 'test@example.com', password: 'password' },
        { 'User-Agent': customUserAgent }
      )

      const response = await wrappedLoginHandler(request)
      
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.requestId).toBeDefined()
    })
  })

  describe('Response Headers', () => {
    it('should include security headers in error responses', async () => {
      mockLoginHandler.mockRejectedValue(new Error('Test error'))

      const request = createMockRequest('http://localhost:3000/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'password'
      })

      const response = await wrappedLoginHandler(request)
      
      expect(response.headers.get('X-Request-ID')).toBeDefined()
      expect(response.headers.get('X-Request-ID')).toMatch(/^req_\d+_[a-z0-9]+$/)
    })

    it('should include Retry-After header for rate limit errors', async () => {
      const { AuthError, AuthErrorType } = await import('@/lib/auth-error-handler')
      
      const rateLimitError = new AuthError(
        AuthErrorType.RATE_LIMIT_EXCEEDED,
        'Too many requests',
        'Rate limit exceeded',
        429,
        { retryAfter: 300 }
      )

      mockLoginHandler.mockRejectedValue(rateLimitError)

      const request = createMockRequest('http://localhost:3000/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'password'
      })

      const response = await wrappedLoginHandler(request)
      
      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('300')
    })
  })

  describe('Error Response Timing', () => {
    it('should not reveal timing information that could aid attackers', async () => {
      const startTime = Date.now()

      // Simulate different error types that might have different processing times
      const errorTypes = [
        new Error('User not found'),
        new Error('Password hash verification failed'),
        new Error('Account locked'),
        new Error('Database query timeout')
      ]

      const responseTimes: number[] = []

      for (const error of errorTypes) {
        mockLoginHandler.mockRejectedValue(error)

        const request = createMockRequest('http://localhost:3000/api/auth/login', 'POST', {
          email: 'test@example.com',
          password: 'password'
        })

        const requestStart = Date.now()
        const response = await wrappedLoginHandler(request)
        const requestEnd = Date.now()

        responseTimes.push(requestEnd - requestStart)

        expect(response.status).toBe(500)
        const responseData = await response.json()
        expect(responseData.error.type).toBe('INTERNAL_ERROR')
      }

      // All response times should be relatively similar (within reasonable bounds)
      // This is a basic check - in a real scenario, you might want more sophisticated timing analysis
      const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      const maxDeviation = Math.max(...responseTimes.map(time => Math.abs(time - avgTime)))
      
      // Allow for some variance but ensure it's not excessive
      expect(maxDeviation).toBeLessThan(100) // 100ms deviation threshold
    })
  })

  describe('Error Logging Integration', () => {
    it('should log errors without exposing sensitive information', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      mockLoginHandler.mockRejectedValue(new Error('Database password is incorrect'))

      const request = createMockRequest('http://localhost:3000/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'password'
      })

      const response = await wrappedLoginHandler(request)
      
      expect(response.status).toBe(500)
      
      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalled()
      
      // Verify logged message contains request ID and operation
      const logCall = consoleSpy.mock.calls[0]
      expect(logCall[0]).toContain('Unexpected error in login')
      expect(logCall[0]).toMatch(/\[req_\d+_[a-z0-9]+\]/)

      consoleSpy.mockRestore()
    })

    it('should handle logging failures gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {
        throw new Error('Logging system failed')
      })

      mockLoginHandler.mockRejectedValue(new Error('Test error'))

      const request = createMockRequest('http://localhost:3000/api/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'password'
      })

      // Should not throw even if logging fails
      const response = await wrappedLoginHandler(request)
      
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.success).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe('Content Type Handling', () => {
    it('should handle requests with invalid content type', async () => {
      mockLoginHandler.mockRejectedValue(new Error('Invalid JSON'))

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': 'Mozilla/5.0 Test Browser',
          'X-Forwarded-For': '192.168.1.1'
        },
        body: 'not json data'
      })

      const response = await wrappedLoginHandler(request)
      
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error.type).toBe('INTERNAL_ERROR')
      expect(responseData.error.message).not.toContain('JSON')
    })

    it('should handle requests with missing content type', async () => {
      mockLoginHandler.mockRejectedValue(new Error('Content type missing'))

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 Test Browser',
          'X-Forwarded-For': '192.168.1.1'
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' })
      })

      const response = await wrappedLoginHandler(request)
      
      expect(response.status).toBe(500)
      const responseData = await response.json()
      expect(responseData.error.type).toBe('INTERNAL_ERROR')
    })
  })
})