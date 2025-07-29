import { PrismaClient, User } from '@prisma/client';
import { passwordService } from './password-service';
import { tokenService } from './token-service';
import { emailService } from './email-service';
import { securityLogger } from './security-logger';
import { authRateLimiters } from './auth-rate-limiter';
import { NextRequest } from 'next/server';

/**
 * User registration data interface
 */
export interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
  role?: 'CUSTOMER' | 'COMPANY';
}

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Authentication result interface
 */
export interface AuthenticationResult {
  success: boolean;
  user?: Partial<User>;
  sessionId?: string;
  error?: string;
  requiresEmailVerification?: boolean;
  accountLocked?: boolean;
  lockoutDuration?: number;
}

/**
 * Registration result interface
 */
export interface RegistrationResult {
  success: boolean;
  user?: Partial<User>;
  error?: string;
  validationErrors?: string[];
}

/**
 * Session data interface
 */
export interface SessionData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
}

/**
 * Account unlock result interface
 */
export interface UnlockResult {
  success: boolean;
  error?: string;
  user?: Partial<User>;
}

/**
 * Account lockout status interface
 */
export interface LockoutStatus {
  isLocked: boolean;
  lockoutCount: number;
  lockedUntil?: Date;
  lockoutDurationMinutes?: number;
  nextLockoutDurationMinutes?: number;
}

/**
 * Account lockout configuration
 */
interface LockoutConfig {
  maxFailedAttempts: number;
  baseLockoutDurationMinutes: number;
  maxLockoutDurationMinutes: number;
  resetWindowMinutes: number;
  exponentialBackoffMultiplier: number;
}

/**
 * Central authentication service that orchestrates all authentication operations
 * Implements secure user registration, login, session management, and security features
 */
