'use client'

import { AuthErrorType } from './auth-error-handler'

/**
 * Rate limit feedback configuration
 */
export interface RateLimitConfig {
  operation: string
  limit: number
  windowMs: number
  retryAfter: number
  severity: 'low' | 'medium' | 'high'
}

/**
 * Rate limit feedback state
 */
export interface RateLimitState {
  isLimited: boolean
  retryAfter: number
  remainingTime: number
  operation: string
  severity: 'low' | 'medium' | 'high'
  message: string
  suggestions: string[]
}

/**
 * Rate limit feedback manager for providing user-friendly rate limiting information
 */
export class RateLimitFeedbackManager {
  private static instance: RateLimitFeedbackManager
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private listeners: Map<string, Set<(state: RateLimitState) => void>> = new Map()

  private constructor() {}

  static getInstance(): RateLimitFeedbackManager {
    if (!RateLimitFeedbackManager.instance) {
      RateLimitFeedbackManager.instance = new RateLimitFeedbackManager()
    }
    return RateLimitFeedbackManager.instance
  }

  /**
   * Subscribe to rate limit updates for a specific operation
   */
  subscribe(operation: string, callback: (state: RateLimitState) => void): () => void {
    if (!this.listeners.has(operation)) {
      this.listeners.set(operation, new Set())
    }
    
    this.listeners.get(operation)!.add(callback)
    
    return () => {
      const operationListeners = this.listeners.get(operation)
      if (operationListeners) {
        operationListeners.delete(callback)
        if (operationListeners.size === 0) {
          this.listeners.delete(operation)
        }
      }
    }
  }

  /**
   * Start rate limit feedback for an operation
   */
  startRateLimit(config: RateLimitConfig): void {
    const { operation, retryAfter, severity } = config
    
    // Clear existing timer
    this.clearTimer(operation)
    
    let remainingTime = retryAfter
    
    const updateState = () => {
      const state: RateLimitState = {
        isLimited: remainingTime > 0,
        retryAfter,
        remainingTime,
        operation,
        severity,
        message: this.getRateLimitMessage(operation, remainingTime, severity),
        suggestions: this.getRateLimitSuggestions(operation, severity)
      }
      
      this.notifyListeners(operation, state)
    }
    
    // Initial update
    updateState()
    
    // Start countdown
    const timer = setInterval(() => {
      remainingTime -= 1
      
      if (remainingTime <= 0) {
        this.clearTimer(operation)
        updateState() // Final update with isLimited: false
      } else {
        updateState()
      }
    }, 1000)
    
    this.timers.set(operation, timer)
  }

  /**
   * Clear rate limit for an operation
   */
  clearRateLimit(operation: string): void {
    this.clearTimer(operation)
    
    const state: RateLimitState = {
      isLimited: false,
      retryAfter: 0,
      remainingTime: 0,
      operation,
      severity: 'low',
      message: '',
      suggestions: []
    }
    
    this.notifyListeners(operation, state)
  }

  /**
   * Get current rate limit state for an operation
   */
  getRateLimitState(operation: string): RateLimitState | null {
    // This would typically be stored in state management or local storage
    // For now, return null if no active rate limit
    return null
  }

