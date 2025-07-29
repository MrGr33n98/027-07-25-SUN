/**
 * Example usage of PasswordService for authentication flows
 * This file demonstrates how to use the PasswordService in real scenarios
 */

import { passwordService, PasswordService } from './password-service';

// Example 1: User Registration Flow
export async function handleUserRegistration(email: string, password: string, confirmPassword: string) {
  // 1. Basic validation
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }

  // 2. Validate password strength
  const validation = passwordService.validatePasswordStrength(password);
  if (!validation.isValid) {
    throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
  }

  // 3. Hash password for secure storage
  const hashedPassword = await passwordService.hashPassword(password);

  // 4. Generate email verification token
  const emailVerificationToken = passwordService.generateSecureToken();

  // Return data for database storage
  return {
    email,
    passwordHash: hashedPassword,
    emailVerificationToken,
    emailVerified: false,
    createdAt: new Date(),
  };
}

// Example 2: User Login Flow
export async function handleUserLogin(email: string, password: string, storedHash: string) {
  // Verify password against stored hash
  const isValidPassword = await passwordService.verifyPassword(password, storedHash);
  
  if (!isValidPassword) {
    // Generic error message for security (don't reveal if email exists)
    throw new Error('Invalid credentials');
  }

  // Login successful - return success indicator
  return {
    success: true,
    timestamp: new Date(),
  };
}

// Example 3: Password Reset Request
export async function handlePasswordResetRequest(email: string) {
  // Generate secure reset token
  const resetToken = passwordService.generateSecureTokenBase64();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Return data for database storage and email sending
  return {
    resetToken,
    resetTokenExpiry,
    requestedAt: new Date(),
  };
}

// Example 4: Password Reset Completion
export async function handlePasswordResetCompletion(
  resetToken: string,
  newPassword: string,
  storedResetToken: string,
  tokenExpiry: Date
) {
  // 1. Validate token format
  if (!passwordService.validateTokenFormat(resetToken)) {
    throw new Error('Invalid reset token format');
  }

  // 2. Check if token matches and hasn't expired
  if (resetToken !== storedResetToken) {
    throw new Error('Invalid reset token');
  }

  if (new Date() > tokenExpiry) {
    throw new Error('Reset token has expired');
  }

  // 3. Validate new password
  const validation = passwordService.validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
  }

  // 4. Hash new password
  const newPasswordHash = await passwordService.hashPassword(newPassword);

  // Return data for database update
  return {
    passwordHash: newPasswordHash,
    resetToken: null, // Clear the reset token
    resetTokenExpiry: null,
    passwordChangedAt: new Date(),
  };
}

// Example 5: Password Change for Authenticated User
export async function handlePasswordChange(
  userId: string,
  currentPassword: string,
  newPassword: string,
  storedHash: string
) {
  // 1. Verify current password
  const isCurrentPasswordValid = await passwordService.verifyPassword(currentPassword, storedHash);
  if (!isCurrentPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  // 2. Validate new password
  const validation = passwordService.validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    throw new Error(`New password validation failed: ${validation.errors.join(', ')}`);
  }

  // 3. Ensure new password is different from current
  const isSamePassword = await passwordService.verifyPassword(newPassword, storedHash);
  if (isSamePassword) {
    throw new Error('New password must be different from current password');
  }

  // 4. Hash new password
  const newPasswordHash = await passwordService.hashPassword(newPassword);

  // Return data for database update
  return {
    passwordHash: newPasswordHash,
    passwordChangedAt: new Date(),
    // Note: In a real implementation, you would also invalidate all existing sessions
  };
}

// Example 6: Email Verification
export async function handleEmailVerification(
  verificationToken: string,
  storedToken: string,
  tokenCreatedAt: Date
) {
  // 1. Validate token format
  if (!passwordService.validateTokenFormat(verificationToken)) {
    throw new Error('Invalid verification token format');
  }

  // 2. Check if token matches
  if (verificationToken !== storedToken) {
    throw new Error('Invalid verification token');
  }

  // 3. Check if token hasn't expired (24 hours)
  const tokenAge = Date.now() - tokenCreatedAt.getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  if (tokenAge > maxAge) {
    throw new Error('Verification token has expired');
  }

  // Return data for database update
  return {
    emailVerified: true,
    emailVerifiedAt: new Date(),
    emailVerificationToken: null, // Clear the token
  };
}

// Example 7: Custom Password Service Configuration
export function createCustomPasswordService() {
  // Create a service with custom configuration
  const customPolicy = {
    minLength: 10,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    forbidCommonPasswords: true,
  };

  return new PasswordService(14, customPolicy); // Higher salt rounds and custom policy
}

// Example 8: Password Strength Feedback for UI
export function getPasswordStrengthFeedback(password: string) {
  const validation = passwordService.validatePasswordStrength(password);
  
  return {
    isValid: validation.isValid,
    score: validation.score,
    errors: validation.errors,
    strength: getStrengthLabel(validation.score),
    suggestions: generatePasswordSuggestions(validation.errors),
  };
}

function getStrengthLabel(score: number): string {
  if (score >= 90) return 'Very Strong';
  if (score >= 75) return 'Strong';
  if (score >= 50) return 'Medium';
  if (score >= 25) return 'Weak';
  return 'Very Weak';
}

function generatePasswordSuggestions(errors: string[]): string[] {
  const suggestions: string[] = [];
  
  if (errors.some(e => e.includes('8 characters'))) {
    suggestions.push('Use at least 8 characters');
  }
  if (errors.some(e => e.includes('uppercase'))) {
    suggestions.push('Add uppercase letters (A-Z)');
  }
  if (errors.some(e => e.includes('lowercase'))) {
    suggestions.push('Add lowercase letters (a-z)');
  }
  if (errors.some(e => e.includes('number'))) {
    suggestions.push('Add numbers (0-9)');
  }
  if (errors.some(e => e.includes('special character'))) {
    suggestions.push('Add special characters (!@#$%^&*)');
  }
  if (errors.some(e => e.includes('common'))) {
    suggestions.push('Avoid common passwords');
  }
  
  return suggestions;
}

// Example 9: Secure Token Generation for Different Purposes
export function generateAuthTokens() {
  return {
    // For email verification (longer expiry, hex format)
    emailVerification: passwordService.generateSecureToken(32),
    
    // For password reset (shorter expiry, base64url format for URLs)
    passwordReset: passwordService.generateSecureTokenBase64(32),
    
    // For session tokens (high entropy)
    sessionToken: passwordService.generateSecureToken(48),
    
    // For API keys (very high entropy)
    apiKey: passwordService.generateSecureTokenBase64(64),
  };
}

// Example 10: Batch Password Validation (for admin tools)
export async function validateMultiplePasswords(passwords: string[]) {
  const results = [];
  
  for (const password of passwords) {
    const validation = passwordService.validatePasswordStrength(password);
    results.push({
      password: password.substring(0, 3) + '***', // Masked for security
      isValid: validation.isValid,
      score: validation.score,
      errorCount: validation.errors.length,
    });
  }
  
  return results;
}