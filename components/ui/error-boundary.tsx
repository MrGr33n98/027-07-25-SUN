'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { AlertTriangle, RefreshCw, Home, Bug, ExternalLink } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  showReportButton?: boolean
  className?: string
}

/**
 * Enhanced error boundary with user-friendly error reporting
 * and recovery options
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error for monitoring
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Report to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined') {
      // Example: Sentry.captureException(error, { extra: errorInfo })
      this.reportError(error, errorInfo)
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // This would typically send to an error reporting service
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Log for development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Report')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Full Report:', errorReport)
      console.groupEnd()
    }

    // In production, send to error tracking service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // }).catch(console.error)
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  private handleReportIssue = () => {
    const { error, errorInfo, errorId } = this.state
    
    const issueBody = encodeURIComponent(`
**Error ID:** ${errorId}
**Error Message:** ${error?.message || 'Unknown error'}
**URL:** ${window.location.href}
**Timestamp:** ${new Date().toISOString()}

**Steps to reproduce:**
1. 
2. 
3. 

**Expected behavior:**


**Additional context:**


---
**Technical Details (do not modify):**
\`\`\`
${error?.stack || 'No stack trace available'}
\`\`\`

\`\`\`
${errorInfo?.componentStack || 'No component stack available'}
\`\`\`
    `)

    const issueUrl = `https://github.com/your-org/solar-connect/issues/new?title=${encodeURIComponent(`Error: ${error?.message || 'Application Error'}`)}&body=${issueBody}`
    window.open(issueUrl, '_blank')
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorInfo, errorId } = this.state
      const { showDetails = false, showReportButton = true, className = '' } = this.props

      return (
        <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-4 ${className}`}>
          <Card className="w-full max-w-2xl border-red-200">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Something went wrong
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-2">
                  We encountered an unexpected error while loading this page.
                </p>
                <p className="text-sm text-gray-500">
                  Error ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{errorId}</code>
                </p>
              </div>

              {/* Error Details (Development/Debug) */}
              {showDetails && error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-800 mb-2">Error Details:</h3>
                  <div className="text-sm text-red-700 space-y-2">
                    <div>
                      <strong>Message:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <details>
                        <summary className="cursor-pointer font-medium">Stack Trace</summary>
                        <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                    {errorInfo?.componentStack && (
                      <details>
                        <summary className="cursor-pointer font-medium">Component Stack</summary>
                        <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* User Actions */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">What you can do:</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Try refreshing the page</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Go back to the previous page</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Clear your browser cache and cookies</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Contact support if the problem persists</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Report Issue */}
              {showReportButton && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Help us improve</h3>
                      <p className="text-sm text-gray-600">
                        Report this issue to help us fix it faster
                      </p>
                    </div>
                    <Button 
                      onClick={this.handleReportIssue}
                      variant="outline"
                      size="sm"
                    >
                      <Bug className="w-4 h-4 mr-2" />
                      Report Issue
                    </Button>
                  </div>
                </div>
              )}

              {/* Support Information */}
              <div className="border-t pt-4 text-center">
                <p className="text-sm text-gray-500 mb-2">
                  If you continue to experience issues, please contact our support team.
                </p>
                <div className="flex justify-center space-x-4 text-sm">
                  <a 
                    href="mailto:support@solarconnect.com" 
                    className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <span>support@solarconnect.com</span>
                  </a>
                  <a 
                    href="/support" 
                    className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Support Center</span>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Async error boundary for handling async errors in components
 */
export function AsyncErrorBoundary({ 
  children, 
  onError,
  ...props 
}: ErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Handle async errors
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      // Handle code splitting errors
      console.warn('Code splitting error detected, reloading page...')
      window.location.reload()
      return
    }

    onError?.(error, errorInfo)
  }

  return (
    <ErrorBoundary {...props} onError={handleError}>
      {children}
    </ErrorBoundary>
  )
}

/**
 * Development-only error boundary with enhanced debugging
 */
export function DevErrorBoundary({ children, ...props }: ErrorBoundaryProps) {
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>
  }

  return (
    <ErrorBoundary 
      {...props} 
      showDetails={true}
      showReportButton={false}
      onError={(error, errorInfo) => {
        // Enhanced development logging
        console.group('🚨 Development Error Boundary')
        console.error('Error:', error)
        console.error('Component Stack:', errorInfo.componentStack)
        console.error('Error Stack:', error.stack)
        console.groupEnd()
        
        props.onError?.(error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}