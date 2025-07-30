# Comprehensive Error Handling System

This document describes the comprehensive error handling and user feedback system implemented for the SolarConnect authentication system. The system follows security-first principles while providing excellent user experience through clear messaging and actionable feedback.

## Overview

The error handling system consists of several integrated components:

1. **Security-First Error Messaging** - Prevents information leakage while providing helpful user guidance
2. **Rate Limiting Feedback** - User-friendly rate limiting with countdown timers and retry guidance
3. **Error Pages and Notifications** - Comprehensive UI components for error display
4. **Error Boundaries** - React error boundaries for graceful error recovery
5. **Comprehensive Logging** - Security event logging for monitoring and debugging

## Components

### 1. AuthError and AuthErrorHandler (`lib/auth-error-handler.ts`)

The core error handling system with security-first messaging.

```typescript
import { AuthError, AuthErrorType, AuthErrorHandler } from '@/lib/auth-error-handler'

// Create a security-conscious error
const error = new AuthError(
  AuthErrorType.INVALID_CREDENTIALS,
  'Invalid email or password. Please check your credentials and try again.', // User message
  'Authentication failed for user@example.com - password mismatch', // Log message
  401,
  {
    suggestions: ['Double-check your email', 'Try password reset'],
    retryAfter: 300
  }
)

// Handle errors in API routes
return AuthErrorHandler.handleError(error, {
  operation: 'login',
  email: 'user@example.com',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
})
```

### 2. Rate Limiting Feedback (`lib/rate-limit-feedback.ts`)

Provides user-friendly rate limiting with real-time countdown and suggestions.

```typescript
import { RateLimitFeedbackManager, useRateLimitFeedback } from '@/lib/rate-limit-feedback'

// In a React component
const { state, startRateLimit, isLimited, remainingTime } = useRateLimitFeedback('login')

// Start rate limiting
startRateLimit({
  limit: 5,
  windowMs: 900000, // 15 minutes
  retryAfter: 300, // 5 minutes
  severity: 'medium'
})

// Display countdown
if (isLimited) {
  console.log(`Try again in ${RateLimitFeedbackManager.formatTimeRemaining(remainingTime)}`)
}
```

### 3. Error Notifications (`components/ui/error-notification.tsx`)

Enhanced error notification components with security indicators and actionable suggestions.

```typescript
import { ErrorNotification, SuccessNotification } from '@/components/ui/error-notification'

<ErrorNotification
  error={{
    type: AuthErrorType.RATE_LIMIT_EXCEEDED,
    message: 'Too many login attempts. Please wait before trying again.',
    retryAfter: 300,
    suggestions: ['Wait for cooldown', 'Check credentials', 'Contact support']
  }}
  variant="toast"
  showCountdown={true}
  onRetry={() => handleRetry()}
  onDismiss={() => handleDismiss()}
/>
```

### 4. Error Pages (`components/ui/error-page.tsx`)

Comprehensive error pages with security-appropriate messaging and recovery options.

```typescript
import { ErrorPage } from '@/components/ui/error-page'

<ErrorPage
  error={{
    type: AuthErrorType.ACCOUNT_LOCKED,
    message: 'Your account has been temporarily locked due to multiple failed login attempts.',
    retryAfter: 1800,
    suggestions: ['Wait for unlock', 'Reset password', 'Contact support']
  }}
  showNavigation={true}
  showSupport={true}
  onRetry={() => handleRetry()}
/>
```

### 5. Error Boundaries (`components/ui/error-boundary.tsx`)

React error boundaries for graceful error recovery with user-friendly interfaces.

```typescript
import { ErrorBoundary, withErrorBoundary } from '@/components/ui/error-boundary'

// Wrap components
<ErrorBoundary
  showDetails={process.env.NODE_ENV === 'development'}
  showReportButton={true}
  onError={(error, errorInfo) => console.error('Boundary caught:', error)}
>
  <YourComponent />
</ErrorBoundary>

// Or use HOC
const SafeComponent = withErrorBoundary(YourComponent, {
  showDetails: false,
  showReportButton: true
})
```

### 6. Enhanced Toast System (`components/ui/toast.tsx`)

Extended toast system with security alerts, countdown timers, and priority handling.

```typescript
import { useToast } from '@/components/ui/toast'

const { addErrorToast, addSecurityToast } = useToast()

// Add error toast with countdown
addErrorToast({
  type: AuthErrorType.RATE_LIMIT_EXCEEDED,
  message: 'Too many attempts. Please wait.',
  retryAfter: 300
})

// Add security alert
addSecurityToast('Suspicious activity detected', 'high')
```

### 7. Error Handling Hook (`hooks/use-error-handling.ts`)

Comprehensive hook for unified error management across the application.

```typescript
import { useErrorHandling } from '@/hooks/use-error-handling'

const { 
  handleAuthError, 
  handleApiError, 
  handleNetworkError,
  handleValidationError,
  handleSecurityEvent 
} = useErrorHandling()

// Handle authentication errors
try {
  await loginUser(credentials)
} catch (error) {
  handleAuthError(error, {
    operation: 'login',
    showToast: true,
    redirectOnError: true
  })
}

// Handle API responses
const response = await fetch('/api/data')
if (!response.ok) {
  await handleApiError(response, {
    operation: 'data_fetch',
    showToast: true
  })
}
```

### 8. Error Redirect Utilities (`lib/error-redirect.ts`)

Utilities for redirecting to appropriate error pages with proper context.

```typescript
import { redirectToErrorPage, createErrorPageUrl } from '@/lib/error-redirect'

// Redirect based on error type
const url = redirectToErrorPage(authError, {
  returnUrl: '/dashboard',
  preserveHistory: false
})

// Create custom error page URL
const customUrl = createErrorPageUrl({
  type: AuthErrorType.VALIDATION_ERROR,
  message: 'Form validation failed',
  suggestions: ['Check required fields', 'Verify email format'],
  returnUrl: '/form'
})
```

