import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { UserRole } from '@prisma/client'
import { AuthMiddleware } from '@/lib/middleware/auth-middleware'
import { RBACService } from '@/lib/rbac'

// Mock next-auth/jwt
jest.mock('next-auth/jwt')
const mockGetToken = getToken as jest.MockedFunction<typeof getToken>

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log
beforeAll(() => {
  console.log = jest.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
})

describe('Route Protection Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (pathname: string, baseUrl = 'http://localhost:3000') => {
    return new NextRequest(new URL(pathname, baseUrl))
  }

  const createMockToken = (overrides: any = {}) => ({
    sub: 'user-123',
    email: 'test@example.com',
    role: UserRole.CUSTOMER,
    emailVerified: new Date(),
    name: 'Test User',
    ...overrides,
  })

  describe('Public Routes', () => {
    it('should allow access to public routes without authentication', async () => {
      mockGetToken.mockResolvedValue(null)
      
      const req = createMockRequest('/')
      const result = await AuthMiddleware.checkAuth(req)
      
      expect(result).toBeNull()
    })

    it('should allow access to login page without authentication', async () => {
      mockGetToken.mockResolvedValue(null)
      
      const req = createMockRequest('/login')
      const result = await AuthMiddleware.checkAuth(req)
      
      expect(result).toBeNull()
    })

    it('should allow access to marketplace without authentication', async () => {
      mockGetToken.mockResolvedValue(null)
      
      const req = createMockRequest('/marketplace')
      const result = await AuthMiddleware.checkAuth(req)
      
      expect(result).toBeNull()
    })
  })

  describe('Protected Routes - Authentication Required', () => {
    it('should redirect to login for dashboard access without token', async () => {
      mockGetToken.mockResolvedValue(null)
      
      const req = createMockRequest('/dashboard')
      const result = await AuthMiddleware.checkAuth(req)
      
      expect(result).not.toBeNull()
      expect(result?.headers.get('location')).toBe('http://localhost:3000/login')
    })

    it('should redirect to login for admin access without token', async () => {
      mockGetToken.mockResolvedValue(null)
      
      const req = createMockRequest('/admin')
      const result = await AuthMiddleware.checkAuth(req)
      
      expect(result).not.toBeNull()
      expect(result?.headers.get('location')).toBe('http://localhost:3000/login')
    })
  })

  describe('Email Verification Requirements', () => {
    it('should redirect to email verification for unverified user accessing dashboard', async () => {
      const token = createMockToken({ emailVerified: null })
      mockGetToken.mockResolvedValue(token)
      
      const req = createMockRequest('/dashboard')
      const result = await AuthMiddleware.checkAuth(req)
      
      expect(result).not.toBeNull()
      expect(result?.headers.get('location')).toContain('/verify-email')
      expect(result?.headers.get('location')).toContain('email=test%40example.com')
      expect(result?.headers.get('location')).toContain('redirect=%2Fdashboard')
    })

    it('should redirect to email verification for unverified user accessing admin', async () => {
      const token = createMockToken({ 
        emailVerified: null,
        role: UserRole.ADMIN 
      })
      mockGetToken.mockResolvedValue(token)
      
      const req = createMockRequest('/admin')
      const result = await AuthMiddleware.checkAuth(req)
      
      expect(result).not.toBeNull()
      expect(result?.headers.get('location')).toContain('/verify-email')
    })

    it('should allow access to dashboard for verified user', async () => {
      const token = createMockToken({ 
        role: UserRole.COMPANY,
        emailVerified: new Date()
      })
      mockGetToken.mockResolvedValue(token)
      
      const req = createMockRequest('/dashboard')
      const result = await AuthMiddleware.checkAuth(req)
      
      expect(result).toBeNull()
    })
  })

  describe('Role-Based Access Control', () => {
    describe('Admin Routes', () => {
      it('should allow admin access to admin routes', async () => {
        const token = createMockToken({ 
          role: UserRole.ADMIN,
          emailVerified: new Date()
        })
        mockGetToken.mockResolvedValue(token)
        
        const req = createMockRequest('/admin/dashboard')
        const result = await AuthMiddleware.checkAuth(req)
        
        expect(result).toBeNull()
      })

      it('should deny company access to admin routes', async () => {
        const token = createMockToken({ 
          role: UserRole.COMPANY,
          emailVerified: new Date()
        })
        mockGetToken.mockResolvedValue(token)
        
        const req = createMockRequest('/admin/users')
        const result = await AuthMiddleware.checkAuth(req)
        
        expect(result).not.toBeNull()
        expect(result?.headers.get('location')).toBe('http://localhost:3000/unauthorized')
      })

      it('should deny customer access to admin routes', async () => {
        const token = createMockToken({ 
          role: UserRole.CUSTOMER,
          emailVerified: new Date()
        })
        mockGetToken.mockResolvedValue(token)
        
        const req = createMockRequest('/admin')
        const result = await AuthMiddleware.checkAuth(req)
        
        expect(result).not.toBeNull()
        expect(result?.headers.get('location')).toBe('http://localhost:3000/unauthorized')
      })
    })

    describe('Company Dashboard Routes', () => {
      it('should allow company access to dashboard routes', async () => {
        const token = createMockToken({ 
          role: UserRole.COMPANY,
          emailVerified: new Date()
        })
        mockGetToken.mockResolvedValue(token)
        
        const req = createMockRequest('/dashboard/products')
        const result = await AuthMiddleware.checkAuth(req)
        
        expect(result).toBeNull()
      })

      it('should allow admin access to dashboard routes', async () => {
        const token = createMockToken({ 
          role: UserRole.ADMIN,
          emailVerified: new Date()
        })
        mockGetToken.mockResolvedValue(token)
        
        const req = createMockRequest('/dashboard/analytics')
        const result = await AuthMiddleware.checkAuth(req)
        
        expect(result).toBeNull()
      })

      it('should deny customer access to dashboard routes', async () => {
        const token = createMockToken({ 
          role: UserRole.CUSTOMER,
          emailVerified: new Date()
        })
        mockGetToken.mockResolvedValue(token)
        
        const req = createMockRequest('/dashboard')
        const result = await AuthMiddleware.checkAuth(req)
        
        expect(result).not.toBeNull()
        expect(result?.headers.get('location')).toBe('http://localhost:3000/unauthorized')
      })
    })
  })

  describe('Middleware Functions', () => {
    describe('adminOnly', () => {
      it('should allow admin users', async () => {
        const token = createMockToken({ 
          role: UserRole.ADMIN,
          emailVerified: new Date()
        })
        mockGetToken.mockResolvedValue(token)
        
        const req = createMockRequest('/admin/test')
        const result = await AuthMiddleware.adminOnly(req)
        
        expect(result).toBeNull()
      })

      it('should deny non-admin users', async () => {
        const token = createMockToken({ 
          role: UserRole.COMPANY,
          emailVerified: new Date()
        })
        mockGetToken.mockResolvedValue(token)
        
        const req = createMockRequest('/admin/test')
        const result = await AuthMiddleware.adminOnly(req)
        
        expect(result).not.toBeNull()
        expect(result?.headers.get('location')).toBe('http://localhost:3000/unauthorized')
      })
    })

    describe('companyOnly', () => {
      it('should allow company users', async () => {
        const token = createMockToken({ 
          role: UserRole.COMPANY,
          emailVerified: new Date()
        })
        mockGetToken.mockResolvedValue(token)
        
        const req = createMockRequest('/dashboard/test')
        const result = await AuthMiddleware.companyOnly(req)
        
        expect(result).toBeNull()
      })

      it('should allow admin users', async () => {
        const token = createMockToken({ 
          role: UserRole.ADMIN,
          emailVerified: new Date()
        })
        mockGetToken.mockResolvedValue(token)
        
        const req = createMockRequest('/dashboard/test')
        const result = await AuthMiddleware.companyOnly(req)
        
        expect(result).toBeNull()
      })

      it('should deny customer users', async () => {
        const token = createMockToken({ 
          role: UserRole.CUSTOMER,
          emailVerified: new Date()
        })
        mockGetToken.mockResolvedValue(token)
        
        const req = createMockRequest('/dashboard/test')
        const result = await AuthMiddleware.companyOnly(req)
        
        expect(result).not.toBeNull()
        expect(result?.headers.get('location')).toBe('http://localhost:3000/unauthorized')
      })
    })

    describe('emailVerified', () => {
      it('should allow users with verified email', async () => {
        const token = createMockToken({ 
          emailVerified: new Date()
        })
        mockGetToken.mockResolvedValue(token)
        
        const req = createMockRequest('/test')
        const result = await AuthMiddleware.emailVerified(req)
        
        expect(result).toBeNull()
      })

      it('should deny users with unverified email', async () => {
        const token = createMockToken({ 
          emailVerified: null
        })
        mockGetToken.mockResolvedValue(token)
        
        const req = createMockRequest('/test')
        const result = await AuthMiddleware.emailVerified(req)
        
        expect(result).not.toBeNull()
        expect(result?.headers.get('location')).toContain('/verify-email')
      })
    })
  })

  describe('getCurrentUser', () => {
    it('should return user data when token exists', async () => {
      const token = createMockToken()
      mockGetToken.mockResolvedValue(token)
      
      const req = createMockRequest('/test')
      const user = await AuthMiddleware.getCurrentUser(req)
      
      expect(user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.CUSTOMER,
        emailVerified: expect.any(Date),
        name: 'Test User',
      })
    })

    it('should return null when no token exists', async () => {
      mockGetToken.mockResolvedValue(null)
      
      const req = createMockRequest('/test')
      const user = await AuthMiddleware.getCurrentUser(req)
      
      expect(user).toBeNull()
    })
  })

  describe('hasPermission', () => {
    it('should return true for admin with any permission', async () => {
      const token = createMockToken({ role: UserRole.ADMIN })
      mockGetToken.mockResolvedValue(token)
      
      const req = createMockRequest('/test')
      const hasPermission = await AuthMiddleware.hasPermission(req, 'user', 'delete')
      
      expect(hasPermission).toBe(true)
    })

    it('should return false for customer with admin permission', async () => {
      const token = createMockToken({ role: UserRole.CUSTOMER })
      mockGetToken.mockResolvedValue(token)
      
      const req = createMockRequest('/test')
      const hasPermission = await AuthMiddleware.hasPermission(req, 'admin', 'dashboard')
      
      expect(hasPermission).toBe(false)
    })

    it('should return true for company with product create permission', async () => {
      const token = createMockToken({ role: UserRole.COMPANY })
      mockGetToken.mockResolvedValue(token)
      
      const req = createMockRequest('/test')
      const hasPermission = await AuthMiddleware.hasPermission(req, 'product', 'create')
      
      expect(hasPermission).toBe(true)
    })
  })

  describe('Complex Route Protection Scenarios', () => {
    it('should handle nested admin routes correctly', async () => {
      const token = createMockToken({ 
        role: UserRole.ADMIN,
        emailVerified: new Date()
      })
      mockGetToken.mockResolvedValue(token)
      
      const req = createMockRequest('/admin/security/events')
      const result = await AuthMiddleware.checkAuth(req)
      
      expect(result).toBeNull()
    })

    it('should handle nested dashboard routes correctly', async () => {
      const token = createMockToken({ 
        role: UserRole.COMPANY,
        emailVerified: new Date()
      })
      mockGetToken.mockResolvedValue(token)
      
      const req = createMockRequest('/dashboard/products/create')
      const result = await AuthMiddleware.checkAuth(req)
      
      expect(result).toBeNull()
    })

    it('should redirect unverified users from email-required routes', async () => {
      const token = createMockToken({ 
        role: UserRole.COMPANY,
        emailVerified: null
      })
      mockGetToken.mockResolvedValue(token)
      
      const req = createMockRequest('/messages/compose')
      const result = await AuthMiddleware.checkAuth(req)
      
      expect(result).not.toBeNull()
      expect(result?.headers.get('location')).toContain('/verify-email')
    })
  })

  describe('RBAC Service Integration', () => {
    it('should correctly identify admin routes', () => {
      expect(RBACService.canAccessRoute(UserRole.ADMIN, '/admin/users')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.COMPANY, '/admin/users')).toBe(false)
      expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/admin/users')).toBe(false)
    })

    it('should correctly identify dashboard routes', () => {
      expect(RBACService.canAccessRoute(UserRole.ADMIN, '/dashboard')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.COMPANY, '/dashboard')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/dashboard')).toBe(false)
    })

    it('should allow all roles to access public routes', () => {
      expect(RBACService.canAccessRoute(UserRole.ADMIN, '/')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.COMPANY, '/marketplace')).toBe(true)
      expect(RBACService.canAccessRoute(UserRole.CUSTOMER, '/about')).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle token parsing errors gracefully', async () => {
      mockGetToken.mockRejectedValue(new Error('Token parsing failed'))
      
      const req = createMockRequest('/test')
      const user = await AuthMiddleware.getCurrentUser(req)
      
      expect(user).toBeNull()
    })

    it('should handle malformed tokens gracefully', async () => {
      mockGetToken.mockResolvedValue({} as any)
      
      const req = createMockRequest('/dashboard')
      const result = await AuthMiddleware.checkAuth(req)
      
      // Should redirect to login due to missing required fields
      expect(result).not.toBeNull()
    })
  })
})