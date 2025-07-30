'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Shield, RefreshCw, ArrowLeft } from 'lucide-react'

export default function RateLimitPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(0)
  
  const retryAfter = parseInt(searchParams.get('retryAfter') || '300') // Default 5 minutes
  const operation = searchParams.get('operation') || 'request'

  useEffect(() => {
    setCountdown(retryAfter)
    
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
  }, [retryAfter])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${remainingSeconds}s`
  }

  const handleRetry = () => {
    router.back()
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Too Many Attempts
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-gray-600">
              We've detected too many {operation} attempts from your location. 
              This is a security measure to protect our platform.
            </p>
            
            {countdown > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-yellow-800">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">
                    Please wait {formatTime(countdown)} before trying again
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">What you can do:</h3>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Wait for the cooldown period to complete</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Double-check your credentials before retrying</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>Contact support if you continue having issues</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col space-y-3">
            {countdown === 0 ? (
              <Button 
                onClick={handleRetry}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            ) : (
              <Button 
                disabled
                className="w-full"
                variant="outline"
              >
                <Clock className="w-4 h-4 mr-2" />
                Wait {formatTime(countdown)}
              </Button>
            )}
            
            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Homepage
            </Button>
          </div>

          <div className="text-xs text-gray-500 border-t pt-4">
            <p>
              This security measure helps protect against automated attacks and ensures 
              fair access for all users.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}