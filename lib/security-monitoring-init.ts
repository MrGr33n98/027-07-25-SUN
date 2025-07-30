import { securityScheduler } from './security-monitoring-scheduler'
import { logger, LogCategory } from './logger'

/**
 * Initialize security monitoring system
 * This should be called when the application starts
 */
export async function initializeSecurityMonitoring(): Promise<void> {
  try {
    // Check if security monitoring should be enabled
    const enableMonitoring = process.env.ENABLE_SECURITY_MONITORING !== 'false'
    const monitoringInterval = parseInt(process.env.SECURITY_MONITORING_INTERVAL_MINUTES || '5')

    if (!enableMonitoring) {
      await logger.info(
        LogCategory.SECURITY,
        'Security monitoring is disabled via environment variable'
      )
      return
    }

    // Validate admin emails are configured
    const adminEmails = process.env.SECURITY_ADMIN_EMAILS
    if (!adminEmails) {
      await logger.warn(
        LogCategory.SECURITY,
        'SECURITY_ADMIN_EMAILS not configured - security alerts will not be sent'
      )
    }

    // Start the security monitoring scheduler
    await securityScheduler.start(monitoringInterval)

    await logger.info(
      LogCategory.SECURITY,
      'Security monitoring system initialized successfully',
      {
        monitoringInterval,
        adminEmailsConfigured: !!adminEmails
      }
    )
  } catch (error) {
    await logger.error(
      LogCategory.SECURITY,
      'Failed to initialize security monitoring system',
      error as Error
    )
    
    // Don't throw the error to prevent application startup failure
    // Security monitoring is important but not critical for basic functionality
  }
}

/**
 * Shutdown security monitoring system
 * This should be called when the application shuts down
 */
export async function shutdownSecurityMonitoring(): Promise<void> {
  try {
    await securityScheduler.stop()
    
    await logger.info(
      LogCategory.SECURITY,
      'Security monitoring system shutdown completed'
    )
  } catch (error) {
    await logger.error(
      LogCategory.SECURITY,
      'Error during security monitoring shutdown',
      error as Error
    )
  }
}

/**
 * Health check for security monitoring system
 */
export function getSecurityMonitoringHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy'
  details: Record<string, any>
} {
  try {
    const schedulerStatus = securityScheduler.getStatus()
    const adminEmailsConfigured = !!process.env.SECURITY_ADMIN_EMAILS
    const enableMonitoring = process.env.ENABLE_SECURITY_MONITORING !== 'false'

    if (!enableMonitoring) {
      return {
        status: 'degraded',
        details: {
          enabled: false,
          reason: 'Security monitoring disabled via configuration'
        }
      }
    }

    if (!schedulerStatus.isRunning) {
      return {
        status: 'unhealthy',
        details: {
          enabled: true,
          schedulerRunning: false,
          adminEmailsConfigured,
          reason: 'Security monitoring scheduler is not running'
        }
      }
    }

    if (!adminEmailsConfigured) {
      return {
        status: 'degraded',
        details: {
          enabled: true,
          schedulerRunning: true,
          adminEmailsConfigured: false,
          reason: 'Admin emails not configured - alerts will not be sent'
        }
      }
    }

    return {
      status: 'healthy',
      details: {
        enabled: true,
        schedulerRunning: true,
        adminEmailsConfigured: true,
        intervalMinutes: schedulerStatus.intervalMinutes,
        nextRunTime: schedulerStatus.nextRunTime
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: 'Failed to check security monitoring health',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}