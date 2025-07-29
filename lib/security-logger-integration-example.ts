/**
 * Integration Example: SecurityLogger with Authentication Services
 * 
 * This file demonstrates how the SecurityLogger integrates with other
 * authentication services in the secure authentication system.
 */

import { securityLogger } from './security-logger'
import { Request } from 'express'

// Example: Integration with Authentication Service
export class AuthenticationServiceExample {
  async login(email: string, password: string, req: Request) {
    const ipAddress = this.getClientIP(req)
    const userAgent = req.headers['user-agent'] || 'Unknown'

    try {
      // Simulate password verification
      const user = await this.verifyCredentials(email, password)
      
      if (user) {
        // Log successful authentication
        await securityLogger.logAuthenticationAttempt(
          email,
          true,
          ipAddress,
          userAgent,
          user.id,
          {
            loginMethod: 'email_password',
            sessionCreated: true
          }
        )

        // Create session and log it
        const sessionId = await this.createSession(user.id, ipAddress, userAgent)
        await securityLogger.logSessionCreated(
          user.id,
          sessionId,
          ipAddress,
          userAgent
        )

        return { success: true, user, sessionId }
      } else {
        // Log failed authentication
        await securityLogger.logAuthenticationAttempt(
          email,
          false,
          ipAddress,
          userAgent,
          undefined,
          {
            reason: 'invalid_credentials',
            loginMethod: 'email_password'
          }
        )

        // Check for suspicious activity (multiple failed attempts)
        await this.checkForSuspiciousActivity(email, ipAddress, userAgent)

        return { success: false, error: 'Invalid credentials' }
      }
    } catch (error) {
      // Log system error
      await securityLogger.logSuspiciousActivity(
        'Authentication system error',
        'HIGH',
        ipAddress,
        userAgent,
        undefined,
        email,
        {
          error: (error as Error).message,
          stack: (error as Error).stack
        }
      )

      throw error
    }
  }

