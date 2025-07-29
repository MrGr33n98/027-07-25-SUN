/**
 * Example usage of TokenService for authentication flows
 * This file demonstrates how to use the TokenService in real scenarios
 */

import { tokenService, TokenService, TokenType } from './token-service';
import { passwordService } from './password-service';

// Example 1: Email Verification Flow
export async function handleEmailVerificationFlow(userId: string, email: string) {
  try {
    // Generate email verification token
    const tokenResult = await tokenService.generateEmailVerificationToken(userId);
    
    console.log('Generated email verification token:', {
      token: tokenResult.token.substring(0, 8) + '...', // Masked for security
      expiresAt: tokenResult.expiresAt,
      userId: tokenResult.userId,
    });

    // In a real application, you would send this token via email
    const verificationUrl = `https://yourapp.com/verify-email?token=${tokenResult.token}`;
    
    // Simulate email sending (replace with actual email service)
    console.log(`Sending verification email to ${email} with URL: ${verificationUrl}`);
    
    return {
      success: true,
      message: 'Verification email sent successfully',
      expiresAt: tokenResult.expiresAt,
    };
  } catch (error) {
    console.error('Failed to generate email verification token:', error);
    return {
      success: false,
      message: 'Failed to send verification email',
    };
  }
}

// Example 2: Email Verification Completion
export async function handleEmailVerificationCompletion(token: string) {
  try {
    // Validate the token
    const validationResult = await tokenService.validateEmailVerificationToken(token);
    
    if (!validationResult.isValid) {
      if (validationResult.isExpired) {
        return {
          success: false,
          message: 'Verification link has expired. Please request a new one.',
          code: 'TOKEN_EXPIRED',
        };
      }
      
      if (validationResult.isUsed) {
        return {
          success: false,
          message: 'This verification link has already been used or is invalid.',
          code: 'TOKEN_USED',
        };
      }
      
      return {
        success: false,
        message: 'Invalid verification link.',
        code: 'TOKEN_INVALID',
      };
    }

    // Token is valid, invalidate it and mark email as verified
    const invalidateSuccess = await tokenService.invalidateEmailVerificationToken(token);
    
    if (!invalidateSuccess) {
      return {
        success: false,
        message: 'Failed to complete email verification.',
        code: 'INVALIDATION_FAILED',
      };
    }

    return {
      success: true,
      message: 'Email verified successfully!',
      userId: validationResult.userId,
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      success: false,
      message: 'An error occurred during email verification.',
      code: 'VERIFICATION_ERROR',
    };
  }
}

// Example 3: Password Reset Request Flow
export async function handlePasswordResetRequest(userId: string, email: string) {
  try {
    // Generate password reset token
    const tokenResult = await tokenService.generatePasswordResetToken(userId);
    
    console.log('Generated password reset token:', {
      token: tokenResult.token.substring(0, 8) + '...', // Masked for security
      expiresAt: tokenResult.expiresAt,
      userId: tokenResult.userId,
    });

    // In a real application, you would send this token via email
    const resetUrl = `https://yourapp.com/reset-password?token=${tokenResult.token}`;
    
    // Simulate email sending (replace with actual email service)
    console.log(`Sending password reset email to ${email} with URL: ${resetUrl}`);
    
    return {
      success: true,
      message: 'Password reset email sent successfully',
      expiresAt: tokenResult.expiresAt,
    };
  } catch (error) {
    console.error('Failed to generate password reset token:', error);
    return {
      success: false,
      message: 'Failed to send password reset email',
    };
  }
}

// Example 4: Password Reset Completion
export async function handlePasswordResetCompletion(
  token: string,
  newPassword: string,
  confirmPassword: string
) {
  try {
    // Basic validation
    if (newPassword !== confirmPassword) {
      return {
        success: false,
        message: 'Passwords do not match',
        code: 'PASSWORD_MISMATCH',
      };
    }

    // Validate password strength
    const passwordValidation = passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        message: `Password validation failed: ${passwordValidation.errors.join(', ')}`,
        code: 'PASSWORD_WEAK',
        errors: passwordValidation.errors,
      };
    }

    // Validate the reset token
    const validationResult = await tokenService.validatePasswordResetToken(token);
    
    if (!validationResult.isValid) {
      if (validationResult.isExpired) {
        return {
          success: false,
          message: 'Password reset link has expired. Please request a new one.',
          code: 'TOKEN_EXPIRED',
        };
      }
      
      if (validationResult.isUsed) {
        return {
          success: false,
          message: 'This password reset link has already been used or is invalid.',
          code: 'TOKEN_USED',
        };
      }
      
      return {
        success: false,
        message: 'Invalid password reset link.',
        code: 'TOKEN_INVALID',
      };
    }

    // Hash the new password
    const hashedPassword = await passwordService.hashPassword(newPassword);

    // Invalidate the reset token
    const invalidateSuccess = await tokenService.invalidatePasswordResetToken(token);
    
    if (!invalidateSuccess) {
      return {
        success: false,
        message: 'Failed to complete password reset.',
        code: 'INVALIDATION_FAILED',
      };
    }

    return {
      success: true,
      message: 'Password reset successfully!',
      userId: validationResult.userId,
      hashedPassword, // Use this to update the user's password in the database
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      message: 'An error occurred during password reset.',
      code: 'RESET_ERROR',
    };
  }
}