## Security Features

### 1. Information Leakage Prevention

- **Generic Error Messages**: User-facing messages never reveal system internals
- **Separate Logging**: Detailed error information is logged separately for debugging
- **Timing Attack Protection**: Consistent response times regardless of error type

```typescript
// User sees: "Invalid email or password"
// Logs contain: "Authentication failed for user@example.com - user not found in database"
```

### 2. Rate Limiting with User Feedback

- **Progressive Penalties**: Increasing lockout duration for repeated violations
- **Clear Communication**: Users understand why they're limited and when they can retry
- **Security Indicators**: High-severity alerts for suspicious activity

### 3. Account Security Measures

- **Account Lockouts**: Automatic lockouts after failed attempts
- **Security Alerts**: Notifications for suspicious activity
- **Recovery Options**: Clear paths for account recovery

## Error Types

The system handles various error types with appropriate messaging:

| Error Type | User Message | Security Level | Retry Allowed |
|------------|--------------|----------------|---------------|
| `INVALID_CREDENTIALS` | Generic login failure message | Medium | Yes |
| `ACCOUNT_LOCKED` | Account temporarily locked | High | No (until unlock) |
| `RATE_LIMIT_EXCEEDED` | Too many attempts | Medium | Yes (after cooldown) |
| `EMAIL_NOT_VERIFIED` | Email verification required | Low | No (redirect to verify) |
| `SUSPICIOUS_ACTIVITY` | Security alert | High | No (manual review) |
| `TOKEN_EXPIRED` | Link expired | Low | No (request new) |
| `VALIDATION_ERROR` | Input validation failed | Low | Yes |
| `SERVICE_UNAVAILABLE` | Service temporarily down | Low | Yes (after delay) |

## Usage Examples

### API Route Error Handling

```typescript
import { withAuthErrorHandling } from '@/lib/auth-error-handler'

export const POST = withAuthErrorHandling(async (request) => {
  // Your API logic here
  const { email, password } = await request.json()
  
  // Validation
  if (!email) {
    throw AuthErrorHandler.createValidationError(
      { email: ['Email is required'] },
      'email'
    )
  }
  
  // Rate limiting check
  const attempts = await getRateLimitAttempts(request)
  if (attempts >= 5) {
    throw AuthErrorHandler.createRateLimitError(300, 'login')
  }
  
  // Authentication logic...
  
}, 'login')
```

### React Component Error Handling

```typescript
import { useErrorHandling } from '@/hooks/use-error-handling'
import { ErrorNotification } from '@/components/ui/error-notification'

export function LoginForm() {
  const { handleAuthError } = useErrorHandling()
  const [error, setError] = useState(null)
  
  const handleSubmit = async (formData) => {
    try {
      setError(null)
      await submitLogin(formData)
    } catch (err) {
      const result = handleAuthError(err, {
        operation: 'login',
        showToast: false, // We'll show inline error
        redirectOnError: true
      })
      
      if (result.type === 'auth_error') {
        setError(result.error)
      }
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <ErrorNotification
          error={error}
          variant="inline"
          onRetry={() => setError(null)}
        />
      )}
      {/* Form fields */}
    </form>
  )
}
```

### Global Error Setup

```typescript
// In your app root or layout
import { useErrorHandling } from '@/hooks/use-error-handling'

export function App() {
  const { setupGlobalErrorHandling } = useErrorHandling()
  
  useEffect(() => {
    const cleanup = setupGlobalErrorHandling()
    return cleanup
  }, [])
  
  return (
    <ErrorBoundary>
      <ToastProvider>
        {/* Your app content */}
      </ToastProvider>
    </ErrorBoundary>
  )
}
```

## Best Practices

### 1. Error Message Guidelines

- **Be Helpful**: Provide actionable suggestions
- **Be Secure**: Never reveal system internals
- **Be Consistent**: Use standard error types and messages
- **Be Clear**: Use plain language, avoid technical jargon

### 2. Rate Limiting

- **Progressive Penalties**: Increase severity with repeated violations
- **Clear Communication**: Always explain why and for how long
- **Recovery Options**: Provide alternative actions (password reset, support contact)

### 3. Security Events

- **Log Everything**: Comprehensive security event logging
- **Alert Appropriately**: High-severity events get immediate attention
- **Provide Context**: Include relevant details for investigation

### 4. User Experience

- **Graceful Degradation**: Always provide fallback options
- **Clear Navigation**: Easy paths back to working functionality
- **Support Access**: Always provide ways to get help

## Testing

The system includes comprehensive tests covering:

- Error creation and handling
- Rate limiting feedback
- Security message validation
- Error page rendering
- Toast notifications
- Error boundaries

Run tests with:
```bash
npm test -- __tests__/lib/error-handling.test.ts
```

## Monitoring and Debugging

### Development Mode

- **Detailed Error Information**: Full stack traces and component stacks
- **Debug Panels**: Expandable error details in UI components
- **Console Logging**: Comprehensive error logging

### Production Mode

- **User-Friendly Messages**: Clean, helpful error messages
- **Security Logging**: Detailed logs for security team
- **Error Tracking**: Integration points for services like Sentry

## Integration with Existing Systems

The error handling system integrates with:

- **Authentication Service**: Handles all auth-related errors
- **Rate Limiter**: Provides user feedback for rate limiting
- **Security Logger**: Logs all security events
- **Email Service**: Sends security notifications
- **Toast System**: Shows user notifications
- **Navigation**: Redirects to appropriate error pages

This comprehensive system ensures that users receive helpful, secure feedback while maintaining the security posture of the application.