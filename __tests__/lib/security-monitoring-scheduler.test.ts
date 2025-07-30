import { SecurityMonitoringScheduler } from '../../lib/security-monitoring-scheduler'
import { securityMonitoring } from '../../lib/security-monitoring'

// Mock dependencies
jest.mock('../../lib/security-monitoring', () => ({
  securityMonitoring: {
    startRealTimeMonitoring: jest.fn()
  }
}))

jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  LogCategory: {
    SECURITY: 'SECURITY'
  }
}))

const securityMonitoringMock = securityMonitoring as jest.Mocked<typeof securityMonitoring>;

describe('SecurityMonitoringScheduler', () => {
  let scheduler: SecurityMonitoringScheduler

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    scheduler = SecurityMonitoringScheduler.getInstance()
  })

  afterEach(async () => {
    await scheduler.stop()
    jest.useRealTimers()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SecurityMonitoringScheduler.getInstance()
      const instance2 = SecurityMonitoringScheduler.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('start', () => {
    it('should start monitoring with default interval', async () => {
      securityMonitoringMock.startRealTimeMonitoring.mockResolvedValue(undefined)

      await scheduler.start()

      const status = scheduler.getStatus()
      expect(status.isRunning).toBe(true)
      expect(status.intervalMinutes).toBe(5)
      expect(securityMonitoringMock.startRealTimeMonitoring).toHaveBeenCalledTimes(1)
    })

    it('should start monitoring with custom interval', async () => {
      securityMonitoringMock.startRealTimeMonitoring.mockResolvedValue(undefined)

      await scheduler.start(10)

      const status = scheduler.getStatus()
      expect(status.isRunning).toBe(true)
      expect(status.intervalMinutes).toBe(10)
    })

    it('should not start if already running', async () => {
      securityMonitoringMock.startRealTimeMonitoring.mockResolvedValue(undefined)

      await scheduler.start()
      await scheduler.start() // Second call

      // Should only be called once from the first start
      expect(securityMonitoringMock.startRealTimeMonitoring).toHaveBeenCalledTimes(1)
    })

    it('should run monitoring cycles at specified intervals', async () => {
      securityMonitoringMock.startRealTimeMonitoring.mockResolvedValue(undefined)

      await scheduler.start(1) // 1 minute interval

      // Fast-forward time by 2 minutes
      jest.advanceTimersByTime(2 * 60 * 1000)

      // Should have run initial cycle + 2 more cycles
      expect(securityMonitoringMock.startRealTimeMonitoring).toHaveBeenCalledTimes(3)
    })
  })

  describe('stop', () => {
    it('should stop monitoring', async () => {
      securityMonitoringMock.startRealTimeMonitoring.mockResolvedValue(undefined)

      await scheduler.start()
      expect(scheduler.getStatus().isRunning).toBe(true)

      await scheduler.stop()
      expect(scheduler.getStatus().isRunning).toBe(false)
    })

    it('should handle stop when not running', async () => {
      // Should not throw
      await expect(scheduler.stop()).resolves.not.toThrow()
    })

    it('should clear interval when stopped', async () => {
      securityMonitoringMock.startRealTimeMonitoring.mockResolvedValue(undefined)

      await scheduler.start(1)
      
      // Fast-forward to trigger one interval
      jest.advanceTimersByTime(60 * 1000)
      expect(securityMonitoringMock.startRealTimeMonitoring).toHaveBeenCalledTimes(2)

      await scheduler.stop()

      // Fast-forward more time - should not trigger more calls
      jest.advanceTimersByTime(60 * 1000)
      expect(securityMonitoringMock.startRealTimeMonitoring).toHaveBeenCalledTimes(2)
    })
  })

  describe('runNow', () => {
    it('should run monitoring cycle immediately', async () => {
      securityMonitoringMock.startRealTimeMonitoring.mockResolvedValue(undefined)

      await scheduler.runNow()

      expect(securityMonitoringMock.startRealTimeMonitoring).toHaveBeenCalledTimes(1)
    })

    it('should work even when scheduler is not running', async () => {
      securityMonitoringMock.startRealTimeMonitoring.mockResolvedValue(undefined)

      await scheduler.runNow()

      expect(securityMonitoringMock.startRealTimeMonitoring).toHaveBeenCalledTimes(1)
      expect(scheduler.getStatus().isRunning).toBe(false)
    })
  })

  describe('getStatus', () => {
    it('should return correct status when not running', () => {
      const status = scheduler.getStatus()

      expect(status.isRunning).toBe(false)
      expect(status.intervalMinutes).toBe(5) // default
      expect(status.nextRunTime).toBeUndefined()
    })

    it('should return correct status when running', async () => {
      securityMonitoringMock.startRealTimeMonitoring.mockResolvedValue(undefined)

      await scheduler.start(10)

      const status = scheduler.getStatus()

      expect(status.isRunning).toBe(true)
      expect(status.intervalMinutes).toBe(10)
      expect(status.nextRunTime).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle monitoring errors gracefully', async () => {
      securityMonitoringMock.startRealTimeMonitoring.mockRejectedValue(new Error('Monitoring failed'))

      // Should not throw
      await expect(scheduler.start()).resolves.not.toThrow()

      const status = scheduler.getStatus()
      expect(status.isRunning).toBe(true) // Should still be running despite error
    })

    it('should continue running after monitoring errors', async () => {
      securityMonitoringMock.startRealTimeMonitoring
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(undefined)

      await scheduler.start(1)

      // Fast-forward to trigger interval
      jest.advanceTimersByTime(60 * 1000)

      // Should have been called twice (initial + interval) despite first error
      expect(securityMonitoringMock.startRealTimeMonitoring).toHaveBeenCalledTimes(2)
      expect(scheduler.getStatus().isRunning).toBe(true)
    })

    it('should handle runNow errors gracefully', async () => {
      securityMonitoringMock.startRealTimeMonitoring.mockRejectedValue(new Error('Run now failed'))

      // Should not throw
      await expect(scheduler.runNow()).resolves.not.toThrow()
    })
  })
})