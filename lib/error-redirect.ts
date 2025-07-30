import { AuthError, AuthErrorType } from './auth-error-handler'

/**
 * Utility functions for redirecting to appropriate error pages
 * with proper error context and user-friendly messaging
 */

export interface ErrorRedirectOptions {
  returnUrl?: string
  showToast?: boolean
  preserveHistory?: boolean
}

/**
 * Redirect to appropriate error page based on error type
 */
export function redirectToErrorPage(
  error: AuthError | Error | unknown,
  options: ErrorRedirectOptions = {}
): string {
  const { returnUrl, preserveHistory = false } = options

  // Build base URL parameters
  const params = new URLSearchParams()
  if (returnUrl) {
    params.set('returnUrl', encodeURIComponent(returnUrl))
  }

  if (error instanceof AuthError) {
    // Handle specific authentication errors with dedicated pages
    switch (error.type) {
      case AuthErrorType.ACCOUNT_LOCKED:
        params.set('lockoutDuration', (error.retryAfter || 1800).toString())
        if (error.details?.email) {
          params.set('email', error.details.email)
        }
        if (error.details?.lockoutCount) {
          params.set('lockoutCount', error.details.lockoutCount.toString())
        }
        return `/error-pages/account-locked?${params.toString()}`

      case AuthErrorType.RATE_LIMIT_EXCEEDED:
        params.set('retryAfter', (error.retryAfter || 300).toString())
        params.set('operation', error.details?.operation || 'request')
        return `/error-pages/rate-limit?${params.toString()}`

      case AuthErrorType.EMAIL_NOT_VERIFIED:
        if (error.details?.email) {
          params.set('email', error.details.email)
        }
        return `/verify-email?${params.toString()}`

      case AuthErrorType.TOKEN_EXPIRED:
      case AuthErrorType.TOKEN_INVALID:
        params.set('reason', error.type === AuthErrorType.TOKEN_EXPIRED ? 'expired' : 'invalid')
        return `/forgot-password?${params.toString()}`

      case AuthErrorType.SUSPICIOUS_ACTIVITY:
        params.set('severity', 'high')
        params.set('reason', 'suspicious_activity')
        return `/security/verify-identity?${params.toString()}`

      default:
        // Use general error page for other auth errors
        return buildGeneralErrorUrl(error, params)
    }
  }

  // Handle generic errors
  const genericError = error instanceof Error ? error : new Error('Unknown error occurred')
  const authError = new AuthError(
    AuthErrorType.INTERNAL_ERROR,
    'An unexpected error occurred. Please try again.',
    genericError.message
  )

  return buildGeneralErrorUrl(authError, params)
}

/**
 * Build URL for general error page with error details
 */
function buildGeneralErrorUrl(error: AuthError, baseParams: URLSearchParams): string {
  const params = new URLSearchParams(baseParams)
  
  params.set('type', error.type)
  params.set('message', encodeURIComponent(error.userMessage))
  
  if (error.retryAfter) {
    params.set('retryAfter', error.retryAfter.toString())
  }
  
  if (error.suggestions && error.suggestions.length > 0) {
    params.set('suggestions', encodeURIComponent(JSON.stringify(error.suggestions)))
  }
  
  if (error.details && Object.keys(error.details).length > 0) {
    // Only include safe details (no sensitive information)
    const safeDetails = {
      operation: error.details.operation,
      field: error.details.field,
      code: error.details.code
    }
    params.set('details', encodeURIComponent(JSON.stringify(safeDetails)))
  }

  return `/error-pages/general?${params.toString()}`
}

/**
 * Client-side redirect to error page
 */
export function clientRedirectToError(
  error: AuthError | Error | unknown,
  options: ErrorRedirectOptions = {}
): void {
  if (typeof window === 'undefined') return

  const url = redirectToErrorPage(error, {
    ...options,
    returnUrl: options.returnUrl || window.location.pathname
  })

  if (options.preserveHistory) {
    window.location.assign(url)
  } else {
    window.location.replace(url)
  }
}

/**
 * Server-side redirect to error page (for use in API routes)
 */
export function serverRedirectToError(
  error: AuthError | Error | unknown,
  baseUrl: string,
  options: ErrorRedirectOptions = {}
): Response {
  const url = redirectToErrorPage(error, options)
  const fullUrl = new URL(url, baseUrl).toString()

  return Response.redirect(fullUrl, 302)
}

/**
 * Create error page URL with custom parameters
 */