  /**
   * Format time remaining in user-friendly format
   */
  static formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return '0s'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }

  /**
   * Get user-friendly rate limit message
   */
  private getRateLimitMessage(operation: string, remainingTime: number, severity: 'low' | 'medium' | 'high'): string {
    const timeStr = RateLimitFeedbackManager.formatTimeRemaining(remainingTime)
    
    if (remainingTime <= 0) {
      return `You can now try ${operation} again.`
    }
    
    const operationMessages: Record<string, string> = {
      'login': `Too many login attempts. Please wait ${timeStr} before trying again.`,
      'registration': `Registration limit reached. Please wait ${timeStr} before creating another account.`,
      'password_reset': `Password reset limit reached. Please wait ${timeStr} before requesting another reset.`,
      'email_verification': `Email verification limit reached. Please wait ${timeStr} before requesting another verification.`,
      'api_request': `Request limit exceeded. Please wait ${timeStr} before making another request.`
    }
    
    const baseMessage = operationMessages[operation] || `Rate limit exceeded for ${operation}. Please wait ${timeStr}.`
    
    if (severity === 'high') {
      return `Security measure activated: ${baseMessage}`
    } else if (severity === 'medium') {
      return `Rate limit: ${baseMessage}`
    }
    
    return baseMessage
  }

  /**
   * Get contextual suggestions for rate limited operations
   */
  private getRateLimitSuggestions(operation: string, severity: 'low' | 'medium' | 'high'): string[] {
    const baseSuggestions = [
      'Wait for the cooldown period to complete',
      'Ensure you\'re using the correct information',
      'Contact support if you continue having issues'
    ]
    
    const operationSuggestions: Record<string, string[]> = {
      'login': [
        'Double-check your email and password',
        'Try resetting your password if you\'ve forgotten it',
        'Make sure Caps Lock is not enabled',
        ...baseSuggestions
      ],
      'registration': [
        'Verify you don\'t already have an account',
        'Check if you received a verification email',
        'Try using a different email address',
        ...baseSuggestions
      ],
      'password_reset': [
        'Check your email inbox and spam folder',
        'Make sure you\'re using the correct email address',
        'Try the reset link from your most recent email',
        ...baseSuggestions
      ],
      'email_verification': [
        'Check your email inbox and spam folder',
        'Look for the most recent verification email',
        'Make sure your email address is correct',
        ...baseSuggestions
      ]
    }
    
    const suggestions = operationSuggestions[operation] || baseSuggestions
    
    if (severity === 'high') {
      return [
        'This is a security measure to protect against automated attacks',
        ...suggestions,
        'Consider changing your password if you suspect unauthorized access'
      ]
    }
    
    return suggestions
  }

  /**
   * Clear timer for an operation
   */
  private clearTimer(operation: string): void {
    const timer = this.timers.get(operation)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(operation)
    }
  }

  /**
   * Notify all listeners for an operation
   */
  private notifyListeners(operation: string, state: RateLimitState): void {
    const operationListeners = this.listeners.get(operation)
    if (operationListeners) {
      operationListeners.forEach(callback => callback(state))
    }
  }

  /**
   * Cleanup all timers and listeners
   */
  destroy(): void {
    this.timers.forEach(timer => clearInterval(timer))
    this.timers.clear()
    this.listeners.clear()
  }
}

/**
 * React hook for rate limit feedback
 */
export function useRateLimitFeedback(operation: string) {
  const [state, setState] = useState<RateLimitState | null>(null)
  const manager = RateLimitFeedbackManager.getInstance()

  useEffect(() => {
    const unsubscribe = manager.subscribe(operation, setState)
    return unsubscribe
  }, [operation, manager])

  const startRateLimit = useCallback((config: Omit<RateLimitConfig, 'operation'>) => {
    manager.startRateLimit({ ...config, operation })
  }, [operation, manager])

  const clearRateLimit = useCallback(() => {
    manager.clearRateLimit(operation)
  }, [operation, manager])

  return {
    state,
    startRateLimit,
    clearRateLimit,
    isLimited: state?.isLimited || false,
    remainingTime: state?.remainingTime || 0,
    message: state?.message || '',
    suggestions: state?.suggestions || []
  }
}

/**
 * Rate limit error creator with enhanced feedback
 */
export class RateLimitErrorCreator {
  /**
   * Create a comprehensive rate limit error with user feedback
   */
  static createError(
    operation: string,
    retryAfter: number,
    severity: 'low' | 'medium' | 'high' = 'medium',
    context?: {
      limit?: number
      windowMs?: number
      currentCount?: number
    }
  ) {
    const manager = RateLimitFeedbackManager.getInstance()
    
    // Start rate limit feedback
    manager.startRateLimit({
      operation,
      limit: context?.limit || 0,
      windowMs: context?.windowMs || 0,
      retryAfter,
      severity
    })

    // Create user-friendly error message
    const timeStr = RateLimitFeedbackManager.formatTimeRemaining(retryAfter)
    const message = severity === 'high' 
      ? `Security rate limit activated. Please wait ${timeStr} before trying again.`
      : `Too many ${operation} attempts. Please wait ${timeStr} before trying again.`

    return {
      type: AuthErrorType.RATE_LIMIT_EXCEEDED,
      message,
      retryAfter,
      suggestions: manager['getRateLimitSuggestions'](operation, severity),
      details: {
        operation,
        severity,
        limit: context?.limit,
        windowMs: context?.windowMs,
        currentCount: context?.currentCount,
        retryAfter
      }
    }
  }

  /**
   * Create progressive rate limit error (increases severity with repeated violations)
   */
  static createProgressiveError(
    operation: string,
    attemptCount: number,
    baseRetryAfter: number = 300
  ) {
    let severity: 'low' | 'medium' | 'high' = 'low'
    let multiplier = 1

    if (attemptCount >= 10) {
      severity = 'high'
      multiplier = 8
    } else if (attemptCount >= 5) {
      severity = 'medium'
      multiplier = 4
    } else if (attemptCount >= 3) {
      severity = 'medium'
      multiplier = 2
    }

    const retryAfter = baseRetryAfter * multiplier

    return this.createError(operation, retryAfter, severity, {
      currentCount: attemptCount
    })
  }
}

// Import useState, useEffect, useCallback for the hook
import { useState, useEffect, useCallback } from 'react'