// Example 5: Token Cleanup Maintenance Task
export async function runTokenCleanupMaintenance() {
  try {
    console.log('Starting token cleanup maintenance...');
    
    const cleanedCount = await tokenService.cleanupExpiredTokens();
    
    console.log(`Token cleanup completed. Cleaned up ${cleanedCount} expired tokens.`);
    
    return {
      success: true,
      cleanedCount,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Token cleanup failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

// Example 6: Resend Email Verification
export async function handleResendEmailVerification(userId: string, email: string) {
  try {
    // This will automatically invalidate any existing email verification token
    const tokenResult = await tokenService.generateEmailVerificationToken(userId);
    
    const verificationUrl = `https://yourapp.com/verify-email?token=${tokenResult.token}`;
    
    // Simulate email sending
    console.log(`Resending verification email to ${email} with URL: ${verificationUrl}`);
    
    return {
      success: true,
      message: 'Verification email resent successfully',
      expiresAt: tokenResult.expiresAt,
    };
  } catch (error) {
    console.error('Failed to resend verification email:', error);
    return {
      success: false,
      message: 'Failed to resend verification email',
    };
  }
}

// Example 7: Check Token Status (for UI feedback)
export async function checkTokenStatus(token: string, type: 'email' | 'password') {
  try {
    let validationResult;
    
    if (type === 'email') {
      validationResult = await tokenService.validateEmailVerificationToken(token);
    } else {
      validationResult = await tokenService.validatePasswordResetToken(token);
    }
    
    return {
      isValid: validationResult.isValid,
      isExpired: validationResult.isExpired,
      isUsed: validationResult.isUsed,
      userId: validationResult.userId,
      error: validationResult.error,
    };
  } catch (error) {
    return {
      isValid: false,
      isExpired: false,
      isUsed: false,
      error: 'Failed to check token status',
    };
  }
}

// Example 8: Custom Token Service with Different Configuration
export function createCustomTokenService() {
  // You can create a custom token service instance if needed
  // For example, for testing or different environments
  
  const customTokenService = new TokenService();
  
  // Get configuration for different token types
  const emailConfig = customTokenService.getTokenConfig(TokenType.EMAIL_VERIFICATION);
  const resetConfig = customTokenService.getTokenConfig(TokenType.PASSWORD_RESET);
  
  console.log('Email verification token config:', emailConfig);
  console.log('Password reset token config:', resetConfig);
  
  return customTokenService;
}

// Example 9: Batch Token Operations (for admin tools)
export async function handleBatchTokenOperations(userIds: string[]) {
  const results = [];
  
  for (const userId of userIds) {
    try {
      // Generate both types of tokens for each user
      const emailToken = await tokenService.generateEmailVerificationToken(userId);
      const resetToken = await tokenService.generatePasswordResetToken(userId);
      
      results.push({
        userId,
        success: true,
        emailToken: emailToken.token.substring(0, 8) + '...', // Masked
        resetToken: resetToken.token.substring(0, 8) + '...', // Masked
        emailExpiresAt: emailToken.expiresAt,
        resetExpiresAt: resetToken.expiresAt,
      });
    } catch (error) {
      results.push({
        userId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return results;
}

// Example 10: Token Expiry Checking Utility
export function getTokenExpiryInfo(expiryDate: Date) {
  const now = new Date();
  const isExpired = tokenService.isTokenExpired(expiryDate);
  const timeUntilExpiry = expiryDate.getTime() - now.getTime();
  
  if (isExpired) {
    const expiredAgo = now.getTime() - expiryDate.getTime();
    return {
      isExpired: true,
      expiredAgo: Math.floor(expiredAgo / 1000), // seconds
      expiredAgoHuman: formatDuration(expiredAgo),
    };
  }
  
  return {
    isExpired: false,
    timeUntilExpiry: Math.floor(timeUntilExpiry / 1000), // seconds
    timeUntilExpiryHuman: formatDuration(timeUntilExpiry),
  };
}

// Helper function to format duration in human-readable format
function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
}

// Example usage in an Express.js route handler
export function createExpressRouteHandlers() {
  return {
    // POST /api/auth/verify-email
    verifyEmail: async (req: any, res: any) => {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required',
        });
      }
      
      const result = await handleEmailVerificationCompletion(token);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        const statusCode = result.code === 'TOKEN_EXPIRED' ? 410 : 400;
        return res.status(statusCode).json(result);
      }
    },
    
    // POST /api/auth/reset-password
    resetPassword: async (req: any, res: any) => {
      const { token, newPassword, confirmPassword } = req.body;
      
      if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token, new password, and confirm password are required',
        });
      }
      
      const result = await handlePasswordResetCompletion(token, newPassword, confirmPassword);
      
      if (result.success) {
        // In a real application, you would update the user's password here
        // using result.hashedPassword and result.userId
        return res.status(200).json({
          success: true,
          message: result.message,
        });
      } else {
        const statusCode = result.code === 'TOKEN_EXPIRED' ? 410 : 400;
        return res.status(statusCode).json(result);
      }
    },
  };
}