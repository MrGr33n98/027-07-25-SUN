import { db } from './db'
import { databaseOptimizer } from './database-optimizer'
import { performanceMonitor } from './performance'
import { logger } from './logger'

interface BenchmarkResult {
  name: string
  duration: number
  operations: number
  opsPerSecond: number
  memoryUsage: {
    before: NodeJS.MemoryUsage
    after: NodeJS.MemoryUsage
    delta: number
  }
  success: boolean
  error?: string
}

interface BenchmarkSuite {
  name: string
  results: BenchmarkResult[]
  totalDuration: number
  averageOpsPerSecond: number
  successRate: number
}

class PerformanceBenchmarks {
  private results: BenchmarkResult[] = []

  // Database connection benchmark
  async benchmarkDatabaseConnection(iterations: number = 100): Promise<BenchmarkResult> {
    const name = 'database_connection'
    const memoryBefore = process.memoryUsage()
    const startTime = Date.now()
    let successCount = 0

    try {
      for (let i = 0; i < iterations; i++) {
        try {
          await db.$queryRaw`SELECT 1`
          successCount++
        } catch (error) {
          logger.warn(`Database connection failed on iteration ${i}`, error)
        }
      }

      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: BenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: (successCount / duration) * 1000,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        success: successCount === iterations,
      }

      this.results.push(result)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: BenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      this.results.push(result)
      return result
    }
  }

  // User query performance benchmark
  async benchmarkUserQueries(iterations: number = 50): Promise<BenchmarkResult> {
    const name = 'user_queries'
    const memoryBefore = process.memoryUsage()
    const startTime = Date.now()
    let successCount = 0

    // Create test users first
    const testEmails = Array.from({ length: 10 }, (_, i) => `benchmark-user-${i}@test.com`)
    
    try {
      // Setup: Create test users
      await db.user.createMany({
        data: testEmails.map(email => ({
          email,
          passwordHash: 'test-hash',
          role: 'CUSTOMER' as const,
        })),
        skipDuplicates: true,
      })

      // Benchmark user lookups
      for (let i = 0; i < iterations; i++) {
        try {
          const email = testEmails[i % testEmails.length]
          await databaseOptimizer.findUserByEmail(email)
          successCount++
        } catch (error) {
          logger.warn(`User query failed on iteration ${i}`, error)
        }
      }

      // Cleanup: Remove test users
      await db.user.deleteMany({
        where: {
          email: { in: testEmails },
        },
      })

      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: BenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: (successCount / duration) * 1000,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        success: successCount === iterations,
      }

      this.results.push(result)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: BenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      this.results.push(result)
      return result
    }
  }

  // Company search performance benchmark
  async benchmarkCompanySearch(iterations: number = 30): Promise<BenchmarkResult> {
    const name = 'company_search'
    const memoryBefore = process.memoryUsage()
    const startTime = Date.now()
    let successCount = 0

    const searchFilters = [
      { city: 'São Paulo', verified: true },
      { state: 'SP', specialties: ['Residencial'] },
      { verified: true, limit: 10 },
      { city: 'Rio de Janeiro', limit: 20 },
      { specialties: ['Comercial', 'Industrial'] },
    ]

    try {
      for (let i = 0; i < iterations; i++) {
        try {
          const filters = searchFilters[i % searchFilters.length]
          await databaseOptimizer.findCompaniesOptimized(filters)
          successCount++
        } catch (error) {
          logger.warn(`Company search failed on iteration ${i}`, error)
        }
      }

      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: BenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: (successCount / duration) * 1000,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        success: successCount === iterations,
      }

      this.results.push(result)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: BenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      this.results.push(result)
      return result
    }
  }

  // Product search performance benchmark
  async benchmarkProductSearch(iterations: number = 30): Promise<BenchmarkResult> {
    const name = 'product_search'
    const memoryBefore = process.memoryUsage()
    const startTime = Date.now()
    let successCount = 0

    const searchFilters = [
      { category: 'PAINEL_SOLAR', inStock: true },
      { minPrice: 100, maxPrice: 1000 },
      { category: 'INVERSOR', limit: 15 },
      { inStock: true, limit: 25 },
      { category: 'BATERIA', minPrice: 500 },
    ]

    try {
      for (let i = 0; i < iterations; i++) {
        try {
          const filters = searchFilters[i % searchFilters.length]
          await databaseOptimizer.findProductsOptimized(filters)
          successCount++
        } catch (error) {
          logger.warn(`Product search failed on iteration ${i}`, error)
        }
      }

      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: BenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: (successCount / duration) * 1000,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        success: successCount === iterations,
      }

      this.results.push(result)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: BenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      this.results.push(result)
      return result
    }
  }

  // Cache performance benchmark
  async benchmarkCachePerformance(iterations: number = 100): Promise<BenchmarkResult> {
    const name = 'cache_performance'
    const memoryBefore = process.memoryUsage()
    const startTime = Date.now()
    let successCount = 0

    try {
      // Test cache with repeated queries
      const filters = { city: 'São Paulo', verified: true, limit: 10 }
      
      for (let i = 0; i < iterations; i++) {
        try {
          await databaseOptimizer.findCompaniesOptimized(filters)
          successCount++
        } catch (error) {
          logger.warn(`Cache test failed on iteration ${i}`, error)
        }
      }

      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: BenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: (successCount / duration) * 1000,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        success: successCount === iterations,
      }

      this.results.push(result)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const memoryAfter = process.memoryUsage()

      const result: BenchmarkResult = {
        name,
        duration,
        operations: iterations,
        opsPerSecond: 0,
        memoryUsage: {
          before: memoryBefore,
          after: memoryAfter,
          delta: memoryAfter.heapUsed - memoryBefore.heapUsed,
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }

      this.results.push(result)
      return result
    }
  }

  // Run complete benchmark suite
  async runBenchmarkSuite(): Promise<BenchmarkSuite> {
    const suiteName = `Performance Benchmark Suite - ${new Date().toISOString()}`
    const suiteStartTime = Date.now()
    
    logger.info('Starting performance benchmark suite')

    const results: BenchmarkResult[] = []

    // Run all benchmarks
    results.push(await this.benchmarkDatabaseConnection(50))
    results.push(await this.benchmarkUserQueries(25))
    results.push(await this.benchmarkCompanySearch(20))
    results.push(await this.benchmarkProductSearch(20))
    results.push(await this.benchmarkCachePerformance(50))

    const totalDuration = Date.now() - suiteStartTime
    const successfulResults = results.filter(r => r.success)
    const totalOperations = results.reduce((sum, r) => sum + r.operations, 0)
    const averageOpsPerSecond = totalOperations / (totalDuration / 1000)
    const successRate = successfulResults.length / results.length

    const suite: BenchmarkSuite = {
      name: suiteName,
      results,
      totalDuration,
      averageOpsPerSecond,
      successRate,
    }

    logger.info('Benchmark suite completed', {
      totalDuration,
      averageOpsPerSecond: Math.round(averageOpsPerSecond),
      successRate: Math.round(successRate * 100),
    })

    return suite
  }

  // Generate performance report
  generatePerformanceReport(suite: BenchmarkSuite): string {
    const report = [
      `# Performance Benchmark Report`,
      `Generated: ${new Date().toISOString()}`,
      `Suite: ${suite.name}`,
      ``,
      `## Summary`,
      `- Total Duration: ${suite.totalDuration}ms`,
      `- Average Ops/Second: ${Math.round(suite.averageOpsPerSecond)}`,
      `- Success Rate: ${Math.round(suite.successRate * 100)}%`,
      ``,
      `## Individual Benchmarks`,
      ``,
    ]

    suite.results.forEach(result => {
      report.push(`### ${result.name}`)
      report.push(`- Duration: ${result.duration}ms`)
      report.push(`- Operations: ${result.operations}`)
      report.push(`- Ops/Second: ${Math.round(result.opsPerSecond)}`)
      report.push(`- Memory Delta: ${Math.round(result.memoryUsage.delta / 1024 / 1024 * 100) / 100}MB`)
      report.push(`- Success: ${result.success ? '✅' : '❌'}`)
      if (result.error) {
        report.push(`- Error: ${result.error}`)
      }
      report.push(``)
    })

    // Performance recommendations
    report.push(`## Recommendations`)
    const slowBenchmarks = suite.results.filter(r => r.opsPerSecond < 10)
    if (slowBenchmarks.length > 0) {
      report.push(`- Slow operations detected: ${slowBenchmarks.map(b => b.name).join(', ')}`)
    }

    const highMemoryUsage = suite.results.filter(r => r.memoryUsage.delta > 50 * 1024 * 1024) // 50MB
    if (highMemoryUsage.length > 0) {
      report.push(`- High memory usage: ${highMemoryUsage.map(b => b.name).join(', ')}`)
    }

    if (suite.successRate < 0.95) {
      report.push(`- Low success rate (${Math.round(suite.successRate * 100)}%) - investigate failures`)
    }

    return report.join('\n')
  }

  // Clear benchmark results
  clearResults(): void {
    this.results = []
  }

  // Get all results
  getResults(): BenchmarkResult[] {
    return [...this.results]
  }
}

export const performanceBenchmarks = new PerformanceBenchmarks()

// Utility function to run benchmarks from CLI or API
export async function runPerformanceBenchmarks(): Promise<BenchmarkSuite> {
  return performanceBenchmarks.runBenchmarkSuite()
}

// Utility function to generate and save report
export async function generateBenchmarkReport(): Promise<string> {
  const suite = await runPerformanceBenchmarks()
  return performanceBenchmarks.generatePerformanceReport(suite)
}