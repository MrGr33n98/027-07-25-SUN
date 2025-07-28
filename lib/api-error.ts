import { NextResponse } from 'next/server'

export class ApiError extends Error {
  public statusCode: number
  public code: string

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
        },
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    // Log the full error for debugging
    console.error('Unexpected error:', error.stack)
    
    return NextResponse.json(
      {
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        },
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      error: {
        message: 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 500,
      },
    },
    { status: 500 }
  )
}

export function withErrorHandling(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}