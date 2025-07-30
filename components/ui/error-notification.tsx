'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle, Clock, Shield, RefreshCw, HelpCircle, CheckCircle, Info } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { AuthErrorType } from '@/lib/auth-error-handler'

export interface ErrorNotificationProps {
  error: {
    type: AuthErrorType
    message: string
    field?: string
    retryAfter?: number
    suggestions?: string[]
    details?: Record<string, any>
  }
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  variant?: 'inline' | 'toast' | 'banner' | 'modal'
  showCountdown?: boolean
}

/**
 * Enhanced error notification component with security-first messaging
 * and comprehensive user feedback
 */
export function ErrorNotification({ 
  error, 
  onRetry, 
  onDismiss, 
  className = '',
  variant = 'inline',
  showCountdown = true
}: ErrorNotificationProps) {
  const [countdown, setCountdown] = useState(error.retryAfter || 0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (error.retryAfter && showCountdown) {
      setCountdown(error.retryAfter)
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [error.retryAfter, showCountdown])

  const getErrorIcon = () => {
    switch (error.type) {
      case AuthErrorType.RATE_LIMIT_EXCEEDED:
        return <Clock className="w-5 h-5" />
      case AuthErrorType.ACCOUNT_LOCKED:
      case AuthErrorType.SUSPICIOUS_ACTIVITY:
        return <Shield className="w-5 h-5" />
      case AuthErrorType.EMAIL_NOT_VERIFIED:
        return <Info className="w-5 h-5" />
      case AuthErrorType.TOKEN_EXPIRED:
      case AuthErrorType.TOKEN_INVALID:
        return <AlertCircle className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const getErrorSeverity = () => {
    switch (error.type) {
      case AuthErrorType.ACCOUNT_LOCKED:
      case AuthErrorType.SUSPICIOUS_ACTIVITY:
        return 'high'
      case AuthErrorType.RATE_LIMIT_EXCEEDED:
      case AuthErrorType.EMAIL_NOT_VERIFIED:
        return 'medium'
      case AuthErrorType.VALIDATION_ERROR:
      case AuthErrorType.PASSWORD_STRENGTH:
      case AuthErrorType.EMAIL_FORMAT:
        return 'low'
      default:
        return 'medium'
    }
  }

  const getErrorColors = () => {
    const severity = getErrorSeverity()
    
    switch (severity) {
      case 'high':
        return {
          text: 'text-red-800',
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600'
        }
      case 'medium':
        return {
          text: 'text-orange-800',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: 'text-orange-600'
        }
      case 'low':
        return {
          text: 'text-blue-800',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600'
        }
      default:
        return {
          text: 'text-gray-800',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'text-gray-600'
        }
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const shouldShowRetry = () => {
    return onRetry && countdown === 0 && ![
      AuthErrorType.ACCOUNT_LOCKED,
      AuthErrorType.SUSPICIOUS_ACTIVITY,
      AuthErrorType.EMAIL_NOT_VERIFIED
    ].includes(error.type)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss?.(), 300)
  }

  if (!isVisible) return null

  const colors = getErrorColors()
  const severity = getErrorSeverity()

  const baseClasses = `
    ${colors.bg} ${colors.border} ${colors.text}
    transition-all duration-300 ease-in-out
    ${variant === 'toast' ? 'shadow-lg animate-in slide-in-from-right' : ''}
    ${variant === 'banner' ? 'border-l-4' : 'border rounded-lg'}
  `

  return (
    <Card className={`${baseClasses} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 ${colors.icon}`}>
            {getErrorIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-semibold ${colors.text}`}>
                {getErrorTitle()}
              </h3>
              {onDismiss && (
                <button
                  onClick={handleDismiss}
                  className={`ml-2 ${colors.icon} hover:opacity-75 transition-opacity`}
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <p className={`mt-1 text-sm ${colors.text}`}>
              {error.message}
            </p>

            {/* Countdown Display */}
            {countdown > 0 && showCountdown && (
              <div className={`mt-3 flex items-center space-x-2 p-2 rounded ${colors.bg} ${colors.border} border`}>
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {error.type === AuthErrorType.RATE_LIMIT_EXCEEDED 
                    ? `Try again in ${formatTime(countdown)}`
                    : `Unlocks in ${formatTime(countdown)}`
                  }
                </span>
              </div>
            )}

            {/* Security Level Indicator */}
            {severity === 'high' && (
              <div className="mt-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-red-700">High Security Alert</span>
              </div>
            )}

            {/* Suggestions */}
            {error.suggestions && error.suggestions.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center space-x-1 mb-2">
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">What you can do:</span>
                </div>
                <ul className="text-sm space-y-1 ml-5">
                  {error.suggestions.slice(0, 3).map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0"></span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              {shouldShowRetry() && (
                <Button
                  onClick={onRetry}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Try Again
                </Button>
              )}

              {error.type === AuthErrorType.EMAIL_NOT_VERIFIED && (
                <Button
                  onClick={() => window.location.href = '/verify-email'}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Verify Email
                </Button>
              )}

              {(error.type === AuthErrorType.ACCOUNT_LOCKED || 
                error.type === AuthErrorType.INVALID_CREDENTIALS) && (
                <Button
                  onClick={() => window.location.href = '/forgot-password'}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Reset Password
                </Button>
              )}

              {severity === 'high' && (
                <Button
                  onClick={() => window.location.href = '/support'}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Contact Support
                </Button>
              )}
            </div>

            {/* Additional Details for Development */}
            {process.env.NODE_ENV === 'development' && error.details && (
              <details className="mt-4">
                <summary className="text-xs cursor-pointer text-gray-500">
                  Debug Information
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  function getErrorTitle(): string {
    switch (error.type) {
      case AuthErrorType.INVALID_CREDENTIALS:
        return 'Authentication Failed'
      case AuthErrorType.ACCOUNT_LOCKED:
        return 'Account Security Lock'
      case AuthErrorType.EMAIL_NOT_VERIFIED:
        return 'Email Verification Required'
      case AuthErrorType.RATE_LIMIT_EXCEEDED:
        return 'Security Rate Limit'
      case AuthErrorType.VALIDATION_ERROR:
        return 'Input Validation'
      case AuthErrorType.PASSWORD_STRENGTH:
        return 'Password Security'
      case AuthErrorType.EMAIL_FORMAT:
        return 'Email Format'
      case AuthErrorType.SUSPICIOUS_ACTIVITY:
        return 'Security Alert'
      case AuthErrorType.TOKEN_EXPIRED:
        return 'Link Expired'
      case AuthErrorType.TOKEN_INVALID:
        return 'Invalid Link'
      case AuthErrorType.SERVICE_UNAVAILABLE:
        return 'Service Temporarily Unavailable'
      case AuthErrorType.INTERNAL_ERROR:
        return 'Technical Issue'
      default:
        return 'Notification'
    }
  }
}

/**
 * Success notification component
 */
export function SuccessNotification({ 
  message, 
  title = 'Success',
  onDismiss, 
  className = '',
  variant = 'inline',
  autoHide = true,
  duration = 5000
}: { 
  message: string
  title?: string
  onDismiss?: () => void
  className?: string
  variant?: 'inline' | 'toast' | 'banner'
  autoHide?: boolean
  duration?: number
}) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onDismiss?.(), 300)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [autoHide, duration, onDismiss])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss?.(), 300)
  }

  if (!isVisible) return null

  const baseClasses = `
    bg-green-50 border-green-200 text-green-800
    transition-all duration-300 ease-in-out
    ${variant === 'toast' ? 'shadow-lg animate-in slide-in-from-right' : ''}
    ${variant === 'banner' ? 'border-l-4' : 'border rounded-lg'}
  `

  return (
    <Card className={`${baseClasses} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 text-green-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-green-800">
                {title}
              </h3>
              {onDismiss && (
                <button
                  onClick={handleDismiss}
                  className="ml-2 text-green-600 hover:opacity-75 transition-opacity"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-green-700">
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Loading notification component
 */
export function LoadingNotification({ 
  message = 'Processing your request...',
  title = 'Please Wait',
  className = '',
  variant = 'inline'
}: { 
  message?: string
  title?: string
  className?: string
  variant?: 'inline' | 'toast' | 'banner'
}) {
  const baseClasses = `
    bg-blue-50 border-blue-200 text-blue-800
    ${variant === 'toast' ? 'shadow-lg' : ''}
    ${variant === 'banner' ? 'border-l-4' : 'border rounded-lg'}
  `

  return (
    <Card className={`${baseClasses} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 text-blue-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-800">
              {title}
            </h3>
            <p className="text-sm text-blue-700">
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}