export class AuthenticationService {
  private prisma: PrismaClient;
  private lockoutConfig: LockoutConfig;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
    this.lockoutConfig = {
      maxFailedAttempts: 5,
      baseLockoutDurationMinutes: 30,
      maxLockoutDurationMinutes: 24 * 60, // 24 hours max
      resetWindowMinutes: 15,
      exponentialBackoffMultiplier: 2,
    };
  }
  /**

   * Register a new user with validation and email verification
   * @param data - Registration data
   * @param req - Next.js request object for rate limiting and logging
   * @returns Promise resolving to registration result
   */
  async register(data: RegistrationData, req: NextRequest): Promise<RegistrationResult> {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      // Apply rate limiting
      const rateLimitResult = await authRateLimiters.registration.checkLimit(req);
      if (!rateLimitResult.success) {
        await securityLogger.logRegistration(
          data.email,
          false,
          ipAddress,
          userAgent,
          undefined,
          { reason: 'rate_limit_exceeded', limit: rateLimitResult.limit }
        );
        return {
          success: false,
          error: 'Too many registration attempts. Please try again later.',
        };
      }

      console.log('Rate limit passed, validating data...');

      // Validate input data
      const validationResult = this.validateRegistrationData(data);
      console.log('Validation result:', validationResult);
      if (!validationResult.isValid) {
        await securityLogger.logRegistration(
          data.email,
          false,
          ipAddress,
          userAgent,
          undefined,
          { reason: 'validation_failed', errors: validationResult.errors }
        );
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: validationResult.errors,
        };
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      console.log('Existing user check:', existingUser);

      if (existingUser) {
        await securityLogger.logRegistration(
          data.email,
          false,
          ipAddress,
          userAgent,
          undefined,
          { reason: 'email_already_exists' }
        );
        return {
          success: false,
          error: 'An account with this email already exists',
        };
      }

      // Hash password
      const passwordHash = await passwordService.hashPassword(data.password);
      console.log('Password hashed successfully');

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          name: data.name,
          role: data.role || 'CUSTOMER',
          passwordHash,
          emailVerified: null, // Will be set when email is verified
          failedLoginAttempts: 0,
        },
      });
      console.log('User created:', user);

      console.log('About to generate token...');
      // Generate email verification token
      let tokenResult;
      try {
        tokenResult = await tokenService.generateEmailVerificationToken(user.id);
        console.log('Token generated:', tokenResult);
      } catch (tokenError) {
        console.error('Token generation failed:', tokenError);
        throw tokenError;
      }

      // Send verification email
      if (emailService) {
        const emailResult = await emailService.sendVerificationEmail(
          user.email,
          tokenResult.token,
          user.name || undefined
        );
        console.log('Email result:', emailResult);

        if (!emailResult.success) {
          console.error('Failed to send verification email:', emailResult.error);
          // Don't fail registration if email fails, but log it
          await securityLogger.logRegistration(
            data.email,
            true,
            ipAddress,
            userAgent,
            user.id,
            { warning: 'verification_email_failed', emailError: emailResult.error }
          );
        }
      }

      // Log successful registration
      await securityLogger.logRegistration(
        data.email,
        true,
        ipAddress,
        userAgent,
        user.id,
        { emailVerificationSent: !!emailService }
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      await securityLogger.logRegistration(
        data.email,
        false,
        ipAddress,
        userAgent,
        undefined,
        { reason: 'internal_error', error: error instanceof Error ? error.message : 'unknown' }
      );
      return {
        success: false,
        error: 'Registration failed. Please try again.',
      };
    }
  } 
 /**
   * Authenticate user login with security checks
   * @param credentials - Login credentials
   * @param req - Next.js request object for rate limiting and logging
   * @returns Promise resolving to authentication result
   */
  async login(credentials: LoginCredentials, req: NextRequest): Promise<AuthenticationResult> {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      // Apply rate limiting
      const rateLimitResult = await authRateLimiters.login.checkLimit(req);
      if (!rateLimitResult.success) {
        await securityLogger.logAuthenticationAttempt(
          credentials.email,
          false,
          ipAddress,
          userAgent,
          undefined,
          { reason: 'rate_limit_exceeded', limit: rateLimitResult.limit }
        );
        return {
          success: false,
          error: 'Too many login attempts. Please try again later.',
        };
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() },
      });

      if (!user || !user.passwordHash) {
        await securityLogger.logAuthenticationAttempt(
          credentials.email,
          false,
          ipAddress,
          userAgent,
          undefined,
          { reason: 'user_not_found' }
        );
        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Check if account is locked
      if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
        const lockoutDuration = Math.ceil(
          (user.accountLockedUntil.getTime() - Date.now()) / (1000 * 60)
        );
        await securityLogger.logAuthenticationAttempt(
          credentials.email,
          false,
          ipAddress,
          userAgent,
          user.id,
          { reason: 'account_locked', lockoutDuration }
        );
        return {
          success: false,
          error: 'Account is temporarily locked due to too many failed login attempts',
          accountLocked: true,
          lockoutDuration,
        };
      }

      // Verify password
      const isPasswordValid = await passwordService.verifyPassword(
        credentials.password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        // Increment failed login attempts
        const updatedUser = await this.handleFailedLogin(user);
        
        await securityLogger.logAuthenticationAttempt(
          credentials.email,
          false,
          ipAddress,
          userAgent,
          user.id,
          { 
            reason: 'invalid_password',
            failedAttempts: updatedUser.failedLoginAttempts,
            accountLocked: !!updatedUser.accountLockedUntil
          }
        );

        if (updatedUser.accountLockedUntil) {
          const lockoutDuration = Math.ceil(
            (updatedUser.accountLockedUntil.getTime() - Date.now()) / (1000 * 60)
          );
          
          // Send lockout notification email
          if (emailService) {
            await emailService.sendAccountLockoutNotification(
              user.email,
              'Too many failed login attempts',
              lockoutDuration,
              user.name || undefined
            );
          }

          return {
            success: false,
            error: 'Account has been temporarily locked due to too many failed login attempts',
            accountLocked: true,
            lockoutDuration,
          };
        }

        return {
          success: false,
          error: 'Invalid credentials',
        };
      }

      // Check if email is verified (if required)
      if (!user.emailVerified) {
        await securityLogger.logAuthenticationAttempt(
          credentials.email,
          false,
          ipAddress,
          userAgent,
          user.id,
          { reason: 'email_not_verified' }
        );
        return {
          success: false,
          error: 'Please verify your email address before logging in',
          requiresEmailVerification: true,
        };
      }

      // Reset failed login attempts on successful login
      await this.resetFailedLoginAttempts(user.id);

      // Create session
      const session = await this.createSession(user.id, ipAddress, userAgent);

      // Update last login info
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIP: ipAddress,
        },
      });

      // Log successful login
      await securityLogger.logAuthenticationAttempt(
        credentials.email,
        true,
        ipAddress,
        userAgent,
        user.id,
        { sessionId: session.id }
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        sessionId: session.id,
      };
    } catch (error) {
      console.error('Login error:', error);
      await securityLogger.logAuthenticationAttempt(
        credentials.email,
        false,
        ipAddress,
        userAgent,
        undefined,
        { reason: 'internal_error', error: error instanceof Error ? error.message : 'unknown' }
      );
      return {
        success: false,
        error: 'Login failed. Please try again.',
      };
    }
  }  /*
*
   * Logout user and invalidate session
   * @param sessionId - Session ID to invalidate
   * @param req - Next.js request object for logging
   * @returns Promise resolving to success boolean
   */
  async logout(sessionId: string, req: NextRequest): Promise<boolean> {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      const session = await this.prisma.authSession.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });

      if (!session) {
        return false;
      }

      // Delete session
      await this.prisma.authSession.delete({
        where: { id: sessionId },
      });

      // Log session expiry
      await securityLogger.logSessionExpired(
        session.userId,
        sessionId,
        ipAddress,
        userAgent,
        'logout'
      );

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Validate session and return user data
   * @param sessionId - Session ID to validate
   * @returns Promise resolving to user data or null if invalid
   */
  async validateSession(sessionId: string): Promise<Partial<User> | null> {
    try {
      const session = await this.prisma.authSession.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });

      if (!session || new Date() > session.expiresAt) {
        if (session) {
          // Clean up expired session
          await this.prisma.authSession.delete({
            where: { id: sessionId },
          });
        }
        return null;
      }

      // Update last accessed time
      await this.prisma.authSession.update({
        where: { id: sessionId },
        data: { lastAccessedAt: new Date() },
      });

      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        emailVerified: session.user.emailVerified,
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }  
/**
   * Handle failed login attempt and implement account lockout with exponential backoff
   * @param user - User who failed login
   * @returns Promise resolving to updated user
   */
  private async handleFailedLogin(user: User): Promise<User> {
    const now = new Date();
    const resetWindow = new Date(now.getTime() - this.lockoutConfig.resetWindowMinutes * 60 * 1000);

    // Reset failed attempts if last failure was outside reset window
    let failedAttempts = user.failedLoginAttempts;
    if (user.updatedAt < resetWindow) {
      failedAttempts = 0;
    }

    failedAttempts += 1;

    let accountLockedUntil: Date | null = null;
    if (failedAttempts >= this.lockoutConfig.maxFailedAttempts) {
      // Calculate lockout duration with exponential backoff
      const lockoutDuration = this.calculateLockoutDuration(failedAttempts);
      accountLockedUntil = new Date(now.getTime() + lockoutDuration * 60 * 1000);
      
      // Log account lockout
      await securityLogger.logAccountLockout(
        user.email,
        'Too many failed login attempts',
        lockoutDuration,
        'system',
        'system',
        user.id,
        { 
          failedAttempts, 
          lockoutDuration,
          lockoutCount: this.getLockoutCount(failedAttempts),
          exponentialBackoff: true
        }
      );
    }

    return await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: failedAttempts,
        accountLockedUntil,
      },
    });
  }

  /**
   * Calculate lockout duration with exponential backoff
   * @param failedAttempts - Number of failed attempts
   * @returns Lockout duration in minutes
   */
  private calculateLockoutDuration(failedAttempts: number): number {
    const lockoutCount = this.getLockoutCount(failedAttempts);
    const duration = this.lockoutConfig.baseLockoutDurationMinutes * 
      Math.pow(this.lockoutConfig.exponentialBackoffMultiplier, lockoutCount);
    
    return Math.min(duration, this.lockoutConfig.maxLockoutDurationMinutes);
  }

  /**
   * Get the lockout count based on failed attempts
   * @param failedAttempts - Number of failed attempts
   * @returns Lockout count (0-based: 0 = first lockout, 1 = second lockout, etc.)
   */
  private getLockoutCount(failedAttempts: number): number {
    if (failedAttempts < this.lockoutConfig.maxFailedAttempts) {
      return 0;
    }
    return Math.floor((failedAttempts - this.lockoutConfig.maxFailedAttempts) / this.lockoutConfig.maxFailedAttempts);
  }  /*
*
   * Get account lockout status for a user
   * @param userId - User ID to check
   * @returns Promise resolving to lockout status
   */
  async getAccountLockoutStatus(userId: string): Promise<LockoutStatus | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          failedLoginAttempts: true,
          accountLockedUntil: true,
        },
      });

      if (!user) {
        return null;
      }

      const now = new Date();
      const isLocked = user.accountLockedUntil ? now < user.accountLockedUntil : false;
      const lockoutCount = user.failedLoginAttempts >= this.lockoutConfig.maxFailedAttempts 
        ? this.getLockoutCount(user.failedLoginAttempts) + 1 // Add 1 for display (1st lockout, 2nd lockout, etc.)
        : 0;

      let nextLockoutDurationMinutes: number | undefined;
      if (user.failedLoginAttempts >= this.lockoutConfig.maxFailedAttempts - 1) {
        const nextFailedAttempts = user.failedLoginAttempts + 1;
        if (nextFailedAttempts >= this.lockoutConfig.maxFailedAttempts) {
          nextLockoutDurationMinutes = this.calculateLockoutDuration(nextFailedAttempts);
        }
      }

      return {
        isLocked,
        lockoutCount,
        lockedUntil: user.accountLockedUntil || undefined,
        lockoutDurationMinutes: isLocked && user.accountLockedUntil 
          ? Math.ceil((user.accountLockedUntil.getTime() - now.getTime()) / (1000 * 60))
          : undefined,
        nextLockoutDurationMinutes,
      };
    } catch (error) {
      console.error('Failed to get account lockout status:', error);
      return null;
    }
  }

  /**
   * Unlock a user account (admin function)
   * @param userId - User ID to unlock
   * @param adminId - Admin user ID performing the unlock
   * @param reason - Reason for unlocking
   * @param req - Next.js request object for logging
   * @returns Promise resolving to unlock result
   */
  async unlockAccount(
    userId: string, 
    adminId: string, 
    reason: string, 
    req: NextRequest
  ): Promise<UnlockResult> {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      // Verify admin permissions (this would typically check admin role)
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId },
        select: { id: true, email: true, role: true },
      });

      if (!admin || admin.role !== 'ADMIN') {
        return {
          success: false,
          error: 'Insufficient permissions to unlock accounts',
        };
      }

      // Find the user to unlock
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          failedLoginAttempts: true,
          accountLockedUntil: true,
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Check if account is actually locked
      const now = new Date();
      const isLocked = user.accountLockedUntil ? now < user.accountLockedUntil : false;

      if (!isLocked && user.failedLoginAttempts === 0) {
        return {
          success: false,
          error: 'Account is not locked',
        };
      }

      // Unlock the account
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          accountLockedUntil: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
        },
      });

      // Log the unlock action
      await securityLogger.logAccountUnlock(
        user.email,
        'admin',
        ipAddress,
        userAgent,
        userId,
        adminId,
        {
          reason,
          adminEmail: admin.email,
          previousFailedAttempts: user.failedLoginAttempts,
          wasLocked: isLocked,
          lockedUntil: user.accountLockedUntil?.toISOString(),
        }
      );

      return {
        success: true,
        user: updatedUser,
      };
    } catch (error) {
      console.error('Failed to unlock account:', error);
      return {
        success: false,
        error: 'Failed to unlock account. Please try again.',
      };
    }
  }  /**

   * Get users with locked accounts (admin function)
   * @param adminId - Admin user ID requesting the data
   * @param limit - Maximum number of results to return
   * @param offset - Number of results to skip
   * @returns Promise resolving to array of locked users
   */
  async getLockedAccounts(
    adminId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<Array<{
    id: string;
    email: string;
    name: string | null;
    failedLoginAttempts: number;
    accountLockedUntil: Date | null;
    lockoutDurationMinutes?: number;
  }> | null> {
    try {
      // Verify admin permissions
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId },
        select: { role: true },
      });

      if (!admin || admin.role !== 'ADMIN') {
        return null;
      }

      const now = new Date();
      const lockedUsers = await this.prisma.user.findMany({
        where: {
          OR: [
            {
              accountLockedUntil: {
                gt: now,
              },
            },
            {
              failedLoginAttempts: {
                gte: this.lockoutConfig.maxFailedAttempts,
              },
            },
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
          failedLoginAttempts: true,
          accountLockedUntil: true,
        },
        orderBy: {
          accountLockedUntil: 'desc',
        },
        take: limit,
        skip: offset,
      });

      return lockedUsers.map(user => ({
        ...user,
        lockoutDurationMinutes: user.accountLockedUntil 
          ? Math.ceil((user.accountLockedUntil.getTime() - now.getTime()) / (1000 * 60))
          : undefined,
      }));
    } catch (error) {
      console.error('Failed to get locked accounts:', error);
      return null;
    }
  }  /*
*
   * Validate registration data
   * @param data - Registration data to validate
   * @returns Validation result
   */
  private validateRegistrationData(data: RegistrationData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Email validation
    if (!data.email || typeof data.email !== 'string') {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Please enter a valid email address');
    }

    // Password validation
    if (!data.password || typeof data.password !== 'string') {
      errors.push('Password is required');
    } else {
      const passwordValidation = passwordService.validatePasswordStrength(data.password);
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors);
      }
    }

    // Confirm password validation
    if (data.password !== data.confirmPassword) {
      errors.push('Passwords do not match');
    }

    // Name validation (optional but if provided should be valid)
    if (data.name && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
      errors.push('Name must be a non-empty string if provided');
    }

    // Role validation
    if (data.role && !['CUSTOMER', 'COMPANY'].includes(data.role)) {
      errors.push('Invalid role specified');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Reset failed login attempts for a user
   * @param userId - User ID to reset attempts for
   */
  private async resetFailedLoginAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
    });
  }

  /**
   * Create a new session for a user
   * @param userId - User ID to create session for
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent
   * @returns Promise resolving to session data
   */
  private async createSession(userId: string, ipAddress: string, userAgent: string): Promise<SessionData> {
    const token = passwordService.generateSecureTokenBase64(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = await this.prisma.authSession.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Log session creation
    await securityLogger.logSessionCreated(userId, session.id, ipAddress, userAgent);

    return session;
  }

  /**
   * Get client IP address from request
   * @param req - Next.js request object
   * @returns Client IP address
   */
  private getClientIP(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfConnectingIP = req.headers.get('cf-connecting-ip');

    if (cfConnectingIP) return cfConnectingIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    if (realIP) return realIP;
    return req.ip || 'unknown';
  }

  /**
   * Request password reset by sending reset token via email
   * @param email - User email address
   * @param req - Next.js request object for rate limiting and logging
   * @returns Promise resolving to password reset request result
   */
  async requestPasswordReset(email: string, req: NextRequest): Promise<{ success: boolean; error?: string }> {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      // Apply rate limiting for password reset requests
      const rateLimitResult = await authRateLimiters.passwordReset.checkLimit(req);
      if (!rateLimitResult.success) {
        await securityLogger.logPasswordResetRequest(
          email,
          false,
          ipAddress,
          userAgent,
          undefined,
          { reason: 'rate_limit_exceeded', limit: rateLimitResult.limit }
        );
        return {
          success: false,
          error: 'Too many password reset requests. Please try again later.',
        };
      }

      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          emailVerified: true,
        },
      });

      // Always return success to prevent email enumeration attacks
      // But only send email if user exists and email is verified
      if (user && user.emailVerified) {
        try {
          // Generate password reset token
          const tokenResult = await tokenService.generatePasswordResetToken(user.id);

          // Send password reset email
          if (emailService) {
            const emailResult = await emailService.sendPasswordResetEmail(
              user.email,
              tokenResult.token,
              user.name || undefined
            );

            if (!emailResult.success) {
              console.error('Failed to send password reset email:', emailResult.error);
              await securityLogger.logPasswordResetRequest(
                email,
                false,
                ipAddress,
                userAgent,
                user.id,
                { reason: 'email_send_failed', emailError: emailResult.error }
              );
              return {
                success: false,
                error: 'Failed to send password reset email. Please try again.',
              };
            }
          }

          // Log successful password reset request
          await securityLogger.logPasswordResetRequest(
            email,
            true,
            ipAddress,
            userAgent,
            user.id,
            { tokenGenerated: true, emailSent: !!emailService }
          );
        } catch (error) {
          console.error('Password reset request error:', error);
          await securityLogger.logPasswordResetRequest(
            email,
            false,
            ipAddress,
            userAgent,
            user.id,
            { reason: 'token_generation_failed', error: error instanceof Error ? error.message : 'unknown' }
          );
          return {
            success: false,
            error: 'Failed to process password reset request. Please try again.',
          };
        }
      } else {
        // Log attempt for non-existent or unverified user (for security monitoring)
        await securityLogger.logPasswordResetRequest(
          email,
          false,
          ipAddress,
          userAgent,
          undefined,
          { reason: user ? 'email_not_verified' : 'user_not_found' }
        );
      }

      // Always return success message to prevent email enumeration
      return {
        success: true,
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      await securityLogger.logPasswordResetRequest(
        email,
        false,
        ipAddress,
        userAgent,
        undefined,
        { reason: 'internal_error', error: error instanceof Error ? error.message : 'unknown' }
      );
      return {
        success: false,
        error: 'Failed to process password reset request. Please try again.',
      };
    }
  }

  /**
   * Complete password reset using reset token and new password
   * @param token - Password reset token
   * @param newPassword - New password
   * @param confirmPassword - Password confirmation
   * @param req - Next.js request object for logging
   * @returns Promise resolving to password reset result
   */
  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
    req: NextRequest
  ): Promise<AuthenticationResult> {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        return {
          success: false,
          error: 'Passwords do not match',
        };
      }

      // Validate password strength
      const passwordValidation = passwordService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', '),
        };
      }

      // Validate password reset token
      const tokenValidation = await tokenService.validatePasswordResetToken(token);
      
      if (!tokenValidation.isValid) {
        await securityLogger.logPasswordResetComplete(
          undefined,
          false,
          ipAddress,
          userAgent,
          tokenValidation.userId,
          { 
            reason: tokenValidation.error,
            isExpired: tokenValidation.isExpired,
            isUsed: tokenValidation.isUsed
          }
        );

        let errorMessage = 'Invalid or expired reset token';
        if (tokenValidation.isExpired) {
          errorMessage = 'Password reset token has expired. Please request a new one.';
        } else if (tokenValidation.isUsed) {
          errorMessage = 'Password reset token has already been used. Please request a new one.';
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: tokenValidation.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
        },
      });

      if (!user) {
        await securityLogger.logPasswordResetComplete(
          undefined,
          false,
          ipAddress,
          userAgent,
          tokenValidation.userId,
          { reason: 'user_not_found' }
        );
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Hash new password
      const passwordHash = await passwordService.hashPassword(newPassword);

      // Update password and invalidate reset token
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiry: null,
          // Reset failed login attempts on successful password reset
          failedLoginAttempts: 0,
          accountLockedUntil: null,
        },
      });

      // Invalidate all existing sessions for this user (security measure)
      await this.prisma.authSession.deleteMany({
        where: { userId: user.id },
      });

      // Send password change notification email
      if (emailService) {
        await emailService.sendPasswordChangeNotification(
          user.email,
          ipAddress,
          user.name || undefined
        );
      }

      // Log successful password reset
      await securityLogger.logPasswordResetComplete(
        user.email,
        true,
        ipAddress,
        userAgent,
        user.id,
        { sessionsInvalidated: true, notificationSent: !!emailService }
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      console.error('Password reset completion error:', error);
      await securityLogger.logPasswordResetComplete(
        undefined,
        false,
        ipAddress,
        userAgent,
        undefined,
        { reason: 'internal_error', error: error instanceof Error ? error.message : 'unknown' }
      );
      return {
        success: false,
        error: 'Failed to reset password. Please try again.',
      };
    }
  }

  /**
   * Change password for authenticated user
   * @param userId - User ID
   * @param currentPassword - Current password for verification
   * @param newPassword - New password
   * @param confirmPassword - Password confirmation
   * @param req - Next.js request object for logging
   * @returns Promise resolving to password change result
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
    req: NextRequest
  ): Promise<AuthenticationResult> {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        return {
          success: false,
          error: 'New passwords do not match',
        };
      }

      // Validate new password strength
      const passwordValidation = passwordService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', '),
        };
      }

      // Get user with current password hash
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          passwordHash: true,
        },
      });

      if (!user || !user.passwordHash) {
        await securityLogger.logPasswordChange(
          undefined,
          false,
          ipAddress,
          userAgent,
          userId,
          { reason: 'user_not_found' }
        );
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await passwordService.verifyPassword(
        currentPassword,
        user.passwordHash
      );

      if (!isCurrentPasswordValid) {
        await securityLogger.logPasswordChange(
          user.email,
          false,
          ipAddress,
          userAgent,
          userId,
          { reason: 'invalid_current_password' }
        );
        return {
          success: false,
          error: 'Current password is incorrect',
        };
      }

      // Hash new password
      const newPasswordHash = await passwordService.hashPassword(newPassword);

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          // Reset failed login attempts on successful password change
          failedLoginAttempts: 0,
          accountLockedUntil: null,
        },
      });

      // Invalidate all other sessions except current one (if we had session tracking)
      // For now, we'll invalidate all sessions as a security measure
      await this.prisma.authSession.deleteMany({
        where: { userId: userId },
      });

      // Send password change notification email
      if (emailService) {
        await emailService.sendPasswordChangeNotification(
          user.email,
          ipAddress,
          user.name || undefined
        );
      }

      // Log successful password change
      await securityLogger.logPasswordChange(
        user.email,
        true,
        ipAddress,
        userAgent,
        userId,
        { sessionsInvalidated: true, notificationSent: !!emailService }
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      console.error('Password change error:', error);
      await securityLogger.logPasswordChange(
        undefined,
        false,
        ipAddress,
        userAgent,
        userId,
        { reason: 'internal_error', error: error instanceof Error ? error.message : 'unknown' }
      );
      return {
        success: false,
        error: 'Failed to change password. Please try again.',
      };
    }
  }

  /**
   * Verify email address using verification token
   * @param token - Email verification token
   * @param req - Next.js request object for logging
   * @returns Promise resolving to verification result
   */
  async verifyEmail(token: string, req: NextRequest): Promise<AuthenticationResult> {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      // Validate token format and existence
      const tokenValidation = await tokenService.validateEmailVerificationToken(token);
      
      if (!tokenValidation.isValid) {
        await securityLogger.logEmailVerification(
          undefined,
          false,
          ipAddress,
          userAgent,
          tokenValidation.userId,
          { 
            reason: tokenValidation.error,
            isExpired: tokenValidation.isExpired,
            isUsed: tokenValidation.isUsed
          }
        );

        let errorMessage = 'Invalid verification token';
        if (tokenValidation.isExpired) {
          errorMessage = 'Verification token has expired. Please request a new one.';
        } else if (tokenValidation.isUsed) {
          errorMessage = 'Verification token has already been used or is invalid.';
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: tokenValidation.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
        },
      });

      if (!user) {
        await securityLogger.logEmailVerification(
          undefined,
          false,
          ipAddress,
          userAgent,
          tokenValidation.userId,
          { reason: 'user_not_found' }
        );
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Check if email is already verified
      if (user.emailVerified) {
        await securityLogger.logEmailVerification(
          user.email,
          false,
          ipAddress,
          userAgent,
          user.id,
          { reason: 'already_verified' }
        );
        return {
          success: false,
          error: 'Email address is already verified',
        };
      }

      // Mark email as verified and invalidate token
      const success = await tokenService.invalidateEmailVerificationToken(token);
      
      if (!success) {
        await securityLogger.logEmailVerification(
          user.email,
          false,
          ipAddress,
          userAgent,
          user.id,
          { reason: 'token_invalidation_failed' }
        );
        return {
          success: false,
          error: 'Failed to verify email. Please try again.',
        };
      }

      // Log successful verification
      await securityLogger.logEmailVerification(
        user.email,
        true,
        ipAddress,
        userAgent,
        user.id,
        { verificationMethod: 'token' }
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: new Date(), // Will be set by token invalidation
        },
      };
    } catch (error) {
      console.error('Email verification error:', error);
      await securityLogger.logEmailVerification(
        undefined,
        false,
        ipAddress,
        userAgent,
        undefined,
        { reason: 'internal_error', error: error instanceof Error ? error.message : 'unknown' }
      );
      return {
        success: false,
        error: 'Email verification failed. Please try again.',
      };
    }
  }

  /**
   * Resend email verification token
   * @param email - Email address to send verification to
   * @param req - Next.js request object for rate limiting and logging
   * @returns Promise resolving to resend result
   */
  async resendEmailVerification(email: string, req: NextRequest): Promise<AuthenticationResult> {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      // Apply rate limiting
      const rateLimitResult = await authRateLimiters.emailVerification.checkLimit(req);
      if (!rateLimitResult.success) {
        await securityLogger.logEmailVerificationResend(
          email,
          false,
          ipAddress,
          userAgent,
          undefined,
          { reason: 'rate_limit_exceeded', limit: rateLimitResult.limit }
        );
        return {
          success: false,
          error: 'Too many verification email requests. Please try again later.',
        };
      }

      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
        },
      });

      if (!user) {
        // Don't reveal if email exists or not for security
        await securityLogger.logEmailVerificationResend(
          email,
          false,
          ipAddress,
          userAgent,
          undefined,
          { reason: 'user_not_found' }
        );
        return {
          success: true, // Return success to not reveal email existence
          user: undefined,
        };
      }

      // Check if email is already verified
      if (user.emailVerified) {
        await securityLogger.logEmailVerificationResend(
          email,
          false,
          ipAddress,
          userAgent,
          user.id,
          { reason: 'already_verified' }
        );
        return {
          success: false,
          error: 'Email address is already verified',
        };
      }

      // Generate new verification token
      const tokenResult = await tokenService.generateEmailVerificationToken(user.id);

      // Send verification email
      if (emailService) {
        const emailResult = await emailService.sendVerificationEmail(
          user.email,
          tokenResult.token,
          user.name || undefined
        );

        if (!emailResult.success) {
          console.error('Failed to send verification email:', emailResult.error);
          await securityLogger.logEmailVerificationResend(
            email,
            false,
            ipAddress,
            userAgent,
            user.id,
            { reason: 'email_send_failed', emailError: emailResult.error }
          );
          return {
            success: false,
            error: 'Failed to send verification email. Please try again.',
          };
        }
      }

      // Log successful resend
      await securityLogger.logEmailVerificationResend(
        email,
        true,
        ipAddress,
        userAgent,
        user.id,
        { tokenExpiry: tokenResult.expiresAt.toISOString() }
      );

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      };
    } catch (error) {
      console.error('Resend email verification error:', error);
      await securityLogger.logEmailVerificationResend(
        email,
        false,
        ipAddress,
        userAgent,
        undefined,
        { reason: 'internal_error', error: error instanceof Error ? error.message : 'unknown' }
      );
      return {
        success: false,
        error: 'Failed to resend verification email. Please try again.',
      };
    }
  }

  /**
   * Check if user's email is verified and handle protected feature access
   * @param userId - User ID to check
   * @returns Promise resolving to verification status
   */
  async checkEmailVerificationStatus(userId: string): Promise<{
    isVerified: boolean;
    user?: Partial<User>;
    requiresVerification: boolean;
  }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
        },
      });

      if (!user) {
        return {
          isVerified: false,
          requiresVerification: true,
        };
      }

      const isVerified = !!user.emailVerified;

      return {
        isVerified,
        user,
        requiresVerification: !isVerified,
      };
    } catch (error) {
      console.error('Failed to check email verification status:', error);
      return {
        isVerified: false,
        requiresVerification: true,
      };
    }
  }

  /**
   * Get email verification token status for a user
   * @param userId - User ID to check
   * @returns Promise resolving to token status
   */
  async getEmailVerificationTokenStatus(userId: string): Promise<{
    hasToken: boolean;
    isExpired: boolean;
    expiresAt?: Date;
  } | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          emailVerificationToken: true,
          emailVerificationExpiry: true,
        },
      });

      if (!user || !user.emailVerificationToken) {
        return {
          hasToken: false,
          isExpired: false,
        };
      }

      const isExpired = user.emailVerificationExpiry 
        ? new Date() > user.emailVerificationExpiry 
        : true;

      return {
        hasToken: true,
        isExpired,
        expiresAt: user.emailVerificationExpiry || undefined,
      };
    } catch (error) {
      console.error('Failed to get email verification token status:', error);
      return null;
    }
  }

  /**
   * Clean up expired sessions
   * @returns Promise resolving to number of cleaned sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await this.prisma.authSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }
}

// Export a default instance
export const authenticationService = new AuthenticationService();