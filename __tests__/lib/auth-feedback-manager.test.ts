import { AuthFeedbackManager, RateLimitFeedback, ValidationFeedback, SecurityFeedback } from '../../lib/auth-feedback-manager'
import { AuthErrorType } from '../../lib/auth-error-handler'

describe('AuthFeedbackManager', () => {
  let feedbackManager: AuthFeedbackManager

  beforeEach(() => {
    feedbackManager = new AuthFeedbackManager({
      maxRetries: 3,
      autoHideSuccess: true,
      autoHideDelay: 1000
    })
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    feedbackManager.destroy()
    jest.useRealTimers()
  })

  describe('state management', () => {
    it('should start with idle state', () => {
      const state = feedbackManager.getState()
      expect(state.type).toBe('idle')
    })

    it('should update to loading state', () => {
      feedbackManager.setLoading('Processing...')
      const state = feedbackManager.getState()
      
      expect(state.type).toBe('loading')
      expect(state.message).toBe('Processing...')
    })

    it('should update to success state', () => {
      feedbackManager.setSuccess('Operation completed')
      const state = feedbackManager.getState()
      
      expect(state.type).toBe('success')
      expect(state.message).toBe('Operation completed')
      expect(state.retryCount).toBe(0)
    })

    it('should update to error state', () => {
      const error = {
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: 'Invalid credentials',
        suggestions: ['Check password']
      }

      feedbackManager.setError(error)
      const state = feedbackManager.getState()
      
      expect(state.type).toBe('error')
      expect(state.error).toEqual(error)
      expect(state.retryCount).toBe(1)
      expect(state.canRetry).toBe(true)
    })

    it('should auto-hide success messages', () => {
      feedbackManager.setSuccess('Success!')
      
      jest.advanceTimersByTime(1000)
      
      const state = feedbackManager.getState()
      expect(state.type).toBe('idle')
    })
  })

  describe('retry logic', () => {
    it('should increment retry count on subsequent errors', () => {
      const error = {
        type: AuthErrorType.VALIDATION_ERROR,
        message: 'Validation failed'
      }

      feedbackManager.setError(error)
      expect(feedbackManager.getState().retryCount).toBe(1)

      feedbackManager.setError(error)
      expect(feedbackManager.getState().retryCount).toBe(2)

      feedbackManager.setError(error)
      expect(feedbackManager.getState().retryCount).toBe(3)
    })

    it('should disable retry after max attempts', () => {
      const error = {
        type: AuthErrorType.VALIDATION_ERROR,
        message: 'Validation failed'
      }

      // Exceed max retries
      for (let i = 0; i < 4; i++) {
        feedbackManager.setError(error)
      }

      const state = feedbackManager.getState()
      expect(state.canRetry).toBe(false)
    })

    it('should not allow retry for non-retryable errors', () => {
      const error = {
        type: AuthErrorType.ACCOUNT_LOCKED,
        message: 'Account locked'
      }

      feedbackManager.setError(error)
      const state = feedbackManager.getState()
      
      expect(state.canRetry).toBe(false)
    })

    it('should reset retry count', () => {
      const error = {
        type: AuthErrorType.VALIDATION_ERROR,
        message: 'Validation failed'
      }

      feedbackManager.setError(error)
      feedbackManager.setError(error)
      expect(feedbackManager.getState().retryCount).toBe(2)

      feedbackManager.resetRetries()
      expect(feedbackManager.getState().retryCount).toBe(0)
    })
  })

  describe('subscription system', () => {
    it('should notify subscribers of state changes', () => {
      const listener = jest.fn()
      const unsubscribe = feedbackManager.subscribe(listener)

      feedbackManager.setLoading('Loading...')
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'loading',
          message: 'Loading...'
        })
      )

      unsubscribe()
      feedbackManager.setSuccess('Success!')
      expect(listener).toHaveBeenCalledTimes(1) // Should not be called after unsubscribe
    })

    it('should handle multiple subscribers', () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()

      feedbackManager.subscribe(listener1)
      feedbackManager.subscribe(listener2)

      feedbackManager.setLoading('Loading...')

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })
  })

  describe('rate limit handling', () => {
    it('should schedule auto-retry for rate limit errors', () => {
      const error = {
        type: AuthErrorType.RATE_LIMIT_EXCEEDED,
        message: 'Rate limit exceeded',
        retryAfter: 5
      }

      feedbackManager.setError(error)
      let state = feedbackManager.getState()
      expect(state.canRetry).toBe(false) // Initially false

      jest.advanceTimersByTime(5000) // Advance by retryAfter seconds

      state = feedbackManager.getState()
      expect(state.canRetry).toBe(true) // Should be true after delay
    })
  })
})