  async register(email: string, password: string, req: Request) {
    const ipAddress = this.getClientIP(req)
    const userAgent = req.headers['user-agent'] || 'Unknown'

    try {
      // Simulate user creation
      const user = await this.createUser(email, password)

      // Log successful registration
      await securityLogger.logRegistration(
        email,
        true,
        ipAddress,
        userAgent,
        user.id,
        {
          registrationMethod: 'email_password',
          emailVerificationRequired: true
        }
      )

      // Generate email verification token and log it
      const verificationToken = await this.generateEmailVerificationToken(user.id)
      await securityLogger.logTokenGenerated(
        'email_verification',
        user.id,
        email,
        ipAddress,
        userAgent,
        {
          tokenExpiry: '24h'
        }
      )

      return { success: true, user, verificationToken }
    } catch (error) {
      // Log failed registration
      await securityLogger.logRegistration(
        email,
        false,
        ipAddress,
        userAgent,
        undefined,
        {
          error: (error as Error).message,
          registrationMethod: 'email_password'
        }
      )

      throw error
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string, req: Request) {
    const ipAddress = this.getClientIP(req)
    const userAgent = req.headers['user-agent'] || 'Unknown'

    try {
      // Verify current password
      const isCurrentPasswordValid = await this.verifyCurrentPassword(userId, currentPassword)
      
      if (!isCurrentPasswordValid) {
        await securityLogger.logPasswordChange(
          userId,
          ipAddress,
          userAgent,
          false,
          {
            reason: 'invalid_current_password'
          }
        )
        return { success: false, error: 'Current password is incorrect' }
      }

      // Update password
      await this.updatePassword(userId, newPassword)

      // Log successful password change
      await securityLogger.logPasswordChange(
        userId,
        ipAddress,
        userAgent,
        true,
        {
          method: 'user_initiated',
          sessionInvalidated: true
        }
      )

      // Invalidate all sessions except current
      await this.invalidateOtherSessions(userId, req.sessionID)

      return { success: true }
    } catch (error) {
      await securityLogger.logPasswordChange(
        userId,
        ipAddress,
        userAgent,
        false,
        {
          error: (error as Error).message
        }
      )

      throw error
    }
  }

  async resetPassword(token: string, newPassword: string, req: Request) {
    const ipAddress = this.getClientIP(req)
    const userAgent = req.headers['user-agent'] || 'Unknown'

    try {
      // Validate reset token
      const tokenData = await this.validatePasswordResetToken(token)
      
      if (!tokenData) {
        await securityLogger.logPasswordResetComplete(
          'unknown',
          ipAddress,
          userAgent,
          false,
          undefined,
          {
            reason: 'invalid_token',
            token: token.substring(0, 8) + '...' // Log partial token for debugging
          }
        )
        return { success: false, error: 'Invalid or expired reset token' }
      }

      // Update password
      await this.updatePassword(tokenData.userId, newPassword)

      // Log successful password reset
      await securityLogger.logPasswordResetComplete(
        tokenData.email,
        ipAddress,
        userAgent,
        true,
        tokenData.userId,
        {
          tokenUsed: true,
          allSessionsInvalidated: true
        }
      )

      // Log token usage
      await securityLogger.logTokenUsed(
        'password_reset',
        true,
        ipAddress,
        userAgent,
        tokenData.userId,
        tokenData.email
      )

      // Invalidate all sessions for security
      await this.invalidateAllSessions(tokenData.userId)

      return { success: true }
    } catch (error) {
      await securityLogger.logPasswordResetComplete(
        'unknown',
        ipAddress,
        userAgent,
        false,
        undefined,
        {
          error: (error as Error).message
        }
      )

      throw error
    }
  }

  async verifyEmail(token: string, req: Request) {
    const ipAddress = this.getClientIP(req)
    const userAgent = req.headers['user-agent'] || 'Unknown'

    try {
      // Validate email verification token
      const tokenData = await this.validateEmailVerificationToken(token)
      
      if (!tokenData) {
        await securityLogger.logEmailVerification(
          'unknown',
          ipAddress,
          userAgent,
          false,
          undefined,
          {
            reason: 'invalid_token',
            token: token.substring(0, 8) + '...'
          }
        )
        return { success: false, error: 'Invalid or expired verification token' }
      }

      // Mark email as verified
      await this.markEmailAsVerified(tokenData.userId)

      // Log successful email verification
      await securityLogger.logEmailVerification(
        tokenData.email,
        ipAddress,
        userAgent,
        true,
        tokenData.userId,
        {
          tokenUsed: true,
          verificationCompleted: true
        }
      )

      // Log token usage
      await securityLogger.logTokenUsed(
        'email_verification',
        true,
        ipAddress,
        userAgent,
        tokenData.userId,
        tokenData.email
      )

      return { success: true, user: tokenData.user }
    } catch (error) {
      await securityLogger.logEmailVerification(
        'unknown',
        ipAddress,
        userAgent,
        false,
        undefined,
        {
          error: (error as Error).message
        }
      )

      throw error
    }
  }

  async logout(userId: string, sessionId: string, req: Request) {
    const ipAddress = this.getClientIP(req)
    const userAgent = req.headers['user-agent'] || 'Unknown'

    try {
      // Invalidate session
      await this.invalidateSession(sessionId)

      // Log session expiry
      await securityLogger.logSessionExpired(
        userId,
        sessionId,
        ipAddress,
        userAgent,
        'logout',
        {
          userInitiated: true
        }
      )

      return { success: true }
    } catch (error) {
      await securityLogger.logSuspiciousActivity(
        'Logout error',
        'MEDIUM',
        ipAddress,
        userAgent,
        userId,
        undefined,
        {
          error: (error as Error).message,
          sessionId
        }
      )

      throw error
    }
  }

  // Helper methods (these would be implemented in the actual service)
  private getClientIP(req: Request): string {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
           'unknown'
  }

  private async verifyCredentials(email: string, password: string) {
    // Implementation would verify password against hash
    return null // Placeholder
  }

  private async createUser(email: string, password: string) {
    // Implementation would create user with hashed password
    return { id: 'user-123', email } // Placeholder
  }

  private async createSession(userId: string, ipAddress: string, userAgent: string) {
    // Implementation would create secure session
    return 'session-456' // Placeholder
  }

  private async generateEmailVerificationToken(userId: string) {
    // Implementation would generate secure token
    return 'token-789' // Placeholder
  }

  private async verifyCurrentPassword(userId: string, password: string) {
    // Implementation would verify current password
    return true // Placeholder
  }

  private async updatePassword(userId: string, newPassword: string) {
    // Implementation would hash and update password
  }

  private async invalidateOtherSessions(userId: string, currentSessionId: string) {
    // Implementation would invalidate all other sessions
  }

  private async invalidateAllSessions(userId: string) {
    // Implementation would invalidate all sessions
  }

  private async validatePasswordResetToken(token: string) {
    // Implementation would validate reset token
    return null // Placeholder
  }

  private async validateEmailVerificationToken(token: string) {
    // Implementation would validate verification token
    return null // Placeholder
  }

  private async markEmailAsVerified(userId: string) {
    // Implementation would mark email as verified
  }

  private async invalidateSession(sessionId: string) {
    // Implementation would invalidate session
  }

  private async checkForSuspiciousActivity(email: string, ipAddress: string, userAgent: string) {
    // Implementation would check for patterns like:
    // - Multiple failed attempts from same IP
    // - Rapid succession attempts
    // - Attempts from unusual locations
    
    // Example: Check failed attempts in last 15 minutes
    const recentFailures = await this.getRecentFailedAttempts(email, ipAddress, 15)
    
    if (recentFailures >= 5) {
      await securityLogger.logSuspiciousActivity(
        'Multiple failed login attempts detected',
        'HIGH',
        ipAddress,
        userAgent,
        undefined,
        email,
        {
          failedAttempts: recentFailures,
          timeWindow: '15 minutes',
          pattern: 'brute_force_attempt'
        }
      )

      // Trigger account lockout if needed
      await this.lockAccount(email, 'Multiple failed login attempts', 1800) // 30 minutes
    }
  }

  private async getRecentFailedAttempts(email: string, ipAddress: string, minutes: number): Promise<number> {
    // Implementation would query security events for recent failures
    return 0 // Placeholder
  }

  private async lockAccount(email: string, reason: string, duration: number) {
    // Implementation would lock the account
    const ipAddress = 'system'
    const userAgent = 'system'
    
    await securityLogger.logAccountLockout(
      email,
      reason,
      duration,
      ipAddress,
      userAgent,
      undefined,
      {
        automatic: true,
        triggerEvent: 'multiple_failed_attempts'
      }
    )
  }
}

// Example: Integration with Rate Limiter
export class RateLimiterIntegration {
  async checkRateLimit(key: string, limit: number, window: number, req: Request) {
    const ipAddress = this.getClientIP(req)
    const userAgent = req.headers['user-agent'] || 'Unknown'

    try {
      const isAllowed = await this.performRateCheck(key, limit, window)
      
      if (!isAllowed) {
        // Log rate limit violation
        await securityLogger.logSuspiciousActivity(
          'Rate limit exceeded',
          'MEDIUM',
          ipAddress,
          userAgent,
          undefined,
          undefined,
          {
            rateLimitKey: key,
            limit,
            window,
            action: 'blocked'
          }
        )
      }

      return isAllowed
    } catch (error) {
      await securityLogger.logSuspiciousActivity(
        'Rate limiter error',
        'HIGH',
        ipAddress,
        userAgent,
        undefined,
        undefined,
        {
          error: (error as Error).message,
          rateLimitKey: key
        }
      )

      // Fail open or closed based on security policy
      return false // Fail closed for security
    }
  }

