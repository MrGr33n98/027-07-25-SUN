import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuthenticationService } from '@/lib/authentication-service';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockTokenService = {
  validateEmailVerificationToken: jest.fn(),
  invalidateEmailVerificationToken: jest.fn(),
  generateEmailVerificationToken: jest.fn(),
};

const mockEmailService = {
  sendVerificationEmail: jest.fn(),
};

const mockSecurityLogger = {
  logEmailVerification: jest.fn(),
  logEmailVerificationResend: jest.fn(),
};

const mockRateLimiters = {
  emailVerification: {
    checkLimit: jest.fn(),
  },
};

// Mock the modules
jest.mock('@/lib/token-service', () => ({
  tokenService: mockTokenService,
}));

jest.mock('@/lib/email-service', () => ({
  emailService: mockEmailService,
}));

jest.mock('@/lib/security-logger', () => ({
  securityLogger: mockSecurityLogger,
}));

jest.mock('@/lib/auth-rate-limiter', () => ({
  authRateLimiters: mockRateLimiters,
}));

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
} as unknown as jest.Mocked<PrismaClient>;

describe('Email Verification System', () => {
  let authService: AuthenticationService;
  let mockRequest: NextRequest;

  beforeEach(() => {
    authService = new AuthenticationService(mockPrisma);
    mockRequest = new NextRequest('http://localhost:3000/test', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'test-agent',
      },
    });

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockRateLimiters.emailVerification.checkLimit.mockResolvedValue({ success: true });
    mockSecurityLogger.logEmailVerification.mockResolvedValue(undefined);
    mockSecurityLogger.logEmailVerificationResend.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('verifyEmail', () => {
    const validToken = 'valid-verification-token';
    const expiredToken = 'expired-verification-token';
    const invalidToken = 'invalid-verification-token';

    it('should successfully verify email with valid token', async () => {
      // Arrange
      const userId = 'user-123';
      const userEmail = 'test@example.com';
      
      mockTokenService.validateEmailVerificationToken.mockResolvedValue({
        isValid: true,
        isExpired: false,
        isUsed: false,
        userId,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: userEmail,
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: null,
      } as any);

      mockTokenService.invalidateEmailVerificationToken.mockResolvedValue(true);

      // Act
      const result = await authService.verifyEmail(validToken, mockRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: userId,
        email: userEmail,
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: expect.any(Date),
      });

      expect(mockTokenService.validateEmailVerificationToken).toHaveBeenCalledWith(validToken);
      expect(mockTokenService.invalidateEmailVerificationToken).toHaveBeenCalledWith(validToken);
      expect(mockSecurityLogger.logEmailVerification).toHaveBeenCalledWith(
        userEmail,
        true,
        '192.168.1.1',
        'test-agent',
        userId,
        { verificationMethod: 'token' }
      );
    });

    it('should fail verification with expired token', async () => {
      // Arrange
      const userId = 'user-123';
      
      mockTokenService.validateEmailVerificationToken.mockResolvedValue({
        isValid: false,
        isExpired: true,
        isUsed: false,
        userId,
        error: 'Token has expired',
      });

      // Act
      const result = await authService.verifyEmail(expiredToken, mockRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Verification token has expired. Please request a new one.');

      expect(mockSecurityLogger.logEmailVerification).toHaveBeenCalledWith(
        undefined,
        false,
        '192.168.1.1',
        'test-agent',
        userId,
        { 
          reason: 'Token has expired',
          isExpired: true,
          isUsed: false
        }
      );
    });

    it('should fail verification with already used token', async () => {
      // Arrange
      mockTokenService.validateEmailVerificationToken.mockResolvedValue({
        isValid: false,
        isExpired: false,
        isUsed: true,
        error: 'Token not found or already used',
      });

      // Act
      const result = await authService.verifyEmail(invalidToken, mockRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Verification token has already been used or is invalid.');

      expect(mockSecurityLogger.logEmailVerification).toHaveBeenCalledWith(
        undefined,
        false,
        '192.168.1.1',
        'test-agent',
        undefined,
        { 
          reason: 'Token not found or already used',
          isExpired: false,
          isUsed: true
        }
      );
    });

    it('should fail verification if user not found', async () => {
      // Arrange
      const userId = 'nonexistent-user';
      
      mockTokenService.validateEmailVerificationToken.mockResolvedValue({
        isValid: true,
        isExpired: false,
        isUsed: false,
        userId,
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await authService.verifyEmail(validToken, mockRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');

      expect(mockSecurityLogger.logEmailVerification).toHaveBeenCalledWith(
        undefined,
        false,
        '192.168.1.1',
        'test-agent',
        userId,
        { reason: 'user_not_found' }
      );
    });

    it('should fail verification if email already verified', async () => {
      // Arrange
      const userId = 'user-123';
      const userEmail = 'test@example.com';
      
      mockTokenService.validateEmailVerificationToken.mockResolvedValue({
        isValid: true,
        isExpired: false,
        isUsed: false,
        userId,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: userEmail,
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: new Date(),
      } as any);

      // Act
      const result = await authService.verifyEmail(validToken, mockRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email address is already verified');

      expect(mockSecurityLogger.logEmailVerification).toHaveBeenCalledWith(
        userEmail,
        false,
        '192.168.1.1',
        'test-agent',
        userId,
        { reason: 'already_verified' }
      );
    });

    it('should handle token invalidation failure', async () => {
      // Arrange
      const userId = 'user-123';
      const userEmail = 'test@example.com';
      
      mockTokenService.validateEmailVerificationToken.mockResolvedValue({
        isValid: true,
        isExpired: false,
        isUsed: false,
        userId,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: userEmail,
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: null,
      } as any);

      mockTokenService.invalidateEmailVerificationToken.mockResolvedValue(false);

      // Act
      const result = await authService.verifyEmail(validToken, mockRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to verify email. Please try again.');

      expect(mockSecurityLogger.logEmailVerification).toHaveBeenCalledWith(
        userEmail,
        false,
        '192.168.1.1',
        'test-agent',
        userId,
        { reason: 'token_invalidation_failed' }
      );
    });
  });

  describe('resendEmailVerification', () => {
    const userEmail = 'test@example.com';

    it('should successfully resend verification email', async () => {
      // Arrange
      const userId = 'user-123';
      const token = 'new-verification-token';
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: userEmail,
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: null,
      } as any);

      mockTokenService.generateEmailVerificationToken.mockResolvedValue({
        token,
        expiresAt,
        userId,
      });

      mockEmailService.sendVerificationEmail.mockResolvedValue({
        success: true,
      });

      // Act
      const result = await authService.resendEmailVerification(userEmail, mockRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: userId,
        email: userEmail,
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: null,
      });

      expect(mockRateLimiters.emailVerification.checkLimit).toHaveBeenCalledWith(mockRequest);
      expect(mockTokenService.generateEmailVerificationToken).toHaveBeenCalledWith(userId);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        userEmail,
        token,
        'Test User'
      );
      expect(mockSecurityLogger.logEmailVerificationResend).toHaveBeenCalledWith(
        userEmail,
        true,
        '192.168.1.1',
        'test-agent',
        userId,
        { tokenExpiry: expiresAt.toISOString() }
      );
    });

    it('should be rate limited', async () => {
      // Arrange
      mockRateLimiters.emailVerification.checkLimit.mockResolvedValue({
        success: false,
        limit: 5,
      });

      // Act
      const result = await authService.resendEmailVerification(userEmail, mockRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many verification email requests. Please try again later.');

      expect(mockSecurityLogger.logEmailVerificationResend).toHaveBeenCalledWith(
        userEmail,
        false,
        '192.168.1.1',
        'test-agent',
        undefined,
        { reason: 'rate_limit_exceeded', limit: 5 }
      );
    });

    it('should not reveal if email does not exist', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await authService.resendEmailVerification(userEmail, mockRequest);

      // Assert
      expect(result.success).toBe(true); // Should return success to not reveal email existence
      expect(result.user).toBeUndefined();

      expect(mockSecurityLogger.logEmailVerificationResend).toHaveBeenCalledWith(
        userEmail,
        false,
        '192.168.1.1',
        'test-agent',
        undefined,
        { reason: 'user_not_found' }
      );
    });

    it('should fail if email is already verified', async () => {
      // Arrange
      const userId = 'user-123';

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: userEmail,
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: new Date(),
      } as any);

      // Act
      const result = await authService.resendEmailVerification(userEmail, mockRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Email address is already verified');

      expect(mockSecurityLogger.logEmailVerificationResend).toHaveBeenCalledWith(
        userEmail,
        false,
        '192.168.1.1',
        'test-agent',
        userId,
        { reason: 'already_verified' }
      );
    });

    it('should handle email sending failure', async () => {
      // Arrange
      const userId = 'user-123';
      const token = 'new-verification-token';
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: userEmail,
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: null,
      } as any);

      mockTokenService.generateEmailVerificationToken.mockResolvedValue({
        token,
        expiresAt,
        userId,
      });

      mockEmailService.sendVerificationEmail.mockResolvedValue({
        success: false,
        error: 'SMTP error',
      });

      // Act
      const result = await authService.resendEmailVerification(userEmail, mockRequest);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send verification email. Please try again.');

      expect(mockSecurityLogger.logEmailVerificationResend).toHaveBeenCalledWith(
        userEmail,
        false,
        '192.168.1.1',
        'test-agent',
        userId,
        { reason: 'email_send_failed', emailError: 'SMTP error' }
      );
    });
  });

  describe('checkEmailVerificationStatus', () => {
    const userId = 'user-123';

    it('should return verified status for verified user', async () => {
      // Arrange
      const verifiedDate = new Date();
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: verifiedDate,
      } as any);

      // Act
      const result = await authService.checkEmailVerificationStatus(userId);

      // Assert
      expect(result.isVerified).toBe(true);
      expect(result.requiresVerification).toBe(false);
      expect(result.user).toEqual({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: verifiedDate,
      });
    });

    it('should return unverified status for unverified user', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: null,
      } as any);

      // Act
      const result = await authService.checkEmailVerificationStatus(userId);

      // Assert
      expect(result.isVerified).toBe(false);
      expect(result.requiresVerification).toBe(true);
      expect(result.user).toEqual({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: null,
      });
    });

    it('should handle user not found', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await authService.checkEmailVerificationStatus(userId);

      // Assert
      expect(result.isVerified).toBe(false);
      expect(result.requiresVerification).toBe(true);
      expect(result.user).toBeUndefined();
    });
  });

  describe('getEmailVerificationTokenStatus', () => {
    const userId = 'user-123';

    it('should return token status for user with valid token', async () => {
      // Arrange
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      mockPrisma.user.findUnique.mockResolvedValue({
        emailVerificationToken: 'valid-token',
        emailVerificationExpiry: expiresAt,
      } as any);

      // Act
      const result = await authService.getEmailVerificationTokenStatus(userId);

      // Assert
      expect(result).toEqual({
        hasToken: true,
        isExpired: false,
        expiresAt,
      });
    });

    it('should return expired status for expired token', async () => {
      // Arrange
      const expiresAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      mockPrisma.user.findUnique.mockResolvedValue({
        emailVerificationToken: 'expired-token',
        emailVerificationExpiry: expiresAt,
      } as any);

      // Act
      const result = await authService.getEmailVerificationTokenStatus(userId);

      // Assert
      expect(result).toEqual({
        hasToken: true,
        isExpired: true,
        expiresAt,
      });
    });

    it('should return no token status for user without token', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      } as any);

      // Act
      const result = await authService.getEmailVerificationTokenStatus(userId);

      // Assert
      expect(result).toEqual({
        hasToken: false,
        isExpired: false,
      });
    });

    it('should handle user not found', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await authService.getEmailVerificationTokenStatus(userId);

      // Assert
      expect(result).toEqual({
        hasToken: false,
        isExpired: false,
      });
    });
  });
});