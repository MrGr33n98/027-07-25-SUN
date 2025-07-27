type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  userId?: string
  sessionId?: string
  userAgent?: string
  ip?: string
  metadata?: Record<string, any>
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    
    return levels[level] >= levels[this.logLevel]
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, userId, sessionId, metadata } = entry
    
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`
    
    if (userId) logMessage += ` | User: ${userId}`
    if (sessionId) logMessage += ` | Session: ${sessionId}`
    if (metadata) logMessage += ` | Metadata: ${JSON.stringify(metadata)}`
    
    return logMessage
  }

  private async persistLog(entry: LogEntry) {
    // In production, you might want to send logs to a service like:
    // - Vercel Analytics
    // - Sentry
    // - LogRocket
    // - Custom logging service
    
    if (this.isDevelopment) {
      console.log(this.formatLog(entry))
      return
    }

    // Example: Send to external logging service
    try {
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // })
    } catch (error) {
      console.error('Failed to persist log:', error)
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    context?: {
      userId?: string
      sessionId?: string
      userAgent?: string
      ip?: string
    }
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      userId: context?.userId,
      sessionId: context?.sessionId,
      userAgent: context?.userAgent,
      ip: context?.ip,
      metadata
    }
  }

  debug(message: string, metadata?: Record<string, any>, context?: any) {
    if (!this.shouldLog('debug')) return
    
    const entry = this.createLogEntry('debug', message, metadata, context)
    this.persistLog(entry)
  }

  info(message: string, metadata?: Record<string, any>, context?: any) {
    if (!this.shouldLog('info')) return
    
    const entry = this.createLogEntry('info', message, metadata, context)
    this.persistLog(entry)
  }

  warn(message: string, metadata?: Record<string, any>, context?: any) {
    if (!this.shouldLog('warn')) return
    
    const entry = this.createLogEntry('warn', message, metadata, context)
    this.persistLog(entry)
  }

  error(message: string, error?: Error, metadata?: Record<string, any>, context?: any) {
    if (!this.shouldLog('error')) return
    
    const errorMetadata = {
      ...metadata,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    }
    
    const entry = this.createLogEntry('error', message, errorMetadata, context)
    this.persistLog(entry)
  }

  // Specific logging methods for common scenarios
  userAction(
    action: string,
    userId: string,
    metadata?: Record<string, any>,
    context?: any
  ) {
    this.info(`User action: ${action}`, metadata, { ...context, userId })
  }

  apiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    context?: any
  ) {
    const level = statusCode >= 400 ? 'error' : 'info'
    const message = `${method} ${path} - ${statusCode} (${duration}ms)`
    
    this[level](message, { method, path, statusCode, duration }, { ...context, userId })
  }

  databaseQuery(
    query: string,
    duration: number,
    metadata?: Record<string, any>
  ) {
    this.debug(`Database query: ${query} (${duration}ms)`, metadata)
  }

  authEvent(
    event: 'login' | 'logout' | 'register' | 'failed_login',
    userId?: string,
    metadata?: Record<string, any>,
    context?: any
  ) {
    this.info(`Auth event: ${event}`, metadata, { ...context, userId })
  }

  businessEvent(
    event: string,
    metadata?: Record<string, any>,
    context?: any
  ) {
    this.info(`Business event: ${event}`, metadata, context)
  }
}

export const logger = new Logger()

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTimer(label: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
    }
  }

  recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    
    const values = this.metrics.get(label)!
    values.push(value)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
    
    // Log slow operations
    if (value > 1000) { // > 1 second
      logger.warn(`Slow operation detected: ${label}`, { duration: value })
    }
  }

  getMetrics(label: string) {
    const values = this.metrics.get(label) || []
    if (values.length === 0) return null
    
    const sorted = [...values].sort((a, b) => a - b)
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length
    const p50 = sorted[Math.floor(sorted.length * 0.5)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]
    
    return {
      count: values.length,
      avg: Math.round(avg),
      min: Math.round(sorted[0]),
      max: Math.round(sorted[sorted.length - 1]),
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99)
    }
  }

  getAllMetrics() {
    const result: Record<string, any> = {}
    for (const [label] of this.metrics) {
      result[label] = this.getMetrics(label)
    }
    return result
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

// Middleware helper for API routes
export function withLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  label: string
) {
  return async (...args: T): Promise<R> => {
    const stopTimer = performanceMonitor.startTimer(label)
    const start = Date.now()
    
    try {
      const result = await fn(...args)
      const duration = Date.now() - start
      
      logger.info(`${label} completed successfully`, { duration })
      return result
    } catch (error) {
      const duration = Date.now() - start
      
      logger.error(`${label} failed`, error as Error, { duration })
      throw error
    } finally {
      stopTimer()
    }
  }
}