export function createErrorPageUrl(params: {
  type?: AuthErrorType
  message: string
  title?: string
  retryAfter?: number
  suggestions?: string[]
  returnUrl?: string
  severity?: 'low' | 'medium' | 'high'
}): string {
  const urlParams = new URLSearchParams()
  
  urlParams.set('type', params.type || AuthErrorType.INTERNAL_ERROR)
  urlParams.set('message', encodeURIComponent(params.message))
  
  if (params.title) {
    urlParams.set('title', encodeURIComponent(params.title))
  }
  
  if (params.retryAfter) {
    urlParams.set('retryAfter', params.retryAfter.toString())
  }
  
  if (params.suggestions && params.suggestions.length > 0) {
    urlParams.set('suggestions', encodeURIComponent(JSON.stringify(params.suggestions)))
  }
  
  if (params.returnUrl) {
    urlParams.set('returnUrl', encodeURIComponent(params.returnUrl))
  }
  
  if (params.severity) {
    urlParams.set('severity', params.severity)
  }

  return `/error-pages/general?${urlParams.toString()}`
}

/**
 * Extract error information from URL parameters
 */
export function parseErrorFromUrl(searchParams: URLSearchParams): {
  type: AuthErrorType
  message: string
  title?: string
  retryAfter?: number
  suggestions?: string[]
  returnUrl?: string
  severity?: 'low' | 'medium' | 'high'
} | null {
  const type = searchParams.get('type') as AuthErrorType
  const message = searchParams.get('message')
  
  if (!type || !message) {
    return null
  }

  const result: any = {
    type,
    message: decodeURIComponent(message)
  }

  const title = searchParams.get('title')
  if (title) {
    result.title = decodeURIComponent(title)
  }

  const retryAfter = searchParams.get('retryAfter')
  if (retryAfter) {
    result.retryAfter = parseInt(retryAfter)
  }

  const suggestions = searchParams.get('suggestions')
  if (suggestions) {
    try {
      result.suggestions = JSON.parse(decodeURIComponent(suggestions))
    } catch (error) {
      console.warn('Failed to parse suggestions from URL:', error)
    }
  }

  const returnUrl = searchParams.get('returnUrl')
  if (returnUrl) {
    result.returnUrl = decodeURIComponent(returnUrl)
  }

  const severity = searchParams.get('severity')
  if (severity && ['low', 'medium', 'high'].includes(severity)) {
    result.severity = severity as 'low' | 'medium' | 'high'
  }

  return result
}

/**
 * Check if current page is an error page
 */
export function isErrorPage(pathname: string): boolean {
  return pathname.startsWith('/error-pages/')
}

/**
 * Get user-friendly error page title based on error type
 */
export function getErrorPageTitle(errorType: AuthErrorType): string {
  switch (errorType) {
    case AuthErrorType.ACCOUNT_LOCKED:
      return 'Account Temporarily Locked'
    case AuthErrorType.RATE_LIMIT_EXCEEDED:
      return 'Too Many Attempts'
    case AuthErrorType.EMAIL_NOT_VERIFIED:
      return 'Email Verification Required'
    case AuthErrorType.TOKEN_EXPIRED:
      return 'Link Expired'
    case AuthErrorType.TOKEN_INVALID:
      return 'Invalid Link'
    case AuthErrorType.SUSPICIOUS_ACTIVITY:
      return 'Security Alert'
    case AuthErrorType.SERVICE_UNAVAILABLE:
      return 'Service Temporarily Unavailable'
    case AuthErrorType.INVALID_CREDENTIALS:
      return 'Authentication Failed'
    case AuthErrorType.VALIDATION_ERROR:
      return 'Invalid Input'
    case AuthErrorType.PASSWORD_STRENGTH:
      return 'Password Requirements Not Met'
    case AuthErrorType.EMAIL_FORMAT:
      return 'Invalid Email Format'
    default:
      return 'Something Went Wrong'
  }
}

/**
 * Get appropriate HTTP status code for error type
 */
export function getErrorStatusCode(errorType: AuthErrorType): number {
  switch (errorType) {
    case AuthErrorType.INVALID_CREDENTIALS:
      return 401
    case AuthErrorType.ACCOUNT_LOCKED:
      return 423
    case AuthErrorType.EMAIL_NOT_VERIFIED:
      return 403
    case AuthErrorType.RATE_LIMIT_EXCEEDED:
      return 429
    case AuthErrorType.VALIDATION_ERROR:
    case AuthErrorType.PASSWORD_STRENGTH:
    case AuthErrorType.EMAIL_FORMAT:
      return 400
    case AuthErrorType.TOKEN_EXPIRED:
    case AuthErrorType.TOKEN_INVALID:
      return 410
    case AuthErrorType.SUSPICIOUS_ACTIVITY:
      return 403
    case AuthErrorType.SERVICE_UNAVAILABLE:
      return 503
    case AuthErrorType.INTERNAL_ERROR:
    default:
      return 500
  }
}