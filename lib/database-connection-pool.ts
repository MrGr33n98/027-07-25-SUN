import { PrismaClient } from '@prisma/client'
import { logger } from './logger'
import { performanceMonitor } from './performance'

interface ConnectionPoolConfig {
  maxConnections: number
  connectionTimeout: number
  idleTimeout: number
  enableQueryLogging: boolean
  slowQueryThreshold: number
}

interface ConnectionStats {
  activeConnections: number
  idleConnections: number
  totalConnections: number
  queriesExecuted: number
  averageQueryTime: number
  slowQueries: number
  connectionErrors: number
}

class DatabaseConnectionPool {
  private static instance: DatabaseConnectionPool
  private prisma: PrismaClient
  private config: ConnectionPoolConfig
  private stats: ConnectionStats
  private queryTimes: number[] = []
  private connectionStartTime: number

  private constructor() {
    this.connectionStartTime = Date.now()
    this.config = {
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10'),
      connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000'),
      idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '300000'),
      enableQueryLogging: process.env.NODE_ENV === 'development',
      slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'),
    }

    this.stats = {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      queriesExecuted: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      connectionErrors: 0,
    }

    this.initializePrisma()
  }

  static getInstance(): DatabaseConnectionPool {
    if (!DatabaseConnectionPool.instance) {
      DatabaseConnectionPool.instance = new DatabaseConnectionPool()
    }
    return DatabaseConnectionPool.instance
  }

  private initializePrisma(): void {
    try {
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
        log: this.config.enableQueryLogging 
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'event', level: 'error' },
              { emit: 'event', level: 'warn' },
            ]
          : [],
      })

      // Set up event listeners for monitoring
      if (this.config.enableQueryLogging) {
        this.prisma.$on('query', (e) => {
          this.handleQueryEvent(e)
        })

        this.prisma.$on('error', (e) => {
          this.handleErrorEvent(e)
        })

        this.prisma.$on('warn', (e) => {
          logger.warn('Database warning', e)
        })
      }

      logger.info('Database connection pool initialized', {
        maxConnections: this.config.maxConnections,
        connectionTimeout: this.config.connectionTimeout,
        idleTimeout: this.config.idleTimeout,
      })
    } catch (error) {
      logger.error('Failed to initialize database connection pool', error)
      this.stats.connectionErrors++
      throw error
    }
  }

  private handleQueryEvent(event: any): void {
    const duration = parseInt(event.duration)
    this.stats.queriesExecuted++
    this.queryTimes.push(duration)

    // Keep only last 1000 query times for average calculation
    if (this.queryTimes.length > 1000) {
      this.queryTimes = this.queryTimes.slice(-1000)
    }

    // Update average query time
    this.stats.averageQueryTime = 
      this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length

    // Track slow queries
    if (duration > this.config.slowQueryThreshold) {
      this.stats.slowQueries++
      logger.warn('Slow query detected', {
        query: event.query,
        duration: `${duration}ms`,
        params: event.params,
      })

      // Record performance metric
      performanceMonitor.recordMetric({
        name: 'slow_database_query',
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { query: event.query.substring(0, 100) },
      })
    }

    // Log query details in development
    if (this.config.enableQueryLogging && process.env.NODE_ENV === 'development') {
      logger.debug('Database query executed', {
        query: event.query,
        duration: `${duration}ms`,
        params: event.params,
      })
    }
  }

  private handleErrorEvent(event: any): void {
    this.stats.connectionErrors++
    logger.error('Database error', event)

    // Record error metric
    performanceMonitor.recordMetric({
      name: 'database_error',
      value: 1,
      unit: 'count',
      timestamp: Date.now(),
      tags: { error: event.message?.substring(0, 100) || 'unknown' },
    })
  }

  // Execute query with performance monitoring
  async executeQuery<T>(
    queryName: string,
    queryFn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return performanceMonitor.measureDbQuery(queryName, async () => {
      try {
        this.stats.activeConnections++
        const result = await queryFn(this.prisma)
        return result
      } catch (error) {
        this.stats.connectionErrors++
        logger.error(`Database query failed: ${queryName}`, error)
        throw error
      } finally {
        this.stats.activeConnections--
      }
    })
  }

  // Optimized user queries
  async findUserByEmail(email: string) {
    return this.executeQuery('find_user_by_email', async (prisma) => {
      return prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          emailVerified: true,
          emailVerificationToken: true,
          emailVerificationExpiry: true,
          passwordResetToken: true,
          passwordResetExpiry: true,
          failedLoginAttempts: true,
          accountLockedUntil: true,
          lastLoginAt: true,
          lastLoginIP: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    })
  }

  async findUserById(id: string) {
    return this.executeQuery('find_user_by_id', async (prisma) => {
      return prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          role: true,
          lastLoginAt: true,
          failedLoginAttempts: true,
          accountLockedUntil: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    })
  }

  // Batch operations for better performance
  async batchUpdateUsers(updates: Array<{
    id: string
    data: any
  }>) {
    return this.executeQuery('batch_update_users', async (prisma) => {
      return prisma.$transaction(
        updates.map(update =>
          prisma.user.update({
            where: { id: update.id },
            data: update.data,
          })
        )
      )
    })
  }

  async batchCreateSecurityEvents(events: Array<{
    userId?: string
    email?: string
    eventType: string
    success: boolean
    ipAddress: string
    userAgent: string
    details?: any
  }>) {
    return this.executeQuery('batch_create_security_events', async (prisma) => {
      return prisma.securityEvent.createMany({
        data: events.map(event => ({
          ...event,
          timestamp: new Date(),
        })),
      })
    })
  }

  // Connection health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    connectionTime: number
    stats: ConnectionStats
    uptime: number
  }> {
    const startTime = Date.now()
    
    try {
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1`
      const connectionTime = Date.now() - startTime
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      
      // Determine health status based on metrics
      if (connectionTime > 5000 || this.stats.connectionErrors > 10) {
        status = 'unhealthy'
      } else if (connectionTime > 1000 || this.stats.slowQueries > 5) {
        status = 'degraded'
      }

      return {
        status,
        connectionTime,
        stats: { ...this.stats },
        uptime: Date.now() - this.connectionStartTime,
      }
    } catch (error) {
      logger.error('Database health check failed', error)
      return {
        status: 'unhealthy',
        connectionTime: Date.now() - startTime,
        stats: { ...this.stats },
        uptime: Date.now() - this.connectionStartTime,
      }
    }
  }

  // Get connection statistics
  getStats(): ConnectionStats {
    return { ...this.stats }
  }

  // Reset statistics
  resetStats(): void {
    this.stats = {
      activeConnections: this.stats.activeConnections, // Keep current active connections
      idleConnections: 0,
      totalConnections: 0,
      queriesExecuted: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      connectionErrors: 0,
    }
    this.queryTimes = []
  }

  // Optimize database performance
  async optimizePerformance(): Promise<{
    indexesCreated: number
    queriesOptimized: number
    recommendations: string[]
  }> {
    const recommendations: string[] = []
    let indexesCreated = 0
    let queriesOptimized = 0

    try {
      // Check for missing indexes on frequently queried columns
      const indexQueries = [
        // User table indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON "User"(email)`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_verified ON "User"(email, "emailVerified")`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_failed_attempts ON "User"("failedLoginAttempts", "accountLockedUntil")`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON "User"("lastLoginAt")`,
        
        // Security events indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_user_id ON "SecurityEvent"("userId", "timestamp")`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_email ON "SecurityEvent"(email, "timestamp")`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_type ON "SecurityEvent"("eventType", "timestamp")`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_events_ip ON "SecurityEvent"("ipAddress", "timestamp")`,
        
        // Session indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_id ON "Session"("userId", "expiresAt")`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token ON "Session"(token)`,
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires ON "Session"("expiresAt")`,
      ]

      for (const query of indexQueries) {
        try {
          await this.prisma.$executeRawUnsafe(query)
          indexesCreated++
        } catch (error) {
          // Index might already exist, which is fine
          if (!error.message?.includes('already exists')) {
            logger.warn('Failed to create index', { query, error: error.message })
          }
        }
      }

      // Analyze query performance
      if (this.stats.slowQueries > 0) {
        recommendations.push(`${this.stats.slowQueries} slow queries detected. Consider query optimization.`)
      }

      if (this.stats.averageQueryTime > 100) {
        recommendations.push(`Average query time is ${this.stats.averageQueryTime.toFixed(2)}ms. Consider adding indexes.`)
      }

      if (this.stats.connectionErrors > 0) {
        recommendations.push(`${this.stats.connectionErrors} connection errors detected. Check database connectivity.`)
      }

      // Update table statistics for query planner
      try {
        await this.prisma.$executeRaw`ANALYZE "User"`
        await this.prisma.$executeRaw`ANALYZE "SecurityEvent"`
        await this.prisma.$executeRaw`ANALYZE "Session"`
        queriesOptimized += 3
      } catch (error) {
        logger.warn('Failed to update table statistics', error)
      }

      logger.info('Database performance optimization completed', {
        indexesCreated,
        queriesOptimized,
        recommendations: recommendations.length,
      })

      return {
        indexesCreated,
        queriesOptimized,
        recommendations,
      }
    } catch (error) {
      logger.error('Database performance optimization failed', error)
      throw error
    }
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect()
      logger.info('Database connection pool disconnected')
    } catch (error) {
      logger.error('Error disconnecting from database', error)
    }
  }

  // Get Prisma client for direct access when needed
  getPrismaClient(): PrismaClient {
    return this.prisma
  }
}

export const dbPool = DatabaseConnectionPool.getInstance()

// Export commonly used database operations
export const db = dbPool.getPrismaClient()

// Graceful shutdown handler
process.on('SIGINT', async () => {
  await dbPool.disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await dbPool.disconnect()
  process.exit(0)
})