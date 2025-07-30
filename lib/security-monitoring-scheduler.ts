import { securityMonitoring } from './security-monitoring'
import { logger, LogCategory } from './logger'

export class SecurityMonitoringScheduler {
  private static instance: SecurityMonitoringScheduler
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false
  private monitoringIntervalMinutes = 5 // Default: check every 5 minutes

  static getInstance(): SecurityMonitoringScheduler {
    if (!SecurityMonitoringScheduler.instance) {
      SecurityMonitoringScheduler.instance = new SecurityMonitoringScheduler()
    }
    return SecurityMonitoringScheduler.instance
  }

  /**
   * Start the security monitoring scheduler
   */
  async start(intervalMinutes: number = 5): Promise<void> {
    if (this.isRunning) {
      await logger.warn(
        LogCategory.SECURITY,
        'Security monitoring scheduler is already running'
      )
      return
    }

    this.monitoringIntervalMinutes = intervalMinutes
    this.isRunning = true

    await logger.info(
      LogCategory.SECURITY,
      `Starting security monitoring scheduler with ${intervalMinutes} minute intervals`
    )

    // Run initial monitoring cycle
    await this.runMonitoringCycle()

    // Schedule recurring monitoring
    this.intervalId = setInterval(async () => {
      await this.runMonitoringCycle()
    }, intervalMinutes * 60 * 1000)
  }

  /**
   * Stop the security monitoring scheduler
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.isRunning = false

    await logger.info(
      LogCategory.SECURITY,
      'Security monitoring scheduler stopped'
    )
  }

  /**
   * Run a single monitoring cycle
   */
  private async runMonitoringCycle(): Promise<void> {
    try {
      await logger.info(
        LogCategory.SECURITY,
        'Starting security monitoring cycle'
      )

      await securityMonitoring.startRealTimeMonitoring()

      await logger.info(
        LogCategory.SECURITY,
        'Security monitoring cycle completed successfully'
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
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean
    intervalMinutes: number
    nextRunTime?: Date
  } {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.monitoringIntervalMinutes,
      nextRunTime: this.intervalId 
        ? new Date(Date.now() + this.monitoringIntervalMinutes * 60 * 1000)
        : undefined
    }
  }

  /**
   * Force run monitoring cycle immediately
   */
  async runNow(): Promise<void> {
    await logger.info(
      LogCategory.SECURITY,
      'Running security monitoring cycle on demand'
    )
    await this.runMonitoringCycle()
  }
}

// Export singleton instance
export const securityScheduler = SecurityMonitoringScheduler.getInstance()