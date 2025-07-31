import { db } from './db'
import { performanceMonitor } from './performance'
import { logger } from './logger'
import { cache, CacheKeys, CacheTags } from './cache-manager'

interface QueryOptimizationConfig {
  enableQueryLogging: boolean
  slowQueryThreshold: number // milliseconds
  enableIndexHints: boolean
  enableQueryCache: boolean
}

class DatabaseOptimizer {
  private config: QueryOptimizationConfig

  constructor(config: Partial<QueryOptimizationConfig> = {}) {
    this.config = {
      enableQueryLogging: config.enableQueryLogging ?? process.env.NODE_ENV === 'development',
      slowQueryThreshold: config.slowQueryThreshold ?? 1000,
      enableIndexHints: config.enableIndexHints ?? true,
      enableQueryCache: config.enableQueryCache ?? true,
      ...config,
    }
  }

  // Optimized user queries with proper indexing
  async findUserByEmail(email: string) {
    return performanceMonitor.measureDbQuery('find_user_by_email', async () => {
      return db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          emailVerified: true,
          failedLoginAttempts: true,
          accountLockedUntil: true,
          lastLoginAt: true,
          role: true,
        },
      })
    })
  }

  // Optimized company queries with pagination and filtering
  async findCompaniesOptimized(filters: {
    city?: string
    state?: string
    verified?: boolean
    specialties?: string[]
    limit?: number
    offset?: number
  }) {
    const cacheKey = CacheKeys.companies.list(filters)
    const ttl = 300 // 5 minutes

    const fetchFn = () => performanceMonitor.measureDbQuery('find_companies_optimized', async () => {
      const where: any = {}

      if (filters.city) where.city = filters.city
      if (filters.state) where.state = filters.state
      if (filters.verified !== undefined) where.verified = filters.verified
      if (filters.specialties?.length) {
        where.specialties = {
          hasSome: filters.specialties,
        }
      }

      return await db.companyProfile.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          rating: true,
          reviewCount: true,
          location: true,
          city: true,
          state: true,
          verified: true,
          specialties: true,
          yearsExperience: true,
          projectsCompleted: true,
        },
        orderBy: [
          { verified: 'desc' },
          { rating: 'desc' },
          { reviewCount: 'desc' },
        ],
        take: filters.limit || 20,
        skip: filters.offset || 0,
      })
    })

    if (this.config.enableQueryCache) {
      return cache.get(cacheKey, fetchFn, {
        ttl,
        tags: [CacheTags.COMPANIES]
      })
    }

    return fetchFn()
  }

  // Optimized product queries with proper indexing
  async findProductsOptimized(filters: {
    category?: string
    companyId?: string
    inStock?: boolean
    minPrice?: number
    maxPrice?: number
    limit?: number
    offset?: number
  }) {
    const cacheKey = CacheKeys.products.list(filters)
    const ttl = 600 // 10 minutes

    const fetchFn = () => performanceMonitor.measureDbQuery('find_products_optimized', async () => {
      const where: any = { status: 'APPROVED' }

      if (filters.category) where.category = filters.category
      if (filters.companyId) where.companyId = filters.companyId
      if (filters.inStock !== undefined) where.inStock = filters.inStock
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        where.price = {}
        if (filters.minPrice !== undefined) where.price.gte = filters.minPrice
        if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice
      }

      return await db.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          originalPrice: true,
          power: true,
          efficiency: true,
          warranty: true,
          inStock: true,
          images: true,
          category: true,
          brand: true,
          model: true,
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              verified: true,
              rating: true,
            },
          },
        },
        orderBy: [
          { company: { verified: 'desc' } },
          { company: { rating: 'desc' } },
          { createdAt: 'desc' },
        ],
        take: filters.limit || 20,
        skip: filters.offset || 0,
      })
    })

    if (this.config.enableQueryCache) {
      return cache.get(cacheKey, fetchFn, {
        ttl,
        tags: [CacheTags.PRODUCTS]
      })
    }

    return fetchFn()
  }

  // Batch operations for better performance
  async batchUpdateUserLoginInfo(updates: Array<{
    userId: string
    lastLoginAt: Date
    lastLoginIP: string
    failedLoginAttempts?: number
  }>) {
    return performanceMonitor.measureDbQuery('batch_update_user_login', async () => {
      const promises = updates.map(update =>
        db.user.update({
          where: { id: update.userId },
          data: {
            lastLoginAt: update.lastLoginAt,
            lastLoginIP: update.lastLoginIP,
            failedLoginAttempts: update.failedLoginAttempts ?? 0,
          },
        })
      )
      
      return Promise.all(promises)
    })
  }

  // Optimized security event logging with batch inserts
  async batchCreateSecurityEvents(events: Array<{
    userId?: string
    email?: string
    eventType: string
    success: boolean
    ipAddress: string
    userAgent: string
    details?: any
  }>) {
    return performanceMonitor.measureDbQuery('batch_create_security_events', async () => {
      return db.securityEvent.createMany({
        data: events.map(event => ({
          ...event,
          timestamp: new Date(),
        })),
      })
    })
  }

  // Database health check and optimization suggestions
  async getDatabaseHealth() {
    const startTime = Date.now()
    
    try {
      // Test basic connectivity
      await db.$queryRaw`SELECT 1`
      const connectionTime = Date.now() - startTime

      // Get table sizes and row counts
      const tableStats = await this.getTableStatistics()
      
      // Check for slow queries from performance monitor
      const performanceReport = performanceMonitor.generateReport()
      const slowQueries = performanceReport.slowQueries.filter(q => 
        q.name.startsWith('db_query_') && q.value > this.config.slowQueryThreshold
      )

      return {
        status: 'healthy',
        connectionTime,
        tableStats,
        slowQueries: slowQueries.length
      }
    } catch (error) {
      logger.error('Database health check failed', error)
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        connectionTime: Date.now() - startTime,
      }
    }
  }

  private async getTableStatistics() {
    try {
      const stats = await db.$queryRaw<Array<{
        table_name: string
        row_count: bigint
        table_size: string
      }>>`
        SELECT 
          schemaname,
          tablename as table_name,
          n_tup_ins + n_tup_upd + n_tup_del as row_count,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
        FROM pg_stat_user_tables 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `

      return stats.map(stat => ({
        tableName: stat.table_name,
        rowCount: Number(stat.row_count),
        tableSize: stat.table_size,
      }))
    } catch (error) {
      logger.warn('Could not get table statistics', error)
      return []
    }
  }

}

export const databaseOptimizer = new DatabaseOptimizer()