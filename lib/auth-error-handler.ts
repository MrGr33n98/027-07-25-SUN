import { NextResponse } from 'next/server'
import { securityLogger } from './security-logger'

/**
 * Authentication-specific error types with security-first messaging
 */
export enum AuthErrorType {
  // Generic errors that don't reveal system information
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Validation errors (safe to be specific)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PASSWORD_STRENGTH = 'PASSWORD_STRENGTH',
  EMAIL_FORMAT = 'EMAIL_FORMAT',
  
  // System errors (generic messaging)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Security-related errors
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
}

/**
 * Error response interface for consistent API responses
 */
export interface AuthErrorResponse {
  success: false
  error: {
    type: AuthErrorType
    message: string
    code: string
    field?: string
    details?: Record<string, any>
    retryAfter?: number
    suggestions?: string[]
  }
  timestamp: string
  requestId?: string
}

/**
 * Success response interface for consistent API responses
 */
export interface AuthSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
  timestamp: string
  requestId?: string
}

/**
 * Authentication error class with security-first design
 */
export class AuthError extends Error {
  public readonly type: AuthErrorType
  public readonly statusCode: number
  public readonly field?: string
  public readonly details?: Record<string, any>
  public readonly retryAfter?: number
  public readonly suggestions?: string[]
  public readonly userMessage: string
  public readonly logMessage: string

  constructor(
    type: AuthErrorType,
    userMessage: string,
    logMessage?: string,
    statusCode: number = 400,
    options?: {
      field?: string
      details?: Record<string, any>
      retryAfter?: number
      suggestions?: string[]
    }
  ) {
    super(logMessage || userMessage)
    this.type = type
    this.userMessage = userMessage
    this.logMessage = logMessage || userMessage
    this.statusCode = statusCode
    this.field = options?.field
    this.details = options?.details
    this.retryAfter = options?.retryAfter
    this.suggestions = options?.suggestions
    this.name = 'AuthError'
  }
}

/**
 * Security-first error messages that don't leak system information
 */
export const AUTH_ERROR_MESSAGES = {
  [AuthErrorType.INVALID_CREDENTIALS]: {
    user: 'Invalid email or password. Please check your credentials and try again.',
    log: 'Authentication failed - invalid credentials provided',
    suggestions: [
      'Double-check your email address',
      'Verify your password is correct',
      'Try resetting your password if you\'ve forgotten it'
    ]
  },
  [AuthErrorType.ACCOUNT_LOCKED]: {
    user: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later or contact support.',
    log: 'Account locked due to failed login attempts',
    suggestions: [
      'Wait for the lockout period to expire',
      'Contact support if you believe this is an error',
      'Reset your password to unlock your account'
    ]
  },
  [AuthErrorType.EMAIL_NOT_VERIFIED]: {
    user: 'Please verify your email address before logging in. Check your inbox for a verification link.',
    log: 'Login attempt with unverified email',
    suggestions: [
      'Check your email inbox and spam folder',
      'Click the verification link in the email',
      'Request a new verification email if needed'
    ]
  },
  [AuthErrorType.RATE_LIMIT_EXCEEDED]: {
    user: 'Too many requests. Please wait before trying again.',
    log: 'Rate limit exceeded',
    suggestions: [
      'Wait a few minutes before trying again',
      'Avoid rapid repeated attempts',
      'Contact support if you continue to have issues'
    ]
  },
  [AuthErrorType.VALIDATION_ERROR]: {
    user: 'Please check your input and try again.',
    log: 'Validation error in request',
    suggestions: [
      'Review the highlighted fields',
      'Ensure all required information is provided',
      'Check that your input meets the specified requirements'
    ]
  },
  [AuthErrorType.PASSWORD_STRENGTH]: {
    user: 'Password does not meet security requirements.',
    log: 'Password strength validation failed',
    suggestions: [
      'Use at least 8 characters',
      'Include uppercase and lowercase letters',
      'Add at least one number and special character',
      'Avoid common passwords and personal information'
    ]
  },
  [AuthErrorType.EMAIL_FORMAT]: {
    user: 'Please enter a valid email address.',
    log: 'Invalid email format provided',
    suggestions: [
      'Check for typos in your email address',
      'Ensure the email format is correct (user@domain.com)',
      'Remove any extra spaces'
    ]
  },
  [AuthErrorType.INTERNAL_ERROR]: {
    user: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
    log: 'Internal server error occurred',
    suggestions: [
      'Try again in a few minutes',
      'Contact support if the problem persists',
      'Check our status page for any known issues'
    ]
  },
  [AuthErrorType.SERVICE_UNAVAILABLE]: {
    user: 'Service is temporarily unavailable. Please try again later.',
    log: 'Service unavailable',
    suggestions: [
      'Try again in a few minutes',
      'Check our status page for updates',
      'Contact support if the issue persists'
    ]
  },
  [AuthErrorType.SUSPICIOUS_ACTIVITY]: {
    user: 'Unusual activity detected. For security reasons, this action has been blocked.',
    log: 'Suspicious activity detected and blocked',
    suggestions: [
      'Try again from a trusted device or location',
      'Contact support to verify your identity',
      'Check for any unauthorized access to your account'
    ]
  },
  [AuthErrorType.TOKEN_EXPIRED]: {
    user: 'This link has expired. Please request a new one.',
    log: 'Expired token used',
    suggestions: [
      'Request a new verification or reset link',
      'Check that you\'re using the most recent email',
      'Links typically expire after 24 hours for security'
    ]
  },
  [AuthErrorType.TOKEN_INVALID]: {
    user: 'This link is invalid or has already been used.',
    log: 'Invalid or used token provided',
    suggestions: [
      'Request a new verification or reset link',
      'Ensure you\'re using the complete link from the email',
      'Check that the link hasn\'t been used already'
    ]
  }
} as const

