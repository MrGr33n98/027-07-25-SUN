import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as verifyEmailPOST, GET as verifyEmailGET } from '@/app/api/auth/verify-email/route';
import { POST as resendVerificationPOST } from '@/app/api/auth/resend-verification/route';
import { GET as verificationStatusGET, POST as verificationStatusPOST } from '@/app/api/auth/verification-status/route';
import { authenticationService } from '@/lib/authentication-service';
import { withAuthRateLimit } from '@/lib/auth-rate-limiter';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/authentication-service');
jest.mock('@/lib/auth-rate-limiter');
jest.mock('next-auth');

const mockAuthService = authenticationService as jest.Mocked<typeof authenticationService>;
const mockWithAuthRateLimit = withAuthRateLimit as jest.MockedFunction<typeof withAuthRateLimit>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('Email Verification API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockWithAuthRateLimit.mockResolvedValue(null); // No rate limiting by default
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/auth/verify-email', () => {
    it('should successfully verify email with valid token', async () => {
      // Arrange
      const token = 'valid-verification-token';
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
        headers: { 'content-type': 'application/json' },
      });

      mockAuthService.verifyEmail.mockResolvedValue({
        success: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
          emailVerified: new Date(),
        },
      });

      // Act
      const response = await verifyEmailPOST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Email verified successfully');
      expect(data.user).toBeDefined();
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token, mockRequest);
    });

    it('should fail with invalid token', async () => {
      // Arrange
      const token = 'invalid-token';
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
        headers: { 'content-type': 'application/json' },
      });

      mockAuthService.verifyEmail.mockResolvedValue({
        success: false,
        error: 'Invalid verification token',
      });

      // Act
      const response = await verifyEmailPOST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid verification token');
    });

    it('should fail with missing token', async () => {
      // Arrange
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
      });

      // Act
      const response = await verifyEmailPOST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Verification token is required');
      expect(mockAuthService.verifyEmail).not.toHaveBeenCalled();
    });

    it('should handle rate limiting', async () => {
      // Arrange
      const token = 'valid-token';
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
        headers: { 'content-type': 'application/json' },
      });

      const rateLimitResponse = new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429 }
      );
      mockWithAuthRateLimit.mockResolvedValue(rateLimitResponse);

      // Act
      const response = await verifyEmailPOST(mockRequest);

      // Assert
      expect(response.status).toBe(429);
      expect(mockWithAuthRateLimit).toHaveBeenCalledWith(mockRequest, 'emailVerification');
      expect(mockAuthService.verifyEmail).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/auth/verify-email', () => {
    it('should successfully verify email with token in query params', async () => {
      // Arrange
      const token = 'valid-verification-token';
      const mockRequest = new NextRequest(`http://localhost:3000/api/auth/verify-email?token=${token}`, {
        method: 'GET',
      });

      mockAuthService.verifyEmail.mockResolvedValue({
        success: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
          emailVerified: new Date(),
        },
      });

      // Act
      const response = await verifyEmailGET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Email verified successfully');
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token, mockRequest);
    });

    it('should fail with missing token in query params', async () => {
      // Arrange
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/verify-email', {
        method: 'GET',
      });

      // Act
      const response = await verifyEmailGET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Verification token is required');
      expect(mockAuthService.verifyEmail).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should successfully resend verification email', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'content-type': 'application/json' },
      });

      mockAuthService.resendEmailVerification.mockResolvedValue({
        success: true,
        user: {
          id: 'user-123',
          email,
          name: 'Test User',
          role: 'CUSTOMER',
          emailVerified: null,
        },
      });

      // Act
      const response = await resendVerificationPOST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Verification email sent successfully. Please check your inbox.');
      expect(mockAuthService.resendEmailVerification).toHaveBeenCalledWith(email, expect.any(NextRequest));
    });

    it('should fail with invalid email format', async () => {
      // Arrange
      const email = 'invalid-email';
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'content-type': 'application/json' },
      });

      // Act
      const response = await resendVerificationPOST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Please enter a valid email address');
      expect(mockAuthService.resendEmailVerification).not.toHaveBeenCalled();
    });

    it('should fail with missing email', async () => {
      // Arrange
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
      });

      // Act
      const response = await resendVerificationPOST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Email address is required');
      expect(mockAuthService.resendEmailVerification).not.toHaveBeenCalled();
    });

    it('should handle rate limiting with email-based limiting', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'content-type': 'application/json' },
      });

      const rateLimitResponse = new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429 }
      );
      mockWithAuthRateLimit.mockResolvedValue(rateLimitResponse);

      // Act
      const response = await resendVerificationPOST(mockRequest);

      // Assert
      expect(response.status).toBe(429);
      expect(mockWithAuthRateLimit).toHaveBeenCalledWith(
        expect.any(NextRequest),
        'emailVerification',
        email.toLowerCase()
      );
      expect(mockAuthService.resendEmailVerification).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/auth/verification-status', () => {
    it('should return verification status for authenticated user', async () => {
      // Arrange
      const userId = 'user-123';
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/verification-status', {
        method: 'GET',
      });

      mockGetServerSession.mockResolvedValue({
        user: { id: userId, role: 'CUSTOMER' },
      } as any);

      mockAuthService.checkEmailVerificationStatus.mockResolvedValue({
        isVerified: true,
        requiresVerification: false,
        user: {
          id: userId,
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
          emailVerified: new Date(),
        },
      });

      // Act
      const response = await verificationStatusGET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isVerified).toBe(true);
      expect(data.requiresVerification).toBe(false);
      expect(mockAuthService.checkEmailVerificationStatus).toHaveBeenCalledWith(userId);
    });

    it('should fail for unauthenticated user', async () => {
      // Arrange
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/verification-status', {
        method: 'GET',
      });

      mockGetServerSession.mockResolvedValue(null);

      // Act
      const response = await verificationStatusGET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
      expect(mockAuthService.checkEmailVerificationStatus).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/verification-status', () => {
    it('should return verification status for specific user (admin)', async () => {
      // Arrange
      const adminId = 'admin-123';
      const targetUserId = 'user-456';
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/verification-status', {
        method: 'POST',
        body: JSON.stringify({ userId: targetUserId }),
        headers: { 'content-type': 'application/json' },
      });

      mockGetServerSession.mockResolvedValue({
        user: { id: adminId, role: 'ADMIN' },
      } as any);

      mockAuthService.checkEmailVerificationStatus.mockResolvedValue({
        isVerified: false,
        requiresVerification: true,
        user: {
          id: targetUserId,
          email: 'target@example.com',
          name: 'Target User',
          role: 'CUSTOMER',
          emailVerified: null,
        },
      });

      mockAuthService.getEmailVerificationTokenStatus.mockResolvedValue({
        hasToken: true,
        isExpired: false,
        expiresAt: new Date(),
      });

      // Act
      const response = await verificationStatusPOST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isVerified).toBe(false);
      expect(data.requiresVerification).toBe(true);
      expect(data.tokenStatus).toBeDefined();
      expect(mockAuthService.checkEmailVerificationStatus).toHaveBeenCalledWith(targetUserId);
      expect(mockAuthService.getEmailVerificationTokenStatus).toHaveBeenCalledWith(targetUserId);
    });

    it('should allow user to check their own status', async () => {
      // Arrange
      const userId = 'user-123';
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/verification-status', {
        method: 'POST',
        body: JSON.stringify({ userId }),
        headers: { 'content-type': 'application/json' },
      });

      mockGetServerSession.mockResolvedValue({
        user: { id: userId, role: 'CUSTOMER' },
      } as any);

      mockAuthService.checkEmailVerificationStatus.mockResolvedValue({
        isVerified: true,
        requiresVerification: false,
        user: {
          id: userId,
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
          emailVerified: new Date(),
        },
      });

      // Act
      const response = await verificationStatusPOST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.isVerified).toBe(true);
      expect(mockAuthService.checkEmailVerificationStatus).toHaveBeenCalledWith(userId);
    });

    it('should fail for non-admin checking other user', async () => {
      // Arrange
      const userId = 'user-123';
      const targetUserId = 'user-456';
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/verification-status', {
        method: 'POST',
        body: JSON.stringify({ userId: targetUserId }),
        headers: { 'content-type': 'application/json' },
      });

      mockGetServerSession.mockResolvedValue({
        user: { id: userId, role: 'CUSTOMER' },
      } as any);

      // Act
      const response = await verificationStatusPOST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Insufficient permissions');
      expect(mockAuthService.checkEmailVerificationStatus).not.toHaveBeenCalled();
    });

    it('should fail with missing userId', async () => {
      // Arrange
      const userId = 'user-123';
      const mockRequest = new NextRequest('http://localhost:3000/api/auth/verification-status', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'content-type': 'application/json' },
      });

      mockGetServerSession.mockResolvedValue({
        user: { id: userId, role: 'ADMIN' },
      } as any);

      // Act
      const response = await verificationStatusPOST(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('User ID is required');
      expect(mockAuthService.checkEmailVerificationStatus).not.toHaveBeenCalled();
    });
  });
});