import { AuthError, AuthErrorHandler, AuthErrorType, AUTH_ERROR_MESSAGES } from '../../lib/auth-error-handler'
import { NextResponse } from 'next/server'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      data,
      status: options?.status || 200,
      headers: options?.headers || {}
    }))
  }
}))

// Mock security logger
jest.mock('../../lib/security-logger', () => ({
  securityLogger: {
    logSecurityEvent: jest.fn()
  }
}))

describe('AuthError', () => {
  it('should create an AuthError with all properties', () => {
    const error = new AuthError(
      AuthErrorType.INVALID_CREDENTIALS,
      'User message',
      'Log message',
      401,
      {
        field: 'email',
        details: { attempts: 3 },
        retryAfter: 300,
        suggestions: ['Try again']
      }
    )

    expect(error.type).toBe(AuthErrorType.INVALID_CREDENTIALS)
    expect(error.userMessage).toBe('User message')
    expect(error.logMessage).toBe('Log message')
    expect(error.statusCode).toBe(401)
    expect(error.field).toBe('email')
    expect(error.details).toEqual({ attempts: 3 })
    expect(error.retryAfter).toBe(300)
    expect(error.suggestions).toEqual(['Try again'])
  })

  it('should use userMessage as logMessage when logMessage is not provided', () => {
    const error = new AuthError(
      AuthErrorType.VALIDATION_ERROR,
      'Validation failed'
    )

    expect(error.userMessage).toBe('Validation failed')
    expect(error.logMessage).toBe('Validation failed')
  })

  it('should have default statusCode of 400', () => {
    const error = new AuthError(
      AuthErrorType.VALIDATION_ERROR,
      'Validation failed'
    )

    expect(error.statusCode).toBe(400)
  })
})

