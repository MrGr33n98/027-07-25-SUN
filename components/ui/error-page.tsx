'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { 
  Shield, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  ArrowLeft, 
  Mail, 
  HelpCircle,
  Home,
  Phone,
  ExternalLink
} from 'lucide-react'
import { AuthErrorType } from '@/lib/auth-error-handler'

export interface ErrorPageProps {
  error: {
    type: AuthErrorType
    message: string
    retryAfter?: number
    suggestions?: string[]
    details?: Record<string, any>
  }
  title?: string
  showNavigation?: boolean
  showSupport?: boolean
  onRetry?: () => void
  className?: string
}

/**
 * Comprehensive error page component with security-first messaging
 * and user-friendly guidance
 */
export function ErrorPage({
  error,
  title,
  showNavigation = true,
  showSupport = true,
  onRetry,
  className = ''
}: ErrorPageProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(error.retryAfter || 0)

  useEffect(() => {
    if (error.retryAfter) {
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
  }, [error.retryAfter])

  const getErrorConfig = () => {
    switch (error.type) {
      case AuthErrorType.ACCOUNT_LOCKED:
        return {
          icon: Shield,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-100',
          title: title || 'Account Security Lock',
          severity: 'high' as const,
          primaryAction: 'Reset Password',
          primaryActionHref: '/forgot-password',
          showCountdown: true
        }
      
      case AuthErrorType.RATE_LIMIT_EXCEEDED:
        return {
          icon: Clock,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          title: title || 'Security Rate Limit',
          severity: 'medium' as const,
          primaryAction: countdown === 0 ? 'Try Again' : null,
          showCountdown: true
        }
      
      case AuthErrorType.SUSPICIOUS_ACTIVITY:
        return {
          icon: Shield,
          iconColor: 'text-orange-600',
          bgColor: 'bg-orange-100',
          title: title || 'Security Alert',
          severity: 'high' as const,
          primaryAction: 'Contact Support',
          primaryActionHref: '/support',
          showCountdown: false
        }
      
      case AuthErrorType.EMAIL_NOT_VERIFIED:
        return {
          icon: Mail,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-100',
          title: title || 'Email Verification Required',
          severity: 'medium' as const,
          primaryAction: 'Verify Email',
          primaryActionHref: '/verify-email',
          showCountdown: false
        }
      
      case AuthErrorType.TOKEN_EXPIRED:
      case AuthErrorType.TOKEN_INVALID:
        return {
          icon: AlertCircle,
          iconColor: 'text-orange-600',
          bgColor: 'bg-orange-100',
          title: title || 'Invalid or Expired Link',
          severity: 'medium' as const,
          primaryAction: 'Request New Link',
          primaryActionHref: '/forgot-password',
          showCountdown: false
        }
      
      case AuthErrorType.SERVICE_UNAVAILABLE:
        return {
          icon: RefreshCw,
          iconColor: 'text-gray-600',
          bgColor: 'bg-gray-100',
          title: title || 'Service Temporarily Unavailable',
          severity: 'low' as const,
          primaryAction: 'Try Again',
          showCountdown: false
        }
      
      default:
        return {
          icon: AlertCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-100',
          title: title || 'Something Went Wrong',
          severity: 'medium' as const,
          primaryAction: 'Try Again',
          showCountdown: false
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

  const getSeverityBorder = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'border-red-200'
      case 'medium':
        return 'border-orange-200'
      case 'low':
        return 'border-yellow-200'
      default:
        return 'border-gray-200'
    }
  }

  const config = getErrorConfig()
  const Icon = config.icon

  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 ${className}`}>
      <Card className={`w-full max-w-lg ${getSeverityBorder(config.severity)}`}>
        <CardHeader className="text-center">
          <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-8 h-8 ${config.iconColor}`} />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {config.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Message */}
          <div className="text-center">
            <p className="text-gray-600 leading-relaxed">
              {error.message}
            </p>
          </div>

          {/* Countdown Display */}
          {config.showCountdown && countdown > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-gray-700">
                <Clock className="w-5 h-5" />
                <span className="font-medium">
                  {error.type === AuthErrorType.RATE_LIMIT_EXCEEDED 
                    ? `Try again in ${formatTime(countdown)}`
                    : `Unlocks in ${formatTime(countdown)}`
                  }
                </span>
              </div>
            </div>
          )}

          {/* Security Level Indicator */}
          {config.severity === 'high' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-700">High Security Alert</span>
              </div>
              <p className="text-xs text-red-600 mt-1">
                This action was blocked to protect your account security.
              </p>
            </div>
          )}

          {/* Suggestions */}
          {error.suggestions && error.suggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4" />
                <span>What you can do:</span>
              </h3>
              
              <div className="space-y-2">
                {error.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-sm text-blue-800">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Action */}
            {config.primaryAction && (countdown === 0 || !config.showCountdown) && (
              <div>
                {config.primaryActionHref ? (
                  <Link href={config.primaryActionHref} className="block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      {config.primaryAction}
                    </Button>
                  </Link>
                ) : onRetry ? (
                  <Button 
                    onClick={onRetry}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {config.primaryAction}
                  </Button>
                ) : null}
              </div>
            )}

            {/* Disabled Primary Action (during countdown) */}
            {config.primaryAction && countdown > 0 && config.showCountdown && (
              <Button 
                disabled
                className="w-full"
                variant="outline"
              >
                <Clock className="w-4 h-4 mr-2" />
                Wait {formatTime(countdown)}
              </Button>
            )}

            {/* Secondary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Support Contact */}
              {showSupport && (
                <Link href="/support">
                  <Button variant="outline" className="w-full">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Get Help
                  </Button>
                </Link>
              )}

              {/* Navigation */}
              {showNavigation && (
                <Button 
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              )}
            </div>
          </div>

          {/* Support Information */}
          {showSupport && config.severity === 'high' && (
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Need immediate help?</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>support@solarconnect.com</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>1-800-SOLAR-HELP</span>
                </div>
                <Link 
                  href="/support" 
                  className="flex items-center space-x-3 text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Submit Support Ticket</span>
                </Link>
              </div>
            </div>
          )}

          {/* Security Tips */}
          {config.severity === 'high' && (
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Security Tips:</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Use a strong, unique password for your account</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Never share your login credentials with others</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Log out from shared or public devices</span>
                </li>
              </ul>
            </div>
          )}

          {/* Footer Information */}
          <div className="text-xs text-gray-500 border-t pt-4">
            <p>
              {config.severity === 'high' 
                ? 'This security measure helps protect your account from unauthorized access.'
                : 'We apologize for any inconvenience. Our team is working to resolve any issues.'
              }
            </p>
            {process.env.NODE_ENV === 'development' && error.details && (
              <details className="mt-2">
                <summary className="cursor-pointer">Debug Information</summary>
                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Simplified error page for common scenarios
 */
export function SimpleErrorPage({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  showRetry = true,
  onRetry,
  className = ''
}: {
  title?: string
  message?: string
  showRetry?: boolean
  onRetry?: () => void
  className?: string
}) {
  const router = useRouter()

  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <p className="text-gray-600">
            {message}
          </p>

          <div className="space-y-3">
            {showRetry && (
              <Button 
                onClick={onRetry || (() => window.location.reload())}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}