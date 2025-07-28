type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  userId?: string
  requestId?: string
  userAgent?: string
  ip?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    }
    return levels[level] >= levels[this.logLevel]
  }

  private formatLog(level: LogLevel, message: string, data?: any, context?: Partial<LogEntry>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      ...context,
    }
  }

  private output(logEntry: LogEntry): void {
    if (this.isDevelopment) {
      // Pretty print for development
      const color = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
      }[logEntry.level]
      
      console.log(
        `${color}[${logEntry.level.toUpperCase()}]\x1b[0m ${logEntry.timestamp} - ${logEntry.message}`,
        logEntry.data ? logEntry.data : ''
      )
    } else {
      // JSON format for production
      console.log(JSON.stringify(logEntry))
    }
  }

  debug(message: string, data?: any, context?: Partial<LogEntry>): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatLog('debug', message, data, context))
    }
  }

  info(message: string, data?: any, context?: Partial<LogEntry>): void {
    if (this.shouldLog('info')) {
      this.output(this.formatLog('info', message, data, context))
    }
  }

  warn(message: string, data?: any, context?: Partial<LogEntry>): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatLog('warn', message, data, context))
    }
  }

  error(message: string, error?: Error | any, context?: Partial<LogEntry>): void {
    if (this.shouldLog('error')) {
      const errorData = error instanceof Error 
        ? { 
            name: error.name, 
            message: error.message, 
            stack: error.stack 
          }
        : error

      this.output(this.formatLog('error', message, errorData, context))
    }
  }

  // Specific logging methods for common scenarios
  apiRequest(method: string, path: string, userId?: string, ip?: string): void {
    this.info(`API Request: ${method} ${path}`, null, { userId, ip })
  }

  apiResponse(method: string, path: string, statusCode: number, duration: number, userId?: string): void {
    this.info(`API Response: ${method} ${path} - ${statusCode} (${duration}ms)`, null, { userId })
  }

  apiError(method: string, path: string, error: Error, userId?: string, ip?: string): void {
    this.error(`API Error: ${method} ${path}`, error, { userId, ip })
  }

  userAction(action: string, userId: string, data?: any): void {
    this.info(`User Action: ${action}`, data, { userId })
  }

  systemEvent(event: string, data?: any): void {
    this.info(`System Event: ${event}`, data)
  }

  performance(operation: string, duration: number, data?: any): void {
    const level = duration > 1000 ? 'warn' : 'info'
    this[level](`Performance: ${operation} took ${duration}ms`, data)
  }

  security(event: string, data?: any, ip?: string): void {
    this.warn(`Security Event: ${event}`, data, { ip })
  }
}

export const logger = new Logger()

// Middleware for request logging
export function withRequestLogging(handler: Function) {
  return async (request: Request, ...args: any[]) => {
    const start = Date.now()
    const method = request.method
    const url = new URL(request.url)
    const path = url.pathname
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'

    logger.apiRequest(method, path, undefined, ip)

    try {
      const response = await handler(request, ...args)
      const duration = Date.now() - start
      const statusCode = response.status || 200
      
      logger.apiResponse(method, path, statusCode, duration)
      
      return response
    } catch (error) {
      const duration = Date.now() - start
      logger.apiError(method, path, error as Error, undefined, ip)
      throw error
    }
  }
}