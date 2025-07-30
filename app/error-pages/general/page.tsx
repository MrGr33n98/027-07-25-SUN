'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ErrorPage } from '@/components/ui/error-page'
import { AuthErrorType } from '@/lib/auth-error-handler'

export default function GeneralErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<{
    type: AuthErrorType
    message: string
    retryAfter?: number
    suggestions?: string[]
    details?: Record<string, any>
  } | null>(null)

  useEffect(() => {
    // Parse error information from URL parameters
    const errorType = searchParams.get('type') as AuthErrorType || AuthErrorType.INTERNAL_ERROR
    const message = searchParams.get('message') || 'An unexpected error occurred.'
    const retryAfter = searchParams.get('retryAfter') ? parseInt(searchParams.get('retryAfter')!) : undefined
    const suggestionsParam = searchParams.get('suggestions')
    const detailsParam = searchParams.get('details')

    let suggestions: string[] = []
    let details: Record<string, any> = {}

    try {
      if (suggestionsParam) {
        suggestions = JSON.parse(decodeURIComponent(suggestionsParam))
      }
      if (detailsParam) {
        details = JSON.parse(decodeURIComponent(detailsParam))
      }
    } catch (parseError) {
      console.warn('Failed to parse error parameters:', parseError)
    }

    setError({
      type: errorType,
      message: decodeURIComponent(message),
      retryAfter,
      suggestions,
      details
    })
  }, [searchParams])

  const handleRetry = () => {
    const returnUrl = searchParams.get('returnUrl')
    if (returnUrl) {
      router.push(decodeURIComponent(returnUrl))
    } else {
      router.back()
    }
  }

  if (!error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorPage
      error={error}
      onRetry={handleRetry}
      showNavigation={true}
      showSupport={true}
    />
  )
}