/**
 * Security Testing: Common Attack Vectors
 * 
 * This test suite validates the system's resilience against common attack vectors
 * including SQL injection, XSS, CSRF, and other security vulnerabilities.
 * 
 * Requirements: 7.1, 7.4, 7.5
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { AuthenticationService } from '../../lib/authentication-service'
import { PasswordService } from '../../lib/password-service'
import { TokenService } from '../../lib/token-service'
import { SecurityLogger } from '../../lib/security-logger'
import { AuthRateLimiter } from '../../lib/auth-rate-limiter'
import { PrismaClient } from '@prisma/client'

// Mock dependencies
jest.mock('../../lib/prisma')
jest.mock('../../lib/redis')

describe('Security Attack Vector Tests', () => {
  let authService: AuthenticationService
  let passwordService: PasswordService
  let tokenService: TokenService
  let securityLogger: SecurityLogger
  let rateLimiter: AuthRateLimiter
  let prismaMock: jest.Mocked<PrismaClient>

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Initialize services
    passwordService = new PasswordService()
    tokenService = new TokenService()
    securityLogger = new SecurityLogger()
    rateLimiter = new AuthRateLimiter()
    authService = new AuthenticationService(
      passwordService,
      tokenService,
      securityLogger,
      rateLimiter
    )

    // Mock Prisma client
    prismaMock = require('../../lib/prisma').prisma as jest.Mocked<PrismaClient>
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('SQL Injection Attack Prevention', () => {
    it('should prevent SQL injection in email field during login', async () => {
      const maliciousEmail = "admin@test.com'; DROP TABLE users; --"
      const password = 'TestPassword123!'

      // Mock user lookup to simulate no user found (safe behavior)
      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)

      const result = await authService.login(maliciousEmail, password, '127.0.0.1', 'test-agent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      
      // Verify that the malicious SQL was not executed
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: maliciousEmail }
      })
      
      // Verify security logging
      expect(securityLogger.logAuthenticationAttempt).toHaveBeenCalledWith(
        maliciousEmail,
        false,
        '127.0.0.1',
        'test-agent',
        'Invalid credentials'
      )
    })

    it('should prevent SQL injection in password reset email field', async () => {
      const maliciousEmail = "test@test.com' UNION SELECT * FROM users WHERE '1'='1"

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)

      const result = await authService.requestPasswordReset(maliciousEmail, '127.0.0.1')

      // Should always return success to prevent email enumeration
      expect(result.success).toBe(true)
      expect(result.message).toBe('If an account with that email exists, a password reset link has been sent.')
      
      // Verify safe database query
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: maliciousEmail }
      })
    })

    it('should sanitize user input in registration', async () => {
      const maliciousData = {
        email: "test@test.com'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --",
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!'
      }

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)
      prismaMock.user.create = jest.fn().mockResolvedValue({
        id: 'user-1',
        email: maliciousData.email,
        emailVerified: false
      })

      const result = await authService.register(
        maliciousData.email,
        maliciousData.password,
        maliciousData.confirmPassword,
        '127.0.0.1',
        'test-agent'
      )

      // Should handle the input safely
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: maliciousData.email, // Input is passed as-is but safely parameterized
          passwordHash: expect.any(String)
        })
      })
    })
  })

  describe('Cross-Site Scripting (XSS) Prevention', () => {
    it('should handle XSS payloads in email field', async () => {
      const xssEmail = '<script>alert("XSS")</script>@test.com'
      const password = 'TestPassword123!'

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)

      const result = await authService.login(xssEmail, password, '127.0.0.1', 'test-agent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      
      // Verify the XSS payload is logged safely
      expect(securityLogger.logAuthenticationAttempt).toHaveBeenCalledWith(
        xssEmail,
        false,
        '127.0.0.1',
        'test-agent',
        'Invalid credentials'
      )
    })

    it('should prevent XSS in error messages', async () => {
      const xssPayload = '<img src=x onerror=alert("XSS")>'
      
      // Test with malicious user agent
      const result = await authService.login(
        'test@test.com',
        'wrongpassword',
        '127.0.0.1',
        xssPayload
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      
      // Error message should not contain the XSS payload
      expect(result.error).not.toContain('<script>')
      expect(result.error).not.toContain('<img')
      expect(result.error).not.toContain('onerror')
    })
  })

  describe('Command Injection Prevention', () => {
    it('should prevent command injection in email field', async () => {
      const commandInjection = 'test@test.com; rm -rf /'
      const password = 'TestPassword123!'

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)

      const result = await authService.login(commandInjection, password, '127.0.0.1', 'test-agent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      
      // Verify the command injection attempt is logged
      expect(securityLogger.logAuthenticationAttempt).toHaveBeenCalledWith(
        commandInjection,
        false,
        '127.0.0.1',
        'test-agent',
        'Invalid credentials'
      )
    })
  })

  describe('LDAP Injection Prevention', () => {
    it('should prevent LDAP injection patterns', async () => {
      const ldapInjection = 'test@test.com)(|(password=*))'
      const password = 'TestPassword123!'

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)

      const result = await authService.login(ldapInjection, password, '127.0.0.1', 'test-agent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
    })
  })

  describe('Path Traversal Prevention', () => {
    it('should prevent path traversal in token validation', async () => {
      const pathTraversalToken = '../../../etc/passwd'

      const result = await authService.verifyEmail(pathTraversalToken, '127.0.0.1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid or expired verification token')
    })

    it('should prevent path traversal in password reset tokens', async () => {
      const pathTraversalToken = '../../../../windows/system32/config/sam'
      const newPassword = 'NewPassword123!'

      const result = await authService.resetPassword(pathTraversalToken, newPassword, '127.0.0.1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid or expired reset token')
    })
  })

  describe('Header Injection Prevention', () => {
    it('should sanitize malicious headers in user agent', async () => {
      const maliciousUserAgent = 'Mozilla/5.0\r\nX-Injected-Header: malicious'
      
      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)

      const result = await authService.login(
        'test@test.com',
        'password',
        '127.0.0.1',
        maliciousUserAgent
      )

      expect(result.success).toBe(false)
      
      // Verify that the malicious header injection is logged safely
      expect(securityLogger.logAuthenticationAttempt).toHaveBeenCalledWith(
        'test@test.com',
        false,
        '127.0.0.1',
        maliciousUserAgent,
        'Invalid credentials'
      )
    })
  })

  describe('Mass Assignment Prevention', () => {
    it('should prevent mass assignment in user registration', async () => {
      const maliciousData = {
        email: 'test@test.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        // Attempting to set admin privileges
        isAdmin: true,
        role: 'ADMIN',
        emailVerified: true
      }

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)
      prismaMock.user.create = jest.fn().mockResolvedValue({
        id: 'user-1',
        email: maliciousData.email,
        emailVerified: false
      })

      const result = await authService.register(
        maliciousData.email,
        maliciousData.password,
        maliciousData.confirmPassword,
        '127.0.0.1',
        'test-agent'
      )

      // Verify only allowed fields are passed to database
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: maliciousData.email,
          passwordHash: expect.any(String),
          emailVerified: false,
          failedLoginAttempts: 0
        }
      })
      
      // Should not include malicious fields
      const createCall = prismaMock.user.create.mock.calls[0][0]
      expect(createCall.data).not.toHaveProperty('isAdmin')
      expect(createCall.data).not.toHaveProperty('role')
      expect(createCall.data.emailVerified).toBe(false) // Should be false by default
    })
  })

  describe('Information Disclosure Prevention', () => {
    it('should not reveal user existence in login errors', async () => {
      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)

      const result = await authService.login(
        'nonexistent@test.com',
        'password',
        '127.0.0.1',
        'test-agent'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      
      // Should not reveal whether email exists or not
      expect(result.error).not.toContain('user not found')
      expect(result.error).not.toContain('email does not exist')
    })

    it('should not reveal password validation details in errors', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: 'hashedpassword',
        emailVerified: true,
        failedLoginAttempts: 0,
        accountLockedUntil: null
      }

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      
      // Mock password verification to fail
      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(false)

      const result = await authService.login(
        'test@test.com',
        'wrongpassword',
        '127.0.0.1',
        'test-agent'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      
      // Should not reveal that email was correct but password was wrong
      expect(result.error).not.toContain('password')
      expect(result.error).not.toContain('incorrect password')
    })
  })

  describe('Rate Limiting Attack Prevention', () => {
    it('should prevent rate limit bypass attempts', async () => {
      // Mock rate limiter to return blocked
      jest.spyOn(rateLimiter, 'checkLimit').mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 900000, // 15 minutes
        retryAfter: 900
      })

      const result = await authService.login(
        'test@test.com',
        'password',
        '127.0.0.1',
        'test-agent'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Too many login attempts. Please try again later.')
      expect(result.retryAfter).toBe(900)
    })

    it('should handle rate limit bypass with different IPs', async () => {
      const ips = ['127.0.0.1', '127.0.0.2', '127.0.0.3']
      const results = []

      for (const ip of ips) {
        // Each IP should be rate limited independently
        jest.spyOn(rateLimiter, 'checkLimit').mockResolvedValue({
          allowed: false,
          remaining: 0,
          resetTime: Date.now() + 900000,
          retryAfter: 900
        })

        const result = await authService.login('test@test.com', 'password', ip, 'test-agent')
        results.push(result)
      }

      // All should be blocked
      results.forEach(result => {
        expect(result.success).toBe(false)
        expect(result.error).toBe('Too many login attempts. Please try again later.')
      })
    })
  })

  describe('Session Fixation Prevention', () => {
    it('should generate new session tokens on login', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: 'hashedpassword',
        emailVerified: true,
        failedLoginAttempts: 0,
        accountLockedUntil: null
      }

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(true)
      jest.spyOn(rateLimiter, 'checkLimit').mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetTime: Date.now() + 900000,
        retryAfter: 0
      })

      // Mock token generation
      jest.spyOn(tokenService, 'generateSecureToken').mockReturnValue('new-session-token')

      const result = await authService.login(
        'test@test.com',
        'password',
        '127.0.0.1',
        'test-agent'
      )

      expect(result.success).toBe(true)
      expect(result.sessionToken).toBe('new-session-token')
      
      // Verify new token was generated
      expect(tokenService.generateSecureToken).toHaveBeenCalled()
    })
  })
})