describe('RateLimitFeedback', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    RateLimitFeedback.clearAll()
    jest.useRealTimers()
  })

  it('should start countdown and call onUpdate', () => {
    const onUpdate = jest.fn()
    const onComplete = jest.fn()

    RateLimitFeedback.startCountdown('test', 3, onUpdate, onComplete)

    expect(onUpdate).toHaveBeenCalledWith(3)

    jest.advanceTimersByTime(1000)
    expect(onUpdate).toHaveBeenCalledWith(2)

    jest.advanceTimersByTime(1000)
    expect(onUpdate).toHaveBeenCalledWith(1)

    jest.advanceTimersByTime(1000)
    expect(onUpdate).toHaveBeenCalledWith(0)
    expect(onComplete).toHaveBeenCalled()
  })

  it('should clear countdown', () => {
    const onUpdate = jest.fn()
    const onComplete = jest.fn()

    RateLimitFeedback.startCountdown('test', 5, onUpdate, onComplete)
    RateLimitFeedback.clearCountdown('test')

    jest.advanceTimersByTime(6000)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('should clear all countdowns', () => {
    const onUpdate1 = jest.fn()
    const onUpdate2 = jest.fn()
    const onComplete1 = jest.fn()
    const onComplete2 = jest.fn()

    RateLimitFeedback.startCountdown('test1', 5, onUpdate1, onComplete1)
    RateLimitFeedback.startCountdown('test2', 5, onUpdate2, onComplete2)

    RateLimitFeedback.clearAll()

    jest.advanceTimersByTime(6000)
    expect(onComplete1).not.toHaveBeenCalled()
    expect(onComplete2).not.toHaveBeenCalled()
  })
})

describe('ValidationFeedback', () => {
  describe('extractFieldErrors', () => {
    it('should extract field errors from API response', () => {
      const error = {
        details: {
          email: ['Invalid email format'],
          password: ['Password too short', 'Missing uppercase']
        }
      }

      const fieldErrors = ValidationFeedback.extractFieldErrors(error)

      expect(fieldErrors).toEqual({
        email: 'Invalid email format',
        password: 'Password too short'
      })
    })

    it('should handle string error messages', () => {
      const error = {
        details: {
          email: 'Invalid email format'
        }
      }

      const fieldErrors = ValidationFeedback.extractFieldErrors(error)

      expect(fieldErrors).toEqual({
        email: 'Invalid email format'
      })
    })

    it('should return empty object for invalid input', () => {
      const fieldErrors = ValidationFeedback.extractFieldErrors(null)
      expect(fieldErrors).toEqual({})
    })
  })

  describe('getFieldErrorMessage', () => {
    it('should return user-friendly field error messages', () => {
      expect(ValidationFeedback.getFieldErrorMessage('email', 'required')).toBe('Email address is required')
      expect(ValidationFeedback.getFieldErrorMessage('password', 'invalid email')).toBe('Please enter a valid email address')
      expect(ValidationFeedback.getFieldErrorMessage('confirmPassword', 'passwords do not match')).toBe('Passwords do not match')
    })

    it('should return original message for unknown patterns', () => {
      const originalMessage = 'Custom validation error'
      expect(ValidationFeedback.getFieldErrorMessage('customField', originalMessage)).toBe(originalMessage)
    })
  })
})

describe('SecurityFeedback', () => {
  describe('getSecurityMessage', () => {
    it('should return appropriate security messages for different error types', () => {
      const accountLockedMessage = SecurityFeedback.getSecurityMessage(AuthErrorType.ACCOUNT_LOCKED)
      expect(accountLockedMessage.severity).toBe('high')
      expect(accountLockedMessage.title).toBe('Account Security')
      expect(accountLockedMessage.actions.length).toBeGreaterThan(0)

      const suspiciousMessage = SecurityFeedback.getSecurityMessage(AuthErrorType.SUSPICIOUS_ACTIVITY)
      expect(suspiciousMessage.severity).toBe('high')
      expect(suspiciousMessage.title).toBe('Security Alert')

      const rateLimitMessage = SecurityFeedback.getSecurityMessage(AuthErrorType.RATE_LIMIT_EXCEEDED)
      expect(rateLimitMessage.severity).toBe('medium')
      expect(rateLimitMessage.title).toBe('Security Measure')
    })

    it('should provide actionable security advice', () => {
      const message = SecurityFeedback.getSecurityMessage(AuthErrorType.ACCOUNT_LOCKED)
      
      expect(message.actions).toContain('Wait for the lockout period to expire')
      expect(message.actions).toContain('Reset your password to unlock immediately')
      expect(message.actions).toContain('Contact support if you believe this is an error')
    })
  })
})