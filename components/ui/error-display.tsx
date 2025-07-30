'use client'

import { AlertCircle, Clock, Shield, RefreshCw, HelpCircle } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { AuthErrorType } from '@/lib/auth-error-handler'

export interface ErrorDisplayProps {
  error: {
    type: AuthErrorType
    message: string
    field?: string
    retryAfter?: number
    suggestions?: string[]
  }
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

/**
 * Comprehensive error display component with user-friendly messaging
 * and actionable suggestions
 */
export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  className = '' 
}: ErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case AuthErrorType.RATE_LIMIT_EXCEEDED:
        return <Clock className="w-5 h-5" />
      case AuthErrorType.ACCOUNT_LOCKED:
        return <Shield className="w-5 h-5" />
      case AuthErrorType.SUSPICIOUS_ACTIVITY:
        return <Shield className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const getErrorColor = () => {
    switch (error.type) {
      case AuthErrorType.RATE_LIMIT_EXCEEDED:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case AuthErrorType.ACCOUNT_LOCKED:
      case AuthErrorType.SUSPICIOUS_ACTIVITY:
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case AuthErrorType.VALIDATION_ERROR:
      case AuthErrorType.PASSWORD_STRENGTH:
      case AuthErrorType.EMAIL_FORMAT:
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-red-600 bg-red-50 border-red-200'
    }
  }

  const formatRetryTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const shouldShowRetry = () => {
    return onRetry && ![
      AuthErrorType.ACCOUNT_LOCKED,
      AuthErrorType.RATE_LIMIT_EXCEEDED,
      AuthErrorType.SUSPICIOUS_ACTIVITY
    ].includes(error.type)
  }

  return (
    <Card className={`border-l-4 ${getErrorColor()} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 ${getErrorColor().split(' ')[0]}`}>
            {getErrorIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-medium ${getErrorColor().split(' ')[0]}`}>
                {getErrorTitle()}
              </h3>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`ml-2 text-sm ${getErrorColor().split(' ')[0]} hover:opacity-75`}
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              )}
            </div>
            
            <p className={`mt-1 text-sm ${getErrorColor().split(' ')[0]}`}>
              {error.message}
            </p>

            {error.retryAfter && (
              <div className="mt-2 flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Try again in {formatRetryTime(error.retryAfter)}
                </span>
              </div>
            )}

            {error.suggestions && error.suggestions.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center space-x-1 mb-2">
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Suggestions:</span>
                </div>
                <ul className="text-sm space-y-1 ml-5">
                  {error.suggestions.map((suggestion, index) => (
                    <li key={index} className="list-disc">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {shouldShowRetry() && (
              <div className="mt-3 flex space-x-2">
                <Button
                  onClick={onRetry}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  function getErrorTitle(): string {
    switch (error.type) {
      case AuthErrorType.INVALID_CREDENTIALS:
        return 'Invalid Credentials'
      case AuthErrorType.ACCOUNT_LOCKED:
        return 'Account Locked'
      case AuthErrorType.EMAIL_NOT_VERIFIED:
        return 'Email Verification Required'
      case AuthErrorType.RATE_LIMIT_EXCEEDED:
        return 'Too Many Attempts'
      case AuthErrorType.VALIDATION_ERROR:
        return 'Validation Error'
      case AuthErrorType.PASSWORD_STRENGTH:
        return 'Password Requirements'
      case AuthErrorType.EMAIL_FORMAT:
        return 'Invalid Email'
      case AuthErrorType.SUSPICIOUS_ACTIVITY:
        return 'Security Alert'
      case AuthErrorType.TOKEN_EXPIRED:
        return 'Link Expired'
      case AuthErrorType.TOKEN_INVALID:
        return 'Invalid Link'
      case AuthErrorType.SERVICE_UNAVAILABLE:
        return 'Service Unavailable'
      default:
        return 'Error'
    }
  }
}

/**
 * Inline error display for form fields
 */
export function InlineError({ 
  message, 
  className = '' 
}: { 
  message: string
  className?: string 
}) {
  return (
    <div className={`flex items-center space-x-1 text-red-600 text-sm mt-1 ${className}`}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

/**
 * Success message display component
 */
export function SuccessDisplay({ 
  message, 
  onDismiss, 
  className = '' 
}: { 
  message: string
  onDismiss?: () => void
  className?: string 
}) {
  return (
    <Card className={`border-l-4 border-green-500 bg-green-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-green-800">
                {message}
              </p>
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="ml-2 text-sm text-green-600 hover:opacity-75"
                  aria-label="Dismiss success message"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Loading state display component
 */
export function LoadingDisplay({ 
  message = 'Processing...', 
  className = '' 
}: { 
  message?: string
  className?: string 
}) {
  return (
    <Card className={`border-l-4 border-blue-500 bg-blue-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 text-blue-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <p className="text-sm font-medium text-blue-800">
            {message}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}