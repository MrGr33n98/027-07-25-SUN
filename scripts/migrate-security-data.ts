#!/usr/bin/env ts-node

/**
 * Security data migration script
 * 
 * Migrates and consolidates security-related data for the new authentication system.
 * This includes cleaning up old sessions, consolidating security events, and 
 * ensuring data integrity.
 */

import { PrismaClient } from '@prisma/client';

interface SecurityMigrationOptions {
  dryRun: boolean;
  cleanupOldSessions: boolean;
  consolidateEvents: boolean;
  verbose: boolean;
}

interface SecurityMigrationStats {
  oldSessionsRemoved: number;
  eventsConsolidated: number;
  tokensCleanedUp: number;
  errors: number;
}

class SecurityDataMigrationService {
  private prisma: PrismaClient;
  private stats: SecurityMigrationStats;

  constructor() {
    this.prisma = new PrismaClient();
    this.stats = {
      oldSessionsRemoved: 0,
      eventsConsolidated: 0,
      tokensCleanedUp: 0,
      errors: 0
    };
  }

  async migrate(options: SecurityMigrationOptions): Promise<void> {
    console.log('🔒 Starting security data migration...');
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
    console.log('---');

    try {
      if (options.cleanupOldSessions) {
        await this.cleanupOldSessions(options);
      }

      if (options.consolidateEvents) {
        await this.consolidateSecurityEvents(options);
      }

      await this.cleanupExpiredTokens(options);
      await this.validateDataIntegrity(options);

      this.printSummary();

    } catch (error) {
      console.error('❌ Security migration failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Clean up old NextAuth sessions that are no longer compatible
   */
  private async cleanupOldSessions(options: SecurityMigrationOptions): Promise<void> {
    console.log('🧹 Cleaning up old sessions...');

    try {
      // Find expired sessions
      const expiredSessions = await this.prisma.session.findMany({
        where: {
          expires: {
            lt: new Date()
          }
        }
      });

      if (options.verbose) {
        console.log(`Found ${expiredSessions.length} expired sessions to remove`);
      }

      if (!options.dryRun && expiredSessions.length > 0) {
        const result = await this.prisma.session.deleteMany({
          where: {
            expires: {
              lt: new Date()
            }
          }
        });

        this.stats.oldSessionsRemoved = result.count;
      } else {
        this.stats.oldSessionsRemoved = expiredSessions.length;
      }

      console.log(`✅ Cleaned up ${this.stats.oldSessionsRemoved} expired sessions`);

    } catch (error) {
      this.stats.errors++;
      console.error('❌ Failed to cleanup old sessions:', error);
    }
  }

  /**
   * Consolidate and clean up security events
   */
  private async consolidateSecurityEvents(options: SecurityMigrationOptions): Promise<void> {
    console.log('📊 Consolidating security events...');

    try {
      // Remove duplicate events (same user, type, timestamp within 1 second)
      const duplicateEvents = await this.prisma.$queryRaw`
        SELECT id FROM security_events s1
        WHERE EXISTS (
          SELECT 1 FROM security_events s2 
          WHERE s2.id > s1.id 
          AND s2."userId" = s1."userId"
          AND s2."eventType" = s1."eventType"
          AND ABS(EXTRACT(EPOCH FROM (s2.timestamp - s1.timestamp))) < 1
        )
      ` as { id: string }[];

      if (options.verbose) {
        console.log(`Found ${duplicateEvents.length} duplicate security events`);
      }

      if (!options.dryRun && duplicateEvents.length > 0) {
        const result = await this.prisma.securityEvent.deleteMany({
          where: {
            id: {
              in: duplicateEvents.map(e => e.id)
            }
          }
        });

        this.stats.eventsConsolidated = result.count;
      } else {
        this.stats.eventsConsolidated = duplicateEvents.length;
      }

      console.log(`✅ Consolidated ${this.stats.eventsConsolidated} duplicate security events`);

    } catch (error) {
      this.stats.errors++;
      console.error('❌ Failed to consolidate security events:', error);
    }
  }

  /**
   * Clean up expired tokens
   */
  private async cleanupExpiredTokens(options: SecurityMigrationOptions): Promise<void> {
    console.log('🎫 Cleaning up expired tokens...');

    try {
      const now = new Date();
      
      // Count expired tokens
      const expiredEmailTokens = await this.prisma.user.count({
        where: {
          emailVerificationExpiry: {
            lt: now
          },
          emailVerificationToken: {
            not: null
          }
        }
      });

      const expiredResetTokens = await this.prisma.user.count({
        where: {
          passwordResetExpiry: {
            lt: now
          },
          passwordResetToken: {
            not: null
          }
        }
      });

      const totalExpiredTokens = expiredEmailTokens + expiredResetTokens;

      if (options.verbose) {
        console.log(`Found ${expiredEmailTokens} expired email verification tokens`);
        console.log(`Found ${expiredResetTokens} expired password reset tokens`);
      }

      if (!options.dryRun && totalExpiredTokens > 0) {
        // Clear expired email verification tokens
        await this.prisma.user.updateMany({
          where: {
            emailVerificationExpiry: {
              lt: now
            },
            emailVerificationToken: {
              not: null
            }
          },
          data: {
            emailVerificationToken: null,
            emailVerificationExpiry: null
          }
        });

        // Clear expired password reset tokens
        await this.prisma.user.updateMany({
          where: {
            passwordResetExpiry: {
              lt: now
            },
            passwordResetToken: {
              not: null
            }
          },
          data: {
            passwordResetToken: null,
            passwordResetExpiry: null
          }
        });
      }

      this.stats.tokensCleanedUp = totalExpiredTokens;
      console.log(`✅ Cleaned up ${totalExpiredTokens} expired tokens`);

    } catch (error) {
      this.stats.errors++;
      console.error('❌ Failed to cleanup expired tokens:', error);
    }
  }

  /**
   * Validate data integrity after migration
   */
  private async validateDataIntegrity(options: SecurityMigrationOptions): Promise<void> {
    console.log('🔍 Validating data integrity...');

    try {
      // Check for users without proper password hashes
      const usersWithoutPasswords = await this.prisma.user.count({
        where: {
          OR: [
            { passwordHash: null },
            { passwordHash: '' }
          ]
        }
      });

      // Check for orphaned security events
      const orphanedEvents = await this.prisma.securityEvent.count({
        where: {
          userId: {
            not: null
          },
          user: null
        }
      });

      // Check for orphaned auth sessions
      const orphanedSessions = await this.prisma.authSession.count({
        where: {
          user: null
        }
      });

      if (usersWithoutPasswords > 0) {
        console.log(`⚠️  Found ${usersWithoutPasswords} users without password hashes`);
      }

      if (orphanedEvents > 0) {
        console.log(`⚠️  Found ${orphanedEvents} orphaned security events`);
      }

      if (orphanedSessions > 0) {
        console.log(`⚠️  Found ${orphanedSessions} orphaned auth sessions`);
      }

      if (usersWithoutPasswords === 0 && orphanedEvents === 0 && orphanedSessions === 0) {
        console.log('✅ Data integrity validation passed');
      }

    } catch (error) {
      this.stats.errors++;
      console.error('❌ Data integrity validation failed:', error);
    }
  }

  /**
   * Print migration summary
   */
  private printSummary(): void {
    console.log('\n📊 Security Migration Summary');
    console.log('=============================');
    console.log(`Old sessions removed: ${this.stats.oldSessionsRemoved}`);
    console.log(`Events consolidated: ${this.stats.eventsConsolidated}`);
    console.log(`Tokens cleaned up: ${this.stats.tokensCleanedUp}`);
    console.log(`Errors: ${this.stats.errors}`);
    
    if (this.stats.errors > 0) {
      console.log('\n⚠️  Some operations failed. Check the error logs above.');
    } else {
      console.log('\n✅ Security data migration completed successfully!');
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): SecurityMigrationOptions {
  const args = process.argv.slice(2);
  
  return {
    dryRun: args.includes('--dry-run'),
    cleanupOldSessions: !args.includes('--skip-sessions'),
    consolidateEvents: !args.includes('--skip-events'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();
  const migrationService = new SecurityDataMigrationService();
  
  try {
    await migrationService.migrate(options);
    process.exit(0);
  } catch (error) {
    console.error('Security migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { SecurityDataMigrationService };