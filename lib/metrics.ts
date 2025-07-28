import { redis } from './redis'
import { logger, LogCategory } from './logger'

export interface MetricData {
  name: string
  value: number
  timestamp?: number
  tags?: Record<string, string>
  unit?: string
}

export interface MetricQuery {
  name: string
  startTime: number
  endTime: number
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count'
  interval?: number // in seconds
}

export class MetricsCollector {
  private static instance: MetricsCollector
  private metricsBuffer: MetricData[] = []
  private flushInterval: NodeJS.Timeout | null = null
  private readonly BUFFER_SIZE = 100
  private readonly FLUSH_INTERVAL = 30000 // 30 seconds

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
      MetricsCollector.instance.startAutoFlush()
    }
    return MetricsCollector.instance
  }

  /**
   * Record a metric value
   */
  async record(metric: MetricData): Promise<void> {
    const enrichedMetric = {
      ...metric,
      timestamp: metric.timestamp || Date.now()
    }

    this.metricsBuffer.push(enrichedMetric)

    // Auto-flush if buffer is full
    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      await this.flush()
    }
  }

  /**
   * Increment a counter metric
   */
  async increment(name: string, value: number = 1, tags?: Record<string, string>): Promise<void> {
    await this.record({
      name,
      value,
      tags,
      unit: 'count'
    })
  }

  /**
   * Record a gauge metric (current value)
   */
  async gauge(name: string, value: number, tags?: Record<string, string>): Promise<void> {
    await this.record({
      name,
      value,
      tags,
      unit: 'gauge'
    })
  }

  /**
   * Record a timing metric
   */
  async timing(name: string, duration: number, tags?: Record<string, string>): Promise<void> {
    await this.record({
      name,
      value: duration,
      tags,
      unit: 'ms'
    })
  }

  /**
   * Record a histogram metric
   */
  async histogram(name: string, value: number, tags?: Record<string, string>): Promise<void> {
    await this.record({
      name,
      value,
      tags,
      unit: 'histogram'
    })
  }

  /**
   * Flush metrics buffer to storage
   */
  async flush(): Promise<void> {
    if (this.metricsBuffer.length === 0) return

    const metrics = [...this.metricsBuffer]
    this.metricsBuffer = []

    try {
      // Store metrics in Redis with time-series structure
      const pipeline = redis.pipeline()

      for (const metric of metrics) {
        const key = this.getMetricKey(metric.name, metric.tags)
        const timestamp = metric.timestamp!
        
        // Store raw metric data
        pipeline.zadd(key, timestamp, JSON.stringify({
          value: metric.value,
          unit: metric.unit,
          tags: metric.tags
        }))

        // Set expiration (keep metrics for 30 days)
        pipeline.expire(key, 30 * 24 * 60 * 60)

        // Update aggregated metrics
        await this.updateAggregates(metric)
      }

      await pipeline.exec()
      
      logger.debug(LogCategory.SYSTEM, `Flushed ${metrics.length} metrics`)
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to flush metrics', error as Error)
      // Put metrics back in buffer for retry
      this.metricsBuffer.unshift(...metrics)
    }
  }

  /**
   * Query metrics data
   */
  async query(query: MetricQuery): Promise<Array<{ timestamp: number; value: number }>> {
    try {
      const key = this.getMetricKey(query.name)
      const data = await redis.zrangebyscore(
        key,
        query.startTime,
        query.endTime,
        'WITHSCORES'
      )

      const results: Array<{ timestamp: number; value: number }> = []
      
      for (let i = 0; i < data.length; i += 2) {
        const metricData = JSON.parse(data[i])
        const timestamp = parseInt(data[i + 1])
        
        results.push({
          timestamp,
          value: metricData.value
        })
      }

      // Apply aggregation if specified
      if (query.aggregation && query.interval) {
        return this.aggregateResults(results, query.aggregation, query.interval)
      }

      return results
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to query metrics', error as Error)
      return []
    }
  }

  /**
   * Get current metric value
   */
  async getCurrentValue(name: string, tags?: Record<string, string>): Promise<number | null> {
    try {
      const key = this.getMetricKey(name, tags)
      const latest = await redis.zrevrange(key, 0, 0, 'WITHSCORES')
      
      if (latest.length >= 2) {
        const metricData = JSON.parse(latest[0])
        return metricData.value
      }
      
      return null
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get current metric value', error as Error)
      return null
    }
  }

  /**
   * Get metric statistics
   */
  async getStats(name: string, startTime: number, endTime: number): Promise<{
    count: number
    sum: number
    avg: number
    min: number
    max: number
  }> {
    try {
      const data = await this.query({
        name,
        startTime,
        endTime
      })

      if (data.length === 0) {
        return { count: 0, sum: 0, avg: 0, min: 0, max: 0 }
      }

      const values = data.map(d => d.value)
      const sum = values.reduce((a, b) => a + b, 0)
      
      return {
        count: values.length,
        sum,
        avg: sum / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to get metric stats', error as Error)
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 }
    }
  }

  private getMetricKey(name: string, tags?: Record<string, string>): string {
    let key = `metrics:${name}`
    
    if (tags) {
      const tagString = Object.entries(tags)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join(',')
      key += `:${tagString}`
    }
    
    return key
  }

  private async updateAggregates(metric: MetricData): Promise<void> {
    const now = Date.now()
    const hourKey = `agg:hour:${metric.name}:${Math.floor(now / (60 * 60 * 1000))}`
    const dayKey = `agg:day:${metric.name}:${Math.floor(now / (24 * 60 * 60 * 1000))}`

    try {
      const pipeline = redis.pipeline()
      
      // Update hourly aggregates
      pipeline.hincrby(hourKey, 'count', 1)
      pipeline.hincrbyfloat(hourKey, 'sum', metric.value)
      pipeline.expire(hourKey, 7 * 24 * 60 * 60) // Keep for 7 days

      // Update daily aggregates
      pipeline.hincrby(dayKey, 'count', 1)
      pipeline.hincrbyfloat(dayKey, 'sum', metric.value)
      pipeline.expire(dayKey, 90 * 24 * 60 * 60) // Keep for 90 days

      await pipeline.exec()
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to update metric aggregates', error as Error)
    }
  }

  private aggregateResults(
    results: Array<{ timestamp: number; value: number }>,
    aggregation: string,
    interval: number
  ): Array<{ timestamp: number; value: number }> {
    const buckets = new Map<number, number[]>()
    
    // Group results into time buckets
    for (const result of results) {
      const bucketTime = Math.floor(result.timestamp / (interval * 1000)) * (interval * 1000)
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, [])
      }
      buckets.get(bucketTime)!.push(result.value)
    }

    // Apply aggregation to each bucket
    const aggregated: Array<{ timestamp: number; value: number }> = []
    
    for (const [timestamp, values] of buckets) {
      let value: number
      
      switch (aggregation) {
        case 'sum':
          value = values.reduce((a, b) => a + b, 0)
          break
        case 'avg':
          value = values.reduce((a, b) => a + b, 0) / values.length
          break
        case 'min':
          value = Math.min(...values)
          break
        case 'max':
          value = Math.max(...values)
          break
        case 'count':
          value = values.length
          break
        default:
          value = values[values.length - 1] // Last value
      }
      
      aggregated.push({ timestamp, value })
    }

    return aggregated.sort((a, b) => a.timestamp - b.timestamp)
  }

  private startAutoFlush(): void {
    this.flushInterval = setInterval(async () => {
      await this.flush()
    }, this.FLUSH_INTERVAL)
  }

  /**
   * Stop the metrics collector
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }
}

// Export singleton instance
export const metrics = MetricsCollector.getInstance()

// Common application metrics
export const AppMetrics = {
  // API metrics
  apiRequest: (method: string, path: string, statusCode: number) =>
    metrics.increment('api.requests', 1, { method, path, status: statusCode.toString() }),

  apiResponseTime: (method: string, path: string, duration: number) =>
    metrics.timing('api.response_time', duration, { method, path }),

  apiError: (method: string, path: string, errorType: string) =>
    metrics.increment('api.errors', 1, { method, path, error_type: errorType }),

  // User metrics
  userRegistration: () => metrics.increment('users.registrations'),
  userLogin: (success: boolean) => metrics.increment('users.logins', 1, { success: success.toString() }),
  userAction: (action: string) => metrics.increment('users.actions', 1, { action }),

  // Business metrics
  productView: (productId: string, category: string) =>
    metrics.increment('products.views', 1, { product_id: productId, category }),

  companyView: (companyId: string) =>
    metrics.increment('companies.views', 1, { company_id: companyId }),

  searchQuery: (query: string, resultsCount: number) =>
    metrics.increment('search.queries', 1, { query_length: query.length.toString(), results: resultsCount.toString() }),

  appointmentCreated: () => metrics.increment('appointments.created'),
  appointmentCompleted: () => metrics.increment('appointments.completed'),

  // System metrics
  cacheHit: (key: string) => metrics.increment('cache.hits', 1, { key }),
  cacheMiss: (key: string) => metrics.increment('cache.misses', 1, { key }),
  
  databaseQuery: (table: string, operation: string, duration: number) =>
    metrics.timing('database.query_time', duration, { table, operation }),

  emailSent: (type: string, success: boolean) =>
    metrics.increment('emails.sent', 1, { type, success: success.toString() }),

  // Performance metrics
  pageLoad: (page: string, duration: number) =>
    metrics.timing('pages.load_time', duration, { page }),

  memoryUsage: (usage: number) => metrics.gauge('system.memory_usage', usage),
  cpuUsage: (usage: number) => metrics.gauge('system.cpu_usage', usage),

  // Error metrics
  errorOccurred: (type: string, severity: string) =>
    metrics.increment('errors.occurred', 1, { type, severity })
}

// Utility function to measure execution time
export function measureTime<T>(
  metricName: string,
  tags?: Record<string, string>
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      try {
        const result = await method.apply(this, args)
        const duration = Date.now() - startTime
        await metrics.timing(metricName, duration, tags)
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        await metrics.timing(metricName, duration, { ...tags, error: 'true' })
        throw error
      }
    }

    return descriptor
  }
}