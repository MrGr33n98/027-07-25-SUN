import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Password strength validation result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number; // 0-100 strength score
}

/**
 * Password policy configuration
 */
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbidCommonPasswords: boolean;
}

/**
 * Default password policy based on security requirements
 */
const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbidCommonPasswords: true,
};

/**
 * Common passwords to reject (basic list for security)
 */
const COMMON_PASSWORDS = new Set([
  'password',
  '123456',
  '123456789',
  'qwerty',
  'abc123',
  'password123',
  'admin',
  'letmein',
  'welcome',
  'monkey',
  '1234567890',
  'iloveyou',
  'princess',
  'rockyou',
  '12345678',
]);

/**
 * Secure password service implementing bcrypt hashing and validation
 * Provides cryptographically secure password operations with timing attack protection
 */
export class PasswordService {
  private readonly saltRounds: number;
  private readonly policy: PasswordPolicy;

  constructor(saltRounds: number = 12, policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY) {
    if (saltRounds < 12) {
      throw new Error('Salt rounds must be at least 12 for security');
    }
    this.saltRounds = saltRounds;
    this.policy = policy;
  }

  /**
   * Hash a password using bcrypt with secure salt rounds
   * @param password - Plain text password to hash
   * @returns Promise resolving to bcrypt hash
   */
  async hashPassword(password: string): Promise<string> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    try {
      // Generate salt and hash password
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify a password against a bcrypt hash with timing attack protection
   * @param password - Plain text password to verify
   * @param hash - Bcrypt hash to verify against
   * @returns Promise resolving to boolean indicating if password matches
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || typeof password !== 'string') {
      return false;
    }

    if (!hash || typeof hash !== 'string') {
      return false;
    }

    try {
      // Use bcrypt.compare for constant-time comparison
      const isValid = await bcrypt.compare(password, hash);
      return isValid;
    } catch (error) {
      // Return false on any error to prevent information leakage
      return false;
    }
  }

  /**
   * Validate password strength against security policy
   * @param password - Password to validate
   * @returns PasswordValidationResult with validation details
   */
  validatePasswordStrength(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    if (!password || typeof password !== 'string') {
      return {
        isValid: false,
        errors: ['Password is required'],
        score: 0,
      };
    }

    // Check minimum length
    if (password.length < this.policy.minLength) {
      errors.push(`Password must be at least ${this.policy.minLength} characters long`);
    } else {
      score += 20;
    }

    // Check for uppercase letters
    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 15;
    }

    // Check for lowercase letters
    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 15;
    }

    // Check for numbers
    if (this.policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score += 15;
    }

    // Check for special characters
    if (this.policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 15;
    }

    // Check against common passwords
    if (this.policy.forbidCommonPasswords && COMMON_PASSWORDS.has(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
    }

    // Additional scoring for length
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Bonus for character variety
    const charTypes = [
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    ].filter(Boolean).length;

    if (charTypes >= 4) score += 10;

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.min(score, 100),
    };
  }

  /**
   * Generate a cryptographically secure random token
   * @param length - Token length in bytes (default: 32)
   * @returns Hex-encoded secure random token
   */
  generateSecureToken(length: number = 32): string {
    if (length < 16) {
      throw new Error('Token length must be at least 16 bytes for security');
    }

    try {
      // Use crypto.randomBytes for cryptographically secure random generation
      const buffer = crypto.randomBytes(length);
      return buffer.toString('hex');
    } catch (error) {
      throw new Error('Failed to generate secure token');
    }
  }

  /**
   * Generate a secure token with URL-safe base64 encoding
   * @param length - Token length in bytes (default: 32)
   * @returns URL-safe base64 encoded secure random token
   */
  generateSecureTokenBase64(length: number = 32): string {
    if (length < 16) {
      throw new Error('Token length must be at least 16 bytes for security');
    }

    try {
      const buffer = crypto.randomBytes(length);
      return buffer.toString('base64url');
    } catch (error) {
      throw new Error('Failed to generate secure token');
    }
  }

  /**
   * Validate token format and basic security properties
   * @param token - Token to validate
   * @param expectedLength - Expected token length in characters (for hex tokens)
   * @returns Boolean indicating if token format is valid
   */
  validateTokenFormat(token: string, expectedLength: number = 64): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Check if token is hex encoded and has expected length
    if (token.length === expectedLength && /^[a-f0-9]+$/i.test(token)) {
      return true;
    }

    // Check if token is base64url encoded (approximate length check)
    const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
    if (base64UrlPattern.test(token) && token.length >= 22) {
      return true;
    }

    return false;
  }

  /**
   * Get password policy configuration
   * @returns Current password policy
   */
  getPasswordPolicy(): PasswordPolicy {
    return { ...this.policy };
  }

  /**
   * Get salt rounds configuration
   * @returns Current salt rounds setting
   */
  getSaltRounds(): number {
    return this.saltRounds;
  }
}

// Export a default instance with secure defaults
export const passwordService = new PasswordService();