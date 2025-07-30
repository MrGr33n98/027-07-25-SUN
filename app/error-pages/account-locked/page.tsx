'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Clock, Mail, HelpCircle, ArrowLeft } from 'lucide-react'

export default function AccountLockedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(0)
  
  const lockoutDuration = parseInt(searchParams.get('lockoutDuration') || '1800') // Default 30 minutes
  const email = searchParams.get('email') || ''
  const lockoutCount = parseInt(searchParams.get('lockoutCount') || '1')

  useEffect(() => {
    setCountdown(lockoutDuration)
    
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
  }, [lockoutDuration])

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

  const getLockoutMessage = () => {
    if (lockoutCount === 1) {
      return "Your account has been temporarily locked due to multiple failed login attempts."
    } else if (lockoutCount <= 3) {
      return `Your account has been locked for the ${lockoutCount === 2 ? '2nd' : '3rd'} time. The lockout duration increases with each occurrence.`
    } else {
      return "Your account has been locked multiple times. Please consider resetting your password or contacting support."
    }
  }

  const getSeverityColor = () => {
    if (lockoutCount === 1) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    if (lockoutCount <= 3) return "text-orange-600 bg-orange-50 border-orange-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Account Temporarily Locked
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className={`border rounded-lg p-4 ${getSeverityColor()}`}>
            <p className="text-sm font-medium">
              {getLockoutMessage()}
            </p>
          </div>

          {countdown > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-gray-700">
                <Clock className="w-5 h-5" />
                <span className="font-medium">
                  Unlocks in {formatTime(countdown)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Unlock your account:</h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Reset Password</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Reset your password to unlock your account immediately
                  </p>
                  <Link 
                    href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                    className="text-xs text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                  >
                    Reset Password Now
                  </Link>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Wait for Unlock</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Your account will automatically unlock after the lockout period
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <HelpCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Contact Support</p>
                  <p className="text-xs text-gray-600 mt-1">
                    If you believe this is an error, our support team can help
                  </p>
                  <Link 
                    href="/support"
                    className="text-xs text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Security Tips:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Use a strong, unique password for your account</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Enable two-factor authentication when available</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Keep your login credentials secure and private</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col space-y-3 pt-4 border-t">
            {countdown === 0 && (
              <Button 
                onClick={() => router.push('/login')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Try Logging In Again
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

          <div className="text-xs text-gray-500 border-t pt-4">
            <p>
              Account lockouts are a security measure to protect against unauthorized access attempts. 
              The lockout duration increases with repeated violations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}