import { EmailService, EmailType } from '../../lib/email-service';
import { Resend } from 'resend';

// Mock Resend
jest.mock('resend');
const MockedResend = Resend as jest.MockedClass<typeof Resend>;

describe('EmailService', () => {
  let emailService: EmailService;
  let mockResendInstance: jest.Mocked<Resend>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Resend instance
    mockResendInstance = {
      emails: {
        send: jest.fn(),
      },
    } as any;
    
    MockedResend.mockImplementation(() => mockResendInstance);

    // Create EmailService instance with test configuration
    emailService = new EmailService({
      apiKey: 'test-api-key',
      fromEmail: 'test@solarconnect.com',
      baseUrl: 'http://localhost:3001',
      rateLimit: {
        maxEmails: 5,
        windowMs: 60000, // 1 minute for testing
      }
    });
  });

  afterEach(() => {
    // Clear all rate limits for testing
    emailService.clearRateLimit();
  });

  describe('constructor', () => {
    it('should throw error if no API key is provided', () => {
      delete process.env.RESEND_API_KEY;
      expect(() => new EmailService()).toThrow('RESEND_API_KEY is required for EmailService');
    });

    it('should use environment variables when no config provided', () => {
      process.env.RESEND_API_KEY = 'env-api-key';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      
      const service = new EmailService();
      expect(MockedResend).toHaveBeenCalledWith('env-api-key');
    });

    it('should use provided config over environment variables', () => {
      process.env.RESEND_API_KEY = 'env-api-key';
      
      const service = new EmailService({
        apiKey: 'custom-api-key',
        fromEmail: 'custom@test.com',
        baseUrl: 'http://custom.com'
      });
      
      expect(MockedResend).toHaveBeenCalledWith('custom-api-key');
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      const result = await emailService.sendVerificationEmail('test@example.com', 'test-token', 'John Doe');

      expect(result.success).toBe(true);
      expect(mockResendInstance.emails.send).toHaveBeenCalledWith({
        from: 'test@solarconnect.com',
        to: 'test@example.com',
        subject: 'Verify Your SolarConnect Account',
        html: expect.stringContaining('Hello John Doe'),
        text: expect.stringContaining('Hello John Doe'),
      });
    });

    it('should include verification URL in email content', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendVerificationEmail('test@example.com', 'test-token');

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).toContain('http://localhost:3001/auth/verify-email?token=test-token');
      expect(call.text).toContain('http://localhost:3001/auth/verify-email?token=test-token');
    });

    it('should handle Resend API errors', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ 
        error: { message: 'API Error' } 
      } as any);

      const result = await emailService.sendVerificationEmail('test@example.com', 'test-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should handle network errors', async () => {
      mockResendInstance.emails.send.mockRejectedValue(new Error('Network error'));

      const result = await emailService.sendVerificationEmail('test@example.com', 'test-token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should respect rate limiting', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      // Send emails up to the limit
      for (let i = 0; i < 5; i++) {
        const result = await emailService.sendVerificationEmail('test@example.com', `token-${i}`);
        expect(result.success).toBe(true);
      }

      // Next email should be rate limited
      const result = await emailService.sendVerificationEmail('test@example.com', 'token-6');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded. Please try again later.');
    });

    it('should sanitize user input in email content', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendVerificationEmail('test@example.com', 'test-token', '<script>alert("xss")</script>John');

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).not.toContain('<script>');
      expect(call.html).toContain('John');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      const result = await emailService.sendPasswordResetEmail('test@example.com', 'reset-token', 'Jane Doe');

      expect(result.success).toBe(true);
      expect(mockResendInstance.emails.send).toHaveBeenCalledWith({
        from: 'test@solarconnect.com',
        to: 'test@example.com',
        subject: 'Reset Your SolarConnect Password',
        html: expect.stringContaining('Hello Jane Doe'),
        text: expect.stringContaining('Hello Jane Doe'),
      });
    });

    it('should include reset URL in email content', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendPasswordResetEmail('test@example.com', 'reset-token');

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).toContain('http://localhost:3001/auth/reset-password?token=reset-token');
      expect(call.text).toContain('http://localhost:3001/auth/reset-password?token=reset-token');
    });

    it('should include security notice about expiry', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendPasswordResetEmail('test@example.com', 'reset-token');

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).toContain('expire in 1 hour');
      expect(call.text).toContain('expire in 1 hour');
    });
  });

  describe('sendPasswordChangeNotification', () => {
    it('should send password change notification successfully', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      const result = await emailService.sendPasswordChangeNotification(
        'test@example.com', 
        '192.168.1.1', 
        'John Doe'
      );

      expect(result.success).toBe(true);
      expect(mockResendInstance.emails.send).toHaveBeenCalledWith({
        from: 'test@solarconnect.com',
        to: 'test@example.com',
        subject: 'SolarConnect Password Changed',
        html: expect.stringContaining('Hello John Doe'),
        text: expect.stringContaining('Hello John Doe'),
      });
    });

    it('should include IP address and timestamp in notification', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendPasswordChangeNotification('test@example.com', '192.168.1.1');

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).toContain('192.168.1.1');
      expect(call.text).toContain('192.168.1.1');
      expect(call.html).toContain('Time:');
      expect(call.text).toContain('Time:');
    });

    it('should sanitize IP address input', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendPasswordChangeNotification(
        'test@example.com', 
        '<script>alert("xss")</script>192.168.1.1'
      );

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).not.toContain('<script>');
      expect(call.html).toContain('192.168.1.1');
    });
  });

  describe('sendSecurityAlert', () => {
    it('should send security alert successfully', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      const result = await emailService.sendSecurityAlert(
        'test@example.com',
        'Suspicious Login',
        '192.168.1.1',
        'John Doe',
        'Multiple failed attempts'
      );

      expect(result.success).toBe(true);
      expect(mockResendInstance.emails.send).toHaveBeenCalledWith({
        from: 'test@solarconnect.com',
        to: 'test@example.com',
        subject: 'SolarConnect Security Alert',
        html: expect.stringContaining('Hello John Doe'),
        text: expect.stringContaining('Hello John Doe'),
      });
    });

    it('should include event details in alert', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendSecurityAlert(
        'test@example.com',
        'Suspicious Login',
        '192.168.1.1',
        'John Doe',
        'Multiple failed attempts'
      );

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).toContain('Suspicious Login');
      expect(call.html).toContain('192.168.1.1');
      expect(call.html).toContain('Multiple failed attempts');
      expect(call.text).toContain('Suspicious Login');
      expect(call.text).toContain('192.168.1.1');
      expect(call.text).toContain('Multiple failed attempts');
    });

    it('should work without optional details', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      const result = await emailService.sendSecurityAlert(
        'test@example.com',
        'Suspicious Login',
        '192.168.1.1'
      );

      expect(result.success).toBe(true);
      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).toContain('Suspicious Login');
    });
  });

  describe('sendAccountLockoutNotification', () => {
    it('should send account lockout notification successfully', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      const result = await emailService.sendAccountLockoutNotification(
        'test@example.com',
        'Too many failed login attempts',
        30,
        'John Doe'
      );

      expect(result.success).toBe(true);
      expect(mockResendInstance.emails.send).toHaveBeenCalledWith({
        from: 'test@solarconnect.com',
        to: 'test@example.com',
        subject: 'SolarConnect Account Temporarily Locked',
        html: expect.stringContaining('Hello John Doe'),
        text: expect.stringContaining('Hello John Doe'),
      });
    });

    it('should include lockout details in notification', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendAccountLockoutNotification(
        'test@example.com',
        'Too many failed login attempts',
        30
      );

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).toContain('Too many failed login attempts');
      expect(call.html).toContain('30 minutes');
      expect(call.text).toContain('Too many failed login attempts');
      expect(call.text).toContain('30 minutes');
    });
  });

  describe('rate limiting', () => {
    it('should track rate limits per email address', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      // Send emails to different addresses
      await emailService.sendVerificationEmail('user1@example.com', 'token1');
      await emailService.sendVerificationEmail('user2@example.com', 'token2');

      // Both should succeed
      expect(mockResendInstance.emails.send).toHaveBeenCalledTimes(2);

      // Check rate limit status
      const status1 = emailService.getRateLimitStatus('user1@example.com');
      const status2 = emailService.getRateLimitStatus('user2@example.com');

      expect(status1.remaining).toBe(4); // 5 - 1 = 4
      expect(status2.remaining).toBe(4); // 5 - 1 = 4
    });

    it('should be case insensitive for email addresses', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      // Send emails with different cases
      await emailService.sendVerificationEmail('User@Example.com', 'token1');
      await emailService.sendVerificationEmail('user@example.com', 'token2');

      // Check rate limit status (should be combined)
      const status = emailService.getRateLimitStatus('USER@EXAMPLE.COM');
      expect(status.remaining).toBe(3); // 5 - 2 = 3
    });

    it('should clean up expired rate limit entries', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      // Send an email
      await emailService.sendVerificationEmail('test@example.com', 'token');

      // Check initial status
      let status = emailService.getRateLimitStatus('test@example.com');
      expect(status.remaining).toBe(4);

      // Clean up (should not affect non-expired entries)
      emailService.cleanupRateLimit();
      status = emailService.getRateLimitStatus('test@example.com');
      expect(status.remaining).toBe(4);
    });
  });

  describe('content sanitization', () => {
    it('should remove script tags from user input', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendVerificationEmail(
        'test@example.com', 
        'token', 
        '<script>alert("xss")</script>John<script>alert("xss2")</script>'
      );

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).not.toContain('<script>');
      expect(call.html).not.toContain('alert');
      expect(call.html).toContain('John');
    });

    it('should remove iframe tags from user input', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendSecurityAlert(
        'test@example.com',
        '<iframe src="evil.com"></iframe>Suspicious Activity',
        '192.168.1.1'
      );

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).not.toContain('<iframe>');
      expect(call.html).not.toContain('evil.com');
      expect(call.html).toContain('Suspicious Activity');
    });

    it('should remove javascript: URLs from user input', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendPasswordChangeNotification(
        'test@example.com',
        'javascript:alert("xss")192.168.1.1'
      );

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).not.toContain('javascript:');
      expect(call.html).toContain('192.168.1.1');
    });

    it('should remove event handlers from user input', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendVerificationEmail(
        'test@example.com', 
        'token', 
        'John onclick="alert(\'xss\')" Doe'
      );

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).not.toContain('onclick=');
      expect(call.html).toContain('John');
      expect(call.html).toContain('Doe');
    });
  });

  describe('email template content', () => {
    it('should include proper security notices in verification emails', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendVerificationEmail('test@example.com', 'token');

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).toContain('expire in 24 hours');
      expect(call.html).toContain('Security Notice');
      expect(call.text).toContain('expire in 24 hours');
      expect(call.text).toContain('Security Notice');
    });

    it('should include proper branding and styling', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendVerificationEmail('test@example.com', 'token');

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.html).toContain('SolarConnect');
      expect(call.html).toContain('font-family: Arial');
      expect(call.html).toContain('<!DOCTYPE html>');
    });

    it('should include fallback text versions', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: { id: 'test-id' } } as any);

      await emailService.sendVerificationEmail('test@example.com', 'token', 'John');

      const call = mockResendInstance.emails.send.mock.calls[0][0];
      expect(call.text).toContain('Hello John');
      expect(call.text).toContain('SolarConnect');
      expect(call.text).not.toContain('<');
      expect(call.text).not.toContain('>');
    });
  });
});