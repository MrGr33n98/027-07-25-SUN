#!/usr/bin/env ts-node

/**
 * Deployment validation script
 * 
 * Validates that the secure authentication system has been deployed correctly
 * and all components are functioning as expected.
 */

import { PrismaClient } from '@prisma/client';
import { AuthFeatureFlags } from '../lib/feature-flags';

interface ValidationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

class DeploymentValidator {
  private prisma: PrismaClient;
  private results: ValidationResult[] = [];

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Run all validation checks
   */
  async validate(): Promise<void> {
    console.log('🔍 Validating secure authentication deployment...');
    console.log('================================================');

    try {
      await this.validateDatabase();
      await this.validateUserModel();
      await this.validateSecurityFeatures();
      await this.validateFeatureFlags();
      await this.validateEnvironment();
      await this.validatePerformance();

      this.printResults();

    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Validate database connectivity and schema
   */
  private async validateDatabase(): Promise<void> {
    try {
      // Test basic connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      this.addResult('Database Connectivity', 'pass', 'Database connection successful');

      // Check if required tables exist
      const tables = ['users', 'security_events', 'auth_sessions'];
      for (const table of tables) {
        try {
          await this.prisma.$queryRaw`SELECT 1 FROM ${table} LIMIT 1`;
          this.addResult(`Table: ${table}`, 'pass', 'Table exists and accessible');
        } catch (error) {
          this.addResult(`Table: ${table}`, 'fail', `Table not accessible: ${error}`);
        }
      }

      // Check indexes
      const indexQuery = `
        SELECT schemaname, tablename, indexname 
        FROM pg_indexes 
        WHERE tablename IN ('users', 'security_events', 'auth_sessions')
      `;
      
      const indexes = await this.prisma.$queryRawUnsafe(indexQuery);
      this.addResult('Database Indexes', 'pass', `Found ${(indexes as any[]).length} indexes`, indexes);

    } catch (error) {
      this.addResult('Database Connectivity', 'fail', `Database connection failed: ${error}`);
    }
  }

  /**
   * Validate user model and authentication fields
   */
  private async validateUserModel(): Promise<void> {
    try {
      // Check if users have proper authentication fields
      const userCount = await this.prisma.user.count();
      this.addResult('User Count', 'pass', `Found ${userCount} users in database`);

      // Check for users with password hashes
      const usersWithPasswords = await this.prisma.user.count({
        where: {
          passwordHash: {
            not: null
          }
        }
      });

      if (usersWithPasswords === 0 && userCount > 0) {
        this.addResult('Password Hashes', 'warning', 'No users have password hashes - migration may be needed');
      } else {
        this.addResult('Password Hashes', 'pass', `${usersWithPasswords} users have password hashes`);
      }

      // Check for bcrypt hashes
      const bcryptUsers = await this.prisma.user.count({
        where: {
          passwordHash: {
            startsWith: '$2'
          }
        }
      });

      this.addResult('Bcrypt Hashes', 'pass', `${bcryptUsers} users have bcrypt password hashes`);

      // Check security fields
      const usersWithSecurityFields = await this.prisma.user.findFirst({
        select: {
          failedLoginAttempts: true,
          accountLockedUntil: true,
          lastLoginAt: true,
          lastLoginIP: true
        }
      });

      if (usersWithSecurityFields) {
        this.addResult('Security Fields', 'pass', 'User security fields are present');
      } else {
        this.addResult('Security Fields', 'fail', 'User security fields are missing');
      }

    } catch (error) {
      this.addResult('User Model', 'fail', `User model validation failed: ${error}`);
    }
  }

  /**
   * Validate security features
   */
  private async validateSecurityFeatures(): Promise<void> {
    try {
      // Check security events logging
      const securityEventCount = await this.prisma.securityEvent.count();
      this.addResult('Security Events', 'pass', `Found ${securityEventCount} security events`);

      // Check auth sessions
      const sessionCount = await this.prisma.authSession.count();
      this.addResult('Auth Sessions', 'pass', `Found ${sessionCount} auth sessions`);

      // Check for recent security events (last 24 hours)
      const recentEvents = await this.prisma.securityEvent.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      if (recentEvents > 0) {
        this.addResult('Recent Security Activity', 'pass', `${recentEvents} security events in last 24 hours`);
      } else {
        this.addResult('Recent Security Activity', 'warning', 'No recent security events - system may be inactive');
      }

    } catch (error) {
      this.addResult('Security Features', 'fail', `Security features validation failed: ${error}`);
    }
  }

  /**
   * Validate feature flags
   */
  private async validateFeatureFlags(): Promise<void> {
    try {
      const context = {
        environment: process.env.NODE_ENV || 'development'
      };

      // Test core feature flags
      const secureAuthEnabled = await AuthFeatureFlags.isSecureAuthEnabled(context);
      this.addResult('Secure Authentication Flag', secureAuthEnabled ? 'pass' : 'warning', 
        `Secure authentication is ${secureAuthEnabled ? 'enabled' : 'disabled'}`);

      const passwordValidationEnabled = await AuthFeatureFlags.isPasswordStrengthValidationEnabled(context);
      this.addResult('Password Validation Flag', passwordValidationEnabled ? 'pass' : 'warning',
        `Password validation is ${passwordValidationEnabled ? 'enabled' : 'disabled'}`);

      const securityLoggingEnabled = await AuthFeatureFlags.isSecurityLoggingEnabled(context);
      this.addResult('Security Logging Flag', securityLoggingEnabled ? 'pass' : 'warning',
        `Security logging is ${securityLoggingEnabled ? 'enabled' : 'disabled'}`);

    } catch (error) {
      this.addResult('Feature Flags', 'fail', `Feature flags validation failed: ${error}`);
    }
  }

  /**
   * Validate environment configuration
   */
  private async validateEnvironment(): Promise<void> {
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        this.addResult(`Environment: ${envVar}`, 'pass', 'Environment variable is set');
      } else {
        this.addResult(`Environment: ${envVar}`, 'fail', 'Required environment variable is missing');
      }
    }

    // Optional environment variables
    const optionalEnvVars = [
      'REDIS_URL',
      'BACKUP_ENCRYPTION_KEY',
      'EMAIL_SERVER_URL'
    ];

    for (const envVar of optionalEnvVars) {
      if (process.env[envVar]) {
        this.addResult(`Environment: ${envVar}`, 'pass', 'Optional environment variable is set');
      } else {
        this.addResult(`Environment: ${envVar}`, 'warning', 'Optional environment variable is not set');
      }
    }

    // Check Node environment
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production') {
      this.addResult('Node Environment', 'pass', 'Running in production mode');
    } else {
      this.addResult('Node Environment', 'warning', `Running in ${nodeEnv} mode`);
    }
  }

  /**
   * Validate performance aspects
   */
  private async validatePerformance(): Promise<void> {
    try {
      // Test database query performance
      const startTime = Date.now();
      await this.prisma.user.findMany({ take: 10 });
      const queryTime = Date.now() - startTime;

      if (queryTime < 100) {
        this.addResult('Database Performance', 'pass', `Query completed in ${queryTime}ms`);
      } else if (queryTime < 500) {
        this.addResult('Database Performance', 'warning', `Query completed in ${queryTime}ms (acceptable)`);
      } else {
        this.addResult('Database Performance', 'fail', `Query completed in ${queryTime}ms (too slow)`);
      }

      // Check for proper indexes on frequently queried fields
      const emailIndexQuery = `
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'users' AND indexdef LIKE '%email%'
      `;
      
      const emailIndexes = await this.prisma.$queryRawUnsafe(emailIndexQuery);
      if ((emailIndexes as any[]).length > 0) {
        this.addResult('Email Index', 'pass', 'Email field is properly indexed');
      } else {
        this.addResult('Email Index', 'warning', 'Email field may not be indexed');
      }

    } catch (error) {
      this.addResult('Performance', 'fail', `Performance validation failed: ${error}`);
    }
  }

  /**
   * Add validation result
   */
  private addResult(component: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any): void {
    this.results.push({ component, status, message, details });
  }

  /**
   * Print validation results
   */
  private printResults(): void {
    console.log('\n📊 Validation Results');
    console.log('====================');

    const passed = this.results.filter(r => r.status === 'pass').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const failed = this.results.filter(r => r.status === 'fail').length;

    for (const result of this.results) {
      const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${result.component}: ${result.message}`);
      
      if (result.details && process.argv.includes('--verbose')) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    }

    console.log('\n📈 Summary');
    console.log('==========');
    console.log(`✅ Passed: ${passed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${this.results.length}`);

    if (failed > 0) {
      console.log('\n❌ Deployment validation FAILED');
      console.log('Please address the failed checks before proceeding.');
      process.exit(1);
    } else if (warnings > 0) {
      console.log('\n⚠️  Deployment validation completed with WARNINGS');
      console.log('Review the warnings and consider addressing them.');
    } else {
      console.log('\n✅ Deployment validation PASSED');
      console.log('All checks completed successfully!');
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const validator = new DeploymentValidator();
  
  try {
    await validator.validate();
    process.exit(0);
  } catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DeploymentValidator };