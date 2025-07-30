'use client'

import { useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { AuthError, AuthErrorType } from '@/lib/auth-error-handler'
import { RateLimitFeedbackManager } from '@/lib/rate-limit-feedback'

/**
 * Comprehensive error handling hook that provides unified error management
 * across the application with security-first messaging and user feedback
 */
export function useErrorHandling() {
  const router = useRouter()
  const { addErrorToast, addSecurityToast, addToast } = useToast()
  const rateLimitManager = useRef(RateLimitFeedbackManager.getInstance())

  /**
   * Handle authentication errors with appropriate user feedback
   */
  const handleAuthError = useCallback((error: unknown, context?: {
    operation?: string
    showToast?: boolean
    redirectOnError?: boolean
    customMessage?: string
  }) => {
    const {
      operation = 'authentication',
      showToast = true,
      redirectOnError = false,
      customMessage
    } = context || {}

    if (error instanceof AuthError) {
      // Handle rate limiting with feedback
      if (error.type === AuthErrorType.RATE_LIMIT_EXCEEDED && error.retryAfter) {
        rateLimitManager.current.startRateLimit({
          operation,
          limit: 0,
          windowMs: 0,
          retryAfter: error.retryAfter,
          severity: 'medium'
        })
      }

      // Show appropriate user feedback
      if (showToast) {
        addErrorToast({
          type: error.type,
          message: customMessage || error.userMessage,
          retryAfter: error.retryAfter
        })
      }

      // Handle redirects for specific error types
      if (redirectOnError) {
        switch (error.type) {
          case AuthErrorType.ACCOUNT_LOCKED:
            router.push(`/error-pages/account-locked?lockoutDuration=${error.retryAfter || 1800}`)
            break
          case AuthErrorType.RATE_LIMIT_EXCEEDED:
            router.push(`/error-pages/rate-limit?retryAfter=${error.retryAfter || 300}&operation=${operation}`)
            break
          case AuthErrorType.EMAIL_NOT_VERIFIED:
            router.push('/verify-email')
            break
          case AuthErrorType.TOKEN_EXPIRED:
          case AuthErrorType.TOKEN_INVALID:
            router.push('/forgot-password')
            break
        }
      }

      return {
        type: 'auth_error',
        error,
        handled: true
      }
    }

    // Handle generic errors
    const genericError = error instanceof Error ? error : new Error('Unknown error occurred')
    
    if (showToast) {
      addErrorToast({
        type: AuthErrorType.INTERNAL_ERROR,
        message: customMessage || 'An unexpected error occurred. Please try again.'
      })
    }

    return {
      type: 'generic_error',
      error: genericError,
      handled: true
    }
  }, [addErrorToast, router, rateLimitManager])

  /**
   * Handle API response errors with appropriate feedback
   */
  const handleApiError = useCallback(async (response: Response, context?: {
    operation?: string
    showToast?: boolean
    customMessages?: Record<number, string>
  }) => {
    const {
      operation = 'request',
      showToast = true,
      customMessages = {}
    } = context || {}

    try {
      const errorData = await response.json()
      
      // Handle structured error responses
      if (errorData.error) {
        const authError = new AuthError(
          errorData.error.type || AuthErrorType.INTERNAL_ERROR,
          errorData.error.message || 'An error occurred',
          undefined,
          response.status,
          {
            field: errorData.error.field,
            details: errorData.error.details,
            retryAfter: errorData.error.retryAfter,
            suggestions: errorData.error.suggestions
          }
        )

        return handleAuthError(authError, { operation, showToast })
      }
    } catch (parseError) {
      // Handle non-JSON error responses
    }

    // Handle HTTP status codes
    const statusMessage = customMessages[response.status] || getDefaultStatusMessage(response.status)
    
    if (showToast) {
      const errorType = response.status >= 500 
        ? AuthErrorType.SERVICE_UNAVAILABLE 
        : AuthErrorType.INTERNAL_ERROR

      addErrorToast({
        type: errorType,
        message: statusMessage
      })
    }

    return {
      type: 'api_error',
      status: response.status,
      message: statusMessage,
      handled: true
    }
  }, [handleAuthError, addErrorToast])

  /**
   * Handle network errors (fetch failures, timeouts, etc.)
   */
  const handleNetworkError = useCallback((error: Error, context?: {
    operation?: string
    showToast?: boolean
    retryCallback?: () => void
  }) => {
    const {
      operation = 'request',
      showToast = true,
      retryCallback
    } = context || {}

    let message = 'Network error occurred. Please check your connection.'
    let errorType = AuthErrorType.SERVICE_UNAVAILABLE

    // Detect specific network error types
    if (error.name === 'AbortError') {
      message = 'Request was cancelled. Please try again.'
    } else if (error.message.includes('timeout')) {
      message = 'Request timed out. Please try again.'
    } else if (error.message.includes('Failed to fetch')) {
      message = 'Unable to connect to server. Please check your internet connection.'
    }

    if (showToast) {
      const actions = retryCallback ? [{
        label: 'Retry',
        onClick: retryCallback,
        variant: 'primary' as const
      }] : undefined

      addToast({
        type: 'error',
        title: 'Connection Error',
        message,
        duration: 8000,
        actions
      })
    }

    return {
      type: 'network_error',
      error,
      message,
      handled: true
    }
  }, [addToast])

  /**
   * Handle validation errors from forms
   */
  const handleValidationError = useCallback((errors: Record<string, string[]>, context?: {
    showToast?: boolean
    focusFirstError?: boolean
  }) => {
    const {
      showToast = true,
      focusFirstError = true
    } = context || {}

    const firstError = Object.entries(errors)[0]
    if (!firstError) return { type: 'validation_error', handled: false }

    const [field, messages] = firstError
    const message = Array.isArray(messages) ? messages[0] : messages

    if (showToast) {
      addErrorToast({
        type: AuthErrorType.VALIDATION_ERROR,
        message: `${field}: ${message}`
      })
    }

    // Focus first error field
    if (focusFirstError && typeof window !== 'undefined') {
      setTimeout(() => {
        const errorElement = document.querySelector(`[name="${field}"], #${field}`)
        if (errorElement instanceof HTMLElement) {
          errorElement.focus()
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }

    return {
      type: 'validation_error',
      errors,
      field,
      message,
      handled: true
    }
  }, [addErrorToast])

  /**
   * Handle security-related events and alerts
   */
  const handleSecurityEvent = useCallback((event: {
    type: 'suspicious_activity' | 'account_locked' | 'password_changed' | 'login_from_new_device'
    message: string
    severity?: 'low' | 'medium' | 'high'
    requiresAction?: boolean
    actionUrl?: string
  }) => {
    const {
      type,
      message,
      severity = 'medium',
      requiresAction = false,
      actionUrl
    } = event

    // Show security toast
    addSecurityToast(message, severity)

    // Handle specific security events
    switch (type) {
      case 'account_locked':
        if (requiresAction) {
          router.push('/error-pages/account-locked')
        }
        break
      case 'suspicious_activity':
        if (severity === 'high') {
          router.push('/security/verify-identity')
        }
        break
      case 'login_from_new_device':
        // Could trigger additional verification
        break
    }

    return {
      type: 'security_event',
      event,
      handled: true
    }
  }, [addSecurityToast, router])

  /**
   * Create a retry function with exponential backoff
   */
  const createRetryFunction = useCallback((
    originalFunction: () => Promise<any>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ) => {
    let retryCount = 0

    const retry = async (): Promise<any> => {
      try {
        return await originalFunction()
      } catch (error) {
        retryCount++
        
        if (retryCount >= maxRetries) {
          throw error
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, retryCount - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        return retry()
      }
    }

    return retry
  }, [])

  /**
   * Global error handler for unhandled promise rejections
   */
  const setupGlobalErrorHandling = useCallback(() => {
    if (typeof window === 'undefined') return

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      handleAuthError(event.reason, {
        operation: 'background_operation',
        showToast: true,
        customMessage: 'An unexpected error occurred in the background.'
      })
    }

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
      
      handleAuthError(event.error, {
        operation: 'application',
        showToast: true,
        customMessage: 'An unexpected application error occurred.'
      })
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [handleAuthError])

  return {
    handleAuthError,
    handleApiError,
    handleNetworkError,
    handleValidationError,
    handleSecurityEvent,
    createRetryFunction,
    setupGlobalErrorHandling
  }
}

/**
 * Get default error message for HTTP status codes
 */
function getDefaultStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.'
    case 401:
      return 'Authentication required. Please log in and try again.'
    case 403:
      return 'Access denied. You don\'t have permission to perform this action.'
    case 404:
      return 'The requested resource was not found.'
    case 409:
      return 'Conflict detected. The resource may have been modified.'
    case 422:
      return 'Invalid data provided. Please check your input.'
    case 429:
      return 'Too many requests. Please wait before trying again.'
    case 500:
      return 'Internal server error. Please try again later.'
    case 502:
      return 'Service temporarily unavailable. Please try again later.'
    case 503:
      return 'Service maintenance in progress. Please try again later.'
    case 504:
      return 'Request timeout. Please try again.'
    default:
      return status >= 500 
        ? 'Server error occurred. Please try again later.'
        : 'An error occurred. Please try again.'
  }
}

/**
 * Hook for handling form submission errors
 */
export function useFormErrorHandling() {
  const { handleAuthError, handleValidationError } = useErrorHandling()

  const handleSubmissionError = useCallback((error: unknown, formData?: FormData) => {
    // Extract form field names for better error context
    const fieldNames = formData ? Array.from(formData.keys()) : []
    
    if (error instanceof AuthError) {
      return handleAuthError(error, {
        operation: 'form_submission',
        showToast: true
      })
    }

    // Handle validation errors
    if (error && typeof error === 'object' && 'validation' in error) {
      return handleValidationError(error.validation as Record<string, string[]>)
    }

    return handleAuthError(error, {
      operation: 'form_submission',
      showToast: true,
      customMessage: 'Failed to submit form. Please check your input and try again.'
    })
  }, [handleAuthError, handleValidationError])

  return {
    handleSubmissionError
  }
}