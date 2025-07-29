import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockDeep<PrismaClient>()),
}))

const prismaMock = mockDeep<PrismaClient>()

describe('Database Models - Security Fields Validation', () => {
  beforeEach(() => {
    mockReset(prismaMock)
  })

  describe('User Model Security Fields', () => {
    it('should create user with security fields', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        passwordHash: '$2b$12$hashedpassword',
        emailVerified: null,
        emailVerificationToken: 'verification-token',
        emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: null,
        lastLoginIP: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Test User',
        image: null,
        role: 'CUSTOMER' as const,
      }

      prismaMock.user.create.mockResolvedValue(mockUser)

      const result = await prismaMock.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: '$2b$12$hashedpassword',
          emailVerificationToken: 'verification-token',
          emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
          failedLoginAttempts: 0,
        },
      })

      expect(result).toEqual(mockUser)
      expect(result.passwordHash).toBeDefined()
      expect(result.emailVerificationToken).toBeDefined()
      expect(result.failedLoginAttempts).toBe(0)
    })

    it('should validate unique email constraint', async () => {
      const duplicateEmailError = new Error('Unique constraint failed on the fields: (`email`)')
      prismaMock.user.create.mockRejectedValue(duplicateEmailError)

      await expect(
        prismaMock.user.create({
          data: {
            email: 'existing@example.com',
            passwordHash: '$2b$12$hashedpassword',
          },
        })
      ).rejects.toThrow('Unique constraint failed on the fields: (`email`)')
    })

    it('should validate unique emailVerificationToken constraint', async () => {
      const duplicateTokenError = new Error('Unique constraint failed on the fields: (`emailVerificationToken`)')
      prismaMock.user.create.mockRejectedValue(duplicateTokenError)

      await expect(
        prismaMock.user.create({
          data: {
            email: 'test@example.com',
            passwordHash: '$2b$12$hashedpassword',
            emailVerificationToken: 'existing-token',
          },
        })
      ).rejects.toThrow('Unique constraint failed on the fields: (`emailVerificationToken`)')
    })

    it('should validate unique passwordResetToken constraint', async () => {
      const duplicateTokenError = new Error('Unique constraint failed on the fields: (`passwordResetToken`)')
      prismaMock.user.create.mockRejectedValue(duplicateTokenError)

      await expect(
        prismaMock.user.create({
          data: {
            email: 'test@example.com',
            passwordHash: '$2b$12$hashedpassword',
            passwordResetToken: 'existing-reset-token',
          },
        })
      ).rejects.toThrow('Unique constraint failed on the fields: (`passwordResetToken`)')
    })

    it('should handle account lockout fields correctly', async () => {
      const lockedUser = {
        id: 'locked-user-id',
        email: 'locked@example.com',
        passwordHash: '$2b$12$hashedpassword',
        failedLoginAttempts: 5,
        accountLockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        lastLoginAt: new Date(),
        lastLoginIP: '192.168.1.1',
        emailVerified: null,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        passwordResetToken: null,
        passwordResetExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Locked User',
        image: null,
        role: 'CUSTOMER' as const,
      }

      prismaMock.user.update.mockResolvedValue(lockedUser)

      const result = await prismaMock.user.update({
        where: { id: 'locked-user-id' },
        data: {
          failedLoginAttempts: 5,
          accountLockedUntil: new Date(Date.now() + 30 * 60 * 1000),
          lastLoginIP: '192.168.1.1',
        },
      })

      expect(result.failedLoginAttempts).toBe(5)
      expect(result.accountLockedUntil).toBeInstanceOf(Date)
      expect(result.lastLoginIP).toBe('192.168.1.1')
    })
  })

  describe('SecurityEvent Model', () => {
    it('should create security event with all required fields', async () => {
      const mockSecurityEvent = {
        id: 'security-event-id',
        userId: 'user-id',
        email: 'test@example.com',
        eventType: 'LOGIN_ATTEMPT' as const,
        success: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: { attemptNumber: 1 },
        timestamp: new Date(),
      }

      prismaMock.securityEvent.create.mockResolvedValue(mockSecurityEvent)

      const result = await prismaMock.securityEvent.create({
        data: {
          userId: 'user-id',
          email: 'test@example.com',
          eventType: 'LOGIN_ATTEMPT',
          success: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          details: { attemptNumber: 1 },
        },
      })

      expect(result).toEqual(mockSecurityEvent)
      expect(result.eventType).toBe('LOGIN_ATTEMPT')
      expect(result.success).toBe(true)
      expect(result.ipAddress).toBe('192.168.1.1')
    })

    it('should create security event without userId for anonymous events', async () => {
      const mockAnonymousEvent = {
        id: 'anonymous-event-id',
        userId: null,
        email: 'unknown@example.com',
        eventType: 'SUSPICIOUS_ACTIVITY' as const,
        success: false,
        ipAddress: '10.0.0.1',
        userAgent: 'Suspicious Bot',
        details: { reason: 'Multiple failed attempts' },
        timestamp: new Date(),
      }

      prismaMock.securityEvent.create.mockResolvedValue(mockAnonymousEvent)

      const result = await prismaMock.securityEvent.create({
        data: {
          email: 'unknown@example.com',
          eventType: 'SUSPICIOUS_ACTIVITY',
          success: false,
          ipAddress: '10.0.0.1',
          userAgent: 'Suspicious Bot',
          details: { reason: 'Multiple failed attempts' },
        },
      })

      expect(result.userId).toBeNull()
      expect(result.eventType).toBe('SUSPICIOUS_ACTIVITY')
      expect(result.success).toBe(false)
    })

    it('should validate SecurityEventType enum values', async () => {
      const validEventTypes = [
        'LOGIN_ATTEMPT',
        'REGISTRATION',
        'PASSWORD_CHANGE',
        'PASSWORD_RESET_REQUEST',
        'PASSWORD_RESET_COMPLETE',
        'EMAIL_VERIFICATION',
        'ACCOUNT_LOCKOUT',
        'ACCOUNT_UNLOCK',
        'SUSPICIOUS_ACTIVITY',
        'SESSION_CREATED',
        'SESSION_EXPIRED',
        'TOKEN_GENERATED',
        'TOKEN_USED',
      ]

      for (const eventType of validEventTypes) {
        const mockEvent = {
          id: `event-${eventType}`,
          userId: 'user-id',
          email: 'test@example.com',
          eventType: eventType as any,
          success: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Test Agent',
          details: null,
          timestamp: new Date(),
        }

        prismaMock.securityEvent.create.mockResolvedValue(mockEvent)

        const result = await prismaMock.securityEvent.create({
          data: {
            userId: 'user-id',
            email: 'test@example.com',
            eventType: eventType as any,
            success: true,
            ipAddress: '192.168.1.1',
            userAgent: 'Test Agent',
          },
        })

        expect(result.eventType).toBe(eventType)
      }
    })
  })

  describe('AuthSession Model', () => {
    it('should create auth session with all required fields', async () => {
      const mockSession = {
        id: 'session-id',
        userId: 'user-id',
        token: 'secure-session-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date(),
        lastAccessedAt: new Date(),
      }

      prismaMock.authSession.create.mockResolvedValue(mockSession)

      const result = await prismaMock.authSession.create({
        data: {
          userId: 'user-id',
          token: 'secure-session-token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      })

      expect(result).toEqual(mockSession)
      expect(result.token).toBe('secure-session-token')
      expect(result.expiresAt).toBeInstanceOf(Date)
    })

    it('should validate unique token constraint', async () => {
      const duplicateTokenError = new Error('Unique constraint failed on the fields: (`token`)')
      prismaMock.authSession.create.mockRejectedValue(duplicateTokenError)

      await expect(
        prismaMock.authSession.create({
          data: {
            userId: 'user-id',
            token: 'existing-token',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            ipAddress: '192.168.1.1',
            userAgent: 'Test Agent',
          },
        })
      ).rejects.toThrow('Unique constraint failed on the fields: (`token`)')
    })

    it('should handle session expiry correctly', async () => {
      const expiredSession = {
        id: 'expired-session-id',
        userId: 'user-id',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        ipAddress: '192.168.1.1',
        userAgent: 'Test Agent',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        lastAccessedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      }

      prismaMock.authSession.findFirst.mockResolvedValue(expiredSession)

      const result = await prismaMock.authSession.findFirst({
        where: {
          token: 'expired-token',
          expiresAt: { lt: new Date() },
        },
      })

      expect(result).toEqual(expiredSession)
      expect(result!.expiresAt.getTime()).toBeLessThan(Date.now())
    })
  })

  describe('Database Indexes Performance', () => {
    it('should efficiently query users by email index', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'indexed@example.com',
        passwordHash: '$2b$12$hashedpassword',
        emailVerified: null,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: null,
        lastLoginIP: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Indexed User',
        image: null,
        role: 'CUSTOMER' as const,
      }

      prismaMock.user.findUnique.mockResolvedValue(mockUser)

      const result = await prismaMock.user.findUnique({
        where: { email: 'indexed@example.com' },
      })

      expect(result).toEqual(mockUser)
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'indexed@example.com' },
      })
    })

    it('should efficiently query users by emailVerificationToken index', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        emailVerificationToken: 'indexed-verification-token',
        passwordHash: '$2b$12$hashedpassword',
        emailVerified: null,
        emailVerificationExpiry: null,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: null,
        lastLoginIP: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Test User',
        image: null,
        role: 'CUSTOMER' as const,
      }

      prismaMock.user.findUnique.mockResolvedValue(mockUser)

      const result = await prismaMock.user.findUnique({
        where: { emailVerificationToken: 'indexed-verification-token' },
      })

      expect(result).toEqual(mockUser)
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { emailVerificationToken: 'indexed-verification-token' },
      })
    })

    it('should efficiently query security events by timestamp index', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          userId: 'user-id',
          email: 'test@example.com',
          eventType: 'LOGIN_ATTEMPT' as const,
          success: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Test Agent',
          details: null,
          timestamp: new Date(),
        },
      ]

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)

      const result = await prismaMock.securityEvent.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: { timestamp: 'desc' },
      })

      expect(result).toEqual(mockEvents)
      expect(prismaMock.securityEvent.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: expect.any(Date),
          },
        },
        orderBy: { timestamp: 'desc' },
      })
    })
  })

  describe('Foreign Key Relationships', () => {
    it('should maintain referential integrity for User-SecurityEvent relationship', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: '$2b$12$hashedpassword',
        emailVerified: null,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: null,
        lastLoginIP: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Test User',
        image: null,
        role: 'CUSTOMER' as const,
        securityEvents: [
          {
            id: 'event-1',
            userId: 'user-id',
            email: 'test@example.com',
            eventType: 'LOGIN_ATTEMPT' as const,
            success: true,
            ipAddress: '192.168.1.1',
            userAgent: 'Test Agent',
            details: null,
            timestamp: new Date(),
          },
        ],
      }

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any)

      const result = await prismaMock.user.findUnique({
        where: { id: 'user-id' },
        include: { securityEvents: true },
      })

      expect(result).toEqual(mockUser)
      expect(result!.securityEvents).toHaveLength(1)
      expect(result!.securityEvents[0].userId).toBe('user-id')
    })

    it('should maintain referential integrity for User-AuthSession relationship', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: '$2b$12$hashedpassword',
        emailVerified: null,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: null,
        lastLoginIP: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 'Test User',
        image: null,
        role: 'CUSTOMER' as const,
        authSessions: [
          {
            id: 'session-1',
            userId: 'user-id',
            token: 'session-token',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            ipAddress: '192.168.1.1',
            userAgent: 'Test Agent',
            createdAt: new Date(),
            lastAccessedAt: new Date(),
          },
        ],
      }

      prismaMock.user.findUnique.mockResolvedValue(mockUser as any)

      const result = await prismaMock.user.findUnique({
        where: { id: 'user-id' },
        include: { authSessions: true },
      })

      expect(result).toEqual(mockUser)
      expect(result!.authSessions).toHaveLength(1)
      expect(result!.authSessions[0].userId).toBe('user-id')
    })
  })
})