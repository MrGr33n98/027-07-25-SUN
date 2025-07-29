import { PasswordService, PasswordValidationResult } from '../../lib/password-service';
import bcrypt from 'bcryptjs';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('constructor', () => {
    it('should create instance with default salt rounds of 12', () => {
      const service = new PasswordService();
      expect(service.getSaltRounds()).toBe(12);
    });

    it('should accept custom salt rounds', () => {
      const service = new PasswordService(14);
      expect(service.getSaltRounds()).toBe(14);
    });

    it('should throw error for salt rounds less than 12', () => {
      expect(() => new PasswordService(10)).toThrow('Salt rounds must be at least 12 for security');
    });

    it('should accept custom password policy', () => {
      const customPolicy = {
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        forbidCommonPasswords: true,
      };
      const service = new PasswordService(12, customPolicy);
      expect(service.getPasswordPolicy()).toEqual(customPolicy);
    });
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
      expect(hash.startsWith('$2')).toBe(true); // bcrypt hash format
    });

    it('should generate unique hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts should produce different hashes
    });

    it('should throw error for empty password', async () => {
      await expect(passwordService.hashPassword('')).rejects.toThrow('Password must be a non-empty string');
    });

    it('should throw error for null password', async () => {
      await expect(passwordService.hashPassword(null as any)).rejects.toThrow('Password must be a non-empty string');
    });

    it('should throw error for non-string password', async () => {
      await expect(passwordService.hashPassword(123 as any)).rejects.toThrow('Password must be a non-empty string');
    });

    it('should use correct salt rounds', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);
      
      // Extract salt rounds from bcrypt hash
      const saltRounds = parseInt(hash.split('$')[2]);
      expect(saltRounds).toBe(12);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);
      const isValid = await passwordService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await passwordService.hashPassword(password);
      const isValid = await passwordService.verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await passwordService.hashPassword('TestPassword123!');
      const isValid = await passwordService.verifyPassword('', hash);

      expect(isValid).toBe(false);
    });

    it('should return false for null password', async () => {
      const hash = await passwordService.hashPassword('TestPassword123!');
      const isValid = await passwordService.verifyPassword(null as any, hash);

      expect(isValid).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const isValid = await passwordService.verifyPassword('TestPassword123!', '');

      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash', async () => {
      const isValid = await passwordService.verifyPassword('TestPassword123!', 'invalid-hash');

      expect(isValid).toBe(false);
    });

    it('should handle bcrypt errors gracefully', async () => {
      const isValid = await passwordService.verifyPassword('TestPassword123!', 'malformed$hash$format');

      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const result = passwordService.validatePasswordStrength('StrongPass123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThan(80);
    });

    it('should reject password too short', () => {
      const result = passwordService.validatePasswordStrength('Short1!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase', () => {
      const result = passwordService.validatePasswordStrength('lowercase123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = passwordService.validatePasswordStrength('UPPERCASE123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without numbers', () => {
      const result = passwordService.validatePasswordStrength('NoNumbers!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special characters', () => {
      const result = passwordService.validatePasswordStrength('NoSpecialChars123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject common passwords', () => {
      const result = passwordService.validatePasswordStrength('password');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is too common and easily guessable');
    });

    it('should handle empty password', () => {
      const result = passwordService.validatePasswordStrength('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
      expect(result.score).toBe(0);
    });

    it('should handle null password', () => {
      const result = passwordService.validatePasswordStrength(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
      expect(result.score).toBe(0);
    });

    it('should give higher score for longer passwords', () => {
      const shortResult = passwordService.validatePasswordStrength('Valid123!');
      const longResult = passwordService.validatePasswordStrength('VeryLongValidPassword123!');

      expect(longResult.score).toBeGreaterThan(shortResult.score);
    });

    it('should validate all special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{};\':"|,.<>/?';
      for (const char of specialChars) {
        const password = `ValidPass123${char}`;
        const result = passwordService.validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
      }
    });

    it('should accumulate multiple errors', () => {
      const result = passwordService.validatePasswordStrength('short');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token with default length', () => {
      const token = passwordService.generateSecureToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
      expect(/^[a-f0-9]+$/i.test(token)).toBe(true);
    });

    it('should generate token with custom length', () => {
      const token = passwordService.generateSecureToken(16);

      expect(token.length).toBe(32); // 16 bytes = 32 hex chars
      expect(/^[a-f0-9]+$/i.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const token1 = passwordService.generateSecureToken();
      const token2 = passwordService.generateSecureToken();

      expect(token1).not.toBe(token2);
    });

    it('should throw error for token length less than 16 bytes', () => {
      expect(() => passwordService.generateSecureToken(15)).toThrow('Token length must be at least 16 bytes for security');
    });

    it('should generate cryptographically secure tokens', () => {
      const tokens = new Set();
      const iterations = 1000;

      // Generate many tokens and ensure no duplicates (extremely unlikely with crypto.randomBytes)
      for (let i = 0; i < iterations; i++) {
        const token = passwordService.generateSecureToken();
        expect(tokens.has(token)).toBe(false);
        tokens.add(token);
      }

      expect(tokens.size).toBe(iterations);
    });
  });

  describe('generateSecureTokenBase64', () => {
    it('should generate base64url token with default length', () => {
      const token = passwordService.generateSecureTokenBase64();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true); // base64url pattern
    });

    it('should generate token with custom length', () => {
      const token = passwordService.generateSecureTokenBase64(16);

      expect(token).toBeDefined();
      expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const token1 = passwordService.generateSecureTokenBase64();
      const token2 = passwordService.generateSecureTokenBase64();

      expect(token1).not.toBe(token2);
    });

    it('should throw error for token length less than 16 bytes', () => {
      expect(() => passwordService.generateSecureTokenBase64(15)).toThrow('Token length must be at least 16 bytes for security');
    });
  });

  describe('validateTokenFormat', () => {
    it('should validate hex token format', () => {
      const token = passwordService.generateSecureToken();
      const isValid = passwordService.validateTokenFormat(token);

      expect(isValid).toBe(true);
    });

    it('should validate base64url token format', () => {
      const token = passwordService.generateSecureTokenBase64();
      const isValid = passwordService.validateTokenFormat(token);

      expect(isValid).toBe(true);
    });

    it('should reject empty token', () => {
      const isValid = passwordService.validateTokenFormat('');

      expect(isValid).toBe(false);
    });

    it('should reject null token', () => {
      const isValid = passwordService.validateTokenFormat(null as any);

      expect(isValid).toBe(false);
    });

    it('should reject invalid hex token', () => {
      const isValid = passwordService.validateTokenFormat('invalid-hex-token');

      expect(isValid).toBe(false);
    });

    it('should reject token with wrong length', () => {
      const isValid = passwordService.validateTokenFormat('abc123', 64);

      expect(isValid).toBe(false);
    });

    it('should validate token with custom expected length', () => {
      const token = passwordService.generateSecureToken(16); // 32 hex chars
      const isValid = passwordService.validateTokenFormat(token, 32);

      expect(isValid).toBe(true);
    });
  });

  describe('timing attack protection', () => {
    it('should have consistent timing for password verification', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);
      const wrongPassword = 'WrongPassword123!';

      // Measure timing for correct password
      const start1 = process.hrtime.bigint();
      await passwordService.verifyPassword(password, hash);
      const end1 = process.hrtime.bigint();
      const correctTime = Number(end1 - start1);

      // Measure timing for incorrect password
      const start2 = process.hrtime.bigint();
      await passwordService.verifyPassword(wrongPassword, hash);
      const end2 = process.hrtime.bigint();
      const incorrectTime = Number(end2 - start2);

      // Times should be relatively similar (within reasonable variance)
      // This is a basic check - bcrypt.compare provides the actual timing attack protection
      const timeDifference = Math.abs(correctTime - incorrectTime);
      const averageTime = (correctTime + incorrectTime) / 2;
      const variance = timeDifference / averageTime;

      // Allow for reasonable variance in timing (50% - this is quite generous for testing)
      expect(variance).toBeLessThan(0.5);
    });

    it('should handle invalid hash gracefully without timing differences', async () => {
      const password = 'TestPassword123!';
      const invalidHash = 'invalid-hash';

      const start = process.hrtime.bigint();
      const result = await passwordService.verifyPassword(password, invalidHash);
      const end = process.hrtime.bigint();
      const duration = Number(end - start);

      expect(result).toBe(false);
      expect(duration).toBeGreaterThan(0); // Should take some time, not return immediately
    });
  });

  describe('salt uniqueness', () => {
    it('should generate unique salts for each password hash', async () => {
      const password = 'TestPassword123!';
      const hashes = [];

      // Generate multiple hashes of the same password
      for (let i = 0; i < 10; i++) {
        const hash = await passwordService.hashPassword(password);
        hashes.push(hash);
      }

      // Extract salts from hashes (salt is part of the bcrypt hash)
      const salts = hashes.map(hash => hash.substring(0, 29)); // bcrypt salt portion

      // All salts should be unique
      const uniqueSalts = new Set(salts);
      expect(uniqueSalts.size).toBe(hashes.length);
    });
  });

  describe('error handling', () => {
    it('should handle bcrypt hashing errors gracefully', async () => {
      // Mock bcrypt.genSalt to throw an error
      const originalGenSalt = bcrypt.genSalt;
      bcrypt.genSalt = jest.fn().mockRejectedValue(new Error('Mocked error'));

      await expect(passwordService.hashPassword('TestPassword123!')).rejects.toThrow('Failed to hash password');

      // Restore original function
      bcrypt.genSalt = originalGenSalt;
    });

    it('should handle bcrypt verification errors gracefully', async () => {
      // Mock bcrypt.compare to throw an error
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockRejectedValue(new Error('Mocked error'));

      const result = await passwordService.verifyPassword('TestPassword123!', 'some-hash');
      expect(result).toBe(false);

      // Restore original function
      bcrypt.compare = originalCompare;
    });

    it('should handle crypto.randomBytes errors gracefully', () => {
      // Mock crypto.randomBytes to throw an error
      const crypto = require('crypto');
      const originalRandomBytes = crypto.randomBytes;
      crypto.randomBytes = jest.fn().mockImplementation(() => {
        throw new Error('Mocked crypto error');
      });

      expect(() => passwordService.generateSecureToken()).toThrow('Failed to generate secure token');

      // Restore original function
      crypto.randomBytes = originalRandomBytes;
    });
  });

  describe('configuration', () => {
    it('should return password policy', () => {
      const policy = passwordService.getPasswordPolicy();

      expect(policy).toEqual({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        forbidCommonPasswords: true,
      });
    });

    it('should return salt rounds', () => {
      const saltRounds = passwordService.getSaltRounds();

      expect(saltRounds).toBe(12);
    });

    it('should not allow modification of returned policy object', () => {
      const policy = passwordService.getPasswordPolicy();
      policy.minLength = 4; // Try to modify

      const freshPolicy = passwordService.getPasswordPolicy();
      expect(freshPolicy.minLength).toBe(8); // Should still be original value
    });
  });
});