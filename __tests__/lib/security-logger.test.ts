import { SecurityLogger, securityLogger } from '../../lib/security-logger'
import { prisma } from '../../lib/prisma'
import { logger } from '../../lib/logger'
import { SecurityEventType } from '@prisma/client'

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: {
    securityEvent: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    }
  }
}))

jest.mock('../../lib/logger', () => ({
  logger: {
    logAuthEvent: jest.fn(),
    logSecurityEvent: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
  LogCategory: {
    SECURITY: 'SECURITY'
  }
}))

const prismaMock = prisma as jest.Mocked<typeof prisma>
const loggerMock = logger as jest.Mocked<typeof logger>

describe('SecurityLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SecurityLogger.getInstance()
      const instance2 = SecurityLogger.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should use the exported singleton instance', () => {
      const instance = SecurityLogger.getInstance()
      expect(securityLogger).toBe(instance)
    })
  })

  describe('logAuthenticationAttempt', () => {
    it('should log successful authentication attempt', async () => {
      const mockEvent = {
        id: 'event-1',
        userId: 'user-123',
        email: 'test@example.com',
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        success: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: { timestamp: expect.any(String) },
        timestamp: expect.any(Date)
      }

      prismaMock.securityEvent.create.mockResolvedValue(mockEvent)

      await securityLogger.logAuthenticationAttempt(
        'test@example.com',
        true,
        '192.168.1.1',
        'Mozilla/5.0',
        'user-123',
        { loginMethod: 'email' }
      )

      expect(prismaMock.securityEvent.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          eventType: SecurityEventType.LOGIN_ATTEMPT,
          success: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: {
            loginMethod: 'email',
            timestamp: expect.any(String)
          },
          timestamp: expect.any(Date)
        }
      })

      expect(loggerMock.logAuthEvent).toHaveBeenCalledWith(
        'Login attempt for test@example.com',
        'user-123',
        true,
        {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          loginMethod: 'email'
        }
      )
    })

    it('should log failed authentication attempt without userId', async () => {
      const mockEvent = {
        id: 'event-2',
        userId: null,
        email: 'test@example.com',
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        success: false,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: { timestamp: expect.any(String) },
        timestamp: expect.any(Date)
      }

      prismaMock.securityEvent.create.mockResolvedValue(mockEvent)

      await securityLogger.logAuthenticationAttempt(
        'test@example.com',
        false,
        '192.168.1.1',
        'Mozilla/5.0'
      )

      expect(prismaMock.securityEvent.create).toHaveBeenCalledWith({
        data: {
          userId: undefined,
          email: 'test@example.com',
          eventType: SecurityEventType.LOGIN_ATTEMPT,
          success: false,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: {
            timestamp: expect.any(String)
          },
          timestamp: expect.any(Date)
        }
      })
    })

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed')
      prismaMock.securityEvent.create.mockRejectedValue(error)

      // Should not throw
      await expect(securityLogger.logAuthenticationAttempt(
        'test@example.com',
        true,
        '192.168.1.1',
        'Mozilla/5.0'
      )).resolves.not.toThrow()

      expect(loggerMock.error).toHaveBeenCalledWith(
        'SECURITY',
        'Failed to log security event',
        error,
        expect.any(Object)
      )
    })
  })

  describe('logRegistration', () => {
    it('should log successful registration', async () => {
      const mockEvent = {
        id: 'event-3',
        userId: 'user-123',
        email: 'newuser@example.com',
        eventType: SecurityEventType.REGISTRATION,
        success: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: { timestamp: expect.any(String) },
        timestamp: expect.any(Date)
      }

      prismaMock.securityEvent.create.mockResolvedValue(mockEvent)

      await securityLogger.logRegistration(
        'newuser@example.com',
        true,
        '192.168.1.1',
        'Mozilla/5.0',
        'user-123',
        { registrationSource: 'web' }
      )

      expect(prismaMock.securityEvent.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          email: 'newuser@example.com',
          eventType: SecurityEventType.REGISTRATION,
          success: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: {
            registrationSource: 'web',
            timestamp: expect.any(String)
          },
          timestamp: expect.any(Date)
        }
      })
    })
  })

  describe('logPasswordChange', () => {
    it('should log successful password change', async () => {
      const mockEvent = {
        id: 'event-4',
        userId: 'user-123',
        email: null,
        eventType: SecurityEventType.PASSWORD_CHANGE,
        success: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: { timestamp: expect.any(String) },
        timestamp: expect.any(Date)
      }

      prismaMock.securityEvent.create.mockResolvedValue(mockEvent)

      await securityLogger.logPasswordChange(
        'user-123',
        '192.168.1.1',
        'Mozilla/5.0',
        true,
        { method: 'settings_page' }
      )

      expect(prismaMock.securityEvent.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          email: undefined,
          eventType: SecurityEventType.PASSWORD_CHANGE,
          success: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: {
            method: 'settings_page',
            timestamp: expect.any(String)
          },
          timestamp: expect.any(Date)
        }
      })

      expect(loggerMock.logSecurityEvent).toHaveBeenCalledWith(
        'Password change for user user-123',
        'LOW',
        {
          userId: 'user-123',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          method: 'settings_page'
        }
      )
    })

    it('should log failed password change with higher severity', async () => {
      await securityLogger.logPasswordChange(
        'user-123',
        '192.168.1.1',
        'Mozilla/5.0',
        false
      )

      expect(loggerMock.logSecurityEvent).toHaveBeenCalledWith(
        'Password change for user user-123',
        'MEDIUM',
        expect.any(Object)
      )
    })
  })

  describe('logAccountLockout', () => {
    it('should log account lockout with high severity', async () => {
      const mockEvent = {
        id: 'event-5',
        userId: 'user-123',
        email: 'test@example.com',
        eventType: SecurityEventType.ACCOUNT_LOCKOUT,
        success: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: {
          reason: 'Too many failed login attempts',
          duration: 1800,
          lockoutTime: expect.any(String),
          unlockTime: expect.any(String)
        },
        timestamp: expect.any(Date)
      }

      prismaMock.securityEvent.create.mockResolvedValue(mockEvent)

      await securityLogger.logAccountLockout(
        'test@example.com',
        'Too many failed login attempts',
        1800,
        '192.168.1.1',
        'Mozilla/5.0',
        'user-123'
      )

      expect(prismaMock.securityEvent.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          eventType: SecurityEventType.ACCOUNT_LOCKOUT,
          success: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: {
            reason: 'Too many failed login attempts',
            duration: 1800,
            lockoutTime: expect.any(String),
            unlockTime: expect.any(String)
          },
          timestamp: expect.any(Date)
        }
      })

      expect(loggerMock.logSecurityEvent).toHaveBeenCalledWith(
        'Account lockout for test@example.com: Too many failed login attempts',
        'HIGH',
        expect.any(Object)
      )
    })
  })

  describe('logSuspiciousActivity', () => {
    it('should log suspicious activity with appropriate severity', async () => {
      const mockEvent = {
        id: 'event-6',
        userId: 'user-123',
        email: 'test@example.com',
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        success: false,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: {
          description: 'Multiple rapid login attempts',
          severity: 'HIGH',
          detectedAt: expect.any(String)
        },
        timestamp: expect.any(Date)
      }

      prismaMock.securityEvent.create.mockResolvedValue(mockEvent)

      await securityLogger.logSuspiciousActivity(
        'Multiple rapid login attempts',
        'HIGH',
        '192.168.1.1',
        'Mozilla/5.0',
        'user-123',
        'test@example.com',
        { attemptCount: 15 }
      )

      expect(prismaMock.securityEvent.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
          success: false,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: {
            description: 'Multiple rapid login attempts',
            severity: 'HIGH',
            detectedAt: expect.any(String),
            attemptCount: 15
          },
          timestamp: expect.any(Date)
        }
      })

      expect(loggerMock.logSecurityEvent).toHaveBeenCalledWith(
        'Suspicious activity detected: Multiple rapid login attempts',
        'HIGH',
        expect.any(Object)
      )
    })
  })

  describe('logSessionCreated', () => {
    it('should log session creation', async () => {
      const mockEvent = {
        id: 'event-7',
        userId: 'user-123',
        email: null,
        eventType: SecurityEventType.SESSION_CREATED,
        success: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: {
          sessionId: 'session-456',
          createdAt: expect.any(String)
        },
        timestamp: expect.any(Date)
      }

      prismaMock.securityEvent.create.mockResolvedValue(mockEvent)

      await securityLogger.logSessionCreated(
        'user-123',
        'session-456',
        '192.168.1.1',
        'Mozilla/5.0'
      )

      expect(prismaMock.securityEvent.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          email: undefined,
          eventType: SecurityEventType.SESSION_CREATED,
          success: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: {
            sessionId: 'session-456',
            createdAt: expect.any(String)
          },
          timestamp: expect.any(Date)
        }
      })
    })
  })

  describe('logTokenGenerated', () => {
    it('should log token generation for email verification', async () => {
      const mockEvent = {
        id: 'event-8',
        userId: 'user-123',
        email: 'test@example.com',
        eventType: SecurityEventType.TOKEN_GENERATED,
        success: true,
        ipAddress: 'system',
        userAgent: 'system',
        details: {
          tokenType: 'email_verification',
          generatedAt: expect.any(String)
        },
        timestamp: expect.any(Date)
      }

      prismaMock.securityEvent.create.mockResolvedValue(mockEvent)

      await securityLogger.logTokenGenerated(
        'email_verification',
        'user-123',
        'test@example.com'
      )

      expect(prismaMock.securityEvent.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          eventType: SecurityEventType.TOKEN_GENERATED,
          success: true,
          ipAddress: 'system',
          userAgent: 'system',
          details: {
            tokenType: 'email_verification',
            generatedAt: expect.any(String)
          },
          timestamp: expect.any(Date)
        }
      })
    })
  })

  describe('getSecurityEvents', () => {
    it('should retrieve security events with filters', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          userId: 'user-123',
          email: 'test@example.com',
          eventType: SecurityEventType.LOGIN_ATTEMPT,
          success: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          timestamp: new Date(),
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User'
          }
        }
      ]

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)

      const result = await securityLogger.getSecurityEvents({
        userId: 'user-123',
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        success: true,
        limit: 50
      })

      expect(prismaMock.securityEvent.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          eventType: SecurityEventType.LOGIN_ATTEMPT,
          success: true
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
        skip: 0,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      })

      expect(result).toEqual(mockEvents)
    })

    it('should handle date range filters', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      prismaMock.securityEvent.findMany.mockResolvedValue([])

      await securityLogger.getSecurityEvents({
        startDate,
        endDate,
        ipAddress: '192.168.1.1'
      })

      expect(prismaMock.securityEvent.findMany).toHaveBeenCalledWith({
        where: {
          ipAddress: '192.168.1.1',
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
        skip: 0,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      })
    })

    it('should handle database errors gracefully', async () => {
      prismaMock.securityEvent.findMany.mockRejectedValue(new Error('Database error'))

      const result = await securityLogger.getSecurityEvents()

      expect(result).toEqual([])
    })
  })

  describe('generateSecurityReport', () => {
    it('should generate comprehensive security statistics', async () => {
      const mockEvents = [
        {
          eventType: SecurityEventType.LOGIN_ATTEMPT,
          success: true,
          ipAddress: '192.168.1.1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          details: {}
        },
        {
          eventType: SecurityEventType.LOGIN_ATTEMPT,
          success: false,
          ipAddress: '192.168.1.1',
          timestamp: new Date('2024-01-01T10:30:00Z'),
          details: {}
        },
        {
          eventType: SecurityEventType.REGISTRATION,
          success: true,
          ipAddress: '192.168.1.2',
          timestamp: new Date('2024-01-01T11:00:00Z'),
          details: {}
        }
      ]

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)

      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-02')

      const result = await securityLogger.generateSecurityReport(startDate, endDate)

      expect(result.totalEvents).toBe(3)
      expect(result.successfulEvents).toBe(2)
      expect(result.failedEvents).toBe(1)
      expect(result.eventsByType[SecurityEventType.LOGIN_ATTEMPT]).toBe(2)
      expect(result.eventsByType[SecurityEventType.REGISTRATION]).toBe(1)
      expect(result.topIpAddresses).toContainEqual({
        ipAddress: '192.168.1.1',
        count: 2
      })
      expect(result.eventsByHour).toHaveLength(2)
    })

    it('should detect suspicious activity patterns', async () => {
      // Create 15 failed login attempts from same IP to trigger brute force detection
      const mockEvents = Array.from({ length: 15 }, (_, i) => ({
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        success: false,
        ipAddress: '192.168.1.100',
        timestamp: new Date(`2024-01-01T10:${i.toString().padStart(2, '0')}:00Z`),
        details: {}
      }))

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)

      const result = await securityLogger.generateSecurityReport(
        new Date('2024-01-01'),
        new Date('2024-01-02')
      )

      expect(result.suspiciousActivity).toContainEqual({
        type: 'brute_force_attempt',
        count: 15,
        description: '15 failed login attempts from IP 192.168.1.100'
      })
    })

    it('should handle database errors gracefully', async () => {
      prismaMock.securityEvent.findMany.mockRejectedValue(new Error('Database error'))

      const result = await securityLogger.generateSecurityReport(
        new Date('2024-01-01'),
        new Date('2024-01-02')
      )

      expect(result.totalEvents).toBe(0)
      expect(result.successfulEvents).toBe(0)
      expect(result.failedEvents).toBe(0)
    })
  })

  describe('cleanupOldEvents', () => {
    it('should delete old security events', async () => {
      prismaMock.securityEvent.deleteMany.mockResolvedValue({ count: 150 })

      const result = await securityLogger.cleanupOldEvents(90)

      expect(prismaMock.securityEvent.deleteMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            lt: expect.any(Date)
          }
        }
      })

      expect(result).toBe(150)
      expect(loggerMock.info).toHaveBeenCalledWith(
        'SECURITY',
        'Cleaned up 150 old security events older than 90 days'
      )
    })

    it('should handle cleanup errors gracefully', async () => {
      const error = new Error('Cleanup failed')
      prismaMock.securityEvent.deleteMany.mockRejectedValue(error)

      const result = await securityLogger.cleanupOldEvents(90)

      expect(result).toBe(0)
      expect(loggerMock.error).toHaveBeenCalledWith(
        'SECURITY',
        'Failed to cleanup old security events',
        error
      )
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing optional parameters gracefully', async () => {
      prismaMock.securityEvent.create.mockResolvedValue({
        id: 'event-1',
        userId: null,
        email: 'test@example.com',
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        success: false,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: {},
        timestamp: new Date()
      })

      await securityLogger.logAuthenticationAttempt(
        'test@example.com',
        false,
        '192.168.1.1',
        'Mozilla/5.0'
      )

      expect(prismaMock.securityEvent.create).toHaveBeenCalledWith({
        data: {
          userId: undefined,
          email: 'test@example.com',
          eventType: SecurityEventType.LOGIN_ATTEMPT,
          success: false,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: {
            timestamp: expect.any(String)
          },
          timestamp: expect.any(Date)
        }
      })
    })

    it('should handle empty details object', async () => {
      prismaMock.securityEvent.create.mockResolvedValue({
        id: 'event-1',
        userId: 'user-123',
        email: null,
        eventType: SecurityEventType.SESSION_CREATED,
        success: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: {},
        timestamp: new Date()
      })

      await securityLogger.logSessionCreated(
        'user-123',
        'session-456',
        '192.168.1.1',
        'Mozilla/5.0'
      )

      expect(prismaMock.securityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          details: {
            sessionId: 'session-456',
            createdAt: expect.any(String)
          }
        })
      })
    })
  })
})