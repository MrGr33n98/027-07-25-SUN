import { authCacheService } from './auth-cache-service'
import { dbPool } from './database-connection-pool'
import { performanceMonitor } from './performance'
import { logger } from './logger'

interface AuthBenchmarkResult {
  name: string
  duration: number
  operations: number
  opsPerSecond: number
  successRate: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  memoryUsage: {
    before: NodeJS.MemoryUsage
    after: NodeJS.MemoryUsage
    delta: number
  }
  errors: string[]
}

interface AuthBenchmarkSuite {
  name: string
  results: AuthBenchmarkResult[]
  totalDuration: number
  overallSuccessRate: number
  recommendations: string[]
}

class AuthPerformanceBenchmarks {
  private results: AuthBenchmarkResult[] = []

  // Benchmark user session caching
  async benchmarkSessionCaching(iterations: number = 100): Promise<AuthBenchmarkResult> {
    const name = 'session_caching'
    const memoryBefore = process.memoryUsage()
    const startTime = Date.now()
    const responseTimes: number[] = []
    const errors: string[] = []
    let successCount = 0

    try {
      for (let i = 0; i < iterations; i++) {
        const operationStart = Date.now()
        
        try {
          const sessionId = `benchmark-session-${i}`
          const sessionData = {
            userId: `user-${i}`,
            email: `benchmark${i}@test.com`,
            role: 'CUSTOMER' as const,
            emailVerified: true,
            lastActivity: new Date(),
            ipAddress: '127.0.0.1',
            userAgent: 'benchmark-agent',
          }

          // Cache session
          await authCacheService.cacheUserSession(sessionId, sessionData, { ttl: 3600 })
          
          // Retrieve session
          const cachedSession = await authCacheService.getUserSession(sessionId)
          
          if (cachedSession) {
            successCount++
          }
          
          const responseTime = Date.now() - operationStart
          responseTimes.push(responseTime)
        } catch (error) {
          errors.push(`Iteration ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          responseTimes.push(Date.now() - operationStart)
        }
      }

      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()
      
      // Calculate percentiles
      const sortedTimes = responseTimes.sort((a, b) => a - b)
      const p95Index = Math.floor(sortedTimes.length * 0.95)
      const p99Index = Math.floor(sortedTimes.length * 0.99)

      const result: AuthBenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: (successCount / duration) * 1000,
        successRate: successCount / iterations,
        averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        p95ResponseTime: sortedTimes[p95Index] || 0,
        p99ResponseTime: sortedTimes[p99Index] || 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        errors,
      }

      this.results.push(result)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: AuthBenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: 0,
        successRate: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }

      this.results.push(result)
      return result
    }
  }

  // Benchmark login attempt tracking
  async benchmarkLoginAttemptTracking(iterations: number = 200): Promise<AuthBenchmarkResult> {
    const name = 'login_attempt_tracking'
    const memoryBefore = process.memoryUsage()
    const startTime = Date.now()
    const responseTimes: number[] = []
    const errors: string[] = []
    let successCount = 0

    const testEmails = Array.from({ length: 20 }, (_, i) => `benchmark${i}@test.com`)

    try {
      for (let i = 0; i < iterations; i++) {
        const operationStart = Date.now()
        
        try {
          const email = testEmails[i % testEmails.length]
          
          // Increment login attempts
          const attempts = await authCacheService.incrementLoginAttempts(email, 15)
          
          if (typeof attempts === 'number' && attempts > 0) {
            successCount++
          }
          
          const responseTime = Date.now() - operationStart
          responseTimes.push(responseTime)
        } catch (error) {
          errors.push(`Iteration ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          responseTimes.push(Date.now() - operationStart)
        }
      }

      // Cleanup
      for (const email of testEmails) {
        await authCacheService.resetLoginAttempts(email)
      }

      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()
      
      const sortedTimes = responseTimes.sort((a, b) => a - b)
      const p95Index = Math.floor(sortedTimes.length * 0.95)
      const p99Index = Math.floor(sortedTimes.length * 0.99)

      const result: AuthBenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: (successCount / duration) * 1000,
        successRate: successCount / iterations,
        averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        p95ResponseTime: sortedTimes[p95Index] || 0,
        p99ResponseTime: sortedTimes[p99Index] || 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        errors,
      }

      this.results.push(result)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: AuthBenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: 0,
        successRate: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }

      this.results.push(result)
      return result
    }
  }

  // Benchmark rate limiting
  async benchmarkRateLimiting(iterations: number = 150): Promise<AuthBenchmarkResult> {
    const name = 'rate_limiting'
    const memoryBefore = process.memoryUsage()
    const startTime = Date.now()
    const responseTimes: number[] = []
    const errors: string[] = []
    let successCount = 0

    const testIPs = Array.from({ length: 10 }, (_, i) => `192.168.1.${i + 1}`)
    const actions = ['login', 'register', 'password_reset']

    try {
      for (let i = 0; i < iterations; i++) {
        const operationStart = Date.now()
        
        try {
          const ip = testIPs[i % testIPs.length]
          const action = actions[i % actions.length]
          
          const rateLimitResult = await authCacheService.checkRateLimit(ip, action, 5, 900)
          
          if (rateLimitResult && typeof rateLimitResult.count === 'number') {
            successCount++
          }
          
          const responseTime = Date.now() - operationStart
          responseTimes.push(responseTime)
        } catch (error) {
          errors.push(`Iteration ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          responseTimes.push(Date.now() - operationStart)
        }
      }

      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()
      
      const sortedTimes = responseTimes.sort((a, b) => a - b)
      const p95Index = Math.floor(sortedTimes.length * 0.95)
      const p99Index = Math.floor(sortedTimes.length * 0.99)

      const result: AuthBenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: (successCount / duration) * 1000,
        successRate: successCount / iterations,
        averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        p95ResponseTime: sortedTimes[p95Index] || 0,
        p99ResponseTime: sortedTimes[p99Index] || 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        errors,
      }

      this.results.push(result)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: AuthBenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: 0,
        successRate: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }

      this.results.push(result)
      return result
    }
  }

  // Benchmark database user operations
  async benchmarkDatabaseUserOperations(iterations: number = 50): Promise<AuthBenchmarkResult> {
    const name = 'database_user_operations'
    const memoryBefore = process.memoryUsage()
    const startTime = Date.now()
    const responseTimes: number[] = []
    const errors: string[] = []
    let successCount = 0

    const testEmails = Array.from({ length: 10 }, (_, i) => `dbtest${i}@benchmark.com`)

    try {
      for (let i = 0; i < iterations; i++) {
        const operationStart = Date.now()
        
        try {
          const email = testEmails[i % testEmails.length]
          
          // Simulate user lookup (this would normally hit the database)
          const user = await dbPool.findUserByEmail(email)
          
          // Consider it successful if no error was thrown
          successCount++
          
          const responseTime = Date.now() - operationStart
          responseTimes.push(responseTime)
        } catch (error) {
          errors.push(`Iteration ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          responseTimes.push(Date.now() - operationStart)
        }
      }

      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()
      
      const sortedTimes = responseTimes.sort((a, b) => a - b)
      const p95Index = Math.floor(sortedTimes.length * 0.95)
      const p99Index = Math.floor(sortedTimes.length * 0.99)

      const result: AuthBenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: (successCount / duration) * 1000,
        successRate: successCount / iterations,
        averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        p95ResponseTime: sortedTimes[p95Index] || 0,
        p99ResponseTime: sortedTimes[p99Index] || 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        errors,
      }

      this.results.push(result)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: AuthBenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: 0,
        successRate: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }

      this.results.push(result)
      return result
    }
  }

  // Benchmark concurrent authentication operations
  async benchmarkConcurrentOperations(concurrency: number = 50): Promise<AuthBenchmarkResult> {
    const name = 'concurrent_operations'
    const memoryBefore = process.memoryUsage()
    const startTime = Date.now()
    const responseTimes: number[] = []
    const errors: string[] = []
    let successCount = 0

    try {
      const promises = []
      
      for (let i = 0; i < concurrency; i++) {
        const operationStart = Date.now()
        
        const promise = (async () => {
          try {
            const sessionId = `concurrent-session-${i}`
            const sessionData = {
              userId: `user-${i}`,
              email: `concurrent${i}@test.com`,
              role: 'CUSTOMER' as const,
              emailVerified: true,
              lastActivity: new Date(),
              ipAddress: '127.0.0.1',
              userAgent: 'concurrent-agent',
            }

            // Perform multiple operations concurrently
            await Promise.all([
              authCacheService.cacheUserSession(sessionId, sessionData),
              authCacheService.incrementLoginAttempts(`concurrent${i}@test.com`),
              authCacheService.checkRateLimit('127.0.0.1', 'login', 5, 900),
            ])
            
            successCount++
            const responseTime = Date.now() - operationStart
            responseTimes.push(responseTime)
          } catch (error) {
            errors.push(`Concurrent operation ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            responseTimes.push(Date.now() - operationStart)
          }
        })()
        
        promises.push(promise)
      }

      await Promise.all(promises)

      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()
      
      const sortedTimes = responseTimes.sort((a, b) => a - b)
      const p95Index = Math.floor(sortedTimes.length * 0.95)
      const p99Index = Math.floor(sortedTimes.length * 0.99)

      const result: AuthBenchmarkResult = {
        name,
        duration,
        operations: concurrency,
        opsPerSecond: (successCount / duration) * 1000,
        successRate: successCount / concurrency,
        averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        p95ResponseTime: sortedTimes[p95Index] || 0,
        p99ResponseTime: sortedTimes[p99Index] || 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        errors,
      }

      this.results.push(result)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: AuthBenchmarkResult = {
        name,
        duration,
        operations: concurrency,
        opsPerSecond: 0,
        successRate: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }

      this.results.push(result)
      return result
    }
  }

  // Run complete authentication benchmark suite
  async runAuthBenchmarkSuite(): Promise<AuthBenchmarkSuite> {
    const suiteName = `Authentication Performance Benchmark Suite - ${new Date().toISOString()}`
    const suiteStartTime = Date.now()
    
    logger.info('Starting authentication performance benchmark suite')

    const results: AuthBenchmarkResult[] = []

    // Run all benchmarks
    results.push(await this.benchmarkSessionCaching(100))
    results.push(await this.benchmarkLoginAttemptTracking(200))
    results.push(await this.benchmarkRateLimiting(150))
    results.push(await this.benchmarkDatabaseUserOperations(50))
    results.push(await this.benchmarkConcurrentOperations(50))

    const totalDuration = Date.now() - suiteStartTime
    const successfulResults = results.filter(r => r.successRate > 0.9)
    const overallSuccessRate = successfulResults.length / results.length

    // Generate recommendations
    const recommendations: string[] = []
    
    results.forEach(result => {
      if (result.successRate < 0.95) {
        recommendations.push(`${result.name}: Low success rate (${Math.round(result.successRate * 100)}%)`)
      }
      
      if (result.averageResponseTime > 100) {
        recommendations.push(`${result.name}: High average response time (${result.averageResponseTime.toFixed(2)}ms)`)
      }
      
      if (result.p95ResponseTime > 500) {
        recommendations.push(`${result.name}: High P95 response time (${result.p95ResponseTime}ms)`)
      }
      
      if (result.memoryUsage.delta > 50 * 1024 * 1024) {
        recommendations.push(`${result.name}: High memory usage (${Math.round(result.memoryUsage.delta / 1024 / 1024)}MB)`)
      }
      
      if (result.errors.length > 0) {
        recommendations.push(`${result.name}: ${result.errors.length} errors occurred`)
      }
    })

    const suite: AuthBenchmarkSuite = {
      name: suiteName,
      results,
      totalDuration,
      overallSuccessRate,
      recommendations,
    }

    logger.info('Authentication benchmark suite completed', {
      totalDuration,
      overallSuccessRate: Math.round(overallSuccessRate * 100),
      recommendations: recommendations.length,
    })

    return suite
  }

  // Generate detailed performance report
  generateAuthPerformanceReport(suite: AuthBenchmarkSuite): string {
    const report = [
      `# Authentication Performance Benchmark Report`,
      `Generated: ${new Date().toISOString()}`,
      `Suite: ${suite.name}`,
      ``,
      `## Executive Summary`,
      `- Total Duration: ${suite.totalDuration}ms`,
      `- Overall Success Rate: ${Math.round(suite.overallSuccessRate * 100)}%`,
      `- Benchmarks Run: ${suite.results.length}`,
      ``,
      `## Performance Metrics`,
      ``,
    ]

    suite.results.forEach(result => {
      report.push(`### ${result.name.replace(/_/g, ' ').toUpperCase()}`)
      report.push(`- Operations: ${result.operations}`)
      report.push(`- Duration: ${result.duration}ms`)
      report.push(`- Ops/Second: ${Math.round(result.opsPerSecond)}`)
      report.push(`- Success Rate: ${Math.round(result.successRate * 100)}%`)
      report.push(`- Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`)
      report.push(`- P95 Response Time: ${result.p95ResponseTime}ms`)
      report.push(`- P99 Response Time: ${result.p99ResponseTime}ms`)
      report.push(`- Memory Delta: ${Math.round(result.memoryUsage.delta / 1024 / 1024 * 100) / 100}MB`)
      
      if (result.errors.length > 0) {
        report.push(`- Errors: ${result.errors.length}`)
        result.errors.slice(0, 3).forEach(error => {
          report.push(`  - ${error}`)
        })
        if (result.errors.length > 3) {
          report.push(`  - ... and ${result.errors.length - 3} more`)
        }
      }
      report.push(``)
    })

    // Performance analysis
    report.push(`## Performance Analysis`)
    
    const fastOperations = suite.results.filter(r => r.averageResponseTime < 50)
    const slowOperations = suite.results.filter(r => r.averageResponseTime > 200)
    const highThroughput = suite.results.filter(r => r.opsPerSecond > 100)
    const lowThroughput = suite.results.filter(r => r.opsPerSecond < 10)

    if (fastOperations.length > 0) {
      report.push(`### Fast Operations (< 50ms avg)`)
      fastOperations.forEach(op => {
        report.push(`- ${op.name}: ${op.averageResponseTime.toFixed(2)}ms avg, ${Math.round(op.opsPerSecond)} ops/sec`)
      })
      report.push(``)
    }

    if (slowOperations.length > 0) {
      report.push(`### Slow Operations (> 200ms avg)`)
      slowOperations.forEach(op => {
        report.push(`- ${op.name}: ${op.averageResponseTime.toFixed(2)}ms avg, ${Math.round(op.opsPerSecond)} ops/sec`)
      })
      report.push(``)
    }

    if (highThroughput.length > 0) {
      report.push(`### High Throughput Operations (> 100 ops/sec)`)
      highThroughput.forEach(op => {
        report.push(`- ${op.name}: ${Math.round(op.opsPerSecond)} ops/sec`)
      })
      report.push(``)
    }

    if (lowThroughput.length > 0) {
      report.push(`### Low Throughput Operations (< 10 ops/sec)`)
      lowThroughput.forEach(op => {
        report.push(`- ${op.name}: ${Math.round(op.opsPerSecond)} ops/sec`)
      })
      report.push(``)
    }

    // Recommendations
    if (suite.recommendations.length > 0) {
      report.push(`## Recommendations`)
      suite.recommendations.forEach(rec => {
        report.push(`- ${rec}`)
      })
      report.push(``)
    }

    // Performance targets
    report.push(`## Performance Targets`)
    report.push(`- Session Operations: > 50 ops/sec, < 100ms avg response time`)
    report.push(`- Rate Limiting: > 100 ops/sec, < 50ms avg response time`)
    report.push(`- Database Operations: > 20 ops/sec, < 200ms avg response time`)
    report.push(`- Overall Success Rate: > 95%`)
    report.push(`- Memory Usage: < 100MB per benchmark`)

    return report.join('\n')
  }

  // Clear benchmark results
  clearResults(): void {
    this.results = []
  }

  // Get all results
  getResults(): AuthBenchmarkResult[] {
    return [...this.results]
  }
}

export const authPerformanceBenchmarks = new AuthPerformanceBenchmarks()

// Utility function to run auth benchmarks from CLI or API
export async function runAuthPerformanceBenchmarks(): Promise<AuthBenchmarkSuite> {
  return authPerformanceBenchmarks.runAuthBenchmarkSuite()
}

// Utility function to generate and save auth benchmark report
export async function generateAuthBenchmarkReport(): Promise<string> {
  const suite = await runAuthPerformanceBenchmarks()
  return authPerformanceBenchmarks.generateAuthPerformanceReport(suite)
}