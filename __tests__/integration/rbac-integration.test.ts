import { UserRole } from '@prisma/client'
import { RBACService, PERMISSIONS, requiresEmailVerification, isProtectedRoute } from '@/lib/rbac'

describe('RBAC Integration Tests', () => {
  describe('Permission System', () => {
    describe('Customer Permissions', () => {
      it('should allow customers to read companies and products', () => {
        expect(RBACService.hasPermission(UserRole.CUSTOMER, PERMISSIONS.COMPANY_READ)).toBe(true)
        expect(RBACService.hasPermission(UserRole.CUSTOMER, PERMISSIONS.PRODUCT_READ)).toBe(true)
        expect(RBACService.hasPermission(UserRole.CUSTOMER, PERMISSIONS.PRODUCT_LIST)).toBe(true)
      })

      it('should allow customers to create reviews and leads', () => {
        expect(RBACService.hasPermission(UserRole.CUSTOMER, PERMISSIONS.REVIEW_CREATE)).toBe(true)
        expect(RBACService.hasPermission(UserRole.CUSTOMER, PERMISSIONS.LEAD_CREATE)).toBe(true)
      })

      it('should deny customers admin permissions', () => {
        expect(RBACService.hasPermission(UserRole.CUSTOMER, PERMISSIONS.ADMIN_DASHBOARD)).toBe(false)
        expect(RBACService.hasPermission(UserRole.CUSTOMER, PERMISSIONS.USER_DELETE)).toBe(false)
        expect(RBACService.hasPermission(UserRole.CUSTOMER, PERMISSIONS.COMPANY_VERIFY)).toBe(false)
      })

      it('should deny customers product management permissions', () => {
        expect(RBACService.hasPermission(UserRole.CUSTOMER, PERMISSIONS.PRODUCT_CREATE)).toBe(false)
        expect(RBACService.hasPermission(UserRole.CUSTOMER, PERMISSIONS.PRODUCT_UPDATE)).toBe(false)
        expect(RBACService.hasPermission(UserRole.CUSTOMER, PERMISSIONS.PRODUCT_DELETE)).toBe(false)
      })
    })

    describe('Company Permissions', () => {
      it('should allow companies to manage their products', () => {
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.PRODUCT_CREATE)).toBe(true)
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.PRODUCT_UPDATE)).toBe(true)
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.PRODUCT_DELETE)).toBe(true)
      })

      it('should allow companies to manage their projects', () => {
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.PROJECT_CREATE)).toBe(true)
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.PROJECT_UPDATE)).toBe(true)
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.PROJECT_DELETE)).toBe(true)
      })

      it('should allow companies to manage leads and quotes', () => {
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.LEAD_READ)).toBe(true)
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.LEAD_UPDATE)).toBe(true)
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.QUOTE_CREATE)).toBe(true)
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.QUOTE_UPDATE)).toBe(true)
      })

      it('should deny companies admin permissions', () => {
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.ADMIN_DASHBOARD)).toBe(false)
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.USER_DELETE)).toBe(false)
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.COMPANY_VERIFY)).toBe(false)
      })

      it('should deny companies moderation permissions', () => {
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.PRODUCT_MODERATE)).toBe(false)
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.REVIEW_MODERATE)).toBe(false)
        expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.PROJECT_MODERATE)).toBe(false)
      })
    })

    describe('Admin Permissions', () => {
      it('should allow admins all user management permissions', () => {
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.USER_READ)).toBe(true)
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.USER_UPDATE)).toBe(true)
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.USER_DELETE)).toBe(true)
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.USER_LIST)).toBe(true)
      })

      it('should allow admins all company management permissions', () => {
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.COMPANY_CREATE)).toBe(true)
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.COMPANY_UPDATE)).toBe(true)
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.COMPANY_DELETE)).toBe(true)
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.COMPANY_VERIFY)).toBe(true)
      })

      it('should allow admins all moderation permissions', () => {
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.PRODUCT_MODERATE)).toBe(true)
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.REVIEW_MODERATE)).toBe(true)
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.PROJECT_MODERATE)).toBe(true)
      })

      it('should allow admins all admin-specific permissions', () => {
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.ADMIN_DASHBOARD)).toBe(true)
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.ADMIN_USERS)).toBe(true)
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.ADMIN_COMPANIES)).toBe(true)
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.ADMIN_MODERATION)).toBe(true)
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.ADMIN_SECURITY)).toBe(true)
        expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.ADMIN_SYSTEM)).toBe(true)
      })
    })
  })

  describe('Role Checking Functions', () => {
    describe('isAdmin', () => {
      it('should return true only for admin role', () => {
        expect(RBACService.isAdmin(UserRole.ADMIN)).toBe(true)
        expect(RBACService.isAdmin(UserRole.COMPANY)).toBe(false)
        expect(RBACService.isAdmin(UserRole.CUSTOMER)).toBe(false)
      })
    })

    describe('isCompany', () => {
      it('should return true for company and admin roles', () => {
        expect(RBACService.isCompany(UserRole.ADMIN)).toBe(true)
        expect(RBACService.isCompany(UserRole.COMPANY)).toBe(true)
        expect(RBACService.isCompany(UserRole.CUSTOMER)).toBe(false)
      })
    })

    describe('isCustomer', () => {
      it('should return true for customer and admin roles', () => {
        expect(RBACService.isCustomer(UserRole.ADMIN)).toBe(true)
        expect(RBACService.isCustomer(UserRole.COMPANY)).toBe(false)
        expect(RBACService.isCustomer(UserRole.CUSTOMER)).toBe(true)
      })
    })

    describe('canAccessDashboard', () => {
      it('should return true for company and admin roles', () => {
        expect(RBACService.canAccessDashboard(UserRole.ADMIN)).toBe(true)
        expect(RBACService.canAccessDashboard(UserRole.COMPANY)).toBe(true)
        expect(RBACService.canAccessDashboard(UserRole.CUSTOMER)).toBe(false)
      })
    })

    describe('canAccessAdmin', () => {
      it('should return true only for admin role', () => {
        expect(RBACService.canAccessAdmin(UserRole.ADMIN)).toBe(true)
        expect(RBACService.canAccessAdmin(UserRole.COMPANY)).toBe(false)
        expect(RBACService.canAccessAdmin(UserRole.CUSTOMER)).toBe(false)
      })
    })
  })

  describe('Route Access Control', () => {
    describe('getRequiredRole', () => {
      it('should return ADMIN for admin routes', () => {
        expect(RBACService.getRequiredRole('/admin')).toBe(UserRole.ADMIN)
        expect(RBACService.getRequiredRole('/admin/users')).toBe(UserRole.ADMIN)
        expect(RBACService.getRequiredRole('/admin/dashboard')).toBe(UserRole.ADMIN)
        expect(RBACService.getRequiredRole('/admin/security/events')).toBe(UserRole.ADMIN)
      })

      it('should return COMPANY for dashboard routes', () => {
        expect(RBACService.getRequiredRole('/dashboard')).toBe(UserRole.COMPANY)
        expect(RBACService.getRequiredRole('/dashboard/products')).toBe(UserRole.COMPANY)
        expect(RBACService.getRequiredRole('/dashboard/analytics')).toBe(UserRole.COMPANY)
      })

      it('should return null for public routes', () => {
        expect(RBACService.getRequiredRole('/')).toBeNull()
        expect(RBACService.getRequiredRole('/marketplace')).toBeNull()
        expect(RBACService.getRequiredRole('/about')).toBeNull()
        expect(RBACService.getRequiredRole('/login')).toBeNull()
        expect(RBACService.getRequiredRole('/register')).toBeNull()
      })
    })

    describe('canAccessRoute', () => {
      it('should allow admin access to all routes', () => {
        expect(RBACService.canAccessRoute(UserRole.ADMIN, '/admin')).toBe(true)
        expect(RBACService.canAccessRoute(UserRole.ADMIN, '/dashboard')).toBe(true)
        expect(RBACService.canAccessRoute(UserRole.ADMIN, '/')).toBe(true)
        expect(RBACService.canAccessRoute(UserRole.ADMIN, '/marketplace')).toBe(true)
      })

      it('should allow company access to dashboard and public routes', () => {
        expect(RBACService.canAccessRoute(UserRole.COMPANY, '/dashboard')).toBe(true)
        expect(RBACService.canAccessRoute(UserRole.COMPANY, '/dashboard/products')).toBe(true)
        expect(RBACService.canAccessRoute(UserRole.COMPANY, '/')).toBe(true)
        expect(RBACService.canAccessRoute(UserRole.COMPANY, '/marketplace')).toBe(true)
        expect(RBACService.canAccessRoute(UserRole.COMPANY, '/admin')).toBe(false)
      })

      it('should allow customer access only to public routes', () => {
        expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/')).toBe(true)
        expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/marketplace')).toBe(true)
        expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/about')).toBe(true)
        expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/dashboard')).toBe(false)
        expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/admin')).toBe(false)
      })
    })
  })

  describe('Email Verification Requirements', () => {
    describe('requiresEmailVerification', () => {
      it('should return true for routes that require email verification', () => {
        expect(requiresEmailVerification('/dashboard')).toBe(true)
        expect(requiresEmailVerification('/dashboard/products')).toBe(true)
        expect(requiresEmailVerification('/admin')).toBe(true)
        expect(requiresEmailVerification('/admin/users')).toBe(true)
        expect(requiresEmailVerification('/messages')).toBe(true)
        expect(requiresEmailVerification('/appointments')).toBe(true)
        expect(requiresEmailVerification('/quotes')).toBe(true)
        expect(requiresEmailVerification('/marketplace/create')).toBe(true)
        expect(requiresEmailVerification('/company/create')).toBe(true)
      })

      it('should return false for public routes', () => {
        expect(requiresEmailVerification('/')).toBe(false)
        expect(requiresEmailVerification('/marketplace')).toBe(false)
        expect(requiresEmailVerification('/about')).toBe(false)
        expect(requiresEmailVerification('/login')).toBe(false)
        expect(requiresEmailVerification('/register')).toBe(false)
        expect(requiresEmailVerification('/verify-email')).toBe(false)
      })
    })

    describe('isProtectedRoute', () => {
      it('should return true for protected routes', () => {
        expect(isProtectedRoute('/dashboard')).toBe(true)
        expect(isProtectedRoute('/admin')).toBe(true)
        expect(isProtectedRoute('/messages')).toBe(true)
        expect(isProtectedRoute('/appointments')).toBe(true)
      })

      it('should return false for public routes', () => {
        expect(isProtectedRoute('/')).toBe(false)
        expect(isProtectedRoute('/marketplace')).toBe(false)
        expect(isProtectedRoute('/about')).toBe(false)
        expect(isProtectedRoute('/login')).toBe(false)
      })
    })
  })

  describe('Permission Inheritance and Hierarchy', () => {
    it('should respect role hierarchy for dashboard access', () => {
      // Admin should have all company permissions
      const companyPermissions = RBACService.getRolePermissions(UserRole.COMPANY)
      companyPermissions.forEach(permission => {
        expect(RBACService.hasPermission(UserRole.ADMIN, permission)).toBe(true)
      })
    })

    it('should maintain role separation for customer permissions', () => {
      // Company should not have customer-specific permissions that don't make sense
      expect(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.LEAD_CREATE)).toBe(false)
      
      // But admin should have all permissions
      expect(RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.LEAD_CREATE)).toBe(true)
    })
  })

  describe('Resource-Action Permission Checking', () => {
    it('should correctly check resource-action combinations', () => {
      // Customer can read but not create products
      expect(RBACService.canAccess(UserRole.CUSTOMER, 'product', 'read')).toBe(true)
      expect(RBACService.canAccess(UserRole.CUSTOMER, 'product', 'create')).toBe(false)
      
      // Company can create and read products
      expect(RBACService.canAccess(UserRole.COMPANY, 'product', 'read')).toBe(true)
      expect(RBACService.canAccess(UserRole.COMPANY, 'product', 'create')).toBe(true)
      
      // Admin can do everything
      expect(RBACService.canAccess(UserRole.ADMIN, 'product', 'moderate')).toBe(true)
      expect(RBACService.canAccess(UserRole.ADMIN, 'admin', 'dashboard')).toBe(true)
    })

    it('should handle non-existent permissions gracefully', () => {
      expect(RBACService.canAccess(UserRole.CUSTOMER, 'nonexistent', 'action')).toBe(false)
      expect(RBACService.canAccess(UserRole.COMPANY, 'resource', 'nonexistent')).toBe(false)
    })
  })

  describe('Complex Permission Scenarios', () => {
    it('should handle nested route permissions correctly', () => {
      // Deep admin routes
      expect(RBACService.canAccessRoute(UserRole.ADMIN, '/admin/security/events/details')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.COMPANY, '/admin/security/events/details')).toBe(false)
      
      // Deep dashboard routes
      expect(RBACService.canAccessRoute(UserRole.COMPANY, '/dashboard/products/create/new')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/dashboard/products/create/new')).toBe(false)
    })

    it('should handle edge cases in route matching', () => {
      // Routes that start with protected route names but are different
      expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/dashboard-public')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/admin-info')).toBe(true)
      
      // Exact matches should still be protected
      expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/dashboard')).toBe(false)
      expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/admin')).toBe(false)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle permission checks efficiently', () => {
      const start = performance.now()
      
      // Perform many permission checks
      for (let i = 0; i < 1000; i++) {
        RBACService.hasPermission(UserRole.ADMIN, PERMISSIONS.USER_READ)
        RBACService.canAccess(UserRole.COMPANY, 'product', 'create')
        RBACService.canAccessRoute(UserRole.CUSTOMER, '/marketplace')
      }
      
      const end = performance.now()
      const duration = end - start
      
      // Should complete in reasonable time (less than 100ms for 3000 checks)
      expect(duration).toBeLessThan(100)
    })

    it('should maintain consistent results across multiple calls', () => {
      const results = []
      
      // Call the same permission check multiple times
      for (let i = 0; i < 10; i++) {
        results.push(RBACService.hasPermission(UserRole.COMPANY, PERMISSIONS.PRODUCT_CREATE))
      }
      
      // All results should be the same
      expect(results.every(result => result === true)).toBe(true)
    })
  })
})