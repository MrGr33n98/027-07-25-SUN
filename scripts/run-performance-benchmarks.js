#!/usr/bin/env node

/**
 * Performance Benchmark Runner
 * 
 * This script runs performance benchmarks for the SolarConnect application
 * and generates detailed reports.
 * 
 * Usa*   node scripts/run-performance-benchmarks.js [options]
 * 
 * Options:
 *   --output <file>    Save report to file
 *   --format <format>  Report format (text|json|html)
 *   --iterations <n>   Number of iterations for each benchmark
 *   --help            Show help
 */

const fs = require('fs')
const path = require('path')

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
    output: null,
    format: 'text',
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
Performance Benchmark Runner

Usage:
  node scripts/run-performance-benchmarks.js [options]

Options:
  --output <file>    Save report to file
  --format <format>  Report format (text|json|html)
  --iterations <n>   Number of iterations for each benchmark
  --help            Show help

Examples:
  node scripts/run-performance-benchmarks.js
  node scripts/run-performance-benchmarks.js --output benchmark-report.txt
  node scripts/run-performance-benchmarks.js --format json --output report.json
  node scripts/run-performance-benchmarks.js --iterations 100
`)
    process.exit(0)
}

async function runBenchmarks() {
    console.log('🚀 Starting Performance Benchmarks...')
    console.log('⏱️  This may take a few minutes...\n')

    try {
        // Dynamic import to handle ES modules
        const {
            runPerformanceBenchmarks,
            performanceBenchmarks
        } = await import('../lib/performance-benchmarks.js')
        const {
            databaseOptimizer
        } = await import('../lib/database-optimizer.js')

        // Run the benchmark suite
        const suite = await runPerformanceBenchmarks()

        // Generate report in requested format
        let report
        switch (options.format) {
            case 'json':
                report = JSON.stringify(suite, null, 2)
                break
            case 'html':
                report = generateHtmlReport(suite)
                break
            case 'text':
            default:
                report = performanceBenchmarks.generatePerformanceReport(suite)
                break
        }

        // Output report
        if (options.output) {
            const outputPath = path.resolve(options.output)
            fs.writeFileSync(outputPath, report, 'utf8')
            console.log(`📊 Report saved to: ${outputPath}`)
        } else {
            console.log('\n📊 Performance Benchmark Report:')
            console.log('='.repeat(50))
            console.log(report)
        }

        // Get database health information
        console.log('\n🔍 Database Health Check:')
        const healthCheck = await databaseOptimizer.getDatabaseHealth()
        console.log(`Status: ${healthCheck.status}`)
        console.log(`Connection Time: ${healthCheck.connectionTime}ms`)

        if (healthCheck.recommendations && healthCheck.recommendations.length > 0) {
            console.log('\n💡 Recommendations:')
            healthCheck.recommendations.forEach(rec => console.log(`  - ${rec}`))
        }

        // Summary
        console.log('\n📈 Summary:')
        console.log(`  Total Duration: ${suite.totalDuration}ms`)
        console.log(`  Average Ops/Second: ${Math.round(suite.averageOpsPerSecond)}`)
        console.log(`  Success Rate: ${Math.round(suite.successRate * 100)}%`)
        console.log(`  Benchmarks Run: ${suite.results.length}`)

        // Performance warnings
        const slowBenchmarks = suite.results.filter(r => r.opsPerSecond < 10)
        if (slowBenchmarks.length > 0) {
            console.log('\n⚠️  Performance Warnings:')
            slowBenchmarks.forEach(benchmark => {
                console.log(`  - ${benchmark.name}: ${Math.round(benchmark.opsPerSecond)} ops/sec`)
            })
        }

        if (suite.successRate < 0.95) {
            console.log(`\n❌ Low success rate: ${Math.round(suite.successRate * 100)}%`)
            const failedBenchmarks = suite.results.filter(r => !r.success)
            failedBenchmarks.forEach(benchmark => {
                console.log(`  - ${benchmark.name}: ${benchmark.error}`)
            })
        }

        console.log('\n✅ Benchmarks completed successfully!')

    } catch (error) {
        console.error('❌ Benchmark failed:', error.message)
        if (process.env.NODE_ENV === 'development') {
            console.error(error.stack)
        }
        process.exit(1)
    }
}

function generateHtmlReport(suite) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Benchmark Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e3f2fd; padding: 15px; border-radius: 5px; flex: 1; }
        .benchmark { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .success { border-left: 4px solid #4caf50; }
        .failure { border-left: 4px solid #f44336; }
        .recommendations { background: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Benchmark Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Suite: ${suite.name}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Duration</h3>
            <p>${suite.totalDuration}ms</p>
        </div>
        <div class="metric">
            <h3>Average Ops/Second</h3>
            <p>${Math.round(suite.averageOpsPerSecond)}</p>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <p>${Math.round(suite.successRate * 100)}%</p>
        </div>
    </div>

    <h2>Individual Benchmarks</h2>
    ${suite.results.map(result => `
        <div class="benchmark ${result.success ? 'success' : 'failure'}">
            <h3>${result.name}</h3>
            <p><strong>Duration:</strong> ${result.duration}ms</p>
            <p><strong>Operations:</strong> ${result.operations}</p>
            <p><strong>Ops/Second:</strong> ${Math.round(result.opsPerSecond)}</p>
            <p><strong>Memory Delta:</strong> ${Math.round(result.memoryUsage.delta / 1024 / 1024 * 100) / 100}MB</p>
            <p><strong>Success:</strong> ${result.success ? '✅' : '❌'}</p>
            ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
        </div>
    `).join('')}

    <div class="recommendations">
        <h2>Recommendations</h2>
        ${suite.results.filter(r => r.opsPerSecond < 10).length > 0 ? 
          `<p>⚠️ Slow operations detected: ${suite.results.filter(r => r.opsPerSecond < 10).map(b => b.name).join(', ')}</p>` : ''}
        ${suite.results.filter(r => r.memoryUsage.delta > 50 * 1024 * 1024).length > 0 ? 
          `<p>⚠️ High memory usage: ${suite.results.filter(r => r.memoryUsage.delta > 50 * 1024 * 1024).map(b => b.name).join(', ')}</p>` : ''}
        ${suite.successRate < 0.95 ? 
          `<p>⚠️ Low success rate (${Math.round(suite.successRate * 100)}%) - investigate failures</p>` : ''}
    </div>
</body>
</html>
`
}

// Run the benchmarks
runBenchmarks().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})