'use client'

import { AuthErrorType } from './auth-error-handler'

/**
 * Client-side feedback manager for authentication operations
 * Provides user-friendly messaging and retry logic
 */
export interface FeedbackState {
  type: 'idle' | 'loading' | 'success' | 'error'
  message?: string
  error?: {
    type: AuthErrorType
    message: string
    field?: string
    retryAfter?: number
    suggestions?: string[]
  }
  retryCount?: number
  canRetry?: boolean
}

export interface FeedbackOptions {
  showRetryButton?: boolean
  maxRetries?: number
  retryDelay?: number
  autoHideSuccess?: boolean
  autoHideDelay?: number
}

/**
 * Hook-like feedback manager for authentication forms
 */
export class AuthFeedbackManager {
  private state: FeedbackState = { type: 'idle' }
  private options: FeedbackOptions
  private listeners: Set<(state: FeedbackState) => void> = new Set()
  private retryTimer: NodeJS.Timeout | null = null
  private autoHideTimer: NodeJS.Timeout | null = null

  constructor(options: FeedbackOptions = {}) {
    this.options = {
      showRetryButton: true,
      maxRetries: 3,
      retryDelay: 1000,
      autoHideSuccess: true,
      autoHideDelay: 5000,
      ...options
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: FeedbackState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Get current state
   */
  getState(): FeedbackState {
    return { ...this.state }
  }

  /**
   * Set loading state with optional message
   */
  setLoading(message?: string): void {
    this.clearTimers()
    this.updateState({
      type: 'loading',
      message: message || 'Processing...',
      error: undefined
    })
  }

  /**
   * Set success state with message
   */
  setSuccess(message: string): void {
    this.clearTimers()
    this.updateState({
      type: 'success',
      message,
      error: undefined,
      retryCount: 0
    })

    if (this.options.autoHideSuccess) {
      this.autoHideTimer = setTimeout(() => {
        this.setIdle()
      }, this.options.autoHideDelay)
    }
  }

  /**
   * Set error state with detailed error information
   */
  setError(error: {
    type: AuthErrorType
    message: string
    field?: string
    retryAfter?: number
    suggestions?: string[]
  }): void {
    this.clearTimers()
    
    const retryCount = (this.state.retryCount || 0) + 1
    const canRetry = this.options.showRetryButton && 
                    retryCount <= (this.options.maxRetries || 3) &&
                    !this.isNonRetryableError(error.type)

    this.updateState({
      type: 'error',
      error,
      retryCount,
      canRetry
    })

    // Auto-retry for rate limit errors after the specified delay
    if (error.type === AuthErrorType.RATE_LIMIT_EXCEEDED && error.retryAfter) {
      this.scheduleAutoRetry(error.retryAfter * 1000)
    }
  }

  /**
   * Set idle state (clear all messages)
   */
  setIdle(): void {
    this.clearTimers()
    this.updateState({
      type: 'idle',
      message: undefined,
      error: undefined
    })
  }

  /**
   * Reset retry count
   */
  resetRetries(): void {
    this.updateState({
      ...this.state,
      retryCount: 0
    })
  }

  /**
   * Check if error type should not allow retries
   */
  private isNonRetryableError(errorType: AuthErrorType): boolean {
    return [
      AuthErrorType.ACCOUNT_LOCKED,
      AuthErrorType.SUSPICIOUS_ACTIVITY,
      AuthErrorType.EMAIL_NOT_VERIFIED,
      AuthErrorType.TOKEN_EXPIRED,
      AuthErrorType.TOKEN_INVALID
    ].includes(errorType)
  }

  /**
   * Schedule automatic retry after delay
   */
  private scheduleAutoRetry(delay: number): void {
    this.retryTimer = setTimeout(() => {
      this.updateState({
        ...this.state,
        canRetry: true
      })
    }, delay)
  }

  /**
   * Update state and notify listeners
   */
  private updateState(newState: Partial<FeedbackState>): void {
    this.state = { ...this.state, ...newState }
    this.listeners.forEach(listener => listener(this.state))
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer)
      this.autoHideTimer = null
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearTimers()
    this.listeners.clear()
  }
}

/**
 * Rate limit feedback helper
 */
export class RateLimitFeedback {
  private static countdowns: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Start countdown display for rate limit
   */
  static startCountdown(
    key: string,
    seconds: number,
    onUpdate: (remaining: number) => void,
    onComplete: () => void
  ): void {
    // Clear existing countdown
    this.clearCountdown(key)

    let remaining = seconds
    onUpdate(remaining)

    const timer = setInterval(() => {
      remaining -= 1
      onUpdate(remaining)

      if (remaining <= 0) {
        this.clearCountdown(key)
        onComplete()
      }
    }, 1000)

    this.countdowns.set(key, timer)
  }

