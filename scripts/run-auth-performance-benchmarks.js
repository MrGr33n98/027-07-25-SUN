#!/usr/bin/env node

/**
 * Authentication Performance Benchmark Runner
 * 
 * This script runs performance benchmarks specifically for authentication
 * operations including caching, rate limiting, and database operations.
 */

const fs = require('fs')
const path = require('path')

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
    output: null,
    format: 'text',
    concurrency: 50,
    iterations: null,
    help: false,
}

for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case '--output':
            options.output = args[++i]
            break
        case '--format':
            options.format = args[++i]
            break
        case '--concurrency':
            options.concurrency = parseInt(args[++i])
            break
        case '--iterations':
            options.iterations = parseInt(args[++i])
            break
        case '--help':
            options.help = true
            break
    }
}

if (options.help) {
    console.log(`
Authentication Performance Benchmark Runner

Usage:
  node scripts/run-auth-performance-benchmarks.js [options]

Options:
  --output <file>    Save report to file
  --format <format>  Report format (text|json|html)
  --concurrency <n>  Number of concurrent operations to test (default: 50)
  --iterations <n>   Number of iterations for each benchmark
  --help            Show help

Examples:
  node scripts/run-auth-performance-benchmarks.js
  node scripts/run-auth-performance-benchmarks.js --output auth-benchmark-report.txt
  node scripts/run-auth-performance-benchmarks.js --format json --output auth-report.json
  node scripts/run-auth-performance-benchmarks.js --concurrency 100 --iterations 200
`)
    process.exit(0)
}