describe('AuthErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleError', () => {
    it('should handle AuthError correctly', async () => {
      const authError = new AuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Invalid credentials',
        'Login failed',
        401,
        { suggestions: ['Check your password'] }
      )

      const context = {
        operation: 'login',
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      }

      const response = await AuthErrorHandler.handleError(authError, context)

      expect(response.data.success).toBe(false)
      expect(response.data.error.type).toBe(AuthErrorType.INVALID_CREDENTIALS)
      expect(response.data.error.message).toBe('Invalid credentials')
      expect(response.data.error.suggestions).toEqual(['Check your password'])
      expect(response.status).toBe(401)
    })

    it('should handle generic Error as internal error', async () => {
      const genericError = new Error('Database connection failed')

      const context = {
        operation: 'registration',
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      }

      const response = await AuthErrorHandler.handleError(genericError, context)

      expect(response.data.success).toBe(false)
      expect(response.data.error.type).toBe(AuthErrorType.INTERNAL_ERROR)
      expect(response.data.error.message).toBe(AUTH_ERROR_MESSAGES[AuthErrorType.INTERNAL_ERROR].user)
      expect(response.status).toBe(500)
    })

    it('should handle unknown error types', async () => {
      const unknownError = 'string error'

      const context = {
        operation: 'password_reset',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      }

      const response = await AuthErrorHandler.handleError(unknownError, context)

      expect(response.data.success).toBe(false)
      expect(response.data.error.type).toBe(AuthErrorType.INTERNAL_ERROR)
      expect(response.status).toBe(500)
    })

    it('should include retry-after header for rate limit errors', async () => {
      const rateLimitError = new AuthError(
        AuthErrorType.RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded',
        'Too many requests',
        429,
        { retryAfter: 300 }
      )

      const context = {
        operation: 'login',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      }

      const response = await AuthErrorHandler.handleError(rateLimitError, context)

      expect(response.headers['Retry-After']).toBe('300')
    })
  })

  describe('createSuccessResponse', () => {
    it('should create a success response with correct format', () => {
      const data = { user: { id: '1', email: 'test@example.com' } }
      const message = 'Login successful'

      const response = AuthErrorHandler.createSuccessResponse(data, message)

      expect(response.data.success).toBe(true)
      expect(response.data.data).toEqual(data)
      expect(response.data.message).toBe(message)
      expect(response.data.timestamp).toBeDefined()
      expect(response.data.requestId).toBeDefined()
    })
  })

  describe('createValidationError', () => {
    it('should create validation error from field errors', () => {
      const validationErrors = {
        email: ['Invalid email format'],
        password: ['Password too short']
      }

      const error = AuthErrorHandler.createValidationError(validationErrors, 'email')

      expect(error.type).toBe(AuthErrorType.VALIDATION_ERROR)
      expect(error.field).toBe('email')
      expect(error.details).toEqual(validationErrors)
      expect(error.statusCode).toBe(400)
    })

    it('should handle array of errors', () => {
      const validationErrors = {
        password: ['Too short', 'Missing uppercase']
      }

      const error = AuthErrorHandler.createValidationError(validationErrors)

      expect(error.userMessage).toBe('Too short')
    })
  })

  describe('createRateLimitError', () => {
    it('should create rate limit error with retry information', () => {
      const error = AuthErrorHandler.createRateLimitError(900, 'login')

      expect(error.type).toBe(AuthErrorType.RATE_LIMIT_EXCEEDED)
      expect(error.retryAfter).toBe(900)
      expect(error.statusCode).toBe(429)
      expect(error.userMessage).toContain('15 minutes')
    })
  })

  describe('createAccountLockoutError', () => {
    it('should create lockout error with time formatting', () => {
      const error = AuthErrorHandler.createAccountLockoutError(90) // 1.5 hours

      expect(error.type).toBe(AuthErrorType.ACCOUNT_LOCKED)
      expect(error.statusCode).toBe(423)
      expect(error.retryAfter).toBe(5400) // 90 minutes in seconds
      expect(error.userMessage).toContain('1 hour and 30 minutes')
    })

    it('should format minutes only for short durations', () => {
      const error = AuthErrorHandler.createAccountLockoutError(30)

      expect(error.userMessage).toContain('30 minutes')
      expect(error.userMessage).not.toContain('hour')
    })
  })

  describe('createPasswordStrengthError', () => {
    it('should create password strength error with requirements', () => {
      const validationErrors = [
        'Must contain uppercase letter',
        'Must contain number'
      ]

      const error = AuthErrorHandler.createPasswordStrengthError(validationErrors)

      expect(error.type).toBe(AuthErrorType.PASSWORD_STRENGTH)
      expect(error.field).toBe('password')
      expect(error.details?.requirements).toEqual(validationErrors)
      expect(error.suggestions).toContain('• Must contain uppercase letter')
    })
  })
})

describe('AUTH_ERROR_MESSAGES', () => {
  it('should have user and log messages for all error types', () => {
    Object.values(AuthErrorType).forEach(errorType => {
      const messages = AUTH_ERROR_MESSAGES[errorType]
      expect(messages).toBeDefined()
      expect(messages.user).toBeDefined()
      expect(messages.log).toBeDefined()
      expect(messages.suggestions).toBeDefined()
      expect(Array.isArray(messages.suggestions)).toBe(true)
    })
  })

  it('should not leak sensitive information in user messages', () => {
    Object.values(AUTH_ERROR_MESSAGES).forEach(messages => {
      // User messages should not contain technical details
      expect(messages.user).not.toMatch(/database|sql|server|internal|stack|trace/i)
      expect(messages.user).not.toMatch(/error|exception|failed/i)
    })
  })

  it('should provide actionable suggestions', () => {
    Object.values(AUTH_ERROR_MESSAGES).forEach(messages => {
      expect(messages.suggestions.length).toBeGreaterThan(0)
      messages.suggestions.forEach(suggestion => {
        expect(typeof suggestion).toBe('string')
        expect(suggestion.length).toBeGreaterThan(0)
      })
    })
  })
})