  /**
   * Clear countdown for key
   */
  static clearCountdown(key: string): void {
    const timer = this.countdowns.get(key)
    if (timer) {
      clearInterval(timer)
      this.countdowns.delete(key)
    }
  }

  /**
   * Clear all countdowns
   */
  static clearAll(): void {
    this.countdowns.forEach(timer => clearInterval(timer))
    this.countdowns.clear()
  }
}

/**
 * Form validation feedback helper
 */
export class ValidationFeedback {
  /**
   * Extract field-specific errors from API response
   */
  static extractFieldErrors(error: any): Record<string, string> {
    const fieldErrors: Record<string, string> = {}

    if (error?.details) {
      Object.entries(error.details).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          fieldErrors[field] = messages[0]
        } else if (typeof messages === 'string') {
          fieldErrors[field] = messages
        }
      })
    }

    return fieldErrors
  }

  /**
   * Get user-friendly field error message
   */
  static getFieldErrorMessage(field: string, error: string): string {
    const fieldLabels: Record<string, string> = {
      email: 'Email address',
      password: 'Password',
      confirmPassword: 'Password confirmation',
      name: 'Name',
      phone: 'Phone number',
      companyName: 'Company name'
    }

    const label = fieldLabels[field] || field
    
    // Common error message improvements
    if (error.includes('required')) {
      return `${label} is required`
    }
    if (error.includes('email')) {
      return 'Please enter a valid email address'
    }
    if (error.includes('password')) {
      return 'Password does not meet requirements'
    }
    if (error.includes('match')) {
      return 'Passwords do not match'
    }

    return error
  }
}

/**
 * Security feedback helper for suspicious activity
 */
export class SecurityFeedback {
  /**
   * Get security-appropriate error message
   */
  static getSecurityMessage(errorType: AuthErrorType): {
    title: string
    message: string
    severity: 'low' | 'medium' | 'high'
    actions: string[]
  } {
    switch (errorType) {
      case AuthErrorType.ACCOUNT_LOCKED:
        return {
          title: 'Account Security',
          message: 'Your account has been temporarily locked for security reasons.',
          severity: 'high',
          actions: [
            'Wait for the lockout period to expire',
            'Reset your password to unlock immediately',
            'Contact support if you believe this is an error'
          ]
        }

      case AuthErrorType.SUSPICIOUS_ACTIVITY:
        return {
          title: 'Security Alert',
          message: 'Unusual activity has been detected on your account.',
          severity: 'high',
          actions: [
            'Verify your identity with support',
            'Check for unauthorized access',
            'Consider changing your password'
          ]
        }

      case AuthErrorType.RATE_LIMIT_EXCEEDED:
        return {
          title: 'Security Measure',
          message: 'Too many attempts detected. This is a security measure.',
          severity: 'medium',
          actions: [
            'Wait before trying again',
            'Ensure you\'re using correct credentials',
            'Contact support if you continue having issues'
          ]
        }

      default:
        return {
          title: 'Security Notice',
          message: 'A security-related issue has occurred.',
          severity: 'low',
          actions: ['Please try again or contact support']
        }
    }
  }
}

/**
 * Accessibility feedback helper
 */
export class AccessibilityFeedback {
  /**
   * Announce message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  /**
   * Focus on error element for keyboard users
   */
  static focusError(errorId: string): void {
    setTimeout(() => {
      const errorElement = document.getElementById(errorId)
      if (errorElement) {
        errorElement.focus()
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }
}