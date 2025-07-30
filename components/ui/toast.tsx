'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Clock, Shield } from 'lucide-react'
import { AuthErrorType } from '@/lib/auth-error-handler'

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'security'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  actions?: ToastAction[]
  dismissible?: boolean
  priority?: 'low' | 'medium' | 'high'
  errorType?: AuthErrorType
  retryAfter?: number
}

interface ToastAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  addErrorToast: (error: { type: AuthErrorType; message: string; retryAfter?: number }) => void
  addSecurityToast: (message: string, severity?: 'low' | 'medium' | 'high') => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { 
      ...toast, 
      id,
      dismissible: toast.dismissible !== false,
      priority: toast.priority || 'medium'
    }
    
    setToasts(prev => {
      // Sort by priority (high -> medium -> low)
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const newToasts = [...prev, newToast]
      
      return newToasts.sort((a, b) => 
        (priorityOrder[b.priority || 'medium'] || 2) - (priorityOrder[a.priority || 'medium'] || 2)
      )
    })
    
    // Auto remove after duration (unless it's a high priority security toast)
    if (newToast.type !== 'security' || newToast.priority !== 'high') {
      const duration = toast.duration || (toast.type === 'error' ? 8000 : 5000)
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addErrorToast = useCallback((error: { type: AuthErrorType; message: string; retryAfter?: number }) => {
    const isSecurityError = [
      AuthErrorType.ACCOUNT_LOCKED,
      AuthErrorType.SUSPICIOUS_ACTIVITY,
      AuthErrorType.RATE_LIMIT_EXCEEDED
    ].includes(error.type)

    addToast({
      type: isSecurityError ? 'security' : 'error',
      title: getErrorTitle(error.type),
      message: error.message,
      duration: isSecurityError ? 10000 : 8000,
      priority: isSecurityError ? 'high' : 'medium',
      errorType: error.type,
      retryAfter: error.retryAfter,
      dismissible: !isSecurityError || error.type !== AuthErrorType.ACCOUNT_LOCKED
    })
  }, [addToast])

  const addSecurityToast = useCallback((message: string, severity: 'low' | 'medium' | 'high' = 'medium') => {
    addToast({
      type: 'security',
      title: 'Security Notice',
      message,
      duration: severity === 'high' ? 0 : 8000, // High severity toasts don't auto-dismiss
      priority: severity,
      dismissible: severity !== 'high'
    })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, addErrorToast, addSecurityToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [countdown, setCountdown] = useState(toast.retryAfter || 0)

  useEffect(() => {
    if (toast.retryAfter) {
      setCountdown(toast.retryAfter)
      
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
  }, [toast.retryAfter])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      case 'security':
        return toast.errorType === AuthErrorType.RATE_LIMIT_EXCEEDED 
          ? <Clock className="w-5 h-5 text-orange-500" />
          : <Shield className="w-5 h-5 text-red-500" />
    }
  }

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      case 'security':
        return toast.priority === 'high' 
          ? 'bg-red-50 border-red-300 border-2'
          : 'bg-orange-50 border-orange-200'
    }
  }

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-900'
      case 'error':
        return 'text-red-900'
      case 'warning':
        return 'text-yellow-900'
      case 'info':
        return 'text-blue-900'
      case 'security':
        return toast.priority === 'high' ? 'text-red-900' : 'text-orange-900'
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const animationClass = toast.priority === 'high' 
    ? 'animate-in slide-in-from-right duration-300 animate-pulse'
    : 'animate-in slide-in-from-right duration-300'

  return (
    <div className={`max-w-sm w-full ${getBgColor()} border rounded-lg shadow-lg p-4 ${animationClass}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${getTextColor()}`}>
              {toast.title}
            </p>
            {toast.priority === 'high' && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-2"></div>
            )}
          </div>
          
          {toast.message && (
            <p className={`mt-1 text-sm ${getTextColor()} opacity-90`}>
              {toast.message}
            </p>
          )}

          {/* Countdown for rate limited operations */}
          {countdown > 0 && (
            <div className={`mt-2 flex items-center space-x-2 text-xs ${getTextColor()} opacity-75`}>
              <Clock className="w-3 h-3" />
              <span>Try again in {formatTime(countdown)}</span>
            </div>
          )}

          {/* Action buttons */}
          {toast.actions && toast.actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {toast.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`text-xs px-2 py-1 rounded ${
                    action.variant === 'primary'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {toast.dismissible && (
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => onRemove(toast.id)}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function getErrorTitle(errorType: AuthErrorType): string {
  switch (errorType) {
    case AuthErrorType.INVALID_CREDENTIALS:
      return 'Authentication Failed'
    case AuthErrorType.ACCOUNT_LOCKED:
      return 'Account Locked'
    case AuthErrorType.EMAIL_NOT_VERIFIED:
      return 'Email Verification Required'
    case AuthErrorType.RATE_LIMIT_EXCEEDED:
      return 'Rate Limit Exceeded'
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