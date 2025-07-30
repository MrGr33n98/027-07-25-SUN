import { prisma } from './prisma'
import { SecurityEventType } from '@prisma/client'
import { securityLogger } from './security-logger'
import { emailService } from './email-service'
import { logger, LogCategory } from './logger'

export interface SuspiciousActivityPattern {
  type: 'brute_force' | 'credential_stuffing' | 'password_spray' | 'account_enumeration' | 'rapid_registration' | 'token_abuse' | 'geographic_anomaly'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  ipAddress?: string
  userId?: string
  email?: string
  count: number
  timeWindow: string
  details: Record<string, any>
}

export interface AlertThreshold {
  name: string
  eventType?: SecurityEventType
  condition: 'count_exceeds' | 'rate_exceeds' | 'pattern_detected'
  threshold: number
  timeWindowMinutes: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  enabled: boolean
}

export interface SecurityAlert {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  ipAddress?: string
  userId?: string
  email?: string
  count: number
  detectedAt: Date
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  details: Record<string, any>
}

export class SecurityMonitoringService {
  private static instance: SecurityMonitoringService
  private alertThresholds: AlertThreshold[] = []
  private activeAlerts: Map<string, SecurityAlert> = new Map()

  static getInstance(): SecurityMonitoringService {
    if (!SecurityMonitoringService.instance) {
      SecurityMonitoringService.instance = new SecurityMonitoringService()
    }
    return SecurityMonitoringService.instance
  }

  constructor() {
    this.initializeDefaultThresholds()
  }

  /**
   * Initialize default alert thresholds
   */
  private initializeDefaultThresholds(): void {
    this.alertThresholds = [
      {
        name: 'brute_force_detection',
        eventType: SecurityEventType.LOGIN_ATTEMPT,
        condition: 'count_exceeds',
        threshold: 10,
        timeWindowMinutes: 15,
        severity: 'HIGH',
        enabled: true
      },
      {
        name: 'password_reset_abuse',
        eventType: SecurityEventType.PASSWORD_RESET_REQUEST,
        condition: 'count_exceeds',
        threshold: 5,
        timeWindowMinutes: 60,
        severity: 'MEDIUM',
        enabled: true
      },
      {
        name: 'rapid_registration',
        eventType: SecurityEventType.REGISTRATION,
        condition: 'rate_exceeds',
        threshold: 10,
        timeWindowMinutes: 60,
        severity: 'MEDIUM',
        enabled: true
      },
      {
        name: 'account_lockout_spike',
        eventType: SecurityEventType.ACCOUNT_LOCKOUT,
        condition: 'count_exceeds',
        threshold: 5,
        timeWindowMinutes: 30,
        severity: 'HIGH',
        enabled: true
      },
      {
        name: 'suspicious_activity_spike',
        eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
        condition: 'count_exceeds',
        threshold: 3,
        timeWindowMinutes: 15,
        severity: 'CRITICAL',
        enabled: true
      },
      {
        name: 'token_abuse_detection',
        eventType: SecurityEventType.TOKEN_USED,
        condition: 'count_exceeds',
        threshold: 20,
        timeWindowMinutes: 60,
        severity: 'MEDIUM',
        enabled: true
      }
    ]
  }

  /**
   * Analyze recent security events for suspicious patterns
   */
  async detectSuspiciousActivity(timeWindowMinutes: number = 60): Promise<SuspiciousActivityPattern[]> {
    const patterns: SuspiciousActivityPattern[] = []
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000)

