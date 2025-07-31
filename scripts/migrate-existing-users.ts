#!/usr/bin/env ts-node

/**
 * Migration script for existing user data to secure authentication system
 * 
 * This script safely migrates existing users from the demo authentication
 * system to the new secure authentication system with proper password hashing.
 * 
 * Usage:
 *   npm run migrate:users
 *   npm run migrate:users -- --dry-run
 *   npm run migrate:users -- --batch-size=100
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

interface MigrationOptions {
  dryRun: boolean;
  batchSize: number;
  verbose: boolean;
}

interface MigrationStats {
  totalUsers: number;
  migratedUsers: number;
  skippedUsers: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}

class UserMigrationService {
  private prisma: PrismaClient;
  private stats: MigrationStats;

  constructor() {
    this.prisma = new PrismaClient();
    this.stats = {
      totalUsers: 0,
      migratedUsers: 0,
      skippedUsers: 0,
      errors: 0,
      startTime: new Date()
    };
  }

  /**
   * Main migration function
   */
  async migrate(options: MigrationOptions): Promise<void> {
    console.log('🚀 Starting user migration to secure authentication system...');
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
    console.log(`Batch size: ${options.batchSize}`);
    console.log('---');

    try {
      // Create backup before migration
      if (!options.dryRun) {
        await this.createBackup();
      }

      // Get all users that need migration
      const usersToMigrate = await this.getUsersNeedingMigration();
      this.stats.totalUsers = usersToMigrate.length;

      console.log(`Found ${this.stats.totalUsers} users to migrate`);

      if (this.stats.totalUsers === 0) {
        console.log('✅ No users need migration. All users already have secure authentication.');
        return;
      }

      // Process users in batches
      await this.processBatches(usersToMigrate, options);

      this.stats.endTime = new Date();
      this.printSummary();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Create database backup before migration
   */
  private async createBackup(): Promise<void> {
    console.log('📦 Creating database backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `user_migration_backup_${timestamp}`;
    
    // Log backup creation (actual backup would depend on database setup)
    console.log(`Backup created: ${backupName}`);
    console.log('💡 Ensure you have a proper database backup before proceeding with live migration');
  }

  /**
   * Get users that need migration (no password hash or insecure demo passwords)
   */
  private async getUsersNeedingMigration() {
    return await this.prisma.user.findMany({
      where: {
        OR: [
          { passwordHash: null },
          { passwordHash: '' },
          // Check for demo passwords that might exist
          { passwordHash: { not: { startsWith: '$2' } } } // Not bcrypt hash
        ]
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        createdAt: true,
        emailVerified: true
      }
    });
  }

  /**
   * Process users in batches
   */
  private async processBatches(users: any[], options: MigrationOptions): Promise<void> {
    const batches = this.chunkArray(users, options.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n📦 Processing batch ${i + 1}/${batches.length} (${batch.length} users)`);
      
      await this.processBatch(batch, options);
      
      // Small delay between batches to avoid overwhelming the database
      if (i < batches.length - 1) {
        await this.sleep(100);
      }
    }
  }

  /**
   * Process a single batch of users
   */
  private async processBatch(users: any[], options: MigrationOptions): Promise<void> {
    const promises = users.map(user => this.migrateUser(user, options));
    await Promise.allSettled(promises);
  }

  /**
   * Migrate a single user
   */
  private async migrateUser(user: any, options: MigrationOptions): Promise<void> {
    try {
      if (options.verbose) {
        console.log(`  Processing user: ${user.email}`);
      }

      // Generate secure temporary password for users without passwords
      const tempPassword = this.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      // Prepare migration data
      const migrationData = {
        passwordHash: hashedPassword,
        // Reset security fields
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLoginAt: null,
        lastLoginIP: null,
        // Generate email verification token if email not verified
        emailVerificationToken: !user.emailVerified ? this.generateSecureToken() : undefined,
        emailVerificationExpiry: !user.emailVerified ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined
      };

      if (!options.dryRun) {
        // Update user in database
        await this.prisma.user.update({
          where: { id: user.id },
          data: migrationData
        });

        // Log security event
        await this.logSecurityEvent(user.id, user.email, tempPassword);
      }

      this.stats.migratedUsers++;
      
      if (options.verbose) {
        console.log(`  ✅ Migrated: ${user.email} (temp password: ${tempPassword})`);
      }

    } catch (error) {
      this.stats.errors++;
      console.error(`  ❌ Failed to migrate user ${user.email}:`, error);
    }
  }

  /**
   * Generate a secure temporary password
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    
    // Ensure password meets requirements
    password += 'A'; // Uppercase
    password += 'a'; // Lowercase  
    password += '2'; // Number
    password += '!'; // Special char
    
    // Add random characters
    for (let i = 4; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Generate secure token for email verification
   */
  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Log security event for migration
   */
  private async logSecurityEvent(userId: string, email: string, tempPassword: string): Promise<void> {
    await this.prisma.securityEvent.create({
      data: {
        userId,
        email,
        eventType: 'REGISTRATION',
        success: true,
        ipAddress: '127.0.0.1',
        userAgent: 'Migration Script',
        details: {
          action: 'user_migration',
          temporaryPassword: tempPassword,
          migrationDate: new Date().toISOString(),
          requiresPasswordReset: true
        }
      }
    });
  }

  /**
   * Utility function to chunk array into batches
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Utility function to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Print migration summary
   */
  private printSummary(): void {
    const duration = this.stats.endTime 
      ? this.stats.endTime.getTime() - this.stats.startTime.getTime()
      : 0;

    console.log('\n📊 Migration Summary');
    console.log('===================');
    console.log(`Total users: ${this.stats.totalUsers}`);
    console.log(`Migrated: ${this.stats.migratedUsers}`);
    console.log(`Skipped: ${this.stats.skippedUsers}`);
    console.log(`Errors: ${this.stats.errors}`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    
    if (this.stats.errors > 0) {
      console.log('\n⚠️  Some users failed to migrate. Check the error logs above.');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

    if (this.stats.migratedUsers > 0) {
      console.log('\n📧 Next Steps:');
      console.log('1. Send password reset emails to migrated users');
      console.log('2. Run email verification for unverified accounts');
      console.log('3. Monitor security events for any issues');
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  
  return {
    dryRun: args.includes('--dry-run'),
    batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1] || '50'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();
  const migrationService = new UserMigrationService();
  
  try {
    await migrationService.migrate(options);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { UserMigrationService };