/**
 * Feature flags system for gradual rollout of secure authentication
 * 
 * This system allows for controlled rollout of authentication features
 * with the ability to enable/disable features for specific users or percentages.
 */

import { PrismaClient } from '@prisma/client';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  enabledUsers: string[];
  enabledRoles: string[];
  environment: string[];
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagContext {
  userId?: string;
  userRole?: string;
  email?: string;
  environment: string;
  ipAddress?: string;
}

class FeatureFlagService {
  private static instance: FeatureFlagService;
  private prisma: PrismaClient;
  private flagCache: Map<string, FeatureFlag> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.prisma = new PrismaClient();
  }

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Check if a feature is enabled for the given context
   */
  async isEnabled(flagName: string, context: FeatureFlagContext): Promise<boolean> {
    try {
      const flag = await this.getFlag(flagName);
      
      if (!flag) {
        // Default to disabled if flag doesn't exist
        return false;
      }

      // Check if flag is globally disabled
      if (!flag.enabled) {
        return false;
      }

      // Check environment restriction
      if (flag.environment.length > 0 && !flag.environment.includes(context.environment)) {
        return false;
      }

      // Check if user is explicitly enabled
      if (context.userId && flag.enabledUsers.includes(context.userId)) {
        return true;
      }

      // Check if user role is enabled
      if (context.userRole && flag.enabledRoles.includes(context.userRole)) {
        return true;
      }

      // Check rollout percentage
      if (flag.rolloutPercentage > 0) {
        const hash = this.hashString(flagName + (context.userId || context.email || context.ipAddress || ''));
        const percentage = (hash % 100) + 1;
        return percentage <= flag.rolloutPercentage;
      }

      return false;

    } catch (error) {
      console.error(`Error checking feature flag ${flagName}:`, error);
      // Fail safe - return false if there's an error
      return false;
    }
  }

  /**
   * Get feature flag configuration
   */
  private async getFlag(flagName: string): Promise<FeatureFlag | null> {
    // Check cache first
    const cached = this.flagCache.get(flagName);
    const cacheTime = this.cacheExpiry.get(flagName);
    
    if (cached && cacheTime && Date.now() < cacheTime) {
      return cached;
    }

    try {
      // Try to get from database (would need a feature_flags table)
      // For now, return from in-memory configuration
      const flag = this.getDefaultFlags()[flagName];
      
      if (flag) {
        // Cache the flag
        this.flagCache.set(flagName, flag);
        this.cacheExpiry.set(flagName, Date.now() + this.CACHE_TTL);
      }

      return flag || null;

    } catch (error) {
      console.error(`Error fetching feature flag ${flagName}:`, error);
      return null;
    }
  }

  /**
   * Default feature flags configuration
   */
  private getDefaultFlags(): Record<string, FeatureFlag> {
    const now = new Date();
    
    return {
      'secure-authentication': {
        name: 'secure-authentication',
        enabled: true,
        rolloutPercentage: 100, // Start with 100% for new users
        enabledUsers: [],
        enabledRoles: ['ADMIN'], // Always enable for admins
        environment: ['development', 'staging', 'production'],
        description: 'Enable secure authentication system with bcrypt hashing',
        createdAt: now,
        updatedAt: now
      },
      'password-strength-validation': {
        name: 'password-strength-validation',
        enabled: true,
        rolloutPercentage: 100,
        enabledUsers: [],
        enabledRoles: ['ADMIN'],
        environment: ['development', 'staging', 'production'],
        description: 'Enable password strength validation requirements',
        createdAt: now,
        updatedAt: now
      },
      'account-lockout': {
        name: 'account-lockout',
        enabled: true,
        rolloutPercentage: 50, // Gradual rollout
        enabledUsers: [],
        enabledRoles: ['ADMIN'],
        environment: ['development', 'staging', 'production'],
        description: 'Enable account lockout after failed login attempts',
        createdAt: now,
        updatedAt: now
      },
      'email-verification-required': {
        name: 'email-verification-required',
        enabled: true,
        rolloutPercentage: 75,
        enabledUsers: [],
        enabledRoles: ['ADMIN'],
        environment: ['staging', 'production'],
        description: 'Require email verification for account access',
        createdAt: now,
        updatedAt: now
      },
      'rate-limiting': {
        name: 'rate-limiting',
        enabled: true,
        rolloutPercentage: 100,
        enabledUsers: [],
        enabledRoles: [],
        environment: ['staging', 'production'],
        description: 'Enable rate limiting for authentication endpoints',
        createdAt: now,
        updatedAt: now
      },
      'security-logging': {
        name: 'security-logging',
        enabled: true,
        rolloutPercentage: 100,
        enabledUsers: [],
        enabledRoles: [],
        environment: ['development', 'staging', 'production'],
        description: 'Enable comprehensive security event logging',
        createdAt: now,
        updatedAt: now
      },
      'password-reset-v2': {
        name: 'password-reset-v2',
        enabled: true,
        rolloutPercentage: 25, // Gradual rollout of new password reset flow
        enabledUsers: [],
        enabledRoles: ['ADMIN'],
        environment: ['development', 'staging'],
        description: 'Enable new secure password reset flow',
        createdAt: now,
        updatedAt: now
      },
      'session-management-v2': {
        name: 'session-management-v2',
        enabled: true,
        rolloutPercentage: 10, // Very gradual rollout
        enabledUsers: [],
        enabledRoles: ['ADMIN'],
        environment: ['development'],
        description: 'Enable new session management system',
        createdAt: now,
        updatedAt: now
      }
    };
  }

  /**
   * Update feature flag configuration
   */
  async updateFlag(flagName: string, updates: Partial<FeatureFlag>): Promise<void> {
    try {
      // In a real implementation, this would update the database
      const currentFlag = await this.getFlag(flagName);
      
      if (currentFlag) {
        const updatedFlag = {
          ...currentFlag,
          ...updates,
          updatedAt: new Date()
        };

        // Update cache
        this.flagCache.set(flagName, updatedFlag);
        this.cacheExpiry.set(flagName, Date.now() + this.CACHE_TTL);

        console.log(`Feature flag ${flagName} updated:`, updates);
      }

    } catch (error) {
      console.error(`Error updating feature flag ${flagName}:`, error);
      throw error;
    }
  }

  /**
   * Get all feature flags for admin dashboard
   */
  async getAllFlags(): Promise<FeatureFlag[]> {
    const flags = this.getDefaultFlags();
    return Object.values(flags);
  }

  /**
   * Clear cache for a specific flag or all flags
   */
  clearCache(flagName?: string): void {
    if (flagName) {
      this.flagCache.delete(flagName);
      this.cacheExpiry.delete(flagName);
    } else {
      this.flagCache.clear();
      this.cacheExpiry.clear();
    }
  }

  /**
   * Hash string for consistent percentage calculation
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Convenience functions for common feature flag checks
 */
