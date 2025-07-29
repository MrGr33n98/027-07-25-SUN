import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

/**
 * Token types for different authentication operations
 */
export enum TokenType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

/**
 * Token configuration for different types
 */
interface TokenConfig {
  expiryMinutes: number;
  length: number;
  encoding: 'hex' | 'base64url';
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  isUsed: boolean;
  userId?: string;
  error?: string;
}

/**
 * Token generation result
 */
export interface TokenGenerationResult {
  token: string;
  expiresAt: Date;
  userId: string;
}

/**
 * Default token configurations based on security requirements
 */
const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
  [TokenType.EMAIL_VERIFICATION]: {
    expiryMinutes: 24 * 60, // 24 hours
    length: 32, // 32 bytes = 64 hex characters
    encoding: 'hex',
  },
  [TokenType.PASSWORD_RESET]: {
    expiryMinutes: 60, // 1 hour
    length: 32, // 32 bytes for high security
    encoding: 'base64url', // URL-safe for email links
  },
};

/**
 * Secure token service for authentication operations
 * Handles token generation, validation, and cleanup with security best practices
 */
export class TokenService {
  private readonly prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Generate a secure token for email verification
   * @param userId - User ID to associate with the token
   * @returns Promise resolving to token generation result
   */
  async generateEmailVerificationToken(userId: string): Promise<TokenGenerationResult> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required and must be a string');
    }

    const config = TOKEN_CONFIGS[TokenType.EMAIL_VERIFICATION];
    const token = this.generateSecureToken(config.length, config.encoding);
    const expiresAt = new Date(Date.now() + config.expiryMinutes * 60 * 1000);

    try {
      // Invalidate any existing email verification tokens for this user
      await this.prisma.user.updateMany({
        where: {
          id: userId,
          emailVerificationToken: { not: null },
        },
        data: {
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        },
      });

      // Store the new token
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          emailVerificationToken: token,
          emailVerificationExpiry: expiresAt,
        },
      });

      return {
        token,
        expiresAt,
        userId,
      };
    } catch (error) {
      throw new Error('Failed to generate email verification token');
    }
  }

  /**
   * Generate a secure token for password reset
   * @param userId - User ID to associate with the token
   * @returns Promise resolving to token generation result
   */
  async generatePasswordResetToken(userId: string): Promise<TokenGenerationResult> {
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID is required and must be a string');
    }

    const config = TOKEN_CONFIGS[TokenType.PASSWORD_RESET];
    const token = this.generateSecureToken(config.length, config.encoding);
    const expiresAt = new Date(Date.now() + config.expiryMinutes * 60 * 1000);

    try {
      // Invalidate any existing password reset tokens for this user
      await this.prisma.user.updateMany({
        where: {
          id: userId,
          passwordResetToken: { not: null },
        },
        data: {
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      });

      // Store the new token
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordResetToken: token,
          passwordResetExpiry: expiresAt,
        },
      });

      return {
        token,
        expiresAt,
        userId,
      };
    } catch (error) {
      throw new Error('Failed to generate password reset token');
    }
  }

  /**
   * Validate an email verification token
   * @param token - Token to validate
   * @returns Promise resolving to validation result
   */
  async validateEmailVerificationToken(token: string): Promise<TokenValidationResult> {
    if (!token || typeof token !== 'string') {
      return {
        isValid: false,
        isExpired: false,
        isUsed: false,
        error: 'Token is required',
      };
    }

    // Validate token format
    if (!this.validateTokenFormat(token, TokenType.EMAIL_VERIFICATION)) {
      return {
        isValid: false,
        isExpired: false,
        isUsed: false,
        error: 'Invalid token format',
      };
    }

    try {
      const user = await this.prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
        },
        select: {
          id: true,
          emailVerificationToken: true,
          emailVerificationExpiry: true,
          emailVerified: true,
        },
      });

      if (!user) {
        return {
          isValid: false,
          isExpired: false,
          isUsed: true,
          error: 'Token not found or already used',
        };
      }

      // Check if token has expired
      if (!user.emailVerificationExpiry || new Date() > user.emailVerificationExpiry) {
        return {
          isValid: false,
          isExpired: true,
          isUsed: false,
          userId: user.id,
          error: 'Token has expired',
        };
      }

      return {
        isValid: true,
        isExpired: false,
        isUsed: false,
        userId: user.id,
      };
    } catch (error) {
      return {
        isValid: false,
        isExpired: false,
        isUsed: false,
        error: 'Failed to validate token',
      };
    }
  }

  /**
   * Validate a password reset token
   * @param token - Token to validate
   * @returns Promise resolving to validation result
   */
  async validatePasswordResetToken(token: string): Promise<TokenValidationResult> {
    if (!token || typeof token !== 'string') {
      return {
        isValid: false,
        isExpired: false,
        isUsed: false,
        error: 'Token is required',
      };
    }

    // Validate token format
    if (!this.validateTokenFormat(token, TokenType.PASSWORD_RESET)) {
      return {
        isValid: false,
        isExpired: false,
        isUsed: false,
        error: 'Invalid token format',
      };
    }

    try {
      const user = await this.prisma.user.findFirst({
        where: {
          passwordResetToken: token,
        },
        select: {
          id: true,
          passwordResetToken: true,
          passwordResetExpiry: true,
        },
      });

      if (!user) {
        return {
          isValid: false,
          isExpired: false,
          isUsed: true,
          error: 'Token not found or already used',
        };
      }

      // Check if token has expired
      if (!user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
        return {
          isValid: false,
          isExpired: true,
          isUsed: false,
          userId: user.id,
          error: 'Token has expired',
        };
      }

      return {
        isValid: true,
        isExpired: false,
        isUsed: false,
        userId: user.id,
      };
    } catch (error) {
      return {
        isValid: false,
        isExpired: false,
        isUsed: false,
        error: 'Failed to validate token',
      };
    }
  }

  /**
   * Invalidate an email verification token (mark as used)
   * @param token - Token to invalidate
   * @returns Promise resolving to success boolean
   */
  async invalidateEmailVerificationToken(token: string): Promise<boolean> {
    if (!token || typeof token !== 'string') {
      return false;
    }

    try {
      const result = await this.prisma.user.updateMany({
        where: {
          emailVerificationToken: token,
        },
        data: {
          emailVerificationToken: null,
          emailVerificationExpiry: null,
          emailVerified: new Date(),
        },
      });

      return result.count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Invalidate a password reset token (mark as used)
   * @param token - Token to invalidate
   * @returns Promise resolving to success boolean
   */
  async invalidatePasswordResetToken(token: string): Promise<boolean> {
    if (!token || typeof token !== 'string') {
      return false;
    }

    try {
      const result = await this.prisma.user.updateMany({
        where: {
          passwordResetToken: token,
        },
        data: {
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      });

      return result.count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up expired tokens from the database
   * @returns Promise resolving to number of cleaned up tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    try {
      // Clean up expired email verification tokens
      const emailResult = await this.prisma.user.updateMany({
        where: {
          emailVerificationExpiry: {
            lt: now,
          },
          emailVerificationToken: {
            not: null,
          },
        },
        data: {
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        },
      });

      cleanedCount += emailResult.count;

      // Clean up expired password reset tokens
      const passwordResult = await this.prisma.user.updateMany({
        where: {
          passwordResetExpiry: {
            lt: now,
          },
          passwordResetToken: {
            not: null,
          },
        },
        data: {
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      });

      cleanedCount += passwordResult.count;

      return cleanedCount;
    } catch (error) {
      throw new Error('Failed to cleanup expired tokens');
    }
  }

  /**
   * Generate a cryptographically secure random token
   * @param length - Token length in bytes
   * @param encoding - Token encoding format
   * @returns Secure random token
   */
  private generateSecureToken(length: number, encoding: 'hex' | 'base64url'): string {
    if (length < 16) {
      throw new Error('Token length must be at least 16 bytes for security');
    }

    try {
      const buffer = crypto.randomBytes(length);
      return encoding === 'hex' ? buffer.toString('hex') : buffer.toString('base64url');
    } catch (error) {
      throw new Error('Failed to generate secure token');
    }
  }

  /**
   * Validate token format based on type
   * @param token - Token to validate
   * @param type - Token type
   * @returns Boolean indicating if format is valid
   */
  private validateTokenFormat(token: string, type: TokenType): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const config = TOKEN_CONFIGS[type];

    if (config.encoding === 'hex') {
      // Hex tokens should be exactly 2 * length characters and contain only hex chars
      const expectedLength = config.length * 2;
      return token.length === expectedLength && /^[a-f0-9]+$/i.test(token);
    } else if (config.encoding === 'base64url') {
      // Base64url tokens should match the pattern and have reasonable length
      const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
      const minLength = Math.floor((config.length * 4) / 3) - 2; // More lenient length check
      return base64UrlPattern.test(token) && token.length >= minLength;
    }

    return false;
  }

  /**
   * Get token configuration for a specific type
   * @param type - Token type
   * @returns Token configuration
   */
  getTokenConfig(type: TokenType): TokenConfig {
    return { ...TOKEN_CONFIGS[type] };
  }

  /**
   * Check if a token is expired based on its expiry date
   * @param expiryDate - Token expiry date
   * @returns Boolean indicating if token is expired
   */
  isTokenExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate;
  }
}

// Export a default instance
export const tokenService = new TokenService();