import { SecurityMonitoringService } from '../../lib/security-monitoring'
import { securityLogger } from '../../lib/security-logger'
import { emailService } from '../../lib/email-service'
import { prisma } from '../../lib/prisma'
import { SecurityEventType } from '@prisma/client'

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: {
    securityEvent: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn()
    }
  }
}))

jest.mock('../../lib/security-logger', () => ({
  securityLogger: {
    logSuspiciousActivity: jest.fn()
  }
}))

jest.mock('../../lib/email-service', () => ({
  emailService: {
    sendSecurityAlert: jest.fn()
  }
}))

jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logSecurityEvent: jest.fn()
  },
  LogCategory: {
    SECURITY: 'SECURITY'
  }
}))

const prismaMock = prisma as jest.Mocked<typeof prisma>;
const securityLoggerMock = securityLogger as jest.Mocked<typeof securityLogger>;
const emailServiceMock = emailService as jest.Mocked<typeof emailService>;

describe('SecurityMonitoringService', () => {
  let securityMonitoring: SecurityMonitoringService

  beforeEach(() => {
    jest.clearAllMocks()
    securityMonitoring = SecurityMonitoringService.getInstance()
    
    // Mock environment variables
    process.env.SECURITY_ADMIN_EMAILS = 'admin1@test.com,admin2@test.com'
  })

  afterEach(() => {
    delete process.env.SECURITY_ADMIN_EMAILS
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SecurityMonitoringService.getInstance()
      const instance2 = SecurityMonitoringService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('detectSuspiciousActivity', () => {
    it('should detect brute force attacks', async () => {
      const mockEvents = Array.from({ length: 15 }, (_, i) => ({
        id: `event-${i}`,
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        success: false,
        ipAddress: '192.168.1.100',
        email: `user${i % 3}@test.com`, // 3 different emails
        timestamp: new Date(Date.now() - i * 60000), // 1 minute apart
        userAgent: 'Mozilla/5.0',
        details: {}
      }))

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)
      securityLoggerMock.logSuspiciousActivity.mockResolvedValue(undefined)

      const patterns = await securityMonitoring.detectSuspiciousActivity(60)

      expect(patterns).toHaveLength(1)
      expect(patterns[0].type).toBe('brute_force')
      expect(patterns[0].severity).toBe('MEDIUM')
      expect(patterns[0].ipAddress).toBe('192.168.1.100')
      expect(patterns[0].count).toBe(15)
      expect(securityLoggerMock.logSuspiciousActivity).toHaveBeenCalledWith(
        expect.stringContaining('Brute force attack detected'),
        'MEDIUM',
        '192.168.1.100',
        'system',
        undefined,
        undefined,
        expect.objectContaining({
          patternType: 'brute_force',
          count: 15
        })
      )
    })

    it('should detect credential stuffing attacks', async () => {
      const mockEvents = Array.from({ length: 40 }, (_, i) => ({
        id: `event-${i}`,
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        success: false,
        ipAddress: '192.168.1.101',
        email: `user${i}@test.com`, // 40 different emails
        timestamp: new Date(Date.now() - i * 30000), // 30 seconds apart
        userAgent: 'Mozilla/5.0',
        details: {}
      }))

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)
      securityLoggerMock.logSuspiciousActivity.mockResolvedValue(undefined)

      const patterns = await securityMonitoring.detectSuspiciousActivity(60)

      expect(patterns).toHaveLength(1)
      expect(patterns[0].type).toBe('credential_stuffing')
      expect(patterns[0].severity).toBe('MEDIUM')
      expect(patterns[0].ipAddress).toBe('192.168.1.101')
      expect(patterns[0].details.uniqueEmailsTargeted).toBe(40)
    })

    it('should detect password spray attacks', async () => {
      const mockEvents = Array.from({ length: 20 }, (_, i) => ({
        id: `event-${i}`,
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        success: false,
        ipAddress: '192.168.1.102',
        email: `user${i}@test.com`, // 20 different emails
        timestamp: new Date(Date.now() - i * 120000), // 2 minutes apart (slow)
        userAgent: 'Mozilla/5.0',
        details: {}
      }))

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)
      securityLoggerMock.logSuspiciousActivity.mockResolvedValue(undefined)

      const patterns = await securityMonitoring.detectSuspiciousActivity(60)

      expect(patterns).toHaveLength(1)
      expect(patterns[0].type).toBe('password_spray')
      expect(patterns[0].severity).toBe('MEDIUM')
      expect(patterns[0].ipAddress).toBe('192.168.1.102')
      expect(patterns[0].details.uniqueEmailsTargeted).toBe(20)
    })

    it('should detect account enumeration via password resets', async () => {
      const mockEvents = Array.from({ length: 25 }, (_, i) => ({
        id: `event-${i}`,
        eventType: SecurityEventType.PASSWORD_RESET_REQUEST,
        success: true,
        ipAddress: '192.168.1.103',
        email: `user${i}@test.com`,
        timestamp: new Date(Date.now() - i * 60000),
        userAgent: 'Mozilla/5.0',
        details: {}
      }))

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)
      securityLoggerMock.logSuspiciousActivity.mockResolvedValue(undefined)

      const patterns = await securityMonitoring.detectSuspiciousActivity(60)

      expect(patterns).toHaveLength(1)
      expect(patterns[0].type).toBe('account_enumeration')
      expect(patterns[0].severity).toBe('MEDIUM')
      expect(patterns[0].ipAddress).toBe('192.168.1.103')
      expect(patterns[0].details.method).toBe('password_reset_enumeration')
    })

    it('should detect rapid registration attempts', async () => {
      const mockEvents = Array.from({ length: 15 }, (_, i) => ({
        id: `event-${i}`,
        eventType: SecurityEventType.REGISTRATION,
        success: true,
        ipAddress: '192.168.1.104',
        email: `user${i}@test.com`,
        timestamp: new Date(Date.now() - i * 20000), // 20 seconds apart (fast)
        userAgent: 'Mozilla/5.0',
        details: {}
      }))

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)
      securityLoggerMock.logSuspiciousActivity.mockResolvedValue(undefined)

      const patterns = await securityMonitoring.detectSuspiciousActivity(60)

      expect(patterns).toHaveLength(1)
      expect(patterns[0].type).toBe('rapid_registration')
      expect(patterns[0].severity).toBe('HIGH') // > 10 registrations per minute
      expect(patterns[0].ipAddress).toBe('192.168.1.104')
    })

    it('should detect token abuse', async () => {
      const mockEvents = Array.from({ length: 60 }, (_, i) => ({
        id: `event-${i}`,
        eventType: SecurityEventType.TOKEN_GENERATED,
        success: true,
        ipAddress: '192.168.1.105',
        email: `user${i % 10}@test.com`,
        timestamp: new Date(Date.now() - i * 30000),
        userAgent: 'Mozilla/5.0',
        details: {}
      }))

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)
      securityLoggerMock.logSuspiciousActivity.mockResolvedValue(undefined)

      const patterns = await securityMonitoring.detectSuspiciousActivity(60)

      expect(patterns).toHaveLength(1)
      expect(patterns[0].type).toBe('token_abuse')
      expect(patterns[0].severity).toBe('MEDIUM')
      expect(patterns[0].ipAddress).toBe('192.168.1.105')
      expect(patterns[0].details.abuseType).toBe('excessive_generation')
    })

    it('should handle database errors gracefully', async () => {
      prismaMock.securityEvent.findMany.mockRejectedValue(new Error('Database error'))

      const patterns = await securityMonitoring.detectSuspiciousActivity(60)

      expect(patterns).toEqual([])
    })
  })

  describe('checkAlertThresholds', () => {
    it('should trigger alert when count threshold is exceeded', async () => {
      const mockEvents = Array.from({ length: 15 }, (_, i) => ({
        id: `event-${i}`,
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        success: false,
        ipAddress: '192.168.1.100',
        timestamp: new Date(Date.now() - i * 60000),
        userAgent: 'Mozilla/5.0'
      }))

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)
      emailServiceMock.sendSecurityAlert.mockResolvedValue({ success: true })

      const alerts = await securityMonitoring.checkAlertThresholds()

      expect(alerts.length).toBeGreaterThan(0)
      const bruteForceAlert = alerts.find(a => a.type === 'brute_force_detection')
      expect(bruteForceAlert).toBeDefined()
      expect(bruteForceAlert?.severity).toBe('HIGH')
      expect(bruteForceAlert?.count).toBe(15)
    })

    it('should send alert notifications to admin emails', async () => {
      const mockEvents = Array.from({ length: 12 }, (_, i) => ({
        id: `event-${i}`,
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        success: false,
        ipAddress: '192.168.1.100',
        timestamp: new Date(Date.now() - i * 60000),
        userAgent: 'Mozilla/5.0'
      }))

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)
      emailServiceMock.sendSecurityAlert.mockResolvedValue({ success: true })

      await securityMonitoring.checkAlertThresholds()

      expect(emailServiceMock.sendSecurityAlert).toHaveBeenCalledTimes(2) // 2 admin emails
      expect(emailServiceMock.sendSecurityAlert).toHaveBeenCalledWith(
        'admin1@test.com',
        'Brute Force Attack Detected',
        expect.stringContaining('12 failed login attempts'),
        'unknown',
        'Security System',
        expect.any(Object)
      )
    })

    it('should not trigger alerts when thresholds are not exceeded', async () => {
      const mockEvents = Array.from({ length: 5 }, (_, i) => ({
        id: `event-${i}`,
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        success: false,
        ipAddress: '192.168.1.100',
        timestamp: new Date(Date.now() - i * 60000),
        userAgent: 'Mozilla/5.0'
      }))

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)

      const alerts = await securityMonitoring.checkAlertThresholds()

      expect(alerts).toHaveLength(0)
      expect(emailServiceMock.sendSecurityAlert).not.toHaveBeenCalled()
    })

    it('should handle disabled thresholds', async () => {
      // Disable all thresholds
      const thresholds = securityMonitoring.getAlertThresholds()
      thresholds.forEach(threshold => {
        securityMonitoring.updateAlertThreshold(threshold.name, { enabled: false })
      })

      const mockEvents = Array.from({ length: 50 }, (_, i) => ({
        id: `event-${i}`,
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        success: false,
        ipAddress: '192.168.1.100',
        timestamp: new Date(Date.now() - i * 60000),
        userAgent: 'Mozilla/5.0'
      }))

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)

      const alerts = await securityMonitoring.checkAlertThresholds()

      expect(alerts).toHaveLength(0)
      expect(emailServiceMock.sendSecurityAlert).not.toHaveBeenCalled()
    })
  })

  describe('Alert Management', () => {
    it('should track active alerts', async () => {
      const mockEvents = Array.from({ length: 15 }, (_, i) => ({
        id: `event-${i}`,
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        success: false,
        ipAddress: '192.168.1.100',
        timestamp: new Date(Date.now() - i * 60000),
        userAgent: 'Mozilla/5.0'
      }))

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)
      emailServiceMock.sendSecurityAlert.mockResolvedValue({ success: true })

      await securityMonitoring.checkAlertThresholds()

      const activeAlerts = securityMonitoring.getActiveAlerts()
      expect(activeAlerts.length).toBeGreaterThan(0)
      expect(activeAlerts[0].acknowledged).toBe(false)
    })

    it('should acknowledge alerts', async () => {
      const mockEvents = Array.from({ length: 15 }, (_, i) => ({
        id: `event-${i}`,
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        success: false,
        ipAddress: '192.168.1.100',
        timestamp: new Date(Date.now() - i * 60000),
        userAgent: 'Mozilla/5.0'
      }))

      prismaMock.securityEvent.findMany.mockResolvedValue(mockEvents)
      emailServiceMock.sendSecurityAlert.mockResolvedValue({ success: true })

      await securityMonitoring.checkAlertThresholds()

      const activeAlerts = securityMonitoring.getActiveAlerts()
      const alertId = activeAlerts[0].id

      const acknowledged = await securityMonitoring.acknowledgeAlert(alertId, 'admin@test.com')

      expect(acknowledged).toBe(true)
      const updatedAlert = securityMonitoring.getActiveAlerts().find(a => a.id === alertId)
      expect(updatedAlert?.acknowledged).toBe(true)
      expect(updatedAlert?.acknowledgedBy).toBe('admin@test.com')
    })

    it('should return false when acknowledging non-existent alert', async () => {
      const acknowledged = await securityMonitoring.acknowledgeAlert('non-existent', 'admin@test.com')
      expect(acknowledged).toBe(false)
    })
  })

  describe('Threshold Management', () => {
    it('should update alert thresholds', () => {
      const updated = securityMonitoring.updateAlertThreshold('brute_force_detection', {
        threshold: 20,
        severity: 'CRITICAL'
      })

      expect(updated).toBe(true)

      const thresholds = securityMonitoring.getAlertThresholds()
      const bruteForceThreshold = thresholds.find(t => t.name === 'brute_force_detection')
      expect(bruteForceThreshold?.threshold).toBe(20)
      expect(bruteForceThreshold?.severity).toBe('CRITICAL')
    })

    it('should return false when updating non-existent threshold', () => {
      const updated = securityMonitoring.updateAlertThreshold('non_existent', {
        threshold: 10
      })

      expect(updated).toBe(false)
    })

    it('should return current thresholds', () => {
      const thresholds = securityMonitoring.getAlertThresholds()

      expect(thresholds.length).toBeGreaterThan(0)
      expect(thresholds[0]).toHaveProperty('name')
      expect(thresholds[0]).toHaveProperty('threshold')
      expect(thresholds[0]).toHaveProperty('severity')
      expect(thresholds[0]).toHaveProperty('enabled')
    })
  })

  describe('startRealTimeMonitoring', () => {
    it('should run complete monitoring cycle', async () => {
      prismaMock.securityEvent.findMany.mockResolvedValue([])
      securityLoggerMock.logSuspiciousActivity.mockResolvedValue(undefined)

      await securityMonitoring.startRealTimeMonitoring()

      expect(prismaMock.securityEvent.findMany).toHaveBeenCalled()
    })

    it('should handle monitoring errors gracefully', async () => {
      prismaMock.securityEvent.findMany.mockRejectedValue(new Error('Database error'))

      // Should not throw
      await expect(securityMonitoring.startRealTimeMonitoring()).resolves.not.toThrow()
    })
  })
})