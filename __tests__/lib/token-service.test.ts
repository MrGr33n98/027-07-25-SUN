import { TokenService, TokenType, TokenValidationResult, TokenGenerationResult } from '../../lib/token-service';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Mock Prisma Client
const mockPrisma = {
  user: {
    updateMany: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock crypto.randomBytes
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

const mockCrypto = crypto as jest.Mocked<typeof crypto>;

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService(mockPrisma);
    jest.clearAllMocks();
    
    // Default mock for crypto.randomBytes
    mockCrypto.randomBytes.mockImplementation((size: number) => {
      const buffer = Buffer.alloc(size);
      for (let i = 0; i < size; i++) {
        buffer[i] = i % 256;
      }
      return buffer;
    });
  });

  describe('generateEmailVerificationToken', () => {
    it('should generate a valid email verification token', async () => {
      const userId = 'user123';
      const mockExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      (mockPrisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await tokenService.generateEmailVerificationToken(userId);

      expect(result).toMatchObject({
        token: expect.any(String),
        expiresAt: expect.any(Date),
        userId,
      });

      // Token should be hex encoded and 64 characters long (32 bytes * 2)
      expect(result.token).toMatch(/^[a-f0-9]{64}$/i);
      
      // Expiry should be approximately 24 hours from now
      const timeDiff = result.expiresAt.getTime() - Date.now();
      expect(timeDiff).toBeGreaterThan(23.9 * 60 * 60 * 1000);
      expect(timeDiff).toBeLessThan(24.1 * 60 * 60 * 1000);
    });

    it('should invalidate existing email verification tokens', async () => {
      const userId = 'user123';

      (mockPrisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      await tokenService.generateEmailVerificationToken(userId);

      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: userId,
          emailVerificationToken: { not: null },
        },
        data: {
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        },
      });
    });

    it('should throw error for invalid user ID', async () => {
      await expect(tokenService.generateEmailVerificationToken('')).rejects.toThrow(
        'User ID is required and must be a string'
      );

      await expect(tokenService.generateEmailVerificationToken(null as any)).rejects.toThrow(
        'User ID is required and must be a string'
      );
    });

    it('should handle database errors gracefully', async () => {
      const userId = 'user123';
      (mockPrisma.user.updateMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(tokenService.generateEmailVerificationToken(userId)).rejects.toThrow(
        'Failed to generate email verification token'
      );
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a valid password reset token', async () => {
      const userId = 'user123';

      (mockPrisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await tokenService.generatePasswordResetToken(userId);

      expect(result).toMatchObject({
        token: expect.any(String),
        expiresAt: expect.any(Date),
        userId,
      });

      // Token should be base64url encoded
      expect(result.token).toMatch(/^[A-Za-z0-9_-]+$/);
      
      // Expiry should be approximately 1 hour from now
      const timeDiff = result.expiresAt.getTime() - Date.now();
      expect(timeDiff).toBeGreaterThan(59 * 60 * 1000);
      expect(timeDiff).toBeLessThan(61 * 60 * 1000);
    });

    it('should invalidate existing password reset tokens', async () => {
      const userId = 'user123';

      (mockPrisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      await tokenService.generatePasswordResetToken(userId);

      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: userId,
          passwordResetToken: { not: null },
        },
        data: {
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      });
    });

    it('should throw error for invalid user ID', async () => {
      await expect(tokenService.generatePasswordResetToken('')).rejects.toThrow(
        'User ID is required and must be a string'
      );
    });
  });

  describe('validateEmailVerificationToken', () => {
    it('should validate a valid email verification token', async () => {
      const token = '0123456789abcdef'.repeat(4); // 64 char hex token
      const userId = 'user123';
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: userId,
        emailVerificationToken: token,
        emailVerificationExpiry: futureDate,
        emailVerified: null,
      });

      const result = await tokenService.validateEmailVerificationToken(token);

      expect(result).toEqual({
        isValid: true,
        isExpired: false,
        isUsed: false,
        userId,
      });
    });

    it('should reject expired email verification token', async () => {
      const token = '0123456789abcdef'.repeat(4);
      const userId = 'user123';
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: userId,
        emailVerificationToken: token,
        emailVerificationExpiry: pastDate,
        emailVerified: null,
      });

      const result = await tokenService.validateEmailVerificationToken(token);

      expect(result).toEqual({
        isValid: false,
        isExpired: true,
        isUsed: false,
        userId,
        error: 'Token has expired',
      });
    });

    it('should reject non-existent token', async () => {
      const token = '0123456789abcdef'.repeat(4);

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await tokenService.validateEmailVerificationToken(token);

      expect(result).toEqual({
        isValid: false,
        isExpired: false,
        isUsed: true,
        error: 'Token not found or already used',
      });
    });

    it('should reject invalid token format', async () => {
      const invalidToken = 'invalid-token';

      const result = await tokenService.validateEmailVerificationToken(invalidToken);

      expect(result).toEqual({
        isValid: false,
        isExpired: false,
        isUsed: false,
        error: 'Invalid token format',
      });
    });

    it('should handle empty or null token', async () => {
      const result1 = await tokenService.validateEmailVerificationToken('');
      const result2 = await tokenService.validateEmailVerificationToken(null as any);

      expect(result1).toEqual({
        isValid: false,
        isExpired: false,
        isUsed: false,
        error: 'Token is required',
      });

      expect(result2).toEqual({
        isValid: false,
        isExpired: false,
        isUsed: false,
        error: 'Token is required',
      });
    });
  });

  describe('validatePasswordResetToken', () => {
    it('should validate a valid password reset token', async () => {
      // Generate a proper base64url token (32 bytes = ~43 base64url chars)
      const token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop_-';
      const userId = 'user123';
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: userId,
        passwordResetToken: token,
        passwordResetExpiry: futureDate,
      });

      const result = await tokenService.validatePasswordResetToken(token);

      expect(result).toEqual({
        isValid: true,
        isExpired: false,
        isUsed: false,
        userId,
      });
    });

    it('should reject expired password reset token', async () => {
      // Generate a proper base64url token (32 bytes = ~43 base64url chars)
      const token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop_-';
      const userId = 'user123';
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: userId,
        passwordResetToken: token,
        passwordResetExpiry: pastDate,
      });

      const result = await tokenService.validatePasswordResetToken(token);

      expect(result).toEqual({
        isValid: false,
        isExpired: true,
        isUsed: false,
        userId,
        error: 'Token has expired',
      });
    });
  });

  describe('invalidateEmailVerificationToken', () => {
    it('should successfully invalidate email verification token', async () => {
      const token = '0123456789abcdef'.repeat(4);

      (mockPrisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await tokenService.invalidateEmailVerificationToken(token);

      expect(result).toBe(true);
      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          emailVerificationToken: token,
        },
        data: {
          emailVerificationToken: null,
          emailVerificationExpiry: null,
          emailVerified: expect.any(Date),
        },
      });
    });

    it('should return false for non-existent token', async () => {
      const token = '0123456789abcdef'.repeat(4);

      (mockPrisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await tokenService.invalidateEmailVerificationToken(token);

      expect(result).toBe(false);
    });

    it('should handle invalid token input', async () => {
      const result1 = await tokenService.invalidateEmailVerificationToken('');
      const result2 = await tokenService.invalidateEmailVerificationToken(null as any);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('invalidatePasswordResetToken', () => {
    it('should successfully invalidate password reset token', async () => {
      const token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop_-';

      (mockPrisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await tokenService.invalidatePasswordResetToken(token);

      expect(result).toBe(true);
      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: {
          passwordResetToken: token,
        },
        data: {
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      });
    });

    it('should return false for non-existent token', async () => {
      const token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop_-';

      (mockPrisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await tokenService.invalidatePasswordResetToken(token);

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should clean up expired tokens and return count', async () => {
      const now = new Date();

      (mockPrisma.user.updateMany as jest.Mock)
        .mockResolvedValueOnce({ count: 3 }) // Email verification tokens
        .mockResolvedValueOnce({ count: 2 }); // Password reset tokens

      const result = await tokenService.cleanupExpiredTokens();

      expect(result).toBe(5);
      expect(mockPrisma.user.updateMany).toHaveBeenCalledTimes(2);
    });

    it('should handle database errors during cleanup', async () => {
      (mockPrisma.user.updateMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(tokenService.cleanupExpiredTokens()).rejects.toThrow(
        'Failed to cleanup expired tokens'
      );
    });
  });

  describe('getTokenConfig', () => {
    it('should return email verification token config', () => {
      const config = tokenService.getTokenConfig(TokenType.EMAIL_VERIFICATION);

      expect(config).toEqual({
        expiryMinutes: 24 * 60,
        length: 32,
        encoding: 'hex',
      });
    });

    it('should return password reset token config', () => {
      const config = tokenService.getTokenConfig(TokenType.PASSWORD_RESET);

      expect(config).toEqual({
        expiryMinutes: 60,
        length: 32,
        encoding: 'base64url',
      });
    });
  });

  describe('isTokenExpired', () => {
    it('should return true for expired token', () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      const result = tokenService.isTokenExpired(pastDate);
      expect(result).toBe(true);
    });

    it('should return false for valid token', () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);
      const result = tokenService.isTokenExpired(futureDate);
      expect(result).toBe(false);
    });
  });

  describe('Token Security', () => {
    it('should generate unique tokens', async () => {
      const userId = 'user123';
      
      // Mock different random bytes for each call
      let callCount = 0;
      mockCrypto.randomBytes.mockImplementation((size: number) => {
        const buffer = Buffer.alloc(size);
        for (let i = 0; i < size; i++) {
          buffer[i] = (i + callCount * 100) % 256;
        }
        callCount++;
        return buffer;
      });

      (mockPrisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      const token1 = await tokenService.generateEmailVerificationToken(userId);
      const token2 = await tokenService.generateEmailVerificationToken(userId);

      expect(token1.token).not.toBe(token2.token);
    });

    it('should use cryptographically secure random generation', async () => {
      const userId = 'user123';

      (mockPrisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({});

      await tokenService.generateEmailVerificationToken(userId);

      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
    });

    it('should handle crypto errors gracefully', async () => {
      const userId = 'user123';
      
      mockCrypto.randomBytes.mockImplementation(() => {
        throw new Error('Crypto error');
      });

      (mockPrisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      await expect(tokenService.generateEmailVerificationToken(userId)).rejects.toThrow(
        'Failed to generate secure token'
      );
    });
  });

  describe('Token Format Validation', () => {
    it('should validate hex token format correctly', () => {
      const validHexToken = '0123456789abcdef'.repeat(4); // 64 chars
      const invalidHexToken1 = '0123456789abcdef'.repeat(3); // Too short
      const invalidHexToken2 = '0123456789abcdefg'.repeat(4); // Invalid char

      // Access private method through any cast for testing
      const service = tokenService as any;
      
      expect(service.validateTokenFormat(validHexToken, TokenType.EMAIL_VERIFICATION)).toBe(true);
      expect(service.validateTokenFormat(invalidHexToken1, TokenType.EMAIL_VERIFICATION)).toBe(false);
      expect(service.validateTokenFormat(invalidHexToken2, TokenType.EMAIL_VERIFICATION)).toBe(false);
    });

    it('should validate base64url token format correctly', () => {
      const validBase64Token = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
      const invalidBase64Token = 'invalid+token/with=padding';

      const service = tokenService as any;
      
      expect(service.validateTokenFormat(validBase64Token, TokenType.PASSWORD_RESET)).toBe(true);
      expect(service.validateTokenFormat(invalidBase64Token, TokenType.PASSWORD_RESET)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle database connection issues', async () => {
      const userId = 'user123';
      const token = '0123456789abcdef'.repeat(4);

      (mockPrisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Connection error'));

      const result = await tokenService.validateEmailVerificationToken(token);

      expect(result).toEqual({
        isValid: false,
        isExpired: false,
        isUsed: false,
        error: 'Failed to validate token',
      });
    });

    it('should handle null expiry dates', async () => {
      const token = '0123456789abcdef'.repeat(4);
      const userId = 'user123';

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: userId,
        emailVerificationToken: token,
        emailVerificationExpiry: null,
        emailVerified: null,
      });

      const result = await tokenService.validateEmailVerificationToken(token);

      expect(result).toEqual({
        isValid: false,
        isExpired: true,
        isUsed: false,
        userId,
        error: 'Token has expired',
      });
    });
  });
});