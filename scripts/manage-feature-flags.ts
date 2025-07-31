#!/usr/bin/env ts-node

/**
 * Feature flag management script
 * 
 * This script allows administrators to manage feature flags for the
 * gradual rollout of authentication features.
 */

import FeatureFlagService, { FeatureFlag, FeatureFlagContext } from '../lib/feature-flags';

interface FlagManagementOptions {
  action: 'list' | 'enable' | 'disable' | 'update' | 'test';
  flagName?: string;
  percentage?: number;
  users?: string[];
  roles?: string[];
  environments?: string[];
  testUserId?: string;
  testUserRole?: string;
  verbose: boolean;
}

class FeatureFlagManager {
  private flagService: FeatureFlagService;

  constructor() {
    this.flagService = FeatureFlagService.getInstance();
  }

  /**
   * Execute flag management command
   */
  async execute(options: FlagManagementOptions): Promise<void> {
    console.log('🚩 Feature Flag Management');
    console.log('=========================');

    try {
      switch (options.action) {
        case 'list':
          await this.listFlags(options);
          break;
        case 'enable':
          await this.enableFlag(options);
          break;
        case 'disable':
          await this.disableFlag(options);
          break;
        case 'update':
          await this.updateFlag(options);
          break;
        case 'test':
          await this.testFlag(options);
          break;
        default:
          throw new Error(`Unknown action: ${options.action}`);
      }

    } catch (error) {
      console.error('❌ Flag management failed:', error);
      throw error;
    }
  }

  /**
   * List all feature flags
   */
  private async listFlags(options: FlagManagementOptions): Promise<void> {
    console.log('📋 Current Feature Flags:');
    console.log('');

    const flags = await this.flagService.getAllFlags();

    for (const flag of flags) {
      console.log(`🚩 ${flag.name}`);
      console.log(`   Status: ${flag.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Rollout: ${flag.rolloutPercentage}%`);
      console.log(`   Environments: ${flag.environment.join(', ') || 'All'}`);
      
      if (flag.enabledUsers.length > 0) {
        console.log(`   Enabled Users: ${flag.enabledUsers.join(', ')}`);
      }
      
      if (flag.enabledRoles.length > 0) {
        console.log(`   Enabled Roles: ${flag.enabledRoles.join(', ')}`);
      }
      
      console.log(`   Description: ${flag.description}`);
      console.log(`   Updated: ${flag.updatedAt.toISOString()}`);
      console.log('');
    }
  }

  /**
   * Enable a feature flag
   */
  private async enableFlag(options: FlagManagementOptions): Promise<void> {
    if (!options.flagName) {
      throw new Error('Flag name is required for enable action');
    }

    console.log(`✅ Enabling feature flag: ${options.flagName}`);

    await this.flagService.updateFlag(options.flagName, {
      enabled: true,
      rolloutPercentage: options.percentage || 100
    });

    console.log(`✅ Feature flag ${options.flagName} enabled`);
  }

  /**
   * Disable a feature flag
   */
  private async disableFlag(options: FlagManagementOptions): Promise<void> {
    if (!options.flagName) {
      throw new Error('Flag name is required for disable action');
    }

    console.log(`❌ Disabling feature flag: ${options.flagName}`);

    await this.flagService.updateFlag(options.flagName, {
      enabled: false
    });

    console.log(`❌ Feature flag ${options.flagName} disabled`);
  }

  /**
   * Update a feature flag
   */
  private async updateFlag(options: FlagManagementOptions): Promise<void> {
    if (!options.flagName) {
      throw new Error('Flag name is required for update action');
    }

    console.log(`🔄 Updating feature flag: ${options.flagName}`);

    const updates: Partial<FeatureFlag> = {};

    if (options.percentage !== undefined) {
      updates.rolloutPercentage = options.percentage;
      console.log(`  Setting rollout percentage to: ${options.percentage}%`);
    }

    if (options.users) {
      updates.enabledUsers = options.users;
      console.log(`  Setting enabled users to: ${options.users.join(', ')}`);
    }

    if (options.roles) {
      updates.enabledRoles = options.roles;
      console.log(`  Setting enabled roles to: ${options.roles.join(', ')}`);
    }

    if (options.environments) {
      updates.environment = options.environments;
      console.log(`  Setting environments to: ${options.environments.join(', ')}`);
    }

    await this.flagService.updateFlag(options.flagName, updates);

    console.log(`✅ Feature flag ${options.flagName} updated`);
  }

