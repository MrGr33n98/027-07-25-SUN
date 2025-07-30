import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { UserRole } from '@prisma/client'
import { RBACService, requiresEmailVerification } from '@/lib/rbac'

export interface AuthContext {
  user?: {
    id: string
    email: string
    role: UserRole
    emailVerified: Date | null
  }
  isAuthenticated: boolean
}

/**
 * Authentication middleware that checks user authentication and role permissions
 */
export class AuthMiddleware {
  /**
   * Get authentication context from request
   */
  static async getAuthContext(req: NextRequest): Promise<AuthContext> {
    try {
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET 
      })

      if (!token || !token.sub) {
        return { isAuthenticated: false }
      }

      return {
        isAuthenticated: true,
        user: {
          id: token.sub,
          email: token.email as string,
          role: token.role as UserRole,
          emailVerified: token.emailVerified as Date | null,
        }
      }
    } catch (error) {
      console.error('Auth context error:', error)
      return { isAuthenticated: false }
    }
  }

  /**
   * Check if user has required role for route
   */
  static async checkRouteAccess(
    req: NextRequest, 
    requiredRole?: UserRole
  ): Promise<{ allowed: boolean; reason?: string }> {
    const authContext = await this.getAuthContext(req)
    const pathname = req.nextUrl.pathname

    // Check if route requires authentication
    if (!authContext.isAuthenticated) {
      return { allowed: false, reason: 'not_authenticated' }
    }

    const user = authContext.user!

    // Check email verification requirement
    if (requiresEmailVerification(pathname) && !user.emailVerified) {
      return { allowed: false, reason: 'email_not_verified' }
    }

    // Check role-based access
    if (requiredRole) {
      if (requiredRole === UserRole.ADMIN && user.role !== UserRole.ADMIN) {
        return { allowed: false, reason: 'insufficient_role' }
      }
      
      if (requiredRole === UserRole.COMPANY && 
          user.role !== UserRole.COMPANY && 
          user.role !== UserRole.ADMIN) {
        return { allowed: false, reason: 'insufficient_role' }
      }
    }

    // Use RBAC service for route access check
    if (!RBACService.canAccessRoute(user.role, pathname)) {
      return { allowed: false, reason: 'route_forbidden' }
    }

    return { allowed: true }
  }

  /**
   * Create unauthorized response
   */
  static createUnauthorizedResponse(reason: string, redirectUrl?: string): NextResponse {
    const response = NextResponse.json(
      { 
        error: 'Unauthorized', 
        reason,
        message: this.getErrorMessage(reason)
      },
      { status: 401 }
    )

    if (redirectUrl) {
      response.headers.set('X-Redirect-URL', redirectUrl)
    }

    return response
  }

  /**
   * Create forbidden response
   */
  static createForbiddenResponse(reason: string): NextResponse {
    return NextResponse.json(
      { 
        error: 'Forbidden', 
        reason,
        message: this.getErrorMessage(reason)
      },
      { status: 403 }
    )
  }

  /**
   * Get user-friendly error message
   */
  private static getErrorMessage(reason: string): string {
    switch (reason) {
      case 'not_authenticated':
        return 'You must be logged in to access this resource'
      case 'email_not_verified':
        return 'Please verify your email address to access this feature'
      case 'insufficient_role':
        return 'You do not have permission to access this resource'
      case 'route_forbidden':
        return 'Access to this route is forbidden'
      default:
        return 'Access denied'
    }
  }
}

/**
 * Higher-order function for protecting API routes with authentication
 */
export function withAuth<T extends any[]>(
  handler: (req: NextRequest, context: AuthContext, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const authContext = await AuthMiddleware.getAuthContext(req)
    
    if (!authContext.isAuthenticated) {
      return AuthMiddleware.createUnauthorizedResponse('not_authenticated', '/login')
    }

    return handler(req, authContext, ...args)
  }
}

/**
 * Higher-order function for protecting admin routes
 */
export function withAdminAuth<T extends any[]>(
  handler: (req: NextRequest, context: AuthContext, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const accessCheck = await AuthMiddleware.checkRouteAccess(req, UserRole.ADMIN)
    
    if (!accessCheck.allowed) {
      if (accessCheck.reason === 'not_authenticated') {
        return AuthMiddleware.createUnauthorizedResponse(accessCheck.reason, '/login')
      }
      return AuthMiddleware.createForbiddenResponse(accessCheck.reason!)
    }

    const authContext = await AuthMiddleware.getAuthContext(req)
    return handler(req, authContext, ...args)
  }
}

/**
 * Higher-order function for protecting company routes
 */
export function withCompanyAuth<T extends any[]>(
  handler: (req: NextRequest, context: AuthContext, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const accessCheck = await AuthMiddleware.checkRouteAccess(req, UserRole.COMPANY)
    
    if (!accessCheck.allowed) {
      if (accessCheck.reason === 'not_authenticated') {
        return AuthMiddleware.createUnauthorizedResponse(accessCheck.reason, '/login')
      }
      return AuthMiddleware.createForbiddenResponse(accessCheck.reason!)
    }

    const authContext = await AuthMiddleware.getAuthContext(req)
    return handler(req, authContext, ...args)
  }
}

/**
 * Middleware for checking specific permissions
 */
export function withPermission<T extends any[]>(
  resource: string,
  action: string,
  handler: (req: NextRequest, context: AuthContext, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const authContext = await AuthMiddleware.getAuthContext(req)
    
    if (!authContext.isAuthenticated) {
      return AuthMiddleware.createUnauthorizedResponse('not_authenticated', '/login')
    }

    const user = authContext.user!
    
    if (!RBACService.canAccess(user.role, resource, action)) {
      return AuthMiddleware.createForbiddenResponse('insufficient_permission')
    }

    return handler(req, authContext, ...args)
  }
}