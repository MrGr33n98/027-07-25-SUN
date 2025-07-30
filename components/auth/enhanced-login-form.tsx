'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorDisplay, InlineError, SuccessDisplay, LoadingDisplay } from '@/components/ui/error-display'
import { Sun, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { AuthFeedbackManager, RateLimitFeedback, ValidationFeedback, AccessibilityFeedback } from '@/lib/auth-feedback-manager'
import { AuthErrorType } from '@/lib/auth-error-handler'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginResponse {
  success: boolean
  data?: {
    user: any
    sessionId: string
    message: string
  }
  error?: {
    type: AuthErrorType
    message: string
    field?: string
    retryAfter?: number
    suggestions?: string[]
  }
}

export function EnhancedLoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [feedbackManager] = useState(() => new AuthFeedbackManager({
    maxRetries: 3,
    autoHideSuccess: true,
    autoHideDelay: 3000
  }))
  const [feedbackState, setFeedbackState] = useState(feedbackManager.getState())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Subscribe to feedback manager updates
  useEffect(() => {
    const unsubscribe = feedbackManager.subscribe(setFeedbackState)
    return unsubscribe
  }, [feedbackManager])

  // Handle rate limit countdown
  useEffect(() => {
    if (feedbackState.error?.type === AuthErrorType.RATE_LIMIT_EXCEEDED && feedbackState.error.retryAfter) {
      RateLimitFeedback.startCountdown(
        'login',
        feedbackState.error.retryAfter,
        setRateLimitCountdown,
        () => {
          feedbackManager.setIdle()
          AccessibilityFeedback.announce('You can now try logging in again')
        }
      )
    }

    return () => RateLimitFeedback.clearCountdown('login')
  }, [feedbackState.error, feedbackManager])

  const onSubmit = async (data: LoginFormData) => {
    // Clear previous errors
    setFieldErrors({})
    clearErrors()
    feedbackManager.setLoading('Signing you in...')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result: LoginResponse = await response.json()

      if (result.success && result.data) {
        feedbackManager.setSuccess('Login successful! Redirecting...')
        AccessibilityFeedback.announce('Login successful, redirecting to dashboard')
        
        // Redirect based on user role
        setTimeout(() => {
          if (result.data?.user?.role === 'COMPANY') {
            router.push('/dashboard')
          } else {
            router.push('/')
          }
        }, 1000)
      } else if (result.error) {
        handleLoginError(result.error)
      }
    } catch (error) {
      feedbackManager.setError({
        type: AuthErrorType.INTERNAL_ERROR,
        message: 'An unexpected error occurred. Please try again.',
        suggestions: ['Check your internet connection', 'Try again in a few moments']
      })
      AccessibilityFeedback.announce('Login failed due to an unexpected error', 'assertive')
    }
  }

  const handleLoginError = (error: LoginResponse['error']) => {
    if (!error) return

    // Handle field-specific validation errors
    if (error.field && error.type === AuthErrorType.VALIDATION_ERROR) {
      setError(error.field as keyof LoginFormData, {
        type: 'manual',
        message: error.message
      })
      AccessibilityFeedback.focusError(`${error.field}-error`)
      return
    }

    // Handle account lockout - redirect to dedicated page
    if (error.type === AuthErrorType.ACCOUNT_LOCKED) {
      const params = new URLSearchParams({
        lockoutDuration: (error.retryAfter || 1800).toString(),
        email: (document.querySelector('input[name="email"]') as HTMLInputElement)?.value || ''
      })
      router.push(`/error-pages/account-locked?${params.toString()}`)
      return
    }

    // Handle rate limiting - redirect to dedicated page
    if (error.type === AuthErrorType.RATE_LIMIT_EXCEEDED) {
      const params = new URLSearchParams({
        retryAfter: (error.retryAfter || 900).toString(),
        operation: 'login'
      })
      router.push(`/error-pages/rate-limit?${params.toString()}`)
      return
    }

    // Handle other errors with feedback manager
    feedbackManager.setError(error)
    AccessibilityFeedback.announce(`Login failed: ${error.message}`, 'assertive')
  }

  const handleRetry = () => {
    feedbackManager.resetRetries()
    feedbackManager.setIdle()
  }

  const isLoading = feedbackState.type === 'loading'
  const hasError = feedbackState.type === 'error'
  const hasSuccess = feedbackState.type === 'success'

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
            <Sun className="w-8 h-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Sign in to SolarConnect</CardTitle>
        <p className="text-gray-600">Access your account to manage your solar business</p>
      </CardHeader>

      <CardContent>
        {/* Feedback Display */}
        {isLoading && (
          <LoadingDisplay 
            message={feedbackState.message} 
            className="mb-4" 
          />
        )}

        {hasSuccess && (
          <SuccessDisplay 
            message={feedbackState.message || 'Success!'} 
            className="mb-4" 
          />
        )}

        {hasError && feedbackState.error && (
          <ErrorDisplay
            error={feedbackState.error}
            onRetry={feedbackState.canRetry ? handleRetry : undefined}
            onDismiss={() => feedbackManager.setIdle()}
            className="mb-4"
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                {...register('email')}
                type="email"
                placeholder="your@email.com"
                className="pl-10"
                disabled={isLoading}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
            {errors.email && (
              <InlineError 
                message={errors.email.message || 'Email is required'} 
                className="mt-1"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                className="pl-10 pr-10"
                disabled={isLoading}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <InlineError 
                message={errors.password.message || 'Password is required'} 
                className="mt-1"
              />
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
            disabled={isLoading || rateLimitCountdown > 0}
          >
            {isLoading ? 'Signing in...' : 
             rateLimitCountdown > 0 ? `Wait ${rateLimitCountdown}s` : 
             'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm space-y-2">
          <Link 
            href="/forgot-password" 
            className="text-orange-600 hover:text-orange-500 font-medium block"
          >
            Forgot your password?
          </Link>
          
          <div>
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/register" className="text-orange-600 hover:text-orange-500 font-medium">
              Sign up for free
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>Security Notice:</strong> Your account will be temporarily locked after 5 failed login attempts. 
            This helps protect your account from unauthorized access.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}