/**
 * UI Error Handling Integration Tests
 * 
 * Tests error handling in UI components to ensure proper error display,
 * user feedback, and recovery mechanisms across authentication flows.
 * 
 * Covers Requirements 2.2 and 7.4:
 * - 2.2: Generic error messaging without revealing system information
 * - 7.4: Security-first error handling that doesn't aid attackers
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorPage, SimpleErrorPage } from '@/components/ui/error-page'
import { ErrorNotification, SuccessNotification, LoadingNotification } from '@/components/ui/error-notification'
import { AuthErrorType } from '@/lib/auth-error-handler'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock window.location
const mockLocation = {
  href: '',
  reload: jest.fn()
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

describe('UI Error Handling Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocation.href = ''
    mockLocation.reload.mockClear()
  })

  describe('ErrorPage Component Error Scenarios', () => {
    it('should display account lockout error with security messaging', () => {
      const error = {
        type: AuthErrorType.ACCOUNT_LOCKED,
        message: 'Account locked for 30 minutes due to multiple failed login attempts.',
        retryAfter: 1800,
        suggestions: [
          'Wait for the lockout period to expire',
          'Contact support if you believe this is an error',
          'Reset your password to unlock your account'
        ]
      }

      render(<ErrorPage error={error} />)

      expect(screen.getByText('Account Security Lock')).toBeInTheDocument()
      expect(screen.getByText(error.message)).toBeInTheDocument()
      expect(screen.getByText('High Security Alert')).toBeInTheDocument()
      expect(screen.getByText('Unlocks in 30m 0s')).toBeInTheDocument()
      
      // Verify security tips are shown
      expect(screen.getByText('Security Tips:')).toBeInTheDocument()
      expect(screen.getByText('Use a strong, unique password for your account')).toBeInTheDocument()
      
      // Verify suggestions are displayed
      expect(screen.getByText('What you can do:')).toBeInTheDocument()
      expect(screen.getByText('Wait for the lockout period to expire')).toBeInTheDocument()
    })

    it('should display rate limit error with countdown timer', async () => {
      const error = {
        type: AuthErrorType.RATE_LIMIT_EXCEEDED,
        message: 'Too many login attempts. Please try again in 5 minutes.',
        retryAfter: 300,
        suggestions: [
          'Wait a few minutes before trying again',
          'Avoid rapid repeated attempts'
        ]
      }

      render(<ErrorPage error={error} />)

      expect(screen.getByText('Security Rate Limit')).toBeInTheDocument()
      expect(screen.getByText(error.message)).toBeInTheDocument()
      expect(screen.getByText('Try again in 5m 0s')).toBeInTheDocument()
      
      // Verify retry button is disabled during countdown
      const waitButton = screen.getByRole('button', { name: /wait 5m 0s/i })
      expect(waitButton).toBeDisabled()
    })

    it('should display suspicious activity error with security alert', () => {
      const error = {
        type: AuthErrorType.SUSPICIOUS_ACTIVITY,
        message: 'Unusual activity detected. For security reasons, this action has been blocked.',
        suggestions: [
          'Try again from a trusted device or location',
          'Contact support to verify your identity',
          'Check for any unauthorized access to your account'
        ]
      }

      render(<ErrorPage error={error} />)

      expect(screen.getByText('Security Alert')).toBeInTheDocument()
      expect(screen.getByText(error.message)).toBeInTheDocument()
      expect(screen.getByText('High Security Alert')).toBeInTheDocument()
      
      // Verify contact support button is available
      expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument()
      
      // Verify support information is displayed
      expect(screen.getByText('Need immediate help?')).toBeInTheDocument()
      expect(screen.getByText('support@solarconnect.com')).toBeInTheDocument()
    })

    it('should display email verification error with helpful guidance', () => {
      const error = {
        type: AuthErrorType.EMAIL_NOT_VERIFIED,
        message: 'Please verify your email address before logging in. Check your inbox for a verification link.',
        suggestions: [
          'Check your email inbox and spam folder',
          'Click the verification link in the email',
          'Request a new verification email if needed'
        ]
      }

      render(<ErrorPage error={error} />)

      expect(screen.getByText('Email Verification Required')).toBeInTheDocument()
      expect(screen.getByText(error.message)).toBeInTheDocument()
      
      // Verify verify email button is available
      expect(screen.getByRole('button', { name: /verify email/i })).toBeInTheDocument()
      
      // Verify suggestions are helpful but not revealing
      expect(screen.getByText('Check your email inbox and spam folder')).toBeInTheDocument()
      expect(screen.getByText('Click the verification link in the email')).toBeInTheDocument()
    })

    it('should display token errors without revealing system information', () => {
      const tokenErrors = [
        {
          type: AuthErrorType.TOKEN_EXPIRED,
          message: 'This link has expired. Please request a new one.',
          title: 'Invalid or Expired Link'
        },
        {
          type: AuthErrorType.TOKEN_INVALID,
          message: 'This link is invalid or has already been used.',
          title: 'Invalid or Expired Link'
        }
      ]

      tokenErrors.forEach(error => {
        const { unmount } = render(<ErrorPage error={error} />)

        expect(screen.getByText(error.title)).toBeInTheDocument()
        expect(screen.getByText(error.message)).toBeInTheDocument()
        
        // Verify no system information is revealed
        expect(screen.queryByText(/database/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/server/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/jwt/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/token validation/i)).not.toBeInTheDocument()
        
        // Verify helpful action is available
        expect(screen.getByRole('button', { name: /request new link/i })).toBeInTheDocument()

        unmount()
      })
    })

    it('should display internal errors with generic messaging', () => {
      const error = {
        type: AuthErrorType.INTERNAL_ERROR,
        message: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
        suggestions: [
          'Try again in a few minutes',
          'Contact support if the problem persists',
          'Check our status page for any known issues'
        ]
      }

      render(<ErrorPage error={error} />)

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
      expect(screen.getByText(error.message)).toBeInTheDocument()
      
      // Verify no technical details are exposed
      expect(screen.queryByText(/database/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/connection/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/timeout/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/exception/i)).not.toBeInTheDocument()
      
      // Verify helpful suggestions
      expect(screen.getByText('Try again in a few minutes')).toBeInTheDocument()
      expect(screen.getByText('Contact support if the problem persists')).toBeInTheDocument()
    })
  })

  describe('ErrorNotification Component Error Scenarios', () => {
    it('should display validation errors with field-specific information', () => {
      const error = {
        type: AuthErrorType.VALIDATION_ERROR,
        message: 'Email is required',
        field: 'email',
        suggestions: [
          'Review the highlighted fields',
          'Ensure all required information is provided'
        ]
      }

      render(<ErrorNotification error={error} />)

      expect(screen.getByText('Input Validation')).toBeInTheDocument()
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('What you can do:')).toBeInTheDocument()
      expect(screen.getByText('Review the highlighted fields')).toBeInTheDocument()
    })

    it('should display password strength errors with specific requirements', () => {
      const error = {
        type: AuthErrorType.PASSWORD_STRENGTH,
        message: 'Password does not meet security requirements.',
        field: 'password',
        suggestions: [
          'Use at least 8 characters',
          'Include uppercase and lowercase letters',
          'Add at least one number and special character'
        ]
      }

      render(<ErrorNotification error={error} />)

      expect(screen.getByText('Password Security')).toBeInTheDocument()
      expect(screen.getByText(error.message)).toBeInTheDocument()
      expect(screen.getByText('Use at least 8 characters')).toBeInTheDocument()
      expect(screen.getByText('Include uppercase and lowercase letters')).toBeInTheDocument()
    })

    it('should display email format errors with helpful guidance', () => {
      const error = {
        type: AuthErrorType.EMAIL_FORMAT,
        message: 'Please enter a valid email address.',
        field: 'email',
        suggestions: [
          'Check for typos in your email address',
          'Ensure the email format is correct (user@domain.com)',
          'Remove any extra spaces'
        ]
      }

      render(<ErrorNotification error={error} />)

      expect(screen.getByText('Email Format')).toBeInTheDocument()
      expect(screen.getByText(error.message)).toBeInTheDocument()
      expect(screen.getByText('Check for typos in your email address')).toBeInTheDocument()
      expect(screen.getByText('Ensure the email format is correct (user@domain.com)')).toBeInTheDocument()
    })

    it('should handle countdown timers correctly', async () => {
      jest.useFakeTimers()

      const error = {
        type: AuthErrorType.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests. Please wait before trying again.',
        retryAfter: 5
      }

      render(<ErrorNotification error={error} showCountdown={true} />)

      expect(screen.getByText('Try again in 5s')).toBeInTheDocument()

      // Fast forward 3 seconds
      jest.advanceTimersByTime(3000)
      await waitFor(() => {
        expect(screen.getByText('Try again in 2s')).toBeInTheDocument()
      })

      // Fast forward to completion
      jest.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.queryByText(/try again in/i)).not.toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('should provide appropriate action buttons for different error types', () => {
      const errorScenarios = [
        {
          error: {
            type: AuthErrorType.EMAIL_NOT_VERIFIED,
            message: 'Email verification required'
          },
          expectedButton: 'Verify Email'
        },
        {
          error: {
            type: AuthErrorType.ACCOUNT_LOCKED,
            message: 'Account is locked'
          },
          expectedButton: 'Reset Password'
        },
        {
          error: {
            type: AuthErrorType.INVALID_CREDENTIALS,
            message: 'Invalid credentials'
          },
          expectedButton: 'Reset Password'
        }
      ]

      errorScenarios.forEach(({ error, expectedButton }) => {
        const { unmount } = render(<ErrorNotification error={error} />)
        
        expect(screen.getByRole('button', { name: expectedButton })).toBeInTheDocument()
        
        unmount()
      })
    })
  })

  describe('Error Recovery Mechanisms', () => {
    it('should allow retry after rate limit expires', async () => {
      jest.useFakeTimers()
      const onRetry = jest.fn()

      const error = {
        type: AuthErrorType.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests',
        retryAfter: 3
      }

      render(<ErrorNotification error={error} onRetry={onRetry} showCountdown={true} />)

      // Initially, no retry button should be available
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()

      // Fast forward past the countdown
      jest.advanceTimersByTime(4000)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })

      // Click retry button
      fireEvent.click(screen.getByRole('button', { name: /try again/i }))
      expect(onRetry).toHaveBeenCalled()

      jest.useRealTimers()
    })

    it('should allow dismissing notifications', async () => {
      const onDismiss = jest.fn()

      const error = {
        type: AuthErrorType.VALIDATION_ERROR,
        message: 'Validation failed'
      }

      render(<ErrorNotification error={error} onDismiss={onDismiss} />)

      const dismissButton = screen.getByLabelText('Dismiss notification')
      fireEvent.click(dismissButton)

      // Should trigger dismiss callback
      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalled()
      })
    })

    it('should navigate to appropriate pages for error recovery', () => {
      const error = {
        type: AuthErrorType.EMAIL_NOT_VERIFIED,
        message: 'Email verification required'
      }

      render(<ErrorNotification error={error} />)

      const verifyButton = screen.getByRole('button', { name: /verify email/i })
      fireEvent.click(verifyButton)

      expect(mockLocation.href).toBe('/verify-email')
    })
  })

  describe('Success and Loading States', () => {
    it('should display success notifications with auto-hide', async () => {
      jest.useFakeTimers()
      const onDismiss = jest.fn()

      render(
        <SuccessNotification 
          message="Operation completed successfully"
          onDismiss={onDismiss}
          autoHide={true}
          duration={3000}
        />
      )

      expect(screen.getByText('Success')).toBeInTheDocument()
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument()

      // Fast forward past auto-hide duration
      jest.advanceTimersByTime(3500)

      await waitFor(() => {
        expect(onDismiss).toHaveBeenCalled()
      })

      jest.useRealTimers()
    })

    it('should display loading notifications with spinner', () => {
      render(
        <LoadingNotification 
          message="Processing your request..."
          title="Please Wait"
        />
      )

      expect(screen.getByText('Please Wait')).toBeInTheDocument()
      expect(screen.getByText('Processing your request...')).toBeInTheDocument()
      
      // Verify spinner is present (by checking for the spinning icon)
      const spinner = screen.getByRole('img', { hidden: true }) // Lucide icons have role="img"
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  describe('SimpleErrorPage Component', () => {
    it('should display simple error with retry functionality', () => {
      const onRetry = jest.fn()

      render(
        <SimpleErrorPage
          title="Connection Error"
          message="Unable to connect to the server"
          onRetry={onRetry}
        />
      )

      expect(screen.getByText('Connection Error')).toBeInTheDocument()
      expect(screen.getByText('Unable to connect to the server')).toBeInTheDocument()

      const retryButton = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(retryButton)

      expect(onRetry).toHaveBeenCalled()
    })

    it('should provide navigation back to homepage', () => {
      render(<SimpleErrorPage />)

      const homeButton = screen.getByRole('button', { name: /go to homepage/i })
      fireEvent.click(homeButton)

      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('should handle missing retry callback gracefully', () => {
      render(<SimpleErrorPage showRetry={true} />)

      const retryButton = screen.getByRole('button', { name: /try again/i })
      
      // Should not throw when clicked without onRetry callback
      expect(() => {
        fireEvent.click(retryButton)
      }).not.toThrow()
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should provide proper ARIA labels and roles', () => {
      const error = {
        type: AuthErrorType.ACCOUNT_LOCKED,
        message: 'Account is locked'
      }

      render(<ErrorNotification error={error} onDismiss={jest.fn()} />)

      // Verify dismiss button has proper aria-label
      expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument()
      
      // Verify buttons have proper roles
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
    })

    it('should handle keyboard navigation properly', async () => {
      const user = userEvent.setup()
      const onRetry = jest.fn()

      const error = {
        type: AuthErrorType.INTERNAL_ERROR,
        message: 'Internal error occurred'
      }

      render(<ErrorNotification error={error} onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: /try again/i })
      
      // Should be focusable and activatable with keyboard
      await user.tab()
      expect(retryButton).toHaveFocus()
      
      await user.keyboard('{Enter}')
      expect(onRetry).toHaveBeenCalled()
    })

    it('should display appropriate severity indicators', () => {
      const highSeverityError = {
        type: AuthErrorType.SUSPICIOUS_ACTIVITY,
        message: 'Suspicious activity detected'
      }

      render(<ErrorNotification error={highSeverityError} />)

      expect(screen.getByText('High Security Alert')).toBeInTheDocument()
      
      // Verify visual indicator is present
      const alertIndicator = screen.getByText('High Security Alert').previousElementSibling
      expect(alertIndicator).toHaveClass('animate-pulse')
    })
  })

  describe('Development Mode Features', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    it('should show debug information in development mode', () => {
      process.env.NODE_ENV = 'development'

      const error = {
        type: AuthErrorType.INTERNAL_ERROR,
        message: 'Internal error',
        details: {
          stack: 'Error stack trace',
          timestamp: '2023-01-01T00:00:00Z'
        }
      }

      render(<ErrorPage error={error} />)

      expect(screen.getByText('Debug Information')).toBeInTheDocument()
      
      // Click to expand debug info
      fireEvent.click(screen.getByText('Debug Information'))
      
      expect(screen.getByText(/"stack": "Error stack trace"/)).toBeInTheDocument()
    })

    it('should hide debug information in production mode', () => {
      process.env.NODE_ENV = 'production'

      const error = {
        type: AuthErrorType.INTERNAL_ERROR,
        message: 'Internal error',
        details: {
          stack: 'Error stack trace',
          timestamp: '2023-01-01T00:00:00Z'
        }
      }

      render(<ErrorPage error={error} />)

      expect(screen.queryByText('Debug Information')).not.toBeInTheDocument()
    })
  })
})