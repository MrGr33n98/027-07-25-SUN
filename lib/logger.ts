import { prisma } from './prisma'

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export enum LogCategory {
  AUTH = 'AUTH',
  API = 'API',
  DATABASE = 'DATABASE',
  CACHE = 'CACHE',
  PAYMENT = 'PAYMENT',
  EMAIL = 'EMAIL',
  ADMIN = 'ADMIN',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  USER_ACTION = 'USER_ACTION',
  SYSTEM = 'SYSTEM'
}

export interface LogEntry {
  level: LogLevel
  category: LogCategory
  message: string
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  metadata?: Record<string, any>
  timestamp?: Date
  requestId?: string
  duration?: number
  error?: Error
}

export class Logger {
  private static instance: Logger
  private requestId: string | null = null

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  setRequestId(requestId: string) {
    this.requestId = requestId
  }

  async log(entry: LogEntry): Promise<void> {
    const logEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date(),
      requestId: entry.requestId || this.requestId
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(logEntry)
    }

    // Database logging for important events
    if (this.shouldPersist(entry.level, entry.category)) {
      await this.persistLog(logEntry)
    }

    // External logging service (e.g., Sentry, LogRocket)
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      await this.sendToExternalService(logEntry)
    }
  }

  async debug(category: LogCategory, message: string, metadata?: Record<string, any>) {
    await this.log({ level: LogLevel.DEBUG, category, message, metadata })
  }

  async info(category: LogCategory, message: string, metadata?: Record<string, any>) {
    await this.log({ level: LogLevel.INFO, category, message, metadata })
  }

  async warn(category: LogCategory, message: string, metadata?: Record<string, any>) {
    await this.log({ level: LogLevel.WARN, category, message, metadata })
  }

  async error(category: LogCategory, message: string, error?: Error, metadata?: Record<string, any>) {
    await this.log({ level: LogLevel.ERROR, category, message, error, metadata })
  }

  async fatal(category: LogCategory, message: string, error?: Error, metadata?: Record<string, any>) {
    await this.log({ level: LogLevel.FATAL, category, message, error, metadata })
  }

  // Specific logging methods for common scenarios
  async logUserAction(userId: string, action: string, metadata?: Record<string, any>) {
    await this.info(LogCategory.USER_ACTION, `User ${userId} performed: ${action}`, {
      userId,
      action,
      ...metadata
    })
  }

  async logAPIRequest(method: string, path: string, statusCode: number, duration: number, userId?: string) {
    await this.info(LogCategory.API, `${method} ${path} - ${statusCode}`, {
      method,
      path,
      statusCode,
      duration,
      userId
    })
  }

  async logAuthEvent(event: string, userId?: string, success: boolean = true, metadata?: Record<string, any>) {
    const level = success ? LogLevel.INFO : LogLevel.WARN
    await this.log({
      level,
      category: LogCategory.AUTH,
      message: `Auth event: ${event}`,
      userId,
      metadata: { event, success, ...metadata }
    })
  }

  async logSecurityEvent(event: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', metadata?: Record<string, any>) {
    const level = severity === 'CRITICAL' ? LogLevel.FATAL : 
                  severity === 'HIGH' ? LogLevel.ERROR :
                  severity === 'MEDIUM' ? LogLevel.WARN : LogLevel.INFO

    await this.log({
      level,
      category: LogCategory.SECURITY,
      message: `Security event: ${event}`,
      metadata: { event, severity, ...metadata }
    })
  }

  async logPerformance(operation: string, duration: number, metadata?: Record<string, any>) {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO
    await this.log({
      level,
      category: LogCategory.PERFORMANCE,
      message: `Performance: ${operation} took ${duration}ms`,
      duration,
      metadata: { operation, ...metadata }
    })
  }

  async logPayment(event: string, amount?: number, currency?: string, userId?: string, metadata?: Record<string, any>) {
    await this.info(LogCategory.PAYMENT, `Payment event: ${event}`, {
      event,
      amount,
      currency,
      userId,
      ...metadata
    })
  }

  private consoleLog(entry: LogEntry) {
    const timestamp = entry.timestamp?.toISOString()
    const prefix = `[${timestamp}] [${entry.level}] [${entry.category}]`
    
    const logData = {
      message: entry.message,
      ...(entry.userId && { userId: entry.userId }),
      ...(entry.requestId && { requestId: entry.requestId }),
      ...(entry.duration && { duration: `${entry.duration}ms` }),
      ...(entry.metadata && { metadata: entry.metadata })
    }

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, logData)
        break
      case LogLevel.INFO:
        console.info(prefix, logData)
        break
      case LogLevel.WARN:
        console.warn(prefix, logData)
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, logData, entry.error)
        break
    }
  }

  private async persistLog(entry: LogEntry): Promise<void> {
    try {
      await prisma.systemLog.create({
        data: {
          level: entry.level,
          category: entry.category,
          message: entry.message,
          userId: entry.userId,
          sessionId: entry.sessionId,
          ip: entry.ip,
          userAgent: entry.userAgent,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
          requestId: entry.requestId,
          duration: entry.duration,
          errorStack: entry.error?.stack,
          timestamp: entry.timestamp || new Date()
        }
      })
    } catch (error) {
      // Don't let logging errors break the application
      console.error('Failed to persist log:', error)
    }
  }

  private shouldPersist(level: LogLevel, category: LogCategory): boolean {
    // Always persist errors and security events
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      return true
    }

    if (category === LogCategory.SECURITY || category === LogCategory.PAYMENT) {
      return true
    }

    // Persist auth events and admin actions
    if (category === LogCategory.AUTH || category === LogCategory.ADMIN) {
      return true
    }

    // In production, only persist important events
    if (process.env.NODE_ENV === 'production') {
      return level === LogLevel.WARN || level === LogLevel.ERROR || level === LogLevel.FATAL
    }

    // In development, persist more events
    return level !== LogLevel.DEBUG
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    try {
      // Example: Send to Sentry
      if (process.env.SENTRY_DSN && entry.error) {
        // Sentry integration would go here
        console.log('Would send to Sentry:', entry)
      }

      // Example: Send to custom logging service
      if (process.env.EXTERNAL_LOG_ENDPOINT) {
        // External service integration would go here
        console.log('Would send to external service:', entry)
      }
    } catch (error) {
      console.error('Failed to send log to external service:', error)
    }
  }

  // Utility methods for structured logging
  async logWithContext(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context: {
      userId?: string
      sessionId?: string
      ip?: string
      userAgent?: string
      requestId?: string
    },
    metadata?: Record<string, any>
  ) {
    await this.log({
      level,
      category,
      message,
      ...context,
      metadata
    })
  }

  // Method to get recent logs for admin dashboard
  async getRecentLogs(
    limit: number = 100,
    level?: LogLevel,
    category?: LogCategory,
    userId?: string
  ) {
    try {
      const where: any = {}
      
      if (level) where.level = level
      if (category) where.category = category
      if (userId) where.userId = userId

      return await prisma.systemLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        select: {
          id: true,
          level: true,
          category: true,
          message: true,
          userId: true,
          ip: true,
          timestamp: true,
          duration: true,
          metadata: true
        }
      })
    } catch (error) {
      console.error('Failed to get recent logs:', error)
      return []
    }
  }

  // Method to get log statistics
  async getLogStats(hours: number = 24) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000)

      const stats = await prisma.systemLog.groupBy({
        by: ['level', 'category'],
        where: {
          timestamp: { gte: since }
        },
        _count: true
      })

      return stats.reduce((acc, stat) => {
        if (!acc[stat.level]) acc[stat.level] = {}
        acc[stat.level][stat.category] = stat._count
        return acc
      }, {} as Record<string, Record<string, number>>)
    } catch (error) {
      console.error('Failed to get log stats:', error)
      return {}
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Middleware helper for request logging
export function createRequestLogger(req: any) {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  logger.setRequestId(requestId)
  
  return {
    requestId,
    logRequest: (method: string, path: string, statusCode: number, duration: number, userId?: string) => {
      logger.logAPIRequest(method, path, statusCode, duration, userId)
    },
    logError: (error: Error, context?: Record<string, any>) => {
      logger.error(LogCategory.API, `Request error: ${error.message}`, error, {
        requestId,
        ...context
      })
    }
  }
}