    try {
      // Get recent security events
      const recentEvents = await prisma.securityEvent.findMany({
        where: {
          timestamp: {
            gte: cutoffTime
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      })

      // Detect brute force attacks
      const bruteForcePatterns = await this.detectBruteForceAttacks(recentEvents)
      patterns.push(...bruteForcePatterns)

      // Detect credential stuffing
      const credentialStuffingPatterns = await this.detectCredentialStuffing(recentEvents)
      patterns.push(...credentialStuffingPatterns)

      // Detect password spray attacks
      const passwordSprayPatterns = await this.detectPasswordSprayAttacks(recentEvents)
      patterns.push(...passwordSprayPatterns)

      // Detect account enumeration
      const enumerationPatterns = await this.detectAccountEnumeration(recentEvents)
      patterns.push(...enumerationPatterns)

      // Detect rapid registration attempts
      const rapidRegistrationPatterns = await this.detectRapidRegistration(recentEvents)
      patterns.push(...rapidRegistrationPatterns)

      // Detect token abuse
      const tokenAbusePatterns = await this.detectTokenAbuse(recentEvents)
      patterns.push(...tokenAbusePatterns)

      // Log detected patterns
      for (const pattern of patterns) {
        await securityLogger.logSuspiciousActivity(
          pattern.description,
          pattern.severity,
          pattern.ipAddress || 'unknown',
          'system',
          pattern.userId,
          pattern.email,
          {
            patternType: pattern.type,
            count: pattern.count,
            timeWindow: pattern.timeWindow,
            ...pattern.details
          }
        )
      }

      return patterns
    } catch (error) {
      await logger.error(
        LogCategory.SECURITY,
        'Failed to detect suspicious activity',
        error as Error
      )
      return []
    }
  }

  /**
   * Detect brute force attacks (multiple failed logins from same IP)
   */
  private async detectBruteForceAttacks(events: any[]): Promise<SuspiciousActivityPattern[]> {
    const patterns: SuspiciousActivityPattern[] = []

    const failedLogins = events.filter(e =>
      e.eventType === SecurityEventType.LOGIN_ATTEMPT && !e.success
    )

    // Group by IP address
    const failedByIp = failedLogins.reduce((acc, event) => {
      if (!acc[event.ipAddress]) {
        acc[event.ipAddress] = []
      }
      acc[event.ipAddress].push(event)
      return acc
    }, {} as Record<string, any[]>)

    // Check for brute force patterns
    Object.entries(failedByIp).forEach(([ip, ipEvents]) => {
      const events = ipEvents as any[]
      if (events.length >= 10) {
        const uniqueEmails = new Set(events.map((e: any) => e.email)).size
        const timeSpan = Math.max(...events.map((e: any) => e.timestamp.getTime())) -
          Math.min(...events.map((e: any) => e.timestamp.getTime()))

        patterns.push({
          type: 'brute_force',
          severity: events.length >= 50 ? 'CRITICAL' : events.length >= 25 ? 'HIGH' : 'MEDIUM',
          description: `Brute force attack detected: ${events.length} failed login attempts from IP ${ip}`,
          ipAddress: ip,
          count: events.length,
          timeWindow: `${Math.round(timeSpan / 60000)} minutes`,
          details: {
            uniqueEmailsTargeted: uniqueEmails,
            averageAttemptsPerMinute: Math.round(events.length / (timeSpan / 60000)),
            firstAttempt: Math.min(...events.map((e: any) => e.timestamp.getTime())),
            lastAttempt: Math.max(...events.map((e: any) => e.timestamp.getTime()))
          }
        })
      }
    })

    return patterns
  }

  /**
   * Detect credential stuffing (same IP trying many different email/password combinations)
   */
  private async detectCredentialStuffing(events: any[]): Promise<SuspiciousActivityPattern[]> {
    const patterns: SuspiciousActivityPattern[] = []

    const failedLogins = events.filter(e =>
      e.eventType === SecurityEventType.LOGIN_ATTEMPT && !e.success
    )

    // Group by IP address
    const failedByIp = failedLogins.reduce((acc, event) => {
      if (!acc[event.ipAddress]) {
        acc[event.ipAddress] = []
      }
      acc[event.ipAddress].push(event)
      return acc
    }, {} as Record<string, any[]>)

    Object.entries(failedByIp).forEach(([ip, ipEvents]: [string, any[]]) => {
      const uniqueEmails = new Set(ipEvents.map((e: any) => e.email))

      // Credential stuffing: many unique emails from same IP with relatively few attempts per email
      if (uniqueEmails.size >= 20 && ipEvents.length / uniqueEmails.size <= 3) {
        patterns.push({
          type: 'credential_stuffing',
          severity: uniqueEmails.size >= 100 ? 'CRITICAL' : uniqueEmails.size >= 50 ? 'HIGH' : 'MEDIUM',
          description: `Credential stuffing attack detected: ${uniqueEmails.size} unique emails targeted from IP ${ip}`,
          ipAddress: ip,
          count: ipEvents.length,
          timeWindow: '60 minutes',
          details: {
            uniqueEmailsTargeted: uniqueEmails.size,
            totalAttempts: ipEvents.length,
            averageAttemptsPerEmail: Math.round(ipEvents.length / uniqueEmails.size)
          }
        })
      }
    })

    return patterns
  }

  /**
   * Detect password spray attacks (same password tried against many accounts)
   */
  private async detectPasswordSprayAttacks(events: any[]): Promise<SuspiciousActivityPattern[]> {
    const patterns: SuspiciousActivityPattern[] = []

    const failedLogins = events.filter(e =>
      e.eventType === SecurityEventType.LOGIN_ATTEMPT && !e.success
    )

    // Group by IP and look for patterns suggesting password spraying
    const failedByIp = failedLogins.reduce((acc, event) => {
      if (!acc[event.ipAddress]) {
        acc[event.ipAddress] = []
      }
      acc[event.ipAddress].push(event)
      return acc
    }, {} as Record<string, any[]>)

    Object.entries(failedByIp).forEach(([ip, ipEvents]: [string, any[]]) => {
      const uniqueEmails = new Set(ipEvents.map((e: any) => e.email))

      // Password spray: many unique emails, exactly 1-2 attempts per email (low and slow)
      if (uniqueEmails.size >= 10 && ipEvents.length / uniqueEmails.size <= 2) {
        const timeSpan = Math.max(...ipEvents.map((e: any) => e.timestamp.getTime())) -
          Math.min(...ipEvents.map((e: any) => e.timestamp.getTime()))

        // Spread over longer time period (characteristic of password spray)
        if (timeSpan > 30 * 60 * 1000) { // More than 30 minutes
          patterns.push({
            type: 'password_spray',
            severity: uniqueEmails.size >= 50 ? 'HIGH' : 'MEDIUM',
            description: `Password spray attack detected: ${uniqueEmails.size} accounts targeted with low-frequency attempts from IP ${ip}`,
            ipAddress: ip,
            count: ipEvents.length,
            timeWindow: `${Math.round(timeSpan / 60000)} minutes`,
            details: {
              uniqueEmailsTargeted: uniqueEmails.size,
              totalAttempts: ipEvents.length,
              averageAttemptsPerEmail: Math.round(ipEvents.length / uniqueEmails.size),
              attackDurationMinutes: Math.round(timeSpan / 60000)
            }
          })
        }
      }
    })

    return patterns
  }

  /**
   * Detect account enumeration attempts
   */
  private async detectAccountEnumeration(events: any[]): Promise<SuspiciousActivityPattern[]> {
    const patterns: SuspiciousActivityPattern[] = []

    // Look for password reset requests and registration attempts that might indicate enumeration
    const enumerationEvents = events.filter(e =>
      e.eventType === SecurityEventType.PASSWORD_RESET_REQUEST ||
      e.eventType === SecurityEventType.REGISTRATION
    )

    const eventsByIp = enumerationEvents.reduce((acc, event) => {
      if (!acc[event.ipAddress]) {
        acc[event.ipAddress] = []
      }
      acc[event.ipAddress].push(event)
      return acc
    }, {} as Record<string, any[]>)

    Object.entries(eventsByIp).forEach(([ip, ipEvents]: [string, any[]]) => {
      const resetRequests = ipEvents.filter((e: any) => e.eventType === SecurityEventType.PASSWORD_RESET_REQUEST)
      const registrationAttempts = ipEvents.filter((e: any) => e.eventType === SecurityEventType.REGISTRATION)

      // High number of password reset requests (testing which emails exist)
      if (resetRequests.length >= 20) {
        patterns.push({
          type: 'account_enumeration',
          severity: resetRequests.length >= 100 ? 'HIGH' : 'MEDIUM',
          description: `Account enumeration detected: ${resetRequests.length} password reset requests from IP ${ip}`,
          ipAddress: ip,
          count: resetRequests.length,
          timeWindow: '60 minutes',
          details: {
            resetRequests: resetRequests.length,
            registrationAttempts: registrationAttempts.length,
            method: 'password_reset_enumeration'
          }
        })
      }

      // High number of registration attempts with different emails
      if (registrationAttempts.length >= 15) {
        const uniqueEmails = new Set(registrationAttempts.map((e: any) => e.email))
        patterns.push({
          type: 'account_enumeration',
          severity: registrationAttempts.length >= 50 ? 'HIGH' : 'MEDIUM',
          description: `Account enumeration detected: ${registrationAttempts.length} registration attempts from IP ${ip}`,
          ipAddress: ip,
          count: registrationAttempts.length,
          timeWindow: '60 minutes',
          details: {
            registrationAttempts: registrationAttempts.length,
            uniqueEmails: uniqueEmails.size,
            method: 'registration_enumeration'
          }
        })
      }
    })

    return patterns
  }

  /**
   * Detect rapid registration attempts (potential bot activity)
   */
  private async detectRapidRegistration(events: any[]): Promise<SuspiciousActivityPattern[]> {
    const patterns: SuspiciousActivityPattern[] = []

    const registrations = events.filter(e => e.eventType === SecurityEventType.REGISTRATION)

    const registrationsByIp = registrations.reduce((acc, event) => {
      if (!acc[event.ipAddress]) {
        acc[event.ipAddress] = []
      }
      acc[event.ipAddress].push(event)
      return acc
    }, {} as Record<string, any[]>)

    Object.entries(registrationsByIp).forEach(([ip, ipEvents]: [string, any[]]) => {
      if (ipEvents.length >= 10) {
        const timeSpan = Math.max(...ipEvents.map((e: any) => e.timestamp.getTime())) -
          Math.min(...ipEvents.map((e: any) => e.timestamp.getTime()))
        const registrationsPerMinute = ipEvents.length / (timeSpan / 60000)

        // More than 2 registrations per minute indicates automated behavior
        if (registrationsPerMinute > 2) {
          patterns.push({
            type: 'rapid_registration',
            severity: registrationsPerMinute > 10 ? 'HIGH' : 'MEDIUM',
            description: `Rapid registration detected: ${ipEvents.length} registrations at ${registrationsPerMinute.toFixed(1)} per minute from IP ${ip}`,
            ipAddress: ip,
            count: ipEvents.length,
            timeWindow: `${Math.round(timeSpan / 60000)} minutes`,
            details: {
              registrationsPerMinute: registrationsPerMinute,
              totalRegistrations: ipEvents.length,
              timeSpanMinutes: Math.round(timeSpan / 60000)
            }
          })
        }
      }
    })

    return patterns
  }

  /**
   * Detect token abuse (excessive token generation or usage)
   */
  private async detectTokenAbuse(events: any[]): Promise<SuspiciousActivityPattern[]> {
    const patterns: SuspiciousActivityPattern[] = []

    const tokenEvents = events.filter(e =>
      e.eventType === SecurityEventType.TOKEN_GENERATED ||
      e.eventType === SecurityEventType.TOKEN_USED
    )

    const tokenEventsByIp = tokenEvents.reduce((acc, event) => {
      if (!acc[event.ipAddress]) {
        acc[event.ipAddress] = []
      }
      acc[event.ipAddress].push(event)
      return acc
    }, {} as Record<string, any[]>)

    Object.entries(tokenEventsByIp).forEach(([ip, ipEvents]: [string, any[]]) => {
      const tokenGenerated = ipEvents.filter((e: any) => e.eventType === SecurityEventType.TOKEN_GENERATED)
      const tokenUsed = ipEvents.filter((e: any) => e.eventType === SecurityEventType.TOKEN_USED)

      // Excessive token generation (potential DoS or resource exhaustion)
      if (tokenGenerated.length >= 50) {
        patterns.push({
          type: 'token_abuse',
          severity: tokenGenerated.length >= 200 ? 'HIGH' : 'MEDIUM',
          description: `Token abuse detected: ${tokenGenerated.length} tokens generated from IP ${ip}`,
          ipAddress: ip,
          count: tokenGenerated.length,
          timeWindow: '60 minutes',
          details: {
            tokensGenerated: tokenGenerated.length,
            tokensUsed: tokenUsed.length,
            abuseType: 'excessive_generation'
          }
        })
      }

      // Excessive failed token usage
      const failedTokenUsage = tokenUsed.filter((e: any) => !e.success)
      if (failedTokenUsage.length >= 20) {
        patterns.push({
          type: 'token_abuse',
          severity: failedTokenUsage.length >= 100 ? 'HIGH' : 'MEDIUM',
          description: `Token abuse detected: ${failedTokenUsage.length} failed token usage attempts from IP ${ip}`,
          ipAddress: ip,
          count: failedTokenUsage.length,
          timeWindow: '60 minutes',
          details: {
            failedTokenUsage: failedTokenUsage.length,
            successfulTokenUsage: tokenUsed.length - failedTokenUsage.length,
            abuseType: 'failed_token_usage'
          }
        })
      }
    })

    return patterns
  }

  /**
   * Check alert thresholds and trigger alerts
   */
  async checkAlertThresholds(): Promise<SecurityAlert[]> {
    const triggeredAlerts: SecurityAlert[] = []

    for (const threshold of this.alertThresholds) {
      if (!threshold.enabled) continue

      try {
        const cutoffTime = new Date(Date.now() - threshold.timeWindowMinutes * 60 * 1000)

        const events = await prisma.securityEvent.findMany({
          where: {
            timestamp: {
              gte: cutoffTime
            },
            ...(threshold.eventType && { eventType: threshold.eventType })
          }
        })

        let alertTriggered = false
        let alertDetails: any = {}

        switch (threshold.condition) {
          case 'count_exceeds':
            if (events.length > threshold.threshold) {
              alertTriggered = true
              alertDetails = {
                eventCount: events.length,
                threshold: threshold.threshold,
                timeWindow: `${threshold.timeWindowMinutes} minutes`
              }
            }
            break

          case 'rate_exceeds':
            const rate = events.length / threshold.timeWindowMinutes
            if (rate > threshold.threshold) {
              alertTriggered = true
              alertDetails = {
                eventsPerMinute: rate,
                threshold: threshold.threshold,
                totalEvents: events.length,
                timeWindow: `${threshold.timeWindowMinutes} minutes`
              }
            }
            break

          case 'pattern_detected':
            // This would be handled by the suspicious activity detection
            break
        }

        if (alertTriggered) {
          const alert: SecurityAlert = {
            id: `alert_${threshold.name}_${Date.now()}`,
            type: threshold.name,
            severity: threshold.severity,
            title: this.getAlertTitle(threshold.name),
            description: this.getAlertDescription(threshold.name, alertDetails),
            count: events.length,
            detectedAt: new Date(),
            acknowledged: false,
            details: alertDetails
          }

          triggeredAlerts.push(alert)
          this.activeAlerts.set(alert.id, alert)

          // Send alert notification
          await this.sendAlertNotification(alert)
        }
      } catch (error) {
        await logger.error(
          LogCategory.SECURITY,
          `Failed to check alert threshold: ${threshold.name}`,
          error as Error
        )
      }
    }

    return triggeredAlerts
  }

  /**
   * Send alert notification to administrators
   */
  private async sendAlertNotification(alert: SecurityAlert): Promise<void> {
    try {
      // Get admin emails (this would be configured in environment or database)
      const adminEmails = process.env.SECURITY_ADMIN_EMAILS?.split(',') || []

      for (const adminEmail of adminEmails) {
        if (emailService) {
          await emailService.sendSecurityAlert(
            adminEmail.trim(),
            alert.title,
            alert.description,
            alert.ipAddress || 'unknown',
            'Security System'
          )
        }
      }

      // Log the alert
      await logger.logSecurityEvent(
        `Security alert triggered: ${alert.title}`,
        alert.severity,
        {
          alertId: alert.id,
          alertType: alert.type,
          ...alert.details
        }
      )
    } catch (error) {
      await logger.error(
        LogCategory.SECURITY,
        'Failed to send alert notification',
        error as Error,
        { alertId: alert.id }
      )
    }
  }

  /**
   * Get alert title based on alert type
   */
  private getAlertTitle(alertType: string): string {
    const titles: Record<string, string> = {
      brute_force_detection: 'Brute Force Attack Detected',
      password_reset_abuse: 'Password Reset Abuse Detected',
      rapid_registration: 'Rapid Registration Activity',
      account_lockout_spike: 'Account Lockout Spike',
      suspicious_activity_spike: 'Suspicious Activity Spike',
      token_abuse_detection: 'Token Abuse Detected'
    }
    return titles[alertType] || 'Security Alert'
  }

  /**
   * Get alert description based on alert type and details
   */
  private getAlertDescription(alertType: string, details: any): string {
    switch (alertType) {
      case 'brute_force_detection':
        return `${details.eventCount} failed login attempts detected in ${details.timeWindow}, exceeding threshold of ${details.threshold}`
      case 'password_reset_abuse':
        return `${details.eventCount} password reset requests detected in ${details.timeWindow}, exceeding threshold of ${details.threshold}`
      case 'rapid_registration':
        return `${details.eventsPerMinute?.toFixed(1)} registrations per minute detected, exceeding threshold of ${details.threshold}`
      case 'account_lockout_spike':
        return `${details.eventCount} account lockouts detected in ${details.timeWindow}, exceeding threshold of ${details.threshold}`
      case 'suspicious_activity_spike':
        return `${details.eventCount} suspicious activities detected in ${details.timeWindow}, exceeding threshold of ${details.threshold}`
      case 'token_abuse_detection':
        return `${details.eventCount} token events detected in ${details.timeWindow}, exceeding threshold of ${details.threshold}`
      default:
        return `Security threshold exceeded: ${details.eventCount} events in ${details.timeWindow}`
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): SecurityAlert[] {
    return Array.from(this.activeAlerts.values())
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId)
    if (!alert) return false

    alert.acknowledged = true
    alert.acknowledgedBy = acknowledgedBy
    alert.acknowledgedAt = new Date()

    await logger.info(
      LogCategory.SECURITY,
      `Security alert acknowledged: ${alert.title}`,
      {
        alertId,
        acknowledgedBy,
        acknowledgedAt: alert.acknowledgedAt
      }
    )

    return true
  }

  /**
   * Start real-time monitoring (would be called by a scheduler or background job)
   */
  async startRealTimeMonitoring(): Promise<void> {
    try {
      // Detect suspicious activity patterns
      const suspiciousPatterns = await this.detectSuspiciousActivity(60)

      // Check alert thresholds
      const triggeredAlerts = await this.checkAlertThresholds()

      await logger.info(
        LogCategory.SECURITY,
        'Security monitoring cycle completed',
        {
          suspiciousPatternsDetected: suspiciousPatterns.length,
          alertsTriggered: triggeredAlerts.length,
          activeAlerts: this.activeAlerts.size
        }
      )
    } catch (error) {
      await logger.error(
        LogCategory.SECURITY,
        'Security monitoring cycle failed',
        error as Error
      )
    }
  }

  /**
   * Configure alert thresholds
   */
  updateAlertThreshold(name: string, updates: Partial<AlertThreshold>): boolean {
    const threshold = this.alertThresholds.find(t => t.name === name)
    if (!threshold) return false

    Object.assign(threshold, updates)
    return true
  }

  /**
   * Get current alert thresholds
   */
  getAlertThresholds(): AlertThreshold[] {
    return [...this.alertThresholds]
  }
}

// Export singleton instance
export const securityMonitoring = SecurityMonitoringService.getInstance()