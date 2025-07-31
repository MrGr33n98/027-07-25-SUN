#!/usr/bin/env ts-node

/**
 * Data backup and recovery system for secure authentication
 * 
 * This script provides comprehensive backup and recovery capabilities
 * for authentication-related data with encryption and validation.
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createGzip, createGunzip } from 'zlib';
import { createCipher, createDecipher, randomBytes } from 'crypto';

interface BackupOptions {
  type: 'full' | 'auth-only' | 'incremental';
  encrypt: boolean;
  compress: boolean;
  destination?: string;
  retention: number; // days
  verbose: boolean;
}

interface RecoveryOptions {
  backupPath: string;
  decrypt: boolean;
  decompress: boolean;
  dryRun: boolean;
  verbose: boolean;
}

interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: string;
  size: number;
  checksum: string;
  encrypted: boolean;
  compressed: boolean;
  tables: string[];
  recordCounts: Record<string, number>;
}

class BackupRecoveryService {
  private prisma: PrismaClient;
  private backupDir: string;
  private encryptionKey: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.backupDir = join(process.cwd(), 'backups');
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || this.generateEncryptionKey();
    
    // Ensure backup directory exists
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create backup
   */
  async createBackup(options: BackupOptions): Promise<string> {
    console.log('📦 Creating backup...');
    console.log(`Type: ${options.type}`);
    console.log(`Encrypt: ${options.encrypt}`);
    console.log(`Compress: ${options.compress}`);
    console.log('---');

    const backupId = this.generateBackupId();
    const timestamp = new Date();
    const backupPath = join(options.destination || this.backupDir, `backup-${backupId}`);

    try {
      // Create backup directory
      mkdirSync(backupPath, { recursive: true });

      let tables: string[] = [];
      let recordCounts: Record<string, number> = {};

      // Determine which tables to backup
      switch (options.type) {
        case 'auth-only':
          tables = ['users', 'security_events', 'auth_sessions'];
          break;
        case 'full':
          tables = await this.getAllTables();
          break;
        case 'incremental':
          tables = await this.getIncrementalTables();
          break;
      }

      console.log(`📋 Backing up ${tables.length} tables...`);

      // Backup each table
      for (const table of tables) {
        const count = await this.backupTable(table, backupPath, options);
        recordCounts[table] = count;
        
        if (options.verbose) {
          console.log(`  ✅ ${table}: ${count} records`);
        }
      }

      // Create metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        type: options.type,
        size: this.getDirectorySize(backupPath),
        checksum: await this.calculateChecksum(backupPath),
        encrypted: options.encrypt,
        compressed: options.compress,
        tables,
        recordCounts
      };

      // Save metadata
      const metadataPath = join(backupPath, 'metadata.json');
      writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      // Compress if requested
      if (options.compress) {
        await this.compressBackup(backupPath);
      }

      // Encrypt if requested
      if (options.encrypt) {
        await this.encryptBackup(backupPath);
      }

      console.log(`✅ Backup created: ${backupPath}`);
      console.log(`📊 Total records: ${Object.values(recordCounts).reduce((a, b) => a + b, 0)}`);
      console.log(`💾 Size: ${this.formatBytes(metadata.size)}`);

      // Cleanup old backups
      await this.cleanupOldBackups(options.retention);

      return backupPath;

    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(options: RecoveryOptions): Promise<void> {
    console.log('🔄 Starting backup restoration...');
    console.log(`Backup: ${options.backupPath}`);
    console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE RESTORE'}`);
    console.log('---');

    try {
      let restorePath = options.backupPath;

      // Decrypt if needed
      if (options.decrypt) {
        restorePath = await this.decryptBackup(restorePath);
      }

      // Decompress if needed
      if (options.decompress) {
        restorePath = await this.decompressBackup(restorePath);
      }

      // Load metadata
      const metadataPath = join(restorePath, 'metadata.json');
      if (!existsSync(metadataPath)) {
        throw new Error('Backup metadata not found');
      }

      const metadata: BackupMetadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
      
      console.log(`📋 Backup Info:`);
      console.log(`  ID: ${metadata.id}`);
      console.log(`  Created: ${metadata.timestamp}`);
      console.log(`  Type: ${metadata.type}`);
      console.log(`  Tables: ${metadata.tables.length}`);
      console.log(`  Records: ${Object.values(metadata.recordCounts).reduce((a, b) => a + b, 0)}`);
      console.log('');

      // Validate backup integrity
      const currentChecksum = await this.calculateChecksum(restorePath);
      if (currentChecksum !== metadata.checksum) {
        throw new Error('Backup integrity check failed - checksums do not match');
      }
      console.log('✅ Backup integrity verified');

      // Create database backup before restore
      if (!options.dryRun) {
        console.log('📦 Creating pre-restore backup...');
        await this.createBackup({
          type: 'full',
          encrypt: false,
          compress: true,
          destination: join(this.backupDir, 'pre-restore'),
          retention: 7,
          verbose: false
        });
      }

      // Restore each table
      for (const table of metadata.tables) {
        await this.restoreTable(table, restorePath, options);
        
        if (options.verbose) {
          console.log(`  ✅ Restored: ${table}`);
        }
      }

      console.log('✅ Backup restoration completed successfully!');

      // Validate restoration
      await this.validateRestoration(metadata, options);

    } catch (error) {
      console.error('❌ Restoration failed:', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    const backups: BackupMetadata[] = [];
    
    try {
      const entries = execSync(`find ${this.backupDir} -name "metadata.json" -type f`, { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(Boolean);

      for (const metadataPath of entries) {
        try {
          const metadata: BackupMetadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
          backups.push(metadata);
        } catch (error) {
          console.warn(`Warning: Could not read metadata from ${metadataPath}`);
        }
      }

      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  /**
   * Backup a single table
   */
  private async backupTable(tableName: string, backupPath: string, options: BackupOptions): Promise<number> {
    try {
      // Get table data based on table name
      let data: any[] = [];
      let count = 0;

      switch (tableName) {
        case 'users':
          data = await this.prisma.user.findMany();
          count = data.length;
          break;
        case 'security_events':
          data = await this.prisma.securityEvent.findMany();
          count = data.length;
          break;
        case 'auth_sessions':
          data = await this.prisma.authSession.findMany();
          count = data.length;
          break;
        // Add other tables as needed
        default:
          console.warn(`Unknown table: ${tableName}`);
          return 0;
      }

      // Write data to file
      const tablePath = join(backupPath, `${tableName}.json`);
      writeFileSync(tablePath, JSON.stringify(data, null, 2));

      return count;

    } catch (error) {
      console.error(`Error backing up table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Restore a single table
   */
  private async restoreTable(tableName: string, restorePath: string, options: RecoveryOptions): Promise<void> {
    try {
      const tablePath = join(restorePath, `${tableName}.json`);
      
      if (!existsSync(tablePath)) {
        console.warn(`Table backup not found: ${tableName}`);
        return;
      }

      const data = JSON.parse(readFileSync(tablePath, 'utf8'));

      if (options.dryRun) {
        console.log(`  Would restore ${data.length} records to ${tableName}`);
        return;
      }

      // Clear existing data (be very careful with this!)
      switch (tableName) {
        case 'users':
          await this.prisma.user.deleteMany({});
          await this.prisma.user.createMany({ data });
          break;
        case 'security_events':
          await this.prisma.securityEvent.deleteMany({});
          await this.prisma.securityEvent.createMany({ data });
          break;
        case 'auth_sessions':
          await this.prisma.authSession.deleteMany({});
          await this.prisma.authSession.createMany({ data });
          break;
        // Add other tables as needed
      }

    } catch (error) {
      console.error(`Error restoring table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get all table names
   */
  private async getAllTables(): Promise<string[]> {
    // This would query the database schema in a real implementation
    return ['users', 'security_events', 'auth_sessions', 'company_profiles', 'products', 'reviews'];
  }

  /**
   * Get tables for incremental backup
   */
  private async getIncrementalTables(): Promise<string[]> {
    // For incremental backups, focus on frequently changing tables
    return ['users', 'security_events', 'auth_sessions'];
  }

  /**
   * Compress backup directory
   */
  private async compressBackup(backupPath: string): Promise<void> {
    const compressedPath = `${backupPath}.tar.gz`;
    execSync(`tar -czf ${compressedPath} -C ${backupPath} .`);
    execSync(`rm -rf ${backupPath}`);
  }

  /**
   * Decompress backup
   */
  private async decompressBackup(backupPath: string): Promise<string> {
    const decompressedPath = backupPath.replace('.tar.gz', '');
    mkdirSync(decompressedPath, { recursive: true });
    execSync(`tar -xzf ${backupPath} -C ${decompressedPath}`);
    return decompressedPath;
  }

  /**
   * Encrypt backup directory
   */
  private async encryptBackup(backupPath: string): Promise<void> {
    // Simple encryption implementation
    const encryptedPath = `${backupPath}.enc`;
    const cipher = createCipher('aes-256-cbc', this.encryptionKey);
    
    // This is a simplified encryption - in production, use proper encryption
    execSync(`tar -czf - -C ${backupPath} . | openssl enc -aes-256-cbc -k "${this.encryptionKey}" > ${encryptedPath}`);
    execSync(`rm -rf ${backupPath}`);
  }

  /**
   * Decrypt backup
   */
  private async decryptBackup(backupPath: string): Promise<string> {
    const decryptedPath = backupPath.replace('.enc', '');
    mkdirSync(decryptedPath, { recursive: true });
    
    execSync(`openssl enc -d -aes-256-cbc -k "${this.encryptionKey}" -in ${backupPath} | tar -xzf - -C ${decryptedPath}`);
    return decryptedPath;
  }

  /**
   * Calculate directory checksum
   */
  private async calculateChecksum(dirPath: string): Promise<string> {
    try {
      const result = execSync(`find ${dirPath} -type f -exec md5sum {} \\; | sort | md5sum`, { encoding: 'utf8' });
      return result.split(' ')[0];
    } catch (error) {
      console.warn('Could not calculate checksum:', error);
      return 'unknown';
    }
  }

  /**
   * Get directory size
   */
  private getDirectorySize(dirPath: string): number {
    try {
      const result = execSync(`du -sb ${dirPath}`, { encoding: 'utf8' });
      return parseInt(result.split('\t')[0]);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Generate backup ID
   */
  private generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = randomBytes(4).toString('hex');
    return `${timestamp}-${random}`;
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Clean up old backups
   */
  private async cleanupOldBackups(retentionDays: number): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const backups = await this.listBackups();
      const oldBackups = backups.filter(backup => new Date(backup.timestamp) < cutoffDate);

      for (const backup of oldBackups) {
        const backupPath = join(this.backupDir, `backup-${backup.id}`);
        if (existsSync(backupPath)) {
          execSync(`rm -rf ${backupPath}`);
          console.log(`🗑️  Cleaned up old backup: ${backup.id}`);
        }
      }

    } catch (error) {
      console.warn('Warning: Could not cleanup old backups:', error);
    }
  }

  /**
   * Validate restoration
   */
  private async validateRestoration(metadata: BackupMetadata, options: RecoveryOptions): Promise<void> {
    console.log('🔍 Validating restoration...');

    try {
      for (const [table, expectedCount] of Object.entries(metadata.recordCounts)) {
        let actualCount = 0;

        switch (table) {
          case 'users':
            actualCount = await this.prisma.user.count();
            break;
          case 'security_events':
            actualCount = await this.prisma.securityEvent.count();
            break;
          case 'auth_sessions':
            actualCount = await this.prisma.authSession.count();
            break;
        }

        if (actualCount !== expectedCount) {
          console.warn(`⚠️  Record count mismatch in ${table}: expected ${expectedCount}, got ${actualCount}`);
        } else if (options.verbose) {
          console.log(`  ✅ ${table}: ${actualCount} records`);
        }
      }

      console.log('✅ Restoration validation completed');

    } catch (error) {
      console.error('❌ Restoration validation failed:', error);
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): { action: string; options: any } {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npm run backup -- <action> [options]');
    console.log('');
    console.log('Actions:');
    console.log('  create                   Create a new backup');
    console.log('  restore <path>           Restore from backup');
    console.log('  list                     List available backups');
    console.log('');
    console.log('Create Options:');
    console.log('  --type=<type>           Backup type: full, auth-only, incremental');
    console.log('  --encrypt               Encrypt the backup');
    console.log('  --compress              Compress the backup');
    console.log('  --destination=<path>    Backup destination directory');
    console.log('  --retention=<days>      Retention period in days');
    console.log('');
    console.log('Restore Options:');
    console.log('  --decrypt               Decrypt the backup');
    console.log('  --decompress            Decompress the backup');
    console.log('  --dry-run               Show what would be restored');
    console.log('');
    console.log('Examples:');
    console.log('  npm run backup -- create --type=auth-only --encrypt --compress');
    console.log('  npm run backup -- restore /path/to/backup --decrypt --decompress');
    console.log('  npm run backup -- list');
    process.exit(0);
  }

  const action = args[0];
  const backupPath = args[1];

  return {
    action,
    options: {
      backupPath,
      type: args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'full',
      encrypt: args.includes('--encrypt'),
      compress: args.includes('--compress'),
      decrypt: args.includes('--decrypt'),
      decompress: args.includes('--decompress'),
      destination: args.find(arg => arg.startsWith('--destination='))?.split('=')[1],
      retention: parseInt(args.find(arg => arg.startsWith('--retention='))?.split('=')[1] || '30'),
      dryRun: args.includes('--dry-run'),
      verbose: args.includes('--verbose') || args.includes('-v')
    }
  };
}

/**
 * Main execution
 */
async function main() {
  const { action, options } = parseArgs();
  const service = new BackupRecoveryService();
  
  try {
    switch (action) {
      case 'create':
        await service.createBackup(options);
        break;
      case 'restore':
        if (!options.backupPath) {
          throw new Error('Backup path is required for restore action');
        }
        await service.restoreBackup(options);
        break;
      case 'list':
        const backups = await service.listBackups();
        console.log('📋 Available Backups:');
        console.log('');
        for (const backup of backups) {
          console.log(`🗂️  ${backup.id}`);
          console.log(`   Created: ${backup.timestamp}`);
          console.log(`   Type: ${backup.type}`);
          console.log(`   Size: ${service['formatBytes'](backup.size)}`);
          console.log(`   Tables: ${backup.tables.length}`);
          console.log(`   Records: ${Object.values(backup.recordCounts).reduce((a, b) => a + b, 0)}`);
          console.log('');
        }
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Backup/Recovery failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { BackupRecoveryService };