async function runAuthBenchmarks() {
    console.log('🔐 Starting Authentication Performance Benchmarks...')
    console.log('⏱️  This may take several minutes...\n')

    try {
        // Dynamic import to handle ES modules
        const {
            runAuthPerformanceBenchmarks,
            authPerformanceBenchmarks
        } = await import('../lib/auth-performance-benchmarks.js')
        const {
            authCacheService
        } = await import('../lib/auth-cache-service.js')
        const {
            dbPool
        } = await import('../lib/database-connection-pool.js')

        // Warm up caches before benchmarking
        console.log('🔥 Warming up authentication cache...')
        await authCacheService.warmAuthCache()

        // Run the authentication benchmark suite
        console.log('🚀 Running authentication benchmarks...')
        const suite = await runAuthPerformanceBenchmarks()

        // Generate report in requested format
        let report
        switch (options.format) {
            case 'json':
                report = JSON.stringify(suite, null, 2)
                break
            case 'html':
                report = generateSimpleHtmlReport(suite)
                break
            case 'text':
            default:
                report = authPerformanceBenchmarks.generateAuthPerformanceReport(suite)
                break
        }

        // Output report
        if (options.output) {
            const outputPath = path.resolve(options.output)
            fs.writeFileSync(outputPath, report, 'utf8')
            console.log(`📊 Report saved to: ${outputPath}`)
        } else {
            console.log('\n📊 Authentication Performance Benchmark Report:')
            console.log('='.repeat(60))
            console.log(report)
        }

        // Get cache health information
        console.log('\n🔍 Authentication Cache Health Check:')
        const cacheHealth = await authCacheService.healthCheck()
        console.log(`Status: ${cacheHealth.status}`)
        console.log(`Redis: ${cacheHealth.redis ? '✅' : '❌'}`)
        console.log(`Cache Manager: ${cacheHealth.cacheManager ? '✅' : '❌'}`)
        console.log(`Response Time: ${cacheHealth.responseTime}ms`)

        if (cacheHealth.errors.length > 0) {
            console.log('⚠️  Cache Errors:')
            cacheHealth.errors.forEach(error => console.log(`  - ${error}`))
        }

        // Get database health information
        console.log('\n🗄️  Database Health Check:')
        const dbHealth = await dbPool.healthCheck()
        console.log(`Status: ${dbHealth.status}`)
        console.log(`Connection Time: ${dbHealth.connectionTime}ms`)
        console.log(`Active Connections: ${dbHealth.stats.activeConnections}`)
        console.log(`Queries Executed: ${dbHealth.stats.queriesExecuted}`)
        console.log(`Average Query Time: ${dbHealth.stats.averageQueryTime.toFixed(2)}ms`)
        console.log(`Slow Queries: ${dbHealth.stats.slowQueries}`)

        // Performance summary
        console.log('\n📈 Performance Summary:')
        console.log(`  Total Duration: ${suite.totalDuration}ms`)
        console.log(`  Overall Success Rate: ${Math.round(suite.overallSuccessRate * 100)}%`)
        console.log(`  Benchmarks Run: ${suite.results.length}`)

        // Top performers
        const sortedByOps = suite.results.sort((a, b) => b.opsPerSecond - a.opsPerSecond)
        console.log('\n🏆 Top Performing Operations:')
        sortedByOps.slice(0, 3).forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.name}: ${Math.round(result.opsPerSecond)} ops/sec`)
        })

        // Performance warnings
        const slowOperations = suite.results.filter(r => r.averageResponseTime > 200)
        if (slowOperations.length > 0) {
            console.log('\n⚠️  Performance Warnings:')
            slowOperations.forEach(op => {
                console.log(`  - ${op.name}: ${op.averageResponseTime.toFixed(2)}ms avg response time`)
            })
        }

        const lowSuccessRate = suite.results.filter(r => r.successRate < 0.95)
        if (lowSuccessRate.length > 0) {
            console.log('\n❌ Low Success Rate Operations:')
            lowSuccessRate.forEach(op => {
                console.log(`  - ${op.name}: ${Math.round(op.successRate * 100)}% success rate`)
                if (op.errors.length > 0) {
                    console.log(`    Errors: ${op.errors.slice(0, 2).join(', ')}`)
                }
            })
        }

        // Recommendations
        if (suite.recommendations.length > 0) {
            console.log('\n💡 Performance Recommendations:')
            suite.recommendations.forEach(rec => console.log(`  - ${rec}`))
        }

        // Cache performance stats
        console.log('\n📊 Cache Performance Stats:')
        const cacheStats = await authCacheService.getCachePerformanceStats()
        console.log(`  Hit Rate: ${Math.round(cacheStats.hitRate * 100)}%`)
        console.log(`  Total Requests: ${cacheStats.totalRequests}`)
        console.log(`  Average Response Time: ${cacheStats.averageResponseTime.toFixed(2)}ms`)

        console.log('\n✅ Authentication benchmarks completed successfully!')

    } catch (error) {
        console.error('❌ Authentication benchmark failed:', error.message)
        if (process.env.NODE_ENV === 'development') {
            console.error(error.stack)
        }
        process.exit(1)
    }
}

function generateSimpleHtmlReport(suite) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        .header { background: #667eea; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .benchmark { border: 1px solid #ddd; margin: 15px 0; padding: 20px; border-radius: 8px; }
        .success { border-left: 4px solid #28a745; }
        .warning { border-left: 4px solid #ffc107; }
        .danger { border-left: 4px solid #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Authentication Performance Report</h1>
            <p>Generated: ${new Date().toISOString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Duration</h3>
                <p>${(suite.totalDuration / 1000).toFixed(1)}s</p>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <p>${Math.round(suite.overallSuccessRate * 100)}%</p>
            </div>
            <div class="metric">
                <h3>Benchmarks</h3>
                <p>${suite.results.length}</p>
            </div>
            <div class="metric">
                <h3>Avg Throughput</h3>
                <p>${Math.round(suite.results.reduce((sum, r) => sum + r.opsPerSecond, 0) / suite.results.length)} ops/sec</p>
            </div>
        </div>
        
        <h2>Benchmark Results</h2>
        ${suite.results.map(result => {
            let statusClass = 'success'
            if (result.successRate < 0.95 || result.averageResponseTime > 200) statusClass = 'warning'
            if (result.successRate < 0.8 || result.averageResponseTime > 500) statusClass = 'danger'
            
            return `<div class="benchmark ${statusClass}">
                <h3>${result.name.replace(/_/g, ' ')}</h3>
                <p>Operations: ${result.operations} | Ops/sec: ${Math.round(result.opsPerSecond)} | Success: ${Math.round(result.successRate * 100)}%</p>
                <p>Avg Response: ${result.averageResponseTime.toFixed(1)}ms | P95: ${result.p95ResponseTime}ms | Memory: ${Math.round(result.memoryUsage.delta / 1024 / 1024)}MB</p>
                ${result.errors.length > 0 ? `<p style="color: red;">Errors: ${result.errors.length}</p>` : ''}
            </div>`
        }).join('')}
        
        ${suite.recommendations.length > 0 ? `
        <h2>Recommendations</h2>
        <ul>${suite.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
        ` : ''}
    </div>
</body>
</html>`
}

// Run the authentication benchmarks
runAuthBenchmarks().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})