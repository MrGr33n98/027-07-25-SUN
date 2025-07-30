import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { UserRole } from '@prisma/client'
import { RBACService, PERMISSIONS, PROTECTED_ROUTES, requiresEmailVerification, isProtectedRoute, PermissionContext } from '@/lib/rbac'
import { AuthMiddleware } from '@/lib/middleware/auth-middleware'

// Mock next-auth/jwt
jest.mock('next-auth/jwt')

const mockGetToken = getToken as jest.MockedFunction<typeof getToken>

describe('Auth & RBAC Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('RBACService Permission Checks', () => {
    test('CUSTOMER role has correct permissions', () => {
      expect(RBACService.canAccess(UserRole.CUSTOMER, 'user', 'read')).toBe(true)
      expect(RBACService.canAccess(UserRole.CUSTOMER, 'company', 'read')).toBe(true)
      expect(RBACService.canAccess(UserRole.CUSTOMER, 'product', 'read')).toBe(true)
      expect(RBACService.canAccess(UserRole.CUSTOMER, 'review', 'create')).toBe(true)
      
      // Should not have admin permissions
      expect(RBACService.canAccess(UserRole.CUSTOMER, 'admin', 'dashboard')).toBe(false)
      expect(RBACService.canAccess(UserRole.CUSTOMER, 'company', 'create')).toBe(false)
      expect(RBACService.canAccess(UserRole.CUSTOMER, 'product', 'create')).toBe(false)
    })

    test('COMPANY role has correct permissions', () => {
      expect(RBACService.canAccess(UserRole.COMPANY, 'user', 'read')).toBe(true)
      expect(RBACService.canAccess(UserRole.COMPANY, 'company', 'create')).toBe(true)
      expect(RBACService.canAccess(UserRole.COMPANY, 'product', 'create')).toBe(true)
      expect(RBACService.canAccess(UserRole.COMPANY, 'project', 'create')).toBe(true)
      expect(RBACService.canAccess(UserRole.COMPANY, 'quote', 'create')).toBe(true)
      
      // Should not have admin permissions
      expect(RBACService.canAccess(UserRole.COMPANY, 'admin', 'dashboard')).toBe(false)
      expect(RBACService.canAccess(UserRole.COMPANY, 'user', 'delete')).toBe(false)
      expect(RBACService.canAccess(UserRole.COMPANY, 'product', 'moderate')).toBe(false)
    })

    test('ADMIN role has all permissions', () => {
      expect(RBACService.canAccess(UserRole.ADMIN, 'admin', 'dashboard')).toBe(true)
      expect(RBACService.canAccess(UserRole.ADMIN, 'user', 'delete')).toBe(true)
      expect(RBACService.canAccess(UserRole.ADMIN, 'company', 'verify')).toBe(true)
      expect(RBACService.canAccess(UserRole.ADMIN, 'product', 'moderate')).toBe(true)
      expect(RBACService.canAccess(UserRole.ADMIN, 'review', 'moderate')).toBe(true)
      expect(RBACService.canAccess(UserRole.ADMIN, 'project', 'moderate')).toBe(true)
    })
  })

  describe('Role-based Route Access', () => {
    test('Admin routes require ADMIN role', () => {
      expect(RBACService.canAccessRoute(UserRole.ADMIN, '/admin')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.ADMIN, '/admin/dashboard')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.ADMIN, '/admin/users')).toBe(true)
      
      expect(RBACService.canAccessRoute(UserRole.COMPANY, '/admin')).toBe(false)
      expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/admin')).toBe(false)
    })

    test('Company dashboard routes allow COMPANY and ADMIN roles', () => {
      expect(RBACService.canAccessRoute(UserRole.COMPANY, '/dashboard')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.ADMIN, '/dashboard')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/dashboard')).toBe(false)
    })

    test('Public routes are accessible to all roles', () => {
      expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.COMPANY, '/marketplace')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.ADMIN, '/about')).toBe(true)
    })
  })

  describe('Email Verification Requirements', () => {
    test('Protected routes require email verification', () => {
      expect(requiresEmailVerification('/dashboard')).toBe(true)
      expect(requiresEmailVerification('/admin')).toBe(true)
      expect(requiresEmailVerification('/marketplace/create')).toBe(true)
      expect(requiresEmailVerification('/messages')).toBe(true)
      
      expect(requiresEmailVerification('/')).toBe(false)
      expect(requiresEmailVerification('/marketplace')).toBe(false)
      expect(requiresEmailVerification('/about')).toBe(false)
    })

    test('Route protection detection works correctly', () => {
      expect(isProtectedRoute('/dashboard')).toBe(true)
      expect(isProtectedRoute('/admin')).toBe(true)
      expect(isProtectedRoute('/messages')).toBe(true)
      
      expect(isProtectedRoute('/')).toBe(false)
      expect(isProtectedRoute('/marketplace')).toBe(false)
    })
  })

  describe('Role Helper Methods', () => {
    test('isAdmin correctly identifies admin users', () => {
      expect(RBACService.isAdmin(UserRole.ADMIN)).toBe(true)
      expect(RBACService.isAdmin(UserRole.COMPANY)).toBe(false)
      expect(RBACService.isAdmin(UserRole.CUSTOMER)).toBe(false)
    })

    test('isCompany correctly identifies company users', () => {
      expect(RBACService.isCompany(UserRole.COMPANY)).toBe(true)
      expect(RBACService.isCompany(UserRole.ADMIN)).toBe(true)
      expect(RBACService.isCompany(UserRole.CUSTOMER)).toBe(false)
    })

    test('isCustomer correctly identifies customer users', () => {
      expect(RBACService.isCustomer(UserRole.CUSTOMER)).toBe(true)
      expect(RBACService.isCustomer(UserRole.ADMIN)).toBe(true)
      expect(RBACService.isCustomer(UserRole.COMPANY)).toBe(false)
    })

    test('canAccessDashboard works correctly', () => {
      expect(RBACService.canAccessDashboard(UserRole.COMPANY)).toBe(true)
      expect(RBACService.canAccessDashboard(UserRole.ADMIN)).toBe(true)
      expect(RBACService.canAccessDashboard(UserRole.CUSTOMER)).toBe(false)
    })

    test('canAccessAdmin works correctly', () => {
      expect(RBACService.canAccessAdmin(UserRole.ADMIN)).toBe(true)
      expect(RBACService.canAccessAdmin(UserRole.COMPANY)).toBe(false)
      expect(RBACService.canAccessAdmin(UserRole.CUSTOMER)).toBe(false)
    })
  })

  describe('Permission Object Validation', () => {
    test('hasPermission works with permission objects', () => {
      expect(RBACService.hasPermission(UserRole.CUSTOMER, PERMISSIONS.USER_READ)).toBe(true)
      expect(RBACService.hasPermission(UserRole.CUSTOMER, PERMISSIONS.ADMIN_DASHBOARD)).toBe(false)
      
      expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.PRODUCT_CREATE)).toBe(true)
      expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.USER_DELETE)).toBe(false)
      
      expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.ADMIN_SYSTEM)).toBe(true)
      expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.USER_DELETE)).toBe(true)
    })

    test('getRolePermissions returns correct permissions', () => {
      const customerPermissions = RBACService.getRolePermissions(UserRole.CUSTOMER)
      const companyPermissions = RBACService.getRolePermissions(UserRole.COMPANY)
      const adminPermissions = RBACService.getRolePermissions(UserRole.ADMIN)

      expect(customerPermissions.length).toBeGreaterThan(0)
      expect(companyPermissions.length).toBeGreaterThan(customerPermissions.length)
      expect(adminPermissions.length).toBeGreaterThan(companyPermissions.length)

      // Check specific permissions exist
      expect(customerPermissions.some(p => p.resource === 'user' && p.action === 'read')).toBe(true)
      expect(companyPermissions.some(p => p.resource === 'product' && p.action === 'create')).toBe(true)
      expect(adminPermissions.some(p => p.resource === 'admin' && p.action === 'dashboard')).toBe(true)
    })
  })

  describe('Route Pattern Matching', () => {
    test('getRequiredRole returns correct roles for route patterns', () => {
      expect(RBACService.getRequiredRole('/admin')).toBe(UserRole.ADMIN)
      expect(RBACService.getRequiredRole('/admin/users')).toBe(UserRole.ADMIN)
      expect(RBACService.getRequiredRole('/dashboard')).toBe(UserRole.COMPANY)
      expect(RBACService.getRequiredRole('/dashboard/products')).toBe(UserRole.COMPANY)
      expect(RBACService.getRequiredRole('/')).toBe(null)
      expect(RBACService.getRequiredRole('/marketplace')).toBe(null)
    })

    test('nested route access works correctly', () => {
      // Admin nested routes
      expect(RBACService.canAccessRoute(UserRole.ADMIN, '/admin/users/123')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.COMPANY, '/admin/users/123')).toBe(false)
      
      // Company nested routes
      expect(RBACService.canAccessRoute(UserRole.COMPANY, '/dashboard/products/create')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.ADMIN, '/dashboard/products/create')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/dashboard/products/create')).toBe(false)
    })
  })

  describe('Edge Cases and Security', () => {
    test('handles undefined/null roles gracefully', () => {
      expect(RBACService.getRolePermissions(undefined as any)).toEqual([])
      expect(RBACService.canAccess(undefined as any, 'user', 'read')).toBe(false)
    })

    test('case sensitivity in resource and action names', () => {
      expect(RBACService.canAccess(UserRole.CUSTOMER, 'USER', 'READ')).toBe(false)
      expect(RBACService.canAccess(UserRole.CUSTOMER, 'user', 'READ')).toBe(false)
      expect(RBACService.canAccess(UserRole.CUSTOMER, 'user', 'read')).toBe(true)
    })

    test('route matching is case sensitive', () => {
      // /ADMIN is not recognized as admin route, so it's treated as public
      expect(RBACService.canAccessRoute(UserRole.ADMIN, '/ADMIN')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/ADMIN')).toBe(true)
      
      // Only exact /admin path is recognized as admin route
      expect(RBACService.canAccessRoute(UserRole.ADMIN, '/admin')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/admin')).toBe(false)
      
      // Test getRequiredRole directly for clarity
      expect(RBACService.getRequiredRole('/ADMIN')).toBe(null)
      expect(RBACService.getRequiredRole('/admin')).toBe(UserRole.ADMIN)
    })
  })

  describe('Conditional Permissions', () => {
    test('owner condition works correctly', () => {
      const context: PermissionContext = {
        userId: 'user-123',
        resourceOwnerId: 'user-123'
      }

      // Test with a permission that exists in the role
      const ownerPermission = { resource: 'project', action: 'update' }
      
      // Should work for company role (has project update permission)
      expect(RBACService.hasPermissionWithContext(UserRole.COMPANY, ownerPermission, context)).toBe(true)
      
      // Should fail for customer role (doesn't have project update permission)
      expect(RBACService.hasPermissionWithContext(UserRole.CUSTOMER, ownerPermission, context)).toBe(false)
    })

    test('canAccessWithContext works correctly', () => {
      const context: PermissionContext = {
        userId: 'user-123',
        companyId: 'company-456'
      }

      expect(RBACService.canAccessWithContext(UserRole.COMPANY, 'product', 'create', context)).toBe(true)
      expect(RBACService.canAccessWithContext(UserRole.CUSTOMER, 'product', 'create', context)).toBe(false)
    })
  })

  describe('AuthMiddleware Integration', () => {
    beforeEach(() => {
      mockGetToken.mockClear()
    })

    test('getAuthContext returns correct context for authenticated user', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'test@example.com',
        role: UserRole.COMPANY,
        emailVerified: new Date()
      })

      const req = new NextRequest('http://localhost:3000/dashboard')
      const context = await AuthMiddleware.getAuthContext(req)

      expect(context.isAuthenticated).toBe(true)
      expect(context.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.COMPANY,
        emailVerified: expect.any(Date)
      })
    })

    test('getAuthContext returns unauthenticated for invalid token', async () => {
      mockGetToken.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/dashboard')
      const context = await AuthMiddleware.getAuthContext(req)

      expect(context.isAuthenticated).toBe(false)
      expect(context.user).toBeUndefined()
    })

    test('checkRouteAccess allows admin to access admin routes', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'admin-123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        emailVerified: new Date()
      })

      const req = new NextRequest('http://localhost:3000/admin/users')
      const result = await AuthMiddleware.checkRouteAccess(req, UserRole.ADMIN)

      expect(result.allowed).toBe(true)
    })

    test('checkRouteAccess blocks non-admin from admin routes', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'user@example.com',
        role: UserRole.COMPANY,
        emailVerified: new Date()
      })

      const req = new NextRequest('http://localhost:3000/admin/users')
      const result = await AuthMiddleware.checkRouteAccess(req, UserRole.ADMIN)

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('insufficient_role')
    })

    test('checkRouteAccess blocks unverified email from protected routes', async () => {
      mockGetToken.mockResolvedValue({
        sub: 'user-123',
        email: 'user@example.com',
        role: UserRole.COMPANY,
        emailVerified: null
      })

      const req = new NextRequest('http://localhost:3000/dashboard')
      const result = await AuthMiddleware.checkRouteAccess(req)

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('email_not_verified')
    })
  })
})