  private getClientIP(req: Request): string {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
           'unknown'
  }

  private async performRateCheck(key: string, limit: number, window: number): Promise<boolean> {
    // Implementation would check rate limit using Redis or similar
    return true // Placeholder
  }
}

// Example: Security Monitoring Dashboard Integration
export class SecurityDashboardIntegration {
  async getSecurityOverview(timeRange: { start: Date; end: Date }) {
    try {
      // Get security statistics
      const stats = await securityLogger.generateSecurityReport(
        timeRange.start,
        timeRange.end
      )

      // Get recent critical events
      const criticalEvents = await securityLogger.getSecurityEvents({
        startDate: timeRange.start,
        endDate: timeRange.end,
        success: false,
        limit: 50
      })

      return {
        stats,
        criticalEvents,
        alerts: stats.suspiciousActivity.filter(activity => 
          activity.type === 'brute_force_attempt' || 
          activity.count > 10
        )
      }
    } catch (error) {
      console.error('Failed to generate security overview:', error)
      return {
        stats: null,
        criticalEvents: [],
        alerts: []
      }
    }
  }

  async getSecurityAlerts() {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const now = new Date()

    const report = await securityLogger.generateSecurityReport(last24Hours, now)
    
    return report.suspiciousActivity.map(activity => ({
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: activity.type,
      severity: this.getSeverityFromType(activity.type),
      message: activity.description,
      count: activity.count,
      timestamp: new Date(),
      status: 'active'
    }))
  }

  private getSeverityFromType(type: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (type) {
      case 'brute_force_attempt':
        return 'HIGH'
      case 'password_reset_abuse':
        return 'MEDIUM'
      case 'high_activity_ip':
        return 'MEDIUM'
      default:
        return 'LOW'
    }
  }
}