  /**
   * Test a feature flag for a specific user
   */
  private async testFlag(options: FlagManagementOptions): Promise<void> {
    if (!options.flagName) {
      throw new Error('Flag name is required for test action');
    }

    console.log(`🧪 Testing feature flag: ${options.flagName}`);

    const context: FeatureFlagContext = {
      userId: options.testUserId,
      userRole: options.testUserRole,
      environment: process.env.NODE_ENV || 'development'
    };

    console.log('Test context:');
    console.log(`  User ID: ${context.userId || 'Not specified'}`);
    console.log(`  User Role: ${context.userRole || 'Not specified'}`);
    console.log(`  Environment: ${context.environment}`);
    console.log('');

    const isEnabled = await this.flagService.isEnabled(options.flagName, context);

    console.log(`Result: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);

    if (options.verbose) {
      // Test with different percentages to show rollout behavior
      console.log('\n📊 Rollout simulation (100 random users):');
      
      let enabledCount = 0;
      for (let i = 0; i < 100; i++) {
        const testContext: FeatureFlagContext = {
          userId: `test-user-${i}`,
          environment: context.environment
        };
        
        const enabled = await this.flagService.isEnabled(options.flagName, testContext);
        if (enabled) enabledCount++;
      }
      
      console.log(`  ${enabledCount}/100 users would have the feature enabled`);
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): FlagManagementOptions {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npm run flags -- <action> [options]');
    console.log('');
    console.log('Actions:');
    console.log('  list                     List all feature flags');
    console.log('  enable <flag>            Enable a feature flag');
    console.log('  disable <flag>           Disable a feature flag');
    console.log('  update <flag> [options]  Update a feature flag');
    console.log('  test <flag> [options]    Test a feature flag');
    console.log('');
    console.log('Options:');
    console.log('  --percentage=<n>         Set rollout percentage (0-100)');
    console.log('  --users=<u1,u2>         Set enabled users (comma-separated)');
    console.log('  --roles=<r1,r2>         Set enabled roles (comma-separated)');
    console.log('  --environments=<e1,e2>   Set environments (comma-separated)');
    console.log('  --test-user-id=<id>     User ID for testing');
    console.log('  --test-user-role=<role> User role for testing');
    console.log('  --verbose               Verbose output');
    console.log('');
    console.log('Examples:');
    console.log('  npm run flags -- list');
    console.log('  npm run flags -- enable secure-authentication');
    console.log('  npm run flags -- update account-lockout --percentage=25');
    console.log('  npm run flags -- test secure-authentication --test-user-id=user123');
    process.exit(0);
  }

  const action = args[0] as FlagManagementOptions['action'];
  const flagName = args[1];

  return {
    action,
    flagName,
    percentage: parseInt(args.find(arg => arg.startsWith('--percentage='))?.split('=')[1] || ''),
    users: args.find(arg => arg.startsWith('--users='))?.split('=')[1]?.split(','),
    roles: args.find(arg => arg.startsWith('--roles='))?.split('=')[1]?.split(','),
    environments: args.find(arg => arg.startsWith('--environments='))?.split('=')[1]?.split(','),
    testUserId: args.find(arg => arg.startsWith('--test-user-id='))?.split('=')[1],
    testUserRole: args.find(arg => arg.startsWith('--test-user-role='))?.split('=')[1],
    verbose: args.includes('--verbose') || args.includes('-v')
  };
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();
  const manager = new FeatureFlagManager();
  
  try {
    await manager.execute(options);
    process.exit(0);
  } catch (error) {
    console.error('Feature flag management failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { FeatureFlagManager };