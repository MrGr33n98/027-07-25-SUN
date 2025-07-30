#!/usr/bin/env node

/**
 * Database Optimization Runner
 * 
 * This script applies database optimizations including indexes and performance monitoring.
 * 
 * Usage:
 *   node scripts/run-database-optimization.js [options]
 * 
 * Options:
 *   --dry-run         Show what woulcuted without running
 *   --indexes-only    Only create indexes, skip monitoring setup
 *   --monitor-only    Only setup monitoring, skip index creation
 *   --help           Show help
 */

const fs = require('fs')
const path = require('path')

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
    dryRun: false,
    indexesOnly: false,
    monitorOnly: false,
    help: false,
}

for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case '--dry-run':
            options.dryRun = true
            break
        case '--indexes-only':
            options.indexesOnly = true
            break
        case '--monitor-only':
            options.monitorOnly = true
            break
        case '--help':
            options.help = true
            break
    }
}

if (options.help) {
    console.log(`
Database Optimization Runner

Usage:
  node scripts/run-database-optimization.js [options]

Options:
  --dry-run         Show what would be executed without running
  --indexes-only    Only create indexes, skip monitoring setup
  --monitor-only    Only setup monitoring, skip index creation
  --help           Show help

Examples:
  node scripts/run-database-optimization.js
  node scripts/run-database-optimization.js --dry-run
  node scripts/run-database-optimization.js --indexes-only
`)
    process.exit(0)
}

async function runOptimization() {
    console.log('🔧 Starting Database Optimization...')

    try {
        // Dynamic import to handle ES modules
        const {
            db
        } = await import('../lib/db.js')
        const {
            databaseOptimizer
        } = await import('../lib/database-optimizer.js')

        // Read the SQL optimization script
        const sqlPath = path.join(__dirname, 'optimize-database-indexes.sql')
        const sqlContent = fs.readFileSync(sqlPath, 'utf8')

        if (options.dryRun) {
            console.log('🔍 DRY RUN MODE - No changes will be made')
            console.log('\nSQL that would be executed:')
            console.log('='.repeat(50))
            console.log(sqlContent)
            console.log('='.repeat(50))
            return
        }

        // Check database health before optimization
        console.log('🏥 Checking database health...')
        const healthBefore = await databaseOptimizer.getDatabaseHealth()
        console.log(`Current status: ${healthBefore.status}`)
        console.log(`Connection time: ${healthBefore.connectionTime}ms`)

        if (!options.monitorOnly) {
            console.log('\n📊 Creating performance indexes...')

            // Split SQL into individual statements
            const statements = sqlContent
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

            let indexCount = 0
            let viewCount = 0
            let functionCount = 0

            for (const statement of statements) {
                try {
                    if (statement.includes('CREATE INDEX')) {
                        await db.$executeRawUnsafe(statement)
                        indexCount++
                        console.log(`  ✅ Created index: ${extractIndexName(statement)}`)
                    } else if (statement.includes('CREATE OR REPLACE VIEW')) {
                        await db.$executeRawUnsafe(statement)
                        viewCount++
                        console.log(`  ✅ Created view: ${extractViewName(statement)}`)
                    } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
                        await db.$executeRawUnsafe(statement)
                        functionCount++
                        console.log(`  ✅ Created function: ${extractFunctionName(statement)}`)
                    } else if (statement.includes('COMMENT ON')) {
                        await db.$executeRawUnsafe(statement)
                    }
                } catch (error) {
                    // Some indexes might already exist, which is fine
                    if (error.message.includes('already exists')) {
                        console.log(`  ⚠️  Already exists: ${extractObjectName(statement)}`)
                    } else {
                        console.error(`  ❌ Failed to execute: ${statement.substring(0, 50)}...`)
                        console.error(`     Error: ${error.message}`)
                    }
                }
            }

            console.log(`\n📈 Summary:`)
            console.log(`  - Indexes created/verified: ${indexCount}`)
            console.log(`  - Views created: ${viewCount}`)
            console.log(`  - Functions created: ${functionCount}`)
        }

        if (!options.indexesOnly) {
            console.log('\n🔍 Setting up performance monitoring...')

            // Enable query statistics if not already enabled
            try {
                await db.$executeRaw `CREATE EXTENSION IF NOT EXISTS pg_stat_statements`
                console.log('  ✅ pg_stat_statements extension enabled')
            } catch (error) {
                console.log('  ⚠️  Could not enable pg_stat_statements (may require superuser privileges)')
            }

            // Test monitoring views
            try {
                const slowQueries = await db.$queryRaw `SELECT * FROM performance_slow_queries LIMIT 5`
                console.log(`  ✅ Performance monitoring active (${slowQueries.length} slow queries found)`)
            } catch (error) {
                console.log('  ⚠️  Performance monitoring views not accessible')
            }
        }

        // Check database health after optimization
        console.log('\n🏥 Checking database health after optimization...')
        const healthAfter = await databaseOptimizer.getDatabaseHealth()
        console.log(`Status: ${healthAfter.status}`)
        console.log(`Connection time: ${healthAfter.connectionTime}ms`)

        if (healthAfter.recommendations && healthAfter.recommendations.length > 0) {
            console.log('\n💡 Additional recommendations:')
            healthAfter.recommendations.forEach(rec => console.log(`  - ${rec}`))
        }

        // Performance comparison
        if (healthBefore.connectionTime && healthAfter.connectionTime) {
            const improvement = healthBefore.connectionTime - healthAfter.connectionTime
            if (improvement > 0) {
                console.log(`\n⚡ Connection time improved by ${improvement}ms`)
            }
        }

        console.log('\n✅ Database optimization completed successfully!')
        console.log('\n📋 Next steps:')
        console.log('  1. Monitor query performance using: SELECT * FROM performance_slow_queries;')
        console.log('  2. Check index usage with: SELECT * FROM index_usage_stats;')
        console.log('  3. Analyze table sizes with: SELECT * FROM table_size_stats;')
        console.log('  4. Run performance analysis: SELECT * FROM analyze_query_performance();')
        console.log('  5. Run benchmarks: npm run benchmark')

    } catch (error) {
        console.error('❌ Database optimization failed:', error.message)
        if (process.env.NODE_ENV === 'development') {
            console.error(error.stack)
        }
        process.exit(1)
    }
}

function extractIndexName(statement) {
    const match = statement.match(/CREATE INDEX[^\\s]*\\s+(?:IF NOT EXISTS\\s+)?([^\\s]+)/i)
    return match ? match[1] : 'unknown'
}

function extractViewName(statement) {
    const match = statement.match(/CREATE OR REPLACE VIEW\\s+([^\\s]+)/i)
    return match ? match[1] : 'unknown'
}

function extractFunctionName(statement) {
    const match = statement.match(/CREATE OR REPLACE FUNCTION\\s+([^\\s(]+)/i)
    return match ? match[1] : 'unknown'
}

function extractObjectName(statement) {
    return extractIndexName(statement) || extractViewName(statement) || extractFunctionName(statement)
}

// Run the optimization
runOptimization().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})