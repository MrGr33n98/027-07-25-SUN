import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { AuthError, AuthErrorType, AuthErrorHandler } from '@/lib/auth-error-handler'
import { RateLimitFeedbackManager, RateLimitErrorCreator } from '@/lib/rate-limit-feedback'
import { redirectToErrorPage, createErrorPageUrl, parseErrorFromUrl } from '@/lib/error-redirect'

// Mock Next.js
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
    redirect: jest.fn((url, status) => ({ url, status }))
  }
}))

// Mock security logger
jest.mock('@/lib/security-logger', () => ({
  securityLogger: {
    logSecurityEvent: jest.fn()
  }
}))

describe('Error Handling System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('AuthError', () => {
    it('should create auth error with correct properties', () => {
      const error = new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid email or password',
        'Authentication failed for user@example.com',
        401,
        {
          field: 'email',
          suggestions: ['Check your email', 'Reset password']
        }
      )

      expect(error.type).toBe(AuthErrorType.INVALID_CREDENTIALS)
      expect(error.userMessage).toBe('Invalid email or password')
      expect(error.logMessage).toBe('Authentication failed for user@example.com')
      expect(error.statusCode).toBe(401)
      expect(error.field).toBe('email')
      expect(error.suggestions).toEqual(['Check your email', 'Reset password'])
    })

    it('should use user message as log message when not provided', () => {
      const error = new AuthError(
        AuthErrorType.VALIDATION_ERROR,
        'Please check your input'
      )

      expect(error.userMessage).toBe('Please check your input')
      expect(error.logMessage).toBe('Please check your input')
    })
  })

  describe('AuthErrorHandler', () => {
    it('should handle auth errors correctly', async () => {
      const error = new AuthError(
        AuthErrorType.RATE_LIMIT_EXCEEDED,
        'Too many attempts',
        'Rate limit exceeded',
        429,
        { retryAfter: 300 }
      )

      const context = {
        operation: 'login',
        email: 'user@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      }

      const response = await AuthErrorHandler.handleError(error, context)

      expect(response.data.success).toBe(false)
      expect(response.data.error.type).toBe(AuthErrorType.RATE_LIMIT_EXCEEDED)
      expect(response.data.error.message).toBe('Too many attempts')
      expect(response.data.error.retryAfter).toBe(300)
      expect(response.options.status).toBe(429)
    })

    it('should create validation error from validation results', () => {
      const validationErrors = {
        email: ['Invalid email format'],
        password: ['Password too short']
      }

      const error = AuthErrorHandler.createValidationError(validationErrors, 'email')

      expect(error.type).toBe(AuthErrorType.VALIDATION_ERROR)
      expect(error.field).toBe('email')
      expect(error.details).toEqual(validationErrors)
    })

    it('should create rate limit error with retry information', () => {
      const error = AuthErrorHandler.createRateLimitError(300, 'login')

      expect(error.type).toBe(AuthErrorType.RATE_LIMIT_EXCEEDED)
      expect(error.retryAfter).toBe(300)
      expect(error.userMessage).toContain('5 minutes')
    })

    it('should create account lockout error with duration', () => {
      const error = AuthErrorHandler.createAccountLockoutError(90)

      expect(error.type).toBe(AuthErrorType.ACCOUNT_LOCKED)
      expect(error.retryAfter).toBe(5400) // 90 minutes in seconds
      expect(error.userMessage).toContain('1 hour and 30 minutes')
    })

    it('should create password strength error with requirements', () => {
      const requirements = [
        'Must be at least 8 characters',
        'Must contain uppercase letter'
      ]

      const error = AuthErrorHandler.createPasswordStrengthError(requirements)

      expect(error.type).toBe(AuthErrorType.PASSWORD_STRENGTH)
      expect(error.field).toBe('password')
      expect(error.details?.requirements).toEqual(requirements)
    })
  })

  describe('RateLimitFeedbackManager', () => {
    let manager: RateLimitFeedbackManager;

    beforeEach(() => {
      manager = RateLimitFeedbackManager.getInstance()
    })

    afterEach(() => {
      manager.destroy()
    })

    it('should format time remaining correctly', () => {
      expect(RateLimitFeedbackManager.formatTimeRemaining(0)).toBe('0s')
      expect(RateLimitFeedbackManager.formatTimeRemaining(30)).toBe('30s')
      expect(RateLimitFeedbackManager.formatTimeRemaining(90)).toBe('1m 30s')
      expect(RateLimitFeedbackManager.formatTimeRemaining(3661)).toBe('1h 1m')
    })

    it('should start rate limit with countdown', (done) => {
      const operation = 'test_operation'
      let callCount = 0

      const unsubscribe = manager.subscribe(operation, (state) => {
        callCount++
        
        if (callCount === 1) {
          expect(state.isLimited).toBe(true)
          expect(state.remainingTime).toBe(2)
          expect(state.operation).toBe(operation)
        } else if (callCount === 3) {
          expect(state.isLimited).toBe(false)
          expect(state.remainingTime).toBe(0)
          unsubscribe()
          done()
        }
      })

      manager.startRateLimit({
        operation,
        limit: 5,
        windowMs: 60000,
        retryAfter: 2,
        severity: 'medium'
      })
    }, 5000)

    it('should clear rate limit immediately', () => {
      const operation = 'test_clear'
      let finalState: any = null

      const unsubscribe = manager.subscribe(operation, (state) => {
        finalState = state
      })

      manager.startRateLimit({
        operation,
        limit: 5,
        windowMs: 60000,
        retryAfter: 10,
        severity: 'low'
      })

      manager.clearRateLimit(operation)

      expect(finalState.isLimited).toBe(false)
      expect(finalState.remainingTime).toBe(0)
      
      unsubscribe()
    })
  })

  describe('RateLimitErrorCreator', () => {
    it('should create rate limit error with feedback', () => {
      const error = RateLimitErrorCreator.createError(
        'login',
        300,
        'medium',
        { limit: 5, windowMs: 900000, currentCount: 6 }
      )

      expect(error.type).toBe(AuthErrorType.RATE_LIMIT_EXCEEDED)
      expect(error.retryAfter).toBe(300)
      expect(error.message).toContain('5m')
      expect(error.details?.operation).toBe('login')
      expect(error.details?.severity).toBe('medium')
    })

    it('should create progressive error with increasing severity', () => {
      // First few attempts - low severity
      const error1 = RateLimitErrorCreator.createProgressiveError('login', 2, 60)
      expect(error1.details?.severity).toBe('low')

      // Medium attempts - medium severity
      const error2 = RateLimitErrorCreator.createProgressiveError('login', 5, 60)
      expect(error2.details?.severity).toBe('medium')
      expect(error2.retryAfter).toBe(240) // 60 * 4

      // High attempts - high severity
      const error3 = RateLimitErrorCreator.createProgressiveError('login', 12, 60)
      expect(error3.details?.severity).toBe('high')
      expect(error3.retryAfter).toBe(480) // 60 * 8
    })
  })

  describe('Error Redirect Utilities', () => {
    it('should redirect to appropriate error page for auth errors', () => {
      const accountLockedError = new AuthError(
        AuthErrorType.ACCOUNT_LOCKED,
        'Account locked',
        undefined,
        423,
        { retryAfter: 1800, email: 'user@example.com', lockoutCount: 2 }
      )

      const url = redirectToErrorPage(accountLockedError, { returnUrl: '/dashboard' })
      
      expect(url).toContain('/error-pages/account-locked')
      expect(url).toContain('lockoutDuration=1800')
      expect(url).toContain('email=user%40example.com')
      expect(url).toContain('lockoutCount=2')
      expect(url).toContain('returnUrl=%2Fdashboard')
    })

    it('should redirect to rate limit page for rate limit errors', () => {
      const rateLimitError = new AuthError(
        AuthErrorType.RATE_LIMIT_EXCEEDED,
        'Too many attempts',
        undefined,
        429,
        { retryAfter: 300, operation: 'login' }
      )

      const url = redirectToErrorPage(rateLimitError)
      
      expect(url).toContain('/error-pages/rate-limit')
      expect(url).toContain('retryAfter=300')
      expect(url).toContain('operation=login')
    })

    it('should redirect to general error page for other errors', () => {
      const genericError = new Error('Something went wrong')
      const url = redirectToErrorPage(genericError)
      
      expect(url).toContain('/error-pages/general')
      expect(url).toContain('type=INTERNAL_ERROR')
      expect(url).toContain('message=')
    })

    it('should create custom error page URL', () => {
      const url = createErrorPageUrl({
        type: AuthErrorType.VALIDATION_ERROR,
        message: 'Invalid input provided',
        title: 'Form Validation Error',
        suggestions: ['Check required fields', 'Verify email format'],
        returnUrl: '/form',
        severity: 'low'
      })

      expect(url).toContain('/error-pages/general')
      expect(url).toContain('type=VALIDATION_ERROR')
      expect(url).toContain('message=Invalid%20input%20provided')
      expect(url).toContain('title=Form%20Validation%20Error')
      expect(url).toContain('suggestions=')
      expect(url).toContain('returnUrl=%2Fform')
      expect(url).toContain('severity=low')
    })

    it('should parse error information from URL', () => {
      const params = new URLSearchParams()
      params.set('type', AuthErrorType.TOKEN_EXPIRED)
      params.set('message', encodeURIComponent('Your link has expired'))
      params.set('retryAfter', '3600')
      params.set('suggestions', encodeURIComponent(JSON.stringify(['Request new link', 'Check email'])))
      params.set('returnUrl', encodeURIComponent('/reset-password'))

      const parsed = parseErrorFromUrl(params)

      expect(parsed).toEqual({
        type: AuthErrorType.TOKEN_EXPIRED,
        message: 'Your link has expired',
        retryAfter: 3600,
        suggestions: ['Request new link', 'Check email'],
        returnUrl: '/reset-password'
      })
    })

    it('should return null for invalid URL parameters', () => {
      const params = new URLSearchParams()
      params.set('type', 'INVALID_TYPE')
      // Missing required message parameter

      const parsed = parseErrorFromUrl(params)
      expect(parsed).toBeNull()
    })
  })

  describe('Security-First Error Messages', () => {
    it('should not leak sensitive information in error messages', () => {
      const error = new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid email or password. Please check your credentials and try again.',
        'Authentication failed for user@example.com - password hash mismatch'
      )

      // User message should be generic
      expect(error.userMessage).not.toContain('user@example.com')
      expect(error.userMessage).not.toContain('hash')
      expect(error.userMessage).not.toContain('mismatch')

      // Log message can contain details
      expect(error.logMessage).toContain('user@example.com')
      expect(error.logMessage).toContain('hash mismatch')
    })

    it('should provide helpful suggestions without revealing system details', () => {
      const error = AuthErrorHandler.createPasswordStrengthError([
        'Password must be at least 8 characters long',
        'Password must contain at least one uppercase letter'
      ])

      expect(error.suggestions).toContain('Use at least 8 characters')
      expect(error.suggestions).toContain('Include uppercase and lowercase letters')
      expect(error.suggestions).not.toContain('database')
      expect(error.suggestions).not.toContain('hash')
      expect(error.suggestions).not.toContain('bcrypt')
    })
  })

  describe('Error Recovery and Retry Logic', () => {
    it('should provide appropriate retry suggestions based on error type', () => {
      const rateLimitError = new AuthError(
        AuthErrorType.RATE_LIMIT_EXCEEDED,
        'Too many attempts',
        undefined,
        429,
        { retryAfter: 300 }
      )

      expect(rateLimitError.suggestions).toContain('Wait a few minutes before trying again')
      expect(rateLimitError.suggestions).toContain('Avoid rapid repeated attempts')
    })

    it('should not suggest retry for non-retryable errors', () => {
      const accountLockedError = new AuthError(
        AuthErrorType.ACCOUNT_LOCKED,
        'Account locked',
        undefined,
        423
      )

      // Should suggest alternative actions, not immediate retry
      expect(accountLockedError.suggestions).toContain('Wait for the lockout period to expire')
      expect(accountLockedError.suggestions).toContain('Reset your password to unlock your account')
    })
  })
})