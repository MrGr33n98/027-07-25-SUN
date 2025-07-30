/**
 * Comprehensive Integration Tests for Error Handling Scenarios
 * 
 * This test suite covers Requirements 2.2 and 7.4:
 * - 2.2: Generic error messaging without revealing system information
 * - 7.4: Security-first error handling that doesn't aid attackers
 * 
 * Tests various error scenarios across the authentication system to ensure
 * proper error handling, security messaging, and user experience.
 */

import { NextRequest, NextResponse } from 'next/server'
import { AuthError, AuthErrorType, AuthErrorHandler } from '@/lib/auth-error-handler'

// Mock dependencies
jest.mock('@/lib/security-logger', () => ({
  securityLogger: {
    logSecurityEvent: jest.fn()
  }
}))

jest.mock('@/lib/rate-limiter', () => ({
  rateLimiter: {
    checkRateLimit: jest.fn(),
    incrementAttempts: jest.fn()
  }
}))

// Import mocked modules
const { securityLogger } = require('@/lib/security-logger')
const { rateLimiter } = require('@/lib/rate-limiter')

describe('Error Handling Scenarios Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    securityLogger.logSecurityEvent.mockResolvedValue(undefined)
  })

  describe('Authentication Error Handling', () => {
    it('should handle invalid credentials with generic messaging', async () => {
      const error = new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid email or password. Please check your credentials and try again.'
      )

      const response = await AuthErrorHandler.handleError(error, {
        operation: 'login',
        email: 'test@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData).toMatchObject({
        success: false,
        error: {
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: 'Invalid email or password. Please check your credentials and try again.',
          code: AuthErrorType.INVALID_CREDENTIALS,
          suggestions: expect.arrayContaining([
            'Double-check your email address',
            'Verify your password is correct',
            'Try resetting your password if you\'ve forgotten it'
          ])
        },
        timestamp: expect.any(String),
        requestId: expect.any(String)
      })

      // Verify security logging
      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        undefined,
        'test@example.com',
        'error_occurred',
        false,
        '192.168.1.1',
        'Mozilla/5.0 Test Browser',
        expect.objectContaining({
          operation: 'login',
          errorType: AuthErrorType.INVALID_CREDENTIALS
        })
      )
    })

    it('should handle account lockout with security messaging', async () => {
      const lockoutError = AuthErrorHandler.createAccountLockoutError(30)

      const response = await AuthErrorHandler.handleError(lockoutError, {
        operation: 'login',
        email: 'locked@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      expect(response.status).toBe(423)
      
      const responseData = await response.json()
      expect(responseData.error).toMatchObject({
        type: AuthErrorType.ACCOUNT_LOCKED,
        message: expect.stringContaining('Account locked for 30 minutes'),
        retryAfter: 1800, // 30 minutes in seconds
        suggestions: expect.arrayContaining([
          'Wait for the lockout period to expire',
          'Contact support if you believe this is an error',
          'Reset your password to unlock your account'
        ])
      })

      // Verify Retry-After header is set
      expect(response.headers.get('Retry-After')).toBe('1800')
    })

    it('should handle rate limiting with appropriate timing information', async () => {
      const rateLimitError = AuthErrorHandler.createRateLimitError(300, 'login')

      const response = await AuthErrorHandler.handleError(rateLimitError, {
        operation: 'login',
        email: 'ratelimited@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      expect(response.status).toBe(429)
      
      const responseData = await response.json()
      expect(responseData.error).toMatchObject({
        type: AuthErrorType.RATE_LIMIT_EXCEEDED,
        message: expect.stringContaining('Too many login attempts'),
        retryAfter: 300,
        suggestions: expect.arrayContaining([
          'Wait a few minutes before trying again',
          'Avoid rapid repeated attempts'
        ])
      })
    })

    it('should handle email verification errors with helpful guidance', async () => {
      const error = new AuthError(
        AuthErrorType.EMAIL_NOT_VERIFIED,
        'Please verify your email address before logging in. Check your inbox for a verification link.'
      )

      const response = await AuthErrorHandler.handleError(error, {
        operation: 'login',
        email: 'unverified@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData.error).toMatchObject({
        type: AuthErrorType.EMAIL_NOT_VERIFIED,
        message: expect.stringContaining('verify your email address'),
        suggestions: expect.arrayContaining([
          'Check your email inbox and spam folder',
          'Click the verification link in the email',
          'Request a new verification email if needed'
        ])
      })
    })
  })

  describe('Token-Related Error Handling', () => {
    it('should handle expired tokens with security-appropriate messaging', async () => {
      const error = new AuthError(
        AuthErrorType.TOKEN_EXPIRED,
        'This link has expired. Please request a new one.'
      )

      const response = await AuthErrorHandler.handleError(error, {
        operation: 'password_reset',
        email: 'user@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData.error).toMatchObject({
        type: AuthErrorType.TOKEN_EXPIRED,
        message: 'This link has expired. Please request a new one.',
        suggestions: expect.arrayContaining([
          'Request a new verification or reset link',
          'Check that you\'re using the most recent email',
          'Links typically expire after 24 hours for security'
        ])
      })
    })

    it('should handle invalid tokens without revealing system details', async () => {
      const error = new AuthError(
        AuthErrorType.TOKEN_INVALID,
        'This link is invalid or has already been used.'
      )

      const response = await AuthErrorHandler.handleError(error, {
        operation: 'email_verification',
        email: 'user@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData.error).toMatchObject({
        type: AuthErrorType.TOKEN_INVALID,
        message: 'This link is invalid or has already been used.',
        suggestions: expect.arrayContaining([
          'Request a new verification or reset link',
          'Ensure you\'re using the complete link from the email',
          'Check that the link hasn\'t been used already'
        ])
      })
    })
  })

  describe('Validation Error Handling', () => {
    it('should handle password strength validation with specific guidance', async () => {
      const validationErrors = [
        'Password must be at least 8 characters long',
        'Password must contain at least one uppercase letter',
        'Password must contain at least one number'
      ]

      const error = AuthErrorHandler.createPasswordStrengthError(validationErrors)

      const response = await AuthErrorHandler.handleError(error, {
        operation: 'registration',
        email: 'newuser@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData.error).toMatchObject({
        type: AuthErrorType.PASSWORD_STRENGTH,
        message: 'Password does not meet security requirements.',
        field: 'password',
        details: {
          requirements: validationErrors
        },
        suggestions: expect.arrayContaining([
          'Use at least 8 characters',
          'Include uppercase and lowercase letters',
          'Add at least one number and special character'
        ])
      })
    })

    it('should handle email format validation errors', async () => {
      const error = new AuthError(
        AuthErrorType.EMAIL_FORMAT,
        'Please enter a valid email address.',
        'Invalid email format provided',
        400,
        {
          field: 'email',
          suggestions: [
            'Check for typos in your email address',
            'Ensure the email format is correct (user@domain.com)',
            'Remove any extra spaces'
          ]
        }
      )

      const response = await AuthErrorHandler.handleError(error, {
        operation: 'registration',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData.error).toMatchObject({
        type: AuthErrorType.EMAIL_FORMAT,
        message: 'Please enter a valid email address.',
        field: 'email',
        suggestions: expect.arrayContaining([
          'Check for typos in your email address',
          'Ensure the email format is correct (user@domain.com)'
        ])
      })
    })

    it('should handle general validation errors with field-specific information', async () => {
      const validationErrors = {
        email: ['Email is required'],
        password: ['Password is required']
      }

      const error = AuthErrorHandler.createValidationError(validationErrors, 'email')

      const response = await AuthErrorHandler.handleError(error, {
        operation: 'login',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      expect(response.status).toBe(400)
      
      const responseData = await response.json()
      expect(responseData.error).toMatchObject({
        type: AuthErrorType.VALIDATION_ERROR,
        message: 'Email is required',
        field: 'email',
        details: validationErrors,
        suggestions: expect.arrayContaining([
          'Review the highlighted fields',
          'Ensure all required information is provided'
        ])
      })
    })
  })

  describe('Security-Related Error Handling', () => {
    it('should handle suspicious activity with appropriate security messaging', async () => {
      const error = new AuthError(
        AuthErrorType.SUSPICIOUS_ACTIVITY,
        'Unusual activity detected. For security reasons, this action has been blocked.',
        'Suspicious login pattern detected',
        403,
        {
          details: { reason: 'multiple_locations', confidence: 0.85 },
          suggestions: [
            'Try again from a trusted device or location',
            'Contact support to verify your identity',
            'Check for any unauthorized access to your account'
          ]
        }
      )

      const response = await AuthErrorHandler.handleError(error, {
        operation: 'login',
        email: 'suspicious@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      expect(response.status).toBe(403)
      
      const responseData = await response.json()
      expect(responseData.error).toMatchObject({
        type: AuthErrorType.SUSPICIOUS_ACTIVITY,
        message: 'Unusual activity detected. For security reasons, this action has been blocked.',
        suggestions: expect.arrayContaining([
          'Try again from a trusted device or location',
          'Contact support to verify your identity'
        ])
      })

      // Verify security event is logged
      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        undefined,
        'suspicious@example.com',
        'error_occurred',
        false,
        '192.168.1.1',
        'Mozilla/5.0 Test Browser',
        expect.objectContaining({
          operation: 'login',
          errorType: AuthErrorType.SUSPICIOUS_ACTIVITY
        })
      )
    })
  })

  describe('System Error Handling', () => {
    it('should handle internal errors with generic messaging', async () => {
      const error = new Error('Database connection failed')

      const response = await AuthErrorHandler.handleError(error, {
        operation: 'login',
        email: 'user@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      expect(response.status).toBe(500)
      
      const responseData = await response.json()
      expect(responseData.error).toMatchObject({
        type: AuthErrorType.INTERNAL_ERROR,
        message: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
        code: AuthErrorType.INTERNAL_ERROR,
        suggestions: expect.arrayContaining([
          'Try again in a few minutes',
          'Contact support if the problem persists',
          'Check our status page for any known issues'
        ])
      })

      // Verify internal error doesn't leak system information
      expect(responseData.error.message).not.toContain('Database')
      expect(responseData.error.message).not.toContain('connection failed')
    })

    it('should handle service unavailable errors', async () => {
      const error = new AuthError(
        AuthErrorType.SERVICE_UNAVAILABLE,
        'Service is temporarily unavailable. Please try again later.',
        'Authentication service is down',
        503
      )

      const response = await AuthErrorHandler.handleError(error, {
        operation: 'login',
        email: 'user@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      expect(response.status).toBe(503)
      
      const responseData = await response.json()
      expect(responseData.error).toMatchObject({
        type: AuthErrorType.SERVICE_UNAVAILABLE,
        message: 'Service is temporarily unavailable. Please try again later.',
        suggestions: expect.arrayContaining([
          'Try again in a few minutes',
          'Check our status page for updates'
        ])
      })
    })
  })

  describe('Error Response Consistency', () => {
    it('should include consistent response structure for all error types', async () => {
      const errorTypes = [
        AuthErrorType.INVALID_CREDENTIALS,
        AuthErrorType.ACCOUNT_LOCKED,
        AuthErrorType.EMAIL_NOT_VERIFIED,
        AuthErrorType.RATE_LIMIT_EXCEEDED,
        AuthErrorType.VALIDATION_ERROR,
        AuthErrorType.PASSWORD_STRENGTH,
        AuthErrorType.EMAIL_FORMAT,
        AuthErrorType.SUSPICIOUS_ACTIVITY,
        AuthErrorType.TOKEN_EXPIRED,
        AuthErrorType.TOKEN_INVALID,
        AuthErrorType.INTERNAL_ERROR,
        AuthErrorType.SERVICE_UNAVAILABLE
      ]

      for (const errorType of errorTypes) {
        const error = new AuthError(errorType, 'Test error message')
        
        const response = await AuthErrorHandler.handleError(error, {
          operation: 'test',
          email: 'test@example.com',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test Browser'
        })

        const responseData = await response.json()
        
        // Verify consistent structure
        expect(responseData).toHaveProperty('success', false)
        expect(responseData).toHaveProperty('error')
        expect(responseData).toHaveProperty('timestamp')
        expect(responseData).toHaveProperty('requestId')
        
        expect(responseData.error).toHaveProperty('type', errorType)
        expect(responseData.error).toHaveProperty('message')
        expect(responseData.error).toHaveProperty('code', errorType)
        expect(responseData.error).toHaveProperty('suggestions')
        
        // Verify timestamp format
        expect(new Date(responseData.timestamp).toISOString()).toBe(responseData.timestamp)
        
        // Verify request ID format
        expect(responseData.requestId).toMatch(/^req_\d+_[a-z0-9]+$/)
        
        // Verify X-Request-ID header
        expect(response.headers.get('X-Request-ID')).toBe(responseData.requestId)
      }
    })

    it('should include appropriate HTTP status codes for different error types', async () => {
      const errorStatusMap = [
        { type: AuthErrorType.INVALID_CREDENTIALS, expectedStatus: 400 },
        { type: AuthErrorType.ACCOUNT_LOCKED, expectedStatus: 423 },
        { type: AuthErrorType.EMAIL_NOT_VERIFIED, expectedStatus: 400 },
        { type: AuthErrorType.RATE_LIMIT_EXCEEDED, expectedStatus: 429 },
        { type: AuthErrorType.VALIDATION_ERROR, expectedStatus: 400 },
        { type: AuthErrorType.PASSWORD_STRENGTH, expectedStatus: 400 },
        { type: AuthErrorType.EMAIL_FORMAT, expectedStatus: 400 },
        { type: AuthErrorType.SUSPICIOUS_ACTIVITY, expectedStatus: 403 },
        { type: AuthErrorType.TOKEN_EXPIRED, expectedStatus: 400 },
        { type: AuthErrorType.TOKEN_INVALID, expectedStatus: 400 },
        { type: AuthErrorType.INTERNAL_ERROR, expectedStatus: 500 },
        { type: AuthErrorType.SERVICE_UNAVAILABLE, expectedStatus: 503 }
      ]

      for (const { type, expectedStatus } of errorStatusMap) {
        const error = new AuthError(type, 'Test error message', undefined, expectedStatus)
        
        const response = await AuthErrorHandler.handleError(error, {
          operation: 'test',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test Browser'
        })

        expect(response.status).toBe(expectedStatus)
      }
    })
  })

  describe('Security Logging Integration', () => {
    it('should log all authentication errors with proper context', async () => {
      const error = new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid credentials'
      )

      await AuthErrorHandler.handleError(error, {
        operation: 'login',
        email: 'test@example.com',
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        'error_occurred',
        false,
        '192.168.1.1',
        'Mozilla/5.0 Test Browser',
        expect.objectContaining({
          operation: 'login',
          errorType: AuthErrorType.INVALID_CREDENTIALS,
          errorMessage: 'Invalid credentials',
          requestId: expect.any(String)
        })
      )
    })

    it('should handle logging failures gracefully', async () => {
      securityLogger.logSecurityEvent.mockRejectedValue(new Error('Logging failed'))

      const error = new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid credentials'
      )

      // Should not throw even if logging fails
      const response = await AuthErrorHandler.handleError(error, {
        operation: 'login',
        email: 'test@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      expect(response.status).toBe(400)
      const responseData = await response.json()
      expect(responseData.success).toBe(false)
    })
  })

  describe('Request Context Handling', () => {
    it('should handle missing IP address and user agent gracefully', async () => {
      const error = new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid credentials'
      )

      const response = await AuthErrorHandler.handleError(error, {
        operation: 'login',
        email: 'test@example.com'
        // Missing ipAddress and userAgent
      })

      expect(response.status).toBe(400)
      
      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        undefined,
        'test@example.com',
        'error_occurred',
        false,
        'unknown',
        'unknown',
        expect.any(Object)
      )
    })

    it('should generate unique request IDs for each error', async () => {
      const error = new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid credentials'
      )

      const response1 = await AuthErrorHandler.handleError(error, {
        operation: 'login',
        email: 'test1@example.com'
      })

      const response2 = await AuthErrorHandler.handleError(error, {
        operation: 'login',
        email: 'test2@example.com'
      })

      const data1 = await response1.json()
      const data2 = await response2.json()

      expect(data1.requestId).not.toBe(data2.requestId)
      expect(data1.requestId).toMatch(/^req_\d+_[a-z0-9]+$/)
      expect(data2.requestId).toMatch(/^req_\d+_[a-z0-9]+$/)
    })
  })

  describe('Success Response Handling', () => {
    it('should create consistent success responses', () => {
      const testData = { userId: '123', email: 'test@example.com' }
      const response = AuthErrorHandler.createSuccessResponse(
        testData,
        'Operation successful',
        'req_123_abc'
      )

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Request-ID')).toBe('req_123_abc')
    })

    it('should generate request ID for success responses when not provided', () => {
      const testData = { userId: '123' }
      const response = AuthErrorHandler.createSuccessResponse(testData, 'Success')

      expect(response.headers.get('X-Request-ID')).toMatch(/^req_\d+_[a-z0-9]+$/)
    })
  })

  describe('Error Message Security', () => {
    it('should never reveal sensitive system information in error messages', async () => {
      const sensitiveErrors = [
        new Error('Database password is incorrect'),
        new Error('Redis connection timeout at 127.0.0.1:6379'),
        new Error('JWT secret key not found in environment'),
        new Error('SQL injection attempt detected in query'),
        new Error('File not found: /etc/passwd')
      ]

      for (const error of sensitiveErrors) {
        const response = await AuthErrorHandler.handleError(error, {
          operation: 'test',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test Browser'
        })

        const responseData = await response.json()
        
        // Should return generic internal error message
        expect(responseData.error.message).toBe(
          'We\'re experiencing technical difficulties. Please try again in a few moments.'
        )
        
        // Should not contain any sensitive information
        expect(responseData.error.message).not.toContain('Database')
        expect(responseData.error.message).not.toContain('Redis')
        expect(responseData.error.message).not.toContain('JWT')
        expect(responseData.error.message).not.toContain('SQL')
        expect(responseData.error.message).not.toContain('/etc/')
        expect(responseData.error.message).not.toContain('127.0.0.1')
        expect(responseData.error.message).not.toContain('password')
      }
    })

    it('should provide helpful suggestions without revealing attack vectors', async () => {
      const error = new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid email or password. Please check your credentials and try again.'
      )

      const response = await AuthErrorHandler.handleError(error, {
        operation: 'login',
        email: 'attacker@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      })

      const responseData = await response.json()
      
      // Should provide helpful suggestions
      expect(responseData.error.suggestions).toContain('Double-check your email address')
      expect(responseData.error.suggestions).toContain('Verify your password is correct')
      
      // Should not reveal whether email exists or not
      expect(responseData.error.message).not.toContain('email not found')
      expect(responseData.error.message).not.toContain('user does not exist')
      expect(responseData.error.message).not.toContain('password incorrect')
    })
  })
})