/**
 * Enhanced authentication error handler with security logging
 */
export class AuthErrorHandler {
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Handle authentication errors with security-first approach
   */
  static async handleError(
    error: unknown,
    context: {
      operation: string
      email?: string
      userId?: string
      ipAddress?: string
      userAgent?: string
      requestId?: string
    }
  ): Promise<NextResponse> {
    const requestId = context.requestId || this.generateRequestId()
    const timestamp = new Date().toISOString()

    // Log security event
    if (context.email || context.userId) {
      await securityLogger.logSecurityEvent(
        context.userId,
        context.email,
        'error_occurred',
        false,
        context.ipAddress || 'unknown',
        context.userAgent || 'unknown',
        {
          operation: context.operation,
          errorType: error instanceof AuthError ? error.type : 'unknown',
          errorMessage: error instanceof Error ? error.message : 'unknown error',
          requestId
        }
      )
    }

    if (error instanceof AuthError) {
      const errorConfig = AUTH_ERROR_MESSAGES[error.type]
      
      const response: AuthErrorResponse = {
        success: false,
        error: {
          type: error.type,
          message: error.userMessage,
          code: error.type,
          field: error.field,
          details: error.details,
          retryAfter: error.retryAfter,
          suggestions: error.suggestions || errorConfig.suggestions
        },
        timestamp,
        requestId
      }

      return NextResponse.json(response, { 
        status: error.statusCode,
        headers: {
          'X-Request-ID': requestId,
          ...(error.retryAfter && { 'Retry-After': error.retryAfter.toString() })
        }
      })
    }

    // Handle unexpected errors with generic messaging
    console.error(`[${requestId}] Unexpected error in ${context.operation}:`, error)
    
    const response: AuthErrorResponse = {
      success: false,
      error: {
        type: AuthErrorType.INTERNAL_ERROR,
        message: AUTH_ERROR_MESSAGES[AuthErrorType.INTERNAL_ERROR].user,
        code: AuthErrorType.INTERNAL_ERROR,
        suggestions: AUTH_ERROR_MESSAGES[AuthErrorType.INTERNAL_ERROR].suggestions
      },
      timestamp,
      requestId
    }

    return NextResponse.json(response, { 
      status: 500,
      headers: {
        'X-Request-ID': requestId
      }
    })
  }

