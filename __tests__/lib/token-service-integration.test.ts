import { TokenService, TokenType } from '../../lib/token-service';
import { PrismaClient } from '@prisma/client';

// Integration tests for TokenService with real database operations
// These tests require a test database to be available

describe.skip('TokenService Integration Tests', () => {
  let tokenService: TokenService;
  let prisma: PrismaClient;
  let testUserId: string;

  beforeAll(async () => {
    // Skip integration tests if no database is available
    if (!process.env.DATABASE_URL) {
      console.log('Skipping integration tests - no DATABASE_URL provided');
      return;
    }

    // Initialize Prisma client for testing
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    tokenService = new TokenService(prisma);

    // Test database connection
    try {
      await prisma.$connect();
    } catch (error) {
      console.log('Skipping integration tests - database connection failed');
      return;
    }

    // Create a test user
    try {
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
      testUserId = testUser.id;
    } catch (error) {
      // User might already exist, try to find it
      const existingUser = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      if (existingUser) {
        testUserId = existingUser.id;
      } else {
        throw error;
      }
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await prisma.user.delete({
        where: { id: testUserId },
      });
    } catch (error) {
      // User might not exist, ignore error
    }

    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up any existing tokens for the test user
    await prisma.user.update({
      where: { id: testUserId },
      data: {
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });
  });

  describe('Email Verification Token Flow', () => {
    it('should generate, validate, and invalidate email verification token', async () => {
      // Generate token
      const tokenResult = await tokenService.generateEmailVerificationToken(testUserId);

      expect(tokenResult.token).toBeDefined();
      expect(tokenResult.userId).toBe(testUserId);
      expect(tokenResult.expiresAt).toBeInstanceOf(Date);

      // Verify token is stored in database
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: {
          emailVerificationToken: true,
          emailVerificationExpiry: true,
        },
      });

      expect(user?.emailVerificationToken).toBe(tokenResult.token);
      expect(user?.emailVerificationExpiry).toEqual(tokenResult.expiresAt);

      // Validate token
      const validationResult = await tokenService.validateEmailVerificationToken(tokenResult.token);

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.isExpired).toBe(false);
      expect(validationResult.isUsed).toBe(false);
      expect(validationResult.userId).toBe(testUserId);

      // Invalidate token
      const invalidateResult = await tokenService.invalidateEmailVerificationToken(tokenResult.token);

      expect(invalidateResult).toBe(true);

      // Verify token is removed from database and email is verified
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: {
          emailVerificationToken: true,
          emailVerificationExpiry: true,
          emailVerified: true,
        },
      });

      expect(updatedUser?.emailVerificationToken).toBeNull();
      expect(updatedUser?.emailVerificationExpiry).toBeNull();
      expect(updatedUser?.emailVerified).toBeInstanceOf(Date);

      // Try to validate invalidated token
      const revalidationResult = await tokenService.validateEmailVerificationToken(tokenResult.token);

      expect(revalidationResult.isValid).toBe(false);
      expect(revalidationResult.isUsed).toBe(true);
    });

    it('should replace existing email verification token', async () => {
      // Generate first token
      const firstToken = await tokenService.generateEmailVerificationToken(testUserId);

      // Generate second token
      const secondToken = await tokenService.generateEmailVerificationToken(testUserId);

      expect(firstToken.token).not.toBe(secondToken.token);

      // First token should be invalid
      const firstValidation = await tokenService.validateEmailVerificationToken(firstToken.token);
      expect(firstValidation.isValid).toBe(false);

      // Second token should be valid
      const secondValidation = await tokenService.validateEmailVerificationToken(secondToken.token);
      expect(secondValidation.isValid).toBe(true);
    });
  });

  describe('Password Reset Token Flow', () => {
    it('should generate, validate, and invalidate password reset token', async () => {
      // Generate token
      const tokenResult = await tokenService.generatePasswordResetToken(testUserId);

      expect(tokenResult.token).toBeDefined();
      expect(tokenResult.userId).toBe(testUserId);
      expect(tokenResult.expiresAt).toBeInstanceOf(Date);

      // Verify token is stored in database
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: {
          passwordResetToken: true,
          passwordResetExpiry: true,
        },
      });

      expect(user?.passwordResetToken).toBe(tokenResult.token);
      expect(user?.passwordResetExpiry).toEqual(tokenResult.expiresAt);

      // Validate token
      const validationResult = await tokenService.validatePasswordResetToken(tokenResult.token);

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.isExpired).toBe(false);
      expect(validationResult.isUsed).toBe(false);
      expect(validationResult.userId).toBe(testUserId);

      // Invalidate token
      const invalidateResult = await tokenService.invalidatePasswordResetToken(tokenResult.token);

      expect(invalidateResult).toBe(true);

      // Verify token is removed from database
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUserId },
        select: {
          passwordResetToken: true,
          passwordResetExpiry: true,
        },
      });

      expect(updatedUser?.passwordResetToken).toBeNull();
      expect(updatedUser?.passwordResetExpiry).toBeNull();

      // Try to validate invalidated token
      const revalidationResult = await tokenService.validatePasswordResetToken(tokenResult.token);

      expect(revalidationResult.isValid).toBe(false);
      expect(revalidationResult.isUsed).toBe(true);
    });

    it('should replace existing password reset token', async () => {
      // Generate first token
      const firstToken = await tokenService.generatePasswordResetToken(testUserId);

      // Generate second token
      const secondToken = await tokenService.generatePasswordResetToken(testUserId);

      expect(firstToken.token).not.toBe(secondToken.token);

      // First token should be invalid
      const firstValidation = await tokenService.validatePasswordResetToken(firstToken.token);
      expect(firstValidation.isValid).toBe(false);

      // Second token should be valid
      const secondValidation = await tokenService.validatePasswordResetToken(secondToken.token);
      expect(secondValidation.isValid).toBe(true);
    });
  });

  describe('Token Expiry', () => {
    it('should handle expired email verification tokens', async () => {
      // Generate token
      const tokenResult = await tokenService.generateEmailVerificationToken(testUserId);

      // Manually set expiry to past date
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          emailVerificationExpiry: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        },
      });

      // Validate expired token
      const validationResult = await tokenService.validateEmailVerificationToken(tokenResult.token);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.isExpired).toBe(true);
      expect(validationResult.userId).toBe(testUserId);
    });

    it('should handle expired password reset tokens', async () => {
      // Generate token
      const tokenResult = await tokenService.generatePasswordResetToken(testUserId);

      // Manually set expiry to past date
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          passwordResetExpiry: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        },
      });

      // Validate expired token
      const validationResult = await tokenService.validatePasswordResetToken(tokenResult.token);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.isExpired).toBe(true);
      expect(validationResult.userId).toBe(testUserId);
    });
  });

  describe('Token Cleanup', () => {
    it('should clean up expired tokens', async () => {
      // Create multiple users with expired tokens
      const users = [];
      for (let i = 0; i < 3; i++) {
        const user = await prisma.user.create({
          data: {
            email: `cleanup-test-${i}@example.com`,
            name: `Cleanup Test User ${i}`,
            emailVerificationToken: `expired-email-token-${i}`,
            emailVerificationExpiry: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
            passwordResetToken: `expired-reset-token-${i}`,
            passwordResetExpiry: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          },
        });
        users.push(user);
      }

      // Run cleanup
      const cleanedCount = await tokenService.cleanupExpiredTokens();

      expect(cleanedCount).toBe(6); // 3 email + 3 password reset tokens

      // Verify tokens are cleaned up
      for (const user of users) {
        const updatedUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            emailVerificationToken: true,
            emailVerificationExpiry: true,
            passwordResetToken: true,
            passwordResetExpiry: true,
          },
        });

        expect(updatedUser?.emailVerificationToken).toBeNull();
        expect(updatedUser?.emailVerificationExpiry).toBeNull();
        expect(updatedUser?.passwordResetToken).toBeNull();
        expect(updatedUser?.passwordResetExpiry).toBeNull();
      }

      // Clean up test users
      for (const user of users) {
        await prisma.user.delete({ where: { id: user.id } });
      }
    });

    it('should not clean up valid tokens', async () => {
      // Generate valid tokens
      const emailToken = await tokenService.generateEmailVerificationToken(testUserId);
      const resetToken = await tokenService.generatePasswordResetToken(testUserId);

      // Run cleanup
      const cleanedCount = await tokenService.cleanupExpiredTokens();

      // Should not clean up valid tokens
      const user = await prisma.user.findUnique({
        where: { id: testUserId },
        select: {
          emailVerificationToken: true,
          passwordResetToken: true,
        },
      });

      expect(user?.emailVerificationToken).toBe(emailToken.token);
      expect(user?.passwordResetToken).toBe(resetToken.token);
    });
  });

  describe('Token Security', () => {
    it('should generate unique tokens across multiple calls', async () => {
      const tokens = new Set();

      // Generate multiple tokens
      for (let i = 0; i < 10; i++) {
        const emailToken = await tokenService.generateEmailVerificationToken(testUserId);
        const resetToken = await tokenService.generatePasswordResetToken(testUserId);

        tokens.add(emailToken.token);
        tokens.add(resetToken.token);
      }

      // All tokens should be unique
      expect(tokens.size).toBe(20);
    });

    it('should generate tokens with correct format and length', async () => {
      const emailToken = await tokenService.generateEmailVerificationToken(testUserId);
      const resetToken = await tokenService.generatePasswordResetToken(testUserId);

      // Email verification token should be hex (64 chars)
      expect(emailToken.token).toMatch(/^[a-f0-9]{64}$/i);

      // Password reset token should be base64url
      expect(resetToken.token).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(resetToken.token.length).toBeGreaterThan(40); // Approximate length for 32 bytes
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent user gracefully', async () => {
      const nonExistentUserId = 'non-existent-user-id';

      await expect(
        tokenService.generateEmailVerificationToken(nonExistentUserId)
      ).rejects.toThrow('Failed to generate email verification token');

      await expect(
        tokenService.generatePasswordResetToken(nonExistentUserId)
      ).rejects.toThrow('Failed to generate password reset token');
    });

    it('should handle malformed tokens gracefully', async () => {
      const malformedTokens = [
        'short',
        'contains+invalid/chars=',
        '0123456789abcdef', // Too short hex
        'g'.repeat(64), // Invalid hex chars
      ];

      for (const token of malformedTokens) {
        const emailResult = await tokenService.validateEmailVerificationToken(token);
        const resetResult = await tokenService.validatePasswordResetToken(token);

        expect(emailResult.isValid).toBe(false);
        expect(resetResult.isValid).toBe(false);
      }
    });
  });
});