export class AuthFeatureFlags {
  private static flagService = FeatureFlagService.getInstance();

  static async isSecureAuthEnabled(context: FeatureFlagContext): Promise<boolean> {
    return this.flagService.isEnabled('secure-authentication', context);
  }

  static async isPasswordStrengthValidationEnabled(context: FeatureFlagContext): Promise<boolean> {
    return this.flagService.isEnabled('password-strength-validation', context);
  }

  static async isAccountLockoutEnabled(context: FeatureFlagContext): Promise<boolean> {
    return this.flagService.isEnabled('account-lockout', context);
  }

  static async isEmailVerificationRequired(context: FeatureFlagContext): Promise<boolean> {
    return this.flagService.isEnabled('email-verification-required', context);
  }

  static async isRateLimitingEnabled(context: FeatureFlagContext): Promise<boolean> {
    return this.flagService.isEnabled('rate-limiting', context);
  }

  static async isSecurityLoggingEnabled(context: FeatureFlagContext): Promise<boolean> {
    return this.flagService.isEnabled('security-logging', context);
  }

  static async isPasswordResetV2Enabled(context: FeatureFlagContext): Promise<boolean> {
    return this.flagService.isEnabled('password-reset-v2', context);
  }

  static async isSessionManagementV2Enabled(context: FeatureFlagContext): Promise<boolean> {
    return this.flagService.isEnabled('session-management-v2', context);
  }
}

/**
 * React hook for feature flags (if using React)
 */
export function useFeatureFlag(flagName: string, context: FeatureFlagContext) {
  // This would be implemented as a React hook in a real application
  // For now, just return a promise-based function
  return {
    isEnabled: () => FeatureFlagService.getInstance().isEnabled(flagName, context),
    loading: false,
    error: null
  };
}

/**
 * Middleware for feature flag checks in API routes
 */
export function withFeatureFlag(flagName: string) {
  return function(handler: any) {
    return async function(req: any, res: any) {
      const context: FeatureFlagContext = {
        userId: req.user?.id,
        userRole: req.user?.role,
        email: req.user?.email,
        environment: process.env.NODE_ENV || 'development',
        ipAddress: req.ip || req.connection.remoteAddress
      };

      const isEnabled = await FeatureFlagService.getInstance().isEnabled(flagName, context);
      
      if (!isEnabled) {
        return res.status(404).json({ error: 'Feature not available' });
      }

      return handler(req, res);
    };
  };
}

export default FeatureFlagService;