  /**
   * Create success response with consistent format
   */
  static createSuccessResponse<T>(
    data: T,
    message?: string,
    requestId?: string
  ): NextResponse {
    const response: AuthSuccessResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId: requestId || this.generateRequestId()
    }

    return NextResponse.json(response, {
      headers: {
        'X-Request-ID': response.requestId!
      }
    })
  }

  /**
   * Create validation error from Zod validation results
   */
  static createValidationError(
    validationErrors: Record<string, any>,
    field?: string
  ): AuthError {
    const firstError = Object.values(validationErrors)[0]
    const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError

    return new AuthError(
      AuthErrorType.VALIDATION_ERROR,
      typeof errorMessage === 'string' ? errorMessage : 'Validation failed',
      `Validation error: ${JSON.stringify(validationErrors)}`,
      400,
      {
        field,
        details: validationErrors,
        suggestions: AUTH_ERROR_MESSAGES[AuthErrorType.VALIDATION_ERROR].suggestions
      }
    )
  }

  /**
   * Create rate limit error with retry information
   */
  static createRateLimitError(
    retryAfter: number,
    operation: string
  ): AuthError {
    return new AuthError(
      AuthErrorType.RATE_LIMIT_EXCEEDED,
      `Too many ${operation} attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
      `Rate limit exceeded for ${operation}`,
      429,
      {
        retryAfter,
        suggestions: AUTH_ERROR_MESSAGES[AuthErrorType.RATE_LIMIT_EXCEEDED].suggestions
      }
    )
  }

  /**
   * Create account lockout error with lockout information
   */
  static createAccountLockoutError(
    lockoutDurationMinutes: number
  ): AuthError {
    const hours = Math.floor(lockoutDurationMinutes / 60)
    const minutes = lockoutDurationMinutes % 60
    
    let timeString = ''
    if (hours > 0) {
      timeString = `${hours} hour${hours > 1 ? 's' : ''}`
      if (minutes > 0) {
        timeString += ` and ${minutes} minute${minutes > 1 ? 's' : ''}`
      }
    } else {
      timeString = `${minutes} minute${minutes > 1 ? 's' : ''}`
    }

    return new AuthError(
      AuthErrorType.ACCOUNT_LOCKED,
      `Account locked for ${timeString} due to multiple failed login attempts.`,
      `Account locked for ${lockoutDurationMinutes} minutes`,
      423,
      {
        retryAfter: lockoutDurationMinutes * 60,
        details: { lockoutDurationMinutes },
        suggestions: AUTH_ERROR_MESSAGES[AuthErrorType.ACCOUNT_LOCKED].suggestions
      }
    )
  }

  /**
   * Create password strength error with specific requirements
   */
  static createPasswordStrengthError(
    validationErrors: string[]
  ): AuthError {
    return new AuthError(
      AuthErrorType.PASSWORD_STRENGTH,
      'Password does not meet security requirements.',
      `Password validation failed: ${validationErrors.join(', ')}`,
      400,
      {
        field: 'password',
        details: { requirements: validationErrors },
        suggestions: [
          ...AUTH_ERROR_MESSAGES[AuthErrorType.PASSWORD_STRENGTH].suggestions,
          ...validationErrors.map(error => `• ${error}`)
        ]
      }
    )
  }
}

/**
 * Middleware wrapper for consistent error handling in API routes
 */
export function withAuthErrorHandling(
  handler: (req: Request, context?: any) => Promise<NextResponse>,
  operation: string
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    const requestId = AuthErrorHandler['generateRequestId']()
    
    try {
      return await handler(req, context)
    } catch (error) {
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                       req.headers.get('x-real-ip') || 
                       'unknown'
      const userAgent = req.headers.get('user-agent') || 'unknown'

      return AuthErrorHandler.handleError(error, {
        operation,
        ipAddress,
        userAgent,
        requestId
      })
    }
  }
}