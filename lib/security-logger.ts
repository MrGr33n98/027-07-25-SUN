import { prisma } from './prisma'
import { SecurityEventType } from '@prisma/client'
import { logger, LogCategory } from './logger'

export interface SecurityEventData {
  userId?: string
  email?: string
  eventType: SecurityEventType
  success: boolean
  ipAddress: string
  userAgent: string
  details?: Record<string, any>
}

export interface SecurityEventFilter {
  userId?: string
  email?: string
  eventType?: SecurityEventType
  success?: boolean
  ipAddress?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export interface SecurityEventStats {
  totalEvents: number
  successfulEvents: number
  failedEvents: number
  eventsByType: Record<SecurityEventType, number>
  eventsByHour: Array<{ hour: string; count: number }>
  topIpAddresses: Array<{ ipAddress: string; count: number }>
  suspiciousActivity: Array<{
    type: string
    count: number
    description: string
  }>
}

export class SecurityLogger {
  private static instance: SecurityLogger

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger()
    }
    return SecurityLogger.instance
  }

  /**
   * Log an authentication attempt (login)
   */
  async logAuthenticationAttempt(
    email: string,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      email,
      eventType: SecurityEventType.LOGIN_ATTEMPT,
      success,
      ipAddress,
      userAgent,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    })

    // Also log to general logger for immediate visibility
    await logger.logAuthEvent(
      `Login attempt for ${email}`,
      userId,
      success,
      { ipAddress, userAgent, ...details }
    )
  }

  /**
   * Log user registration events
   */
  async logRegistration(
    email: string,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      email,
      eventType: SecurityEventType.REGISTRATION,
      success,
      ipAddress,
      userAgent,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Log password change events
   */
  async logPasswordChange(
    email: string | undefined,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      email,
      eventType: SecurityEventType.PASSWORD_CHANGE,
      success,
      ipAddress,
      userAgent,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    })

    // Log to general logger for admin visibility
    await logger.logSecurityEvent(
      `Password change for user ${userId}`,
      success ? 'LOW' : 'MEDIUM',
      { userId, email, ipAddress, userAgent, ...details }
    )
  }

  /**
   * Log password reset request events
   */
  async logPasswordResetRequest(
    email: string,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      email,
      eventType: SecurityEventType.PASSWORD_RESET_REQUEST,
      success,
      ipAddress,
      userAgent,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Log password reset completion events
   */
  async logPasswordResetComplete(
    email: string | undefined,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      email,
      eventType: SecurityEventType.PASSWORD_RESET_COMPLETE,
      success,
      ipAddress,
      userAgent,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Log email verification events
   */
  async logEmailVerification(
    email: string | undefined,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      email,
      eventType: SecurityEventType.EMAIL_VERIFICATION,
      success,
      ipAddress,
      userAgent,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Log email verification resend events
   */
  async logEmailVerificationResend(
    email: string,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      email,
      eventType: SecurityEventType.EMAIL_VERIFICATION,
      success,
      ipAddress,
      userAgent,
      details: {
        action: 'resend',
        ...details,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Log account lockout events
   */
  async logAccountLockout(
    email: string,
    reason: string,
    duration: number,
    ipAddress: string,
    userAgent: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      email,
      eventType: SecurityEventType.ACCOUNT_LOCKOUT,
      success: true, // Lockout is a successful security measure
      ipAddress,
      userAgent,
      details: {
        reason,
        duration,
        lockoutTime: new Date().toISOString(),
        unlockTime: new Date(Date.now() + duration * 1000).toISOString(),
        ...details
      }
    })

    // Log to general logger with high severity
    await logger.logSecurityEvent(
      `Account lockout for ${email}: ${reason}`,
      'HIGH',
      { userId, email, reason, duration, ipAddress, userAgent, ...details }
    )
  }

  /**
   * Log account unlock events
   */
  async logAccountUnlock(
    email: string,
    method: 'automatic' | 'admin',
    ipAddress: string,
    userAgent: string,
    userId?: string,
    adminId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      email,
      eventType: SecurityEventType.ACCOUNT_UNLOCK,
      success: true,
      ipAddress,
      userAgent,
      details: {
        method,
        adminId,
        unlockTime: new Date().toISOString(),
        ...details
      }
    })
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    description: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    ipAddress: string,
    userAgent: string,
    userId?: string,
    email?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      email,
      eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
      success: false, // Suspicious activity is always a failed/concerning event
      ipAddress,
      userAgent,
      details: {
        description,
        severity,
        detectedAt: new Date().toISOString(),
        ...details
      }
    })

    // Log to general logger with appropriate severity
    await logger.logSecurityEvent(
      `Suspicious activity detected: ${description}`,
      severity,
      { userId, email, ipAddress, userAgent, ...details }
    )
  }

  /**
   * Log session creation events
   */
  async logSessionCreated(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      eventType: SecurityEventType.SESSION_CREATED,
      success: true,
      ipAddress,
      userAgent,
      details: {
        sessionId,
        createdAt: new Date().toISOString(),
        ...details
      }
    })
  }

  /**
   * Log session expiry events
   */
  async logSessionExpired(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    reason: 'timeout' | 'logout' | 'password_change' | 'admin_revoke' = 'timeout',
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      eventType: SecurityEventType.SESSION_EXPIRED,
      success: true,
      ipAddress,
      userAgent,
      details: {
        sessionId,
        reason,
        expiredAt: new Date().toISOString(),
        ...details
      }
    })
  }

  /**
   * Log token generation events
   */
  async logTokenGenerated(
    tokenType: 'email_verification' | 'password_reset' | 'session',
    userId?: string,
    email?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      email,
      eventType: SecurityEventType.TOKEN_GENERATED,
      success: true,
      ipAddress: ipAddress || 'system',
      userAgent: userAgent || 'system',
      details: {
        tokenType,
        generatedAt: new Date().toISOString(),
        ...details
      }
    })
  }

  /**
   * Log token usage events
   */
  async logTokenUsed(
    tokenType: 'email_verification' | 'password_reset' | 'session',
    success: boolean,
    ipAddress: string,
    userAgent: string,
    userId?: string,
    email?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      email,
      eventType: SecurityEventType.TOKEN_USED,
      success,
      ipAddress,
      userAgent,
      details: {
        tokenType,
        usedAt: new Date().toISOString(),
        ...details
      }
    })
  }

  /**
   * Core method to log security events to database
   */
  private async logSecurityEvent(eventData: SecurityEventData): Promise<void> {
    try {
      await prisma.securityEvent.create({
        data: {
          userId: eventData.userId,
          email: eventData.email,
          eventType: eventData.eventType,
          success: eventData.success,
          ipAddress: eventData.ipAddress,
          userAgent: eventData.userAgent,
          details: eventData.details || {},
          timestamp: new Date()
        }
      })
    } catch (error) {
      // Don't let logging errors break the application
      console.error('Failed to log security event:', error)
      
      // Log the failure to the general logger
      await logger.error(
        LogCategory.SECURITY,
        'Failed to log security event',
        error as Error,
        { eventData }
      )
    }
  }

  /**
   * Retrieve security events with filtering
   */
  async getSecurityEvents(filter: SecurityEventFilter = {}): Promise<any[]> {
    try {
      const where: any = {}

      if (filter.userId) where.userId = filter.userId
      if (filter.email) where.email = filter.email
      if (filter.eventType) where.eventType = filter.eventType
      if (filter.success !== undefined) where.success = filter.success
      if (filter.ipAddress) where.ipAddress = filter.ipAddress
      
      if (filter.startDate || filter.endDate) {
        where.timestamp = {}
        if (filter.startDate) where.timestamp.gte = filter.startDate
        if (filter.endDate) where.timestamp.lte = filter.endDate
      }

      return await prisma.securityEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filter.limit || 100,
        skip: filter.offset || 0,
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
    } catch (error) {
      console.error('Failed to retrieve security events:', error)
      return []
    }
  }

  /**
   * Generate security statistics and reports
   */
  async generateSecurityReport(
    startDate: Date,
    endDate: Date
  ): Promise<SecurityEventStats> {
    try {
      const events = await prisma.securityEvent.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          eventType: true,
          success: true,
          ipAddress: true,
          timestamp: true,
          details: true
        }
      })

      const totalEvents = events.length
      const successfulEvents = events.filter(e => e.success).length
      const failedEvents = totalEvents - successfulEvents

      // Count events by type
      const eventsByType = events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1
        return acc
      }, {} as Record<SecurityEventType, number>)

      // Count events by hour
      const eventsByHour = events.reduce((acc, event) => {
        const hour = event.timestamp.toISOString().substring(0, 13) + ':00:00'
        const existing = acc.find(item => item.hour === hour)
        if (existing) {
          existing.count++
        } else {
          acc.push({ hour, count: 1 })
        }
        return acc
      }, [] as Array<{ hour: string; count: number }>)

      // Count events by IP address
      const ipCounts = events.reduce((acc, event) => {
        acc[event.ipAddress] = (acc[event.ipAddress] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const topIpAddresses = Object.entries(ipCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([ipAddress, count]) => ({ ipAddress, count }))

      // Detect suspicious activity patterns
      const suspiciousActivity = this.detectSuspiciousPatterns(events, ipCounts)

      return {
        totalEvents,
        successfulEvents,
        failedEvents,
        eventsByType,
        eventsByHour,
        topIpAddresses,
        suspiciousActivity
      }
    } catch (error) {
      console.error('Failed to generate security report:', error)
      return {
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        eventsByType: {} as Record<SecurityEventType, number>,
        eventsByHour: [],
        topIpAddresses: [],
        suspiciousActivity: []
      }
    }
  }

  /**
   * Detect suspicious activity patterns
   */
  private detectSuspiciousPatterns(
    events: any[],
    ipCounts: Record<string, number>
  ): Array<{ type: string; count: number; description: string }> {
    const suspicious = []

    // High number of failed login attempts from single IP
    const failedLogins = events.filter(e => 
      e.eventType === SecurityEventType.LOGIN_ATTEMPT && !e.success
    )
    const failedByIp = failedLogins.reduce((acc, event) => {
      acc[event.ipAddress] = (acc[event.ipAddress] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(failedByIp).forEach(([ip, count]) => {
      if (count >= 10) {
        suspicious.push({
          type: 'brute_force_attempt',
          count,
          description: `${count} failed login attempts from IP ${ip}`
        })
      }
    })

    // Multiple password reset requests
    const passwordResets = events.filter(e => 
      e.eventType === SecurityEventType.PASSWORD_RESET_REQUEST
    )
    const resetsByIp = passwordResets.reduce((acc, event) => {
      acc[event.ipAddress] = (acc[event.ipAddress] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(resetsByIp).forEach(([ip, count]) => {
      if (count >= 5) {
        suspicious.push({
          type: 'password_reset_abuse',
          count,
          description: `${count} password reset requests from IP ${ip}`
        })
      }
    })

    // High activity from single IP
    Object.entries(ipCounts).forEach(([ip, count]) => {
      if (count >= 100) {
        suspicious.push({
          type: 'high_activity_ip',
          count,
          description: `${count} total events from IP ${ip}`
        })
      }
    })

    return suspicious
  }

  /**
   * Clean up old security events (for maintenance)
   */
  async cleanupOldEvents(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
      
      const result = await prisma.securityEvent.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      })

      await logger.info(
        LogCategory.SECURITY,
        `Cleaned up ${result.count} old security events older than ${olderThanDays} days`
      )

      return result.count
    } catch (error) {
      console.error('Failed to cleanup old security events:', error)
      await logger.error(
        LogCategory.SECURITY,
        'Failed to cleanup old security events',
        error as Error
      )
      return 0
    }
  }
}

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance()