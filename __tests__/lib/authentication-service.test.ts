import { describe, it, expect, beforeEach, afterEach, jest, beforeAll, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AuthenticationService, RegistrationData, LoginCredentials } from '../../lib/authentication-service';

// Create mock functions
const mockPasswordService = {
  validatePasswordStrength: jest.fn(),
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  generateSecureTokenBase64: jest.fn(),
};

const mockTokenService = {
  generateEmailVerificationToken: jest.fn(),
};

const mockEmailService = {
  sendVerificationEmail: jest.fn(),
  sendAccountLockoutNotification: jest.fn(),
};

const mockSecurityLogger = {
  logRegistration: jest.fn(),
  logAuthenticationAttempt: jest.fn(),
  logSessionCreated: jest.fn(),
  logSessionExpired: jest.fn(),
  logAccountLockout: jest.fn(),
};

// Mock dependencies
jest.mock('../../lib/password-service', () => ({
  passwordService: mockPasswordService,
}));

jest.mock('../../lib/token-service', () => ({
  tokenService: mockTokenService,
}));

jest.mock('../../lib/email-service', () => ({
  emailService: mockEmailService,
}));

jest.mock('../../lib/security-logger', () => ({
  securityLogger: mockSecurityLogger,
}));

// Mock rate limiter
const mockRateLimitResult = {
  success: true,
  limit: 5,
  remaining: 4,
  resetTime: Date.now() + 900000,
  retryAfter: 0,
};

jest.mock('../../lib/auth-rate-limiter', () => ({
  authRateLimiters: {
    registration: {
      checkLimit: jest.fn().mockResolvedValue(mockRateLimitResult),
    },
    login: {
      checkLimit: jest.fn().mockResolvedValue(mockRateLimitResult),
    },
  },
}));

// Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  authSession: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let mockRequest: NextRequest;

  beforeAll(() => {
    // Mock console methods to reduce test noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    authService = new AuthenticationService(mockPrisma);
    
    // Create mock request
    mockRequest = {
      headers: {
        get: jest.fn((name: string) => {
          const headers: Record<string, string> = {
            'user-agent': 'test-agent',
            'x-forwarded-for': '192.168.1.1',
          };
          return headers[name] || null;
        }),
      },
      ip: '192.168.1.1',
    } as unknown as NextRequest;

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockPasswordService.validatePasswordStrength.mockReturnValue({
      isValid: true,
      errors: [],
      score: 85,
    });

    mockPasswordService.hashPassword.mockResolvedValue('hashed_password');
    mockPasswordService.verifyPassword.mockResolvedValue(true);
    mockPasswordService.generateSecureTokenBase64.mockReturnValue('secure_token');

    mockTokenService.generateEmailVerificationToken.mockResolvedValue({
      token: 'verification_token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userId: 'user_id',
    });
    
    console.log('Mock setup complete, tokenService mock:', mockTokenService.generateEmailVerificationToken);

    mockSecurityLogger.logRegistration.mockResolvedValue(undefined);
    mockSecurityLogger.logAuthenticationAttempt.mockResolvedValue(undefined);
    mockSecurityLogger.logSessionCreated.mockResolvedValue(undefined);
    mockSecurityLogger.logSessionExpired.mockResolvedValue(undefined);
    mockSecurityLogger.logAccountLockout.mockResolvedValue(undefined);
  });

  describe('register', () => {
    const validRegistrationData: RegistrationData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      name: 'Test User',
      role: 'CUSTOMER',
    };

    it('should successfully register a new user', async () => {
      // Mock user doesn't exist
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Mock user creation
      const mockUser = {
        id: 'user_id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: null,
      };
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      // Mock email service
      mockEmailService.sendVerificationEmail.mockResolvedValue({
        success: true,
      });

      const result = await authService.register(validRegistrationData, mockRequest);

      console.log('Registration result:', result);
      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'user_id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: null,
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
          passwordHash: 'hashed_password',
          emailVerified: null,
          failedLoginAttempts: 0,
        },
      });
      expect(mockTokenService.generateEmailVerificationToken).toHaveBeenCalledWith('user_id');
      expect(mockSecurityLogger.logRegistration).toHaveBeenCalledWith(
        'test@example.com',
        true,
        '192.168.1.1',
        'test-agent',
        'user_id',
        expect.any(Object)
      );
    });

    it('should fail registration with invalid password', async () => {
      mockPasswordService.validatePasswordStrength.mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 8 characters long'],
        score: 20,
      });

      const invalidData = {
        ...validRegistrationData,
        password: 'weak',
        confirmPassword: 'weak',
      };

      const result = await authService.register(invalidData, mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.validationErrors).toContain('Password must be at least 8 characters long');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should fail registration with mismatched passwords', async () => {
      const invalidData = {
        ...validRegistrationData,
        confirmPassword: 'DifferentPassword123!',
      };

      const result = await authService.register(invalidData, mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.validationErrors).toContain('Passwords do not match');
    });

    it('should fail registration with existing email', async () => {
      // Mock existing user
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing_user',
        email: 'test@example.com',
      });

      const result = await authService.register(validRegistrationData, mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An account with this email already exists');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const validCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    const mockUser = {
      id: 'user_id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'CUSTOMER',
      passwordHash: 'hashed_password',
      emailVerified: new Date(),
      failedLoginAttempts: 0,
      accountLockedUntil: null,
      updatedAt: new Date(),
    };

    it('should successfully login with valid credentials', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      
      const mockSession = {
        id: 'session_id',
        userId: 'user_id',
        token: 'secure_token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
      };
      (mockPrisma.authSession.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await authService.login(validCredentials, mockRequest);

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'user_id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: mockUser.emailVerified,
      });
      expect(result.sessionId).toBe('session_id');
      expect(mockPrisma.authSession.create).toHaveBeenCalled();
      expect(mockSecurityLogger.logAuthenticationAttempt).toHaveBeenCalledWith(
        'test@example.com',
        true,
        '192.168.1.1',
        'test-agent',
        'user_id',
        expect.objectContaining({ sessionId: 'session_id' })
      );
    });

    it('should fail login with invalid credentials', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockPasswordService.verifyPassword.mockResolvedValue(false);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 1,
      });

      const result = await authService.login(validCredentials, mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_id' },
        data: {
          failedLoginAttempts: 1,
          accountLockedUntil: null,
        },
      });
    });

    it('should fail login with non-existent user', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.login(validCredentials, mockRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(mockSecurityLogger.logAuthenticationAttempt).toHaveBeenCalledWith(
        'test@example.com',
        false,
        '192.168.1.1',
        'test-agent',
        undefined,
        expect.objectContaining({ reason: 'user_not_found' })
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout and invalidate session', async () => {
      const mockSession = {
        id: 'session_id',
        userId: 'user_id',
        token: 'session_token',
        user: { id: 'user_id', email: 'test@example.com' },
      };
      (mockPrisma.authSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (mockPrisma.authSession.delete as jest.Mock).mockResolvedValue(mockSession);

      const result = await authService.logout('session_id', mockRequest);

      expect(result).toBe(true);
      expect(mockPrisma.authSession.delete).toHaveBeenCalledWith({
        where: { id: 'session_id' },
      });
      expect(mockSecurityLogger.logSessionExpired).toHaveBeenCalledWith(
        'user_id',
        'session_id',
        '192.168.1.1',
        'test-agent',
        'logout'
      );
    });

    it('should fail logout with invalid session', async () => {
      (mockPrisma.authSession.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.logout('invalid_session', mockRequest);

      expect(result).toBe(false);
      expect(mockPrisma.authSession.delete).not.toHaveBeenCalled();
    });
  });

  describe('validateSession', () => {
    it('should successfully validate active session', async () => {
      const mockSession = {
        id: 'session_id',
        userId: 'user_id',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        user: {
          id: 'user_id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
          emailVerified: new Date(),
        },
      };
      (mockPrisma.authSession.findUnique as jest.Mock).mockResolvedValue(mockSession);
      (mockPrisma.authSession.update as jest.Mock).mockResolvedValue(mockSession);

      const result = await authService.validateSession('session_id');

      expect(result).toEqual({
        id: 'user_id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
        emailVerified: mockSession.user.emailVerified,
      });
      expect(mockPrisma.authSession.update).toHaveBeenCalledWith({
        where: { id: 'session_id' },
        data: { lastAccessedAt: expect.any(Date) },
      });
    });

    it('should fail validation with expired session', async () => {
      const expiredSession = {
        id: 'session_id',
        userId: 'user_id',
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        user: { id: 'user_id', email: 'test@example.com' },
      };
      (mockPrisma.authSession.findUnique as jest.Mock).mockResolvedValue(expiredSession);
      (mockPrisma.authSession.delete as jest.Mock).mockResolvedValue(expiredSession);

      const result = await authService.validateSession('session_id');

      expect(result).toBeNull();
      expect(mockPrisma.authSession.delete).toHaveBeenCalledWith({
        where: { id: 'session_id' },
      });
    });

    it('should fail validation with non-existent session', async () => {
      (mockPrisma.authSession.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.validateSession('invalid_session');

      expect(result).toBeNull();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired sessions', async () => {
      (mockPrisma.authSession.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });

      const result = await authService.cleanupExpiredSessions();

      expect(result).toBe(5);
      expect(mockPrisma.authSession.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      (mockPrisma.authSession.deleteMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await authService.cleanupExpiredSessions();

      expect(result).toBe(0);
    });
  });
});