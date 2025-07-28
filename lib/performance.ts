import { logger } from './logger'

interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  timestamp: number
  tags?: Record<string, string>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private timers: Map<string, number> = new Map()

  // Start a timer
  startTimer(name: string): void {
    this.timers.set(name, Date.now())
  }

  // End a timer and record the metric
  endTimer(name: string, tags?: Record<string, string>): number {
    const startTime = this.timers.get(name)
    if (!startTime) {
      logger.warn(`Timer '${name}' was not started`)
      return 0
    }

    const duration = Date.now() - startTime
    this.timers.delete(name)

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags,
    })

    // Log slow operations
    if (duration > 1000) {
      logger.performance(`Slow operation: ${name}`, duration, tags)
    }

    return duration
  }

  // Record a custom metric
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Log critical metrics
    if (metric.name.includes('error') || metric.value > 5000) {
      logger.warn(`Performance metric: ${metric.name} = ${metric.value}${metric.unit}`, metric.tags)
    }
  }

  // Get metrics for a specific time range
  getMetrics(since?: number): PerformanceMetric[] {
    const sinceTime = since || Date.now() - 60000 // Last minute by default
    return this.metrics.filter(m => m.timestamp >= sinceTime)
  }

  // Get average for a metric
  getAverage(metricName: string, since?: number): number {
    const metrics = this.getMetrics(since).filter(m => m.name === metricName)
    if (metrics.length === 0) return 0
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0)
    return sum / metrics.length
  }

  // Clear old metrics
  cleanup(): void {
    const oneHourAgo = Date.now() - 3600000
    this.metrics = this.metrics.filter(m => m.timestamp >= oneHourAgo)
  }

  // Database query performance
  async measureDbQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    this.startTimer(`db_query_${queryName}`)
    try {
      const result = await queryFn()
      this.endTimer(`db_query_${queryName}`, { query: queryName })
      return result
    } catch (error) {
      this.endTimer(`db_query_${queryName}`, { query: queryName, error: 'true' })
      throw error
    }
  }

  // API endpoint performance
  async measureApiEndpoint<T>(endpoint: string, method: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(`api_${method}_${endpoint}`)
    try {
      const result = await fn()
      this.endTimer(`api_${method}_${endpoint}`, { endpoint, method })
      return result
    } catch (error) {
      this.endTimer(`api_${method}_${endpoint}`, { endpoint, method, error: 'true' })
      throw error
    }
  }

  // External API calls
  async measureExternalApi<T>(serviceName: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(`external_api_${serviceName}`)
    try {
      const result = await fn()
      this.endTimer(`external_api_${serviceName}`, { service: serviceName })
      return result
    } catch (error) {
      this.endTimer(`external_api_${serviceName}`, { service: serviceName, error: 'true' })
      throw error
    }
  }

  // Memory usage
  recordMemoryUsage(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      this.recordMetric({
        name: 'memory_heap_used',
        value: usage.heapUsed,
        unit: 'bytes',
        timestamp: Date.now(),
      })
      this.recordMetric({
        name: 'memory_heap_total',
        value: usage.heapTotal,
        unit: 'bytes',
        timestamp: Date.now(),
      })
    }
  }

  // Generate performance report
  generateReport(): {
    summary: Record<string, number>
    slowQueries: PerformanceMetric[]
    errorRate: number
    memoryUsage?: { heapUsed: number; heapTotal: number }
  } {
    const recentMetrics = this.getMetrics()
    const dbQueries = recentMetrics.filter(m => m.name.startsWith('db_query_'))
    const apiCalls = recentMetrics.filter(m => m.name.startsWith('api_'))
    const errors = recentMetrics.filter(m => m.tags?.error === 'true')

    const slowQueries = recentMetrics
      .filter(m => m.value > 1000)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    const summary = {
      totalRequests: apiCalls.length,
      avgResponseTime: this.getAverage('api_response_time'),
      avgDbQueryTime: dbQueries.length > 0 ? 
        dbQueries.reduce((acc, m) => acc + m.value, 0) / dbQueries.length : 0,
      slowQueriesCount: slowQueries.length,
    }

    const errorRate = recentMetrics.length > 0 ? errors.length / recentMetrics.length : 0

    // Get latest memory usage
    const memoryMetrics = recentMetrics.filter(m => m.name.startsWith('memory_'))
    const latestHeapUsed = memoryMetrics.find(m => m.name === 'memory_heap_used')
    const latestHeapTotal = memoryMetrics.find(m => m.name === 'memory_heap_total')

    const memoryUsage = latestHeapUsed && latestHeapTotal ? {
      heapUsed: latestHeapUsed.value,
      heapTotal: latestHeapTotal.value,
    } : undefined

    return {
      summary,
      slowQueries,
      errorRate,
      memoryUsage,
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Cleanup old metrics every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    performanceMonitor.cleanup()
    performanceMonitor.recordMemoryUsage()
  }, 3600000) // 1 hour
}

// Wrapper for measuring function performance
export function measurePerformance<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  tags?: Record<string, string>
): T {
  return ((...args: any[]) => {
    performanceMonitor.startTimer(name)
    try {
      const result = fn(...args)
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.endTimer(name, tags)
        })
      }
      
      performanceMonitor.endTimer(name, tags)
      return result
    } catch (error) {
      performanceMonitor.endTimer(name, { ...tags, error: 'true' })
      throw error
    }
  }) as T
}