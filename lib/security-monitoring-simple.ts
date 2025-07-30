import { prisma } from './prisma'
import { SecurityEventType } from '@prisma/client'
import { securityLogger } from './security-logger'
import { emailService } from './email-service'
import { logger, LogCategory } from './logger'

export interface SuspiciousActivityPattern {
  type: 'brute_force' | 'credential_stuffing' | 'password_spray' | 'account_enumeration' | 'rapid_registration' | 'token_abuse'
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
  condition: 'count_exceeds' | 'rate_exceeds'
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
      const bruteForcePatterns = this.detectBruteForceAttacks(recentEvents)
      patterns.push(...bruteForcePatterns)

      // Detect rapid registration attempts
      const rapidRegistrationPatterns = this.detectRapidRegistration(recentEvents)
      patterns.push(...rapidRegistrationPatterns)

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
  private detectBruteForceAttacks(events: any[]): SuspiciousActivityPattern[] {
    const patterns: SuspiciousActivityPattern[] = []
    
    const failedLogins = events.filter(e => 
      e.eventType === SecurityEventType.LOGIN_ATTEMPT && !e.success
    )

    // Group by IP address
    const failedByIp: Record<string, any[]> = {}
    failedLogins.forEach(event => {
      if (!failedByIp[event.ipAddress]) {
        failedByIp[event.ipAddress] = []
      }
      failedByIp[event.ipAddress].push(event)
    })

    // Check for brute force patterns
    Object.entries(failedByIp).forEach(([ip, ipEvents]) => {
      if (ipEvents.length >= 10) {
        const uniqueEmails = new Set(ipEvents.map(e => e.email)).size
        const timeSpan = Math.max(...ipEvents.map(e => e.timestamp.getTime())) - 
                        Math.min(...ipEvents.map(e => e.timestamp.getTime()))
        
        patterns.push({
          type: 'brute_force',
          severity: ipEvents.length >= 50 ? 'CRITICAL' : ipEvents.length >= 25 ? 'HIGH' : 'MEDIUM',
          description: `Brute force attack detected: ${ipEvents.length} failed login attempts from IP ${ip}`,
          ipAddress: ip,
          count: ipEvents.length,
          timeWindow: `${Math.round(timeSpan / 60000)} minutes`,
          details: {
            uniqueEmailsTargeted: uniqueEmails,
            averageAttemptsPerMinute: Math.round(ipEvents.length / (timeSpan / 60000)),
            firstAttempt: Math.min(...ipEvents.map(e => e.timestamp.getTime())),
            lastAttempt: Math.max(...ipEvents.map(e => e.timestamp.getTime()))
          }
        })
      }
    })

    return patterns
  }

  /**
   * Detect rapid registration attempts (potential bot activity)
   */
  private detectRapidRegistration(events: any[]): SuspiciousActivityPattern[] {
    const patterns: SuspiciousActivityPattern[] = []
    
    const registrations = events.filter(e => e.eventType === SecurityEventType.REGISTRATION)
    
    const registrationsByIp: Record<string, any[]> = {}
    registrations.forEach(event => {
      if (!registrationsByIp[event.ipAddress]) {
        registrationsByIp[event.ipAddress] = []
      }
      registrationsByIp[event.ipAddress].push(event)
    })

    Object.entries(registrationsByIp).forEach(([ip, ipEvents]) => {
      if (ipEvents.length >= 10) {
        const timeSpan = Math.max(...ipEvents.map(e => e.timestamp.getTime())) - 
                        Math.min(...ipEvents.map(e => e.timestamp.getTime()))
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
      suspicious_activity_spike: 'Suspicious Activity Spike'
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