import { passwordService, PasswordService } from '../../lib/password-service';

describe('PasswordService Integration', () => {
  describe('default export', () => {
    it('should provide a default passwordService instance', () => {
      expect(passwordService).toBeInstanceOf(PasswordService);
      expect(passwordService.getSaltRounds()).toBe(12);
    });

    it('should be ready to use for authentication flows', async () => {
      const testPassword = 'UserPassword123!';

      // Test complete flow: validation -> hashing -> verification
      const validation = passwordService.validatePasswordStrength(testPassword);
      expect(validation.isValid).toBe(true);

      const hash = await passwordService.hashPassword(testPassword);
      expect(hash).toBeDefined();

      const isValid = await passwordService.verifyPassword(testPassword, hash);
      expect(isValid).toBe(true);

      const isInvalid = await passwordService.verifyPassword('WrongPassword123!', hash);
      expect(isInvalid).toBe(false);
    });

    it('should generate secure tokens for authentication flows', () => {
      const emailVerificationToken = passwordService.generateSecureToken();
      const passwordResetToken = passwordService.generateSecureTokenBase64();

      expect(passwordService.validateTokenFormat(emailVerificationToken)).toBe(true);
      expect(passwordService.validateTokenFormat(passwordResetToken)).toBe(true);
      expect(emailVerificationToken).not.toBe(passwordResetToken);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle user registration scenario', async () => {
      const userPassword = 'MySecurePassword123!';

      // 1. Validate password strength
      const validation = passwordService.validatePasswordStrength(userPassword);
      expect(validation.isValid).toBe(true);
      expect(validation.score).toBeGreaterThan(80);

      // 2. Hash password for storage
      const hashedPassword = await passwordService.hashPassword(userPassword);
      expect(hashedPassword).toMatch(/^\$2[aby]\$12\$/); // bcrypt format with salt rounds 12

      // 3. Generate email verification token
      const verificationToken = passwordService.generateSecureToken();
      expect(verificationToken).toHaveLength(64);
      expect(passwordService.validateTokenFormat(verificationToken)).toBe(true);
    });

    it('should handle user login scenario', async () => {
      const userPassword = 'LoginPassword123!';
      const hashedPassword = await passwordService.hashPassword(userPassword);

      // Simulate login attempt with correct password
      const loginSuccess = await passwordService.verifyPassword(userPassword, hashedPassword);
      expect(loginSuccess).toBe(true);

      // Simulate login attempt with incorrect password
      const loginFailure = await passwordService.verifyPassword('WrongPassword123!', hashedPassword);
      expect(loginFailure).toBe(false);
    });

    it('should handle password reset scenario', async () => {
      const oldPassword = 'OldPassword123!';
      const newPassword = 'NewPassword456!';

      // Hash old password (simulating existing user)
      const oldHash = await passwordService.hashPassword(oldPassword);

      // Generate password reset token
      const resetToken = passwordService.generateSecureTokenBase64();
      expect(passwordService.validateTokenFormat(resetToken)).toBe(true);

      // Validate new password
      const validation = passwordService.validatePasswordStrength(newPassword);
      expect(validation.isValid).toBe(true);

      // Hash new password
      const newHash = await passwordService.hashPassword(newPassword);

      // Verify old password no longer works
      const oldPasswordWorks = await passwordService.verifyPassword(oldPassword, newHash);
      expect(oldPasswordWorks).toBe(false);

      // Verify new password works
      const newPasswordWorks = await passwordService.verifyPassword(newPassword, newHash);
      expect(newPasswordWorks).toBe(true);
    });

    it('should handle weak password rejection', () => {
      const weakPasswords = [
        'password',      // Common password
        '123456',        // Common password
        'short',         // Too short
        'nouppercase1!', // No uppercase
        'NOLOWERCASE1!', // No lowercase
        'NoNumbers!',    // No numbers
        'NoSpecialChars123', // No special characters
      ];

      weakPasswords.forEach(password => {
        const validation = passwordService.validatePasswordStrength(password);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
    });

    it('should provide detailed password feedback for UI', () => {
      const password = 'weak';
      const validation = passwordService.validatePasswordStrength(password);

      expect(validation).toEqual({
        isValid: false,
        errors: expect.arrayContaining([
          'Password must be at least 8 characters long',
          'Password must contain at least one uppercase letter',
          'Password must contain at least one number',
          'Password must contain at least one special character',
        ]),
        score: expect.any(Number),
      });

      expect(validation.score).toBeLessThan(50);
    });

    it('should handle edge cases gracefully', async () => {
      // Empty inputs
      expect(passwordService.validatePasswordStrength('')).toEqual({
        isValid: false,
        errors: ['Password is required'],
        score: 0,
      });

      // Invalid verification attempts
      expect(await passwordService.verifyPassword('', 'hash')).toBe(false);
      expect(await passwordService.verifyPassword('password', '')).toBe(false);
      expect(await passwordService.verifyPassword('password', 'invalid')).toBe(false);

      // Token validation edge cases
      expect(passwordService.validateTokenFormat('')).toBe(false);
      expect(passwordService.validateTokenFormat('short')).toBe(false);
      expect(passwordService.validateTokenFormat('invalid-chars!')).toBe(false);
    });
  });

  describe('security properties', () => {
    it('should use secure salt rounds', () => {
      expect(passwordService.getSaltRounds()).toBeGreaterThanOrEqual(12);
    });

    it('should enforce strong password policy', () => {
      const policy = passwordService.getPasswordPolicy();

      expect(policy.minLength).toBeGreaterThanOrEqual(8);
      expect(policy.requireUppercase).toBe(true);
      expect(policy.requireLowercase).toBe(true);
      expect(policy.requireNumbers).toBe(true);
      expect(policy.requireSpecialChars).toBe(true);
      expect(policy.forbidCommonPasswords).toBe(true);
    });

    it('should generate cryptographically secure tokens', () => {
      const tokens = new Set();
      const iterations = 100;

      // Generate many tokens to test randomness
      for (let i = 0; i < iterations; i++) {
        const token = passwordService.generateSecureToken();
        expect(tokens.has(token)).toBe(false);
        tokens.add(token);
      }

      expect(tokens.size).toBe(iterations);
    });

    it('should protect against timing attacks', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);

      // Multiple verification attempts should have consistent timing
      const timings: number[] = [];
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        await passwordService.verifyPassword('WrongPassword123!', hash);
        const end = process.hrtime.bigint();
        timings.push(Number(end - start));
      }

      // Calculate coefficient of variation (standard deviation / mean)
      const mean = timings.reduce((a, b) => a + b) / timings.length;
      const variance = timings.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / timings.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / mean;

      // Timing should be relatively consistent (low coefficient of variation)
      expect(coefficientOfVariation).toBeLessThan(0.5); // Allow for reasonable variance
    });
  });
});