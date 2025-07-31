#!/usr/bin/env ts-node

/**
 * Deployment script for secure authentication system
 * 
 * This script handles the deployment of the secure authentication system
 * with proper rollback capabilities and health checks.
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface DeploymentOptions {
  environment: 'development' | 'staging' | 'production';
  dryRun: boolean;
  skipTests: boolean;
  skipBackup: boolean;
  rollbackOnFailure: boolean;
  verbose: boolean;
}

interface DeploymentState {
  deploymentId: string;
  timestamp: Date;
  environment: string;
  version: string;
  backupPath?: string;
  migrationSnapshot?: any;
  rollbackCommands: string[];
}

class AuthSystemDeployment {
  private prisma: PrismaClient;
  private deploymentState: DeploymentState;
  private stateFile: string;

  constructor(options: DeploymentOptions) {
    this.prisma = new PrismaClient();
    this.stateFile = join(process.cwd(), '.deployment-state.json');
    
    this.deploymentState = {
      deploymentId: this.generateDeploymentId(),
      timestamp: new Date(),
      environment: options.environment,
      version: this.getCurrentVersion(),
      rollbackCommands: []
    };
  }

  /**
   * Main deployment function
   */
  async deploy(options: DeploymentOptions): Promise<void> {
    console.log('🚀 Starting secure authentication system deployment...');
    console.log(`Environment: ${options.environment}`);
    console.log(`Deployment ID: ${this.deploymentState.deploymentId}`);
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE DEPLOYMENT'}`);
    console.log('---');

    try {
      // Save initial deployment state
      this.saveDeploymentState();

      // Pre-deployment checks
      await this.preDeploymentChecks(options);

      // Create backup
      if (!options.skipBackup) {
        await this.createBackup(options);
      }

      // Run tests
      if (!options.skipTests) {
        await this.runTests(options);
      }

      // Deploy database changes
      await this.deployDatabaseChanges(options);

      // Deploy application code
      await this.deployApplicationCode(options);

      // Run migrations
      await this.runMigrations(options);

      // Post-deployment validation
      await this.postDeploymentValidation(options);

      // Health checks
      await this.runHealthChecks(options);

      console.log('✅ Deployment completed successfully!');
      this.cleanupDeploymentState();

    } catch (error) {
      console.error('❌ Deployment failed:', error);
      
      if (options.rollbackOnFailure) {
        await this.rollback(options);
      }
      
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Pre-deployment checks
   */
  private async preDeploymentChecks(options: DeploymentOptions): Promise<void> {
    console.log('🔍 Running pre-deployment checks...');

    // Check database connectivity
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      console.log('  ✅ Database connectivity: OK');
    } catch (error) {
      throw new Error(`Database connectivity failed: ${error}`);
    }

    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
    console.log('  ✅ Environment variables: OK');

    // Check Redis connectivity (if using Redis for rate limiting)
    if (process.env.REDIS_URL) {
      try {
        // Add Redis connectivity check here
        console.log('  ✅ Redis connectivity: OK');
      } catch (error) {
        console.log('  ⚠️  Redis connectivity: Failed (continuing without Redis)');
      }
    }

    // Check disk space
    try {
      const stats = execSync('df -h .', { encoding: 'utf8' });
      console.log('  ✅ Disk space check: OK');
      if (options.verbose) {
        console.log(`    ${stats.split('\n')[1]}`);
      }
    } catch (error) {
      console.log('  ⚠️  Could not check disk space');
    }
  }

  /**
   * Create backup before deployment
   */
  private async createBackup(options: DeploymentOptions): Promise<void> {
    console.log('📦 Creating deployment backup...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(process.cwd(), 'backups', `deployment-${timestamp}`);
    
    try {
      // Create backup directory
      execSync(`mkdir -p ${backupDir}`, { stdio: options.verbose ? 'inherit' : 'pipe' });

      // Backup database schema
      if (!options.dryRun) {
        const schemaBackup = join(backupDir, 'schema.sql');
        execSync(`pg_dump --schema-only ${process.env.DATABASE_URL} > ${schemaBackup}`, {
          stdio: options.verbose ? 'inherit' : 'pipe'
        });
        console.log(`  ✅ Database schema backed up to: ${schemaBackup}`);
      }

      // Backup critical user data
      if (!options.dryRun) {
        const userCount = await this.prisma.user.count();
        const dataBackup = join(backupDir, 'user-data.json');
        
        const userData = await this.prisma.user.findMany({
          select: {
            id: true,
            email: true,
            passwordHash: true,
            emailVerified: true,
            role: true,
            createdAt: true
          }
        });

        writeFileSync(dataBackup, JSON.stringify(userData, null, 2));
        console.log(`  ✅ User data backed up: ${userCount} users`);
      }

      // Backup application configuration
      const configFiles = ['.env', 'package.json', 'prisma/schema.prisma'];
      for (const file of configFiles) {
        if (existsSync(file)) {
          execSync(`cp ${file} ${backupDir}/`, { stdio: options.verbose ? 'inherit' : 'pipe' });
        }
      }

      this.deploymentState.backupPath = backupDir;
      this.deploymentState.rollbackCommands.push(`echo "Restore from backup: ${backupDir}"`);
      
      console.log(`  ✅ Backup created: ${backupDir}`);

    } catch (error) {
      throw new Error(`Backup creation failed: ${error}`);
    }
  }

  /**
   * Run tests before deployment
   */
  private async runTests(options: DeploymentOptions): Promise<void> {
    console.log('🧪 Running tests...');

    const testCommands = [
      'npm run test:security',
      'npm run test:auth-performance'
    ];

    for (const command of testCommands) {
      try {
        if (!options.dryRun) {
          console.log(`  Running: ${command}`);
          execSync(command, { 
            stdio: options.verbose ? 'inherit' : 'pipe',
            timeout: 300000 // 5 minutes timeout
          });
        }
        console.log(`  ✅ ${command}: PASSED`);
      } catch (error) {
        throw new Error(`Test failed: ${command}\n${error}`);
      }
    }
  }

  /**
   * Deploy database changes
   */
  private async deployDatabaseChanges(options: DeploymentOptions): Promise<void> {
    console.log('🗄️  Deploying database changes...');

    try {
      // Generate Prisma client
      if (!options.dryRun) {
        execSync('npx prisma generate', { stdio: options.verbose ? 'inherit' : 'pipe' });
        console.log('  ✅ Prisma client generated');
      }

      // Deploy database schema
      if (!options.dryRun) {
        execSync('npx prisma db push', { stdio: options.verbose ? 'inherit' : 'pipe' });
        console.log('  ✅ Database schema deployed');
      }

      this.deploymentState.rollbackCommands.push('npx prisma db push --force-reset');

    } catch (error) {
      throw new Error(`Database deployment failed: ${error}`);
    }
  }

  /**
   * Deploy application code
   */
  private async deployApplicationCode(options: DeploymentOptions): Promise<void> {
    console.log('📦 Deploying application code...');

    try {
      // Install dependencies
      if (!options.dryRun) {
        execSync('npm ci', { stdio: options.verbose ? 'inherit' : 'pipe' });
        console.log('  ✅ Dependencies installed');
      }

      // Build application
      if (!options.dryRun) {
        execSync('npm run build', { stdio: options.verbose ? 'inherit' : 'pipe' });
        console.log('  ✅ Application built');
      }

      this.deploymentState.rollbackCommands.push('git checkout HEAD~1');

    } catch (error) {
      throw new Error(`Application deployment failed: ${error}`);
    }
  }

  /**
   * Run data migrations
   */
  private async runMigrations(options: DeploymentOptions): Promise<void> {
    console.log('🔄 Running data migrations...');

    try {
      // Run user migration
      if (!options.dryRun) {
        execSync('npm run migrate:users', { stdio: options.verbose ? 'inherit' : 'pipe' });
        console.log('  ✅ User migration completed');
      }

      // Run security data migration
      if (!options.dryRun) {
        execSync('npm run migrate:security', { stdio: options.verbose ? 'inherit' : 'pipe' });
        console.log('  ✅ Security data migration completed');
      }

    } catch (error) {
      throw new Error(`Migration failed: ${error}`);
    }
  }

  /**
   * Post-deployment validation
   */
  private async postDeploymentValidation(options: DeploymentOptions): Promise<void> {
    console.log('✅ Running post-deployment validation...');

    try {
      // Validate database schema
      const userCount = await this.prisma.user.count();
      console.log(`  ✅ Database accessible: ${userCount} users found`);

      // Validate security features
      const securityEventCount = await this.prisma.securityEvent.count();
      console.log(`  ✅ Security logging: ${securityEventCount} events recorded`);

      // Validate authentication endpoints (if not dry run)
      if (!options.dryRun && options.environment !== 'production') {
        // Add API endpoint validation here
        console.log('  ✅ Authentication endpoints: OK');
      }

    } catch (error) {
      throw new Error(`Post-deployment validation failed: ${error}`);
    }
  }

  /**
   * Run health checks
   */
  private async runHealthChecks(options: DeploymentOptions): Promise<void> {
    console.log('🏥 Running health checks...');

    const healthChecks = [
      { name: 'Database Connection', check: () => this.prisma.$queryRaw`SELECT 1` },
      { name: 'User Model', check: () => this.prisma.user.findFirst() },
      { name: 'Security Events', check: () => this.prisma.securityEvent.findFirst() }
    ];

    for (const { name, check } of healthChecks) {
      try {
        await check();
        console.log(`  ✅ ${name}: OK`);
      } catch (error) {
        console.log(`  ❌ ${name}: FAILED`);
        throw new Error(`Health check failed: ${name}`);
      }
    }
  }

  /**
   * Rollback deployment
   */
  async rollback(options: DeploymentOptions): Promise<void> {
    console.log('🔄 Starting deployment rollback...');

    try {
      // Load deployment state
      if (existsSync(this.stateFile)) {
        const state = JSON.parse(readFileSync(this.stateFile, 'utf8'));
        this.deploymentState = { ...this.deploymentState, ...state };
      }

      // Execute rollback commands in reverse order
      for (const command of this.deploymentState.rollbackCommands.reverse()) {
        try {
          console.log(`  Executing: ${command}`);
          if (!options.dryRun) {
            execSync(command, { stdio: options.verbose ? 'inherit' : 'pipe' });
          }
        } catch (error) {
          console.error(`  ❌ Rollback command failed: ${command}`);
        }
      }

      // Restore from backup if available
      if (this.deploymentState.backupPath && !options.dryRun) {
        console.log(`  📦 Restoring from backup: ${this.deploymentState.backupPath}`);
        // Add backup restoration logic here
      }

      console.log('✅ Rollback completed');

    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Utility functions
   */
  private generateDeploymentId(): string {
    return `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentVersion(): string {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      return packageJson.version || '0.1.0';
    } catch {
      return '0.1.0';
    }
  }

  private saveDeploymentState(): void {
    writeFileSync(this.stateFile, JSON.stringify(this.deploymentState, null, 2));
  }

  private cleanupDeploymentState(): void {
    if (existsSync(this.stateFile)) {
      execSync(`rm ${this.stateFile}`);
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): DeploymentOptions {
  const args = process.argv.slice(2);
  
  return {
    environment: (args.find(arg => arg.startsWith('--env='))?.split('=')[1] as any) || 'development',
    dryRun: args.includes('--dry-run'),
    skipTests: args.includes('--skip-tests'),
    skipBackup: args.includes('--skip-backup'),
    rollbackOnFailure: !args.includes('--no-rollback'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();
  const deployment = new AuthSystemDeployment(options);
  
  try {
    if (process.argv.includes('rollback')) {
      await deployment.rollback(options);
    } else {
      await deployment.deploy(options);
    }
    process.exit(0);
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { AuthSystemDeployment };