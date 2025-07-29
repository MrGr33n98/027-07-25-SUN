import { Resend } from 'resend';

// Email service configuration
interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  baseUrl: string;
  rateLimit: {
    maxEmails: number;
    windowMs: number;
  };
}

// Email template types
export enum EmailType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGE_NOTIFICATION = 'password_change_notification',
  SECURITY_ALERT = 'security_alert',
  ACCOUNT_LOCKOUT = 'account_lockout'
}

// Email template data interfaces
interface EmailVerificationData {
  email: string;
  token: string;
  userName?: string;
}

interface PasswordResetData {
  email: string;
  token: string;
  userName?: string;
}

interface PasswordChangeNotificationData {
  email: string;
  userName?: string;
  timestamp: Date;
  ipAddress: string;
}

interface SecurityAlertData {
  email: string;
  userName?: string;
  eventType: string;
  timestamp: Date;
  ipAddress: string;
  details?: string;
}

interface AccountLockoutData {
  email: string;
  userName?: string;
  lockoutDuration: number; // in minutes
  reason: string;
  timestamp: Date;
}

type EmailTemplateData = 
  | EmailVerificationData 
  | PasswordResetData 
  | PasswordChangeNotificationData 
  | SecurityAlertData 
  | AccountLockoutData;

// Rate limiting storage (in production, use Redis)
const emailRateLimit = new Map<string, { count: number; resetTime: number }>();

export class EmailService {
  private resend: Resend;
  private config: EmailConfig;

  constructor(config?: Partial<EmailConfig>) {
    const apiKey = config?.apiKey || process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required for EmailService');
    }

    this.config = {
      apiKey,
      fromEmail: config?.fromEmail || 'SolarConnect <noreply@solarconnect.com>',
      baseUrl: config?.baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3001',
      rateLimit: {
        maxEmails: config?.rateLimit?.maxEmails || 10,
        windowMs: config?.rateLimit?.windowMs || 60 * 60 * 1000, // 1 hour
      }
    };

    this.resend = new Resend(this.config.apiKey);
  }

  /**
   * Check rate limiting for email sending
   */
  private checkRateLimit(email: string): boolean {
    const now = Date.now();
    const key = email.toLowerCase();
    const limit = emailRateLimit.get(key);

    if (!limit || now > limit.resetTime) {
      emailRateLimit.set(key, {
        count: 1,
        resetTime: now + this.config.rateLimit.windowMs
      });
      return true;
    }

    if (limit.count >= this.config.rateLimit.maxEmails) {
      return false;
    }

    limit.count++;
    return true;
  }

  /**
   * Sanitize email content to prevent injection attacks
   */
  private sanitizeContent(content: string): string {
    // Remove potentially dangerous HTML tags and scripts
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * Generate email verification template
   */
  private generateEmailVerificationTemplate(data: EmailVerificationData): { subject: string; html: string; text: string } {
    const verificationUrl = `${this.config.baseUrl}/auth/verify-email?token=${encodeURIComponent(data.token)}`;
    const userName = data.userName || 'User';

    const subject = 'Verify Your SolarConnect Account';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px 0; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
            .security-notice { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to SolarConnect!</h1>
          </div>
          <div class="content">
            <p>Hello ${this.sanitizeContent(userName)},</p>
            <p>Thank you for registering with SolarConnect. To complete your account setup and start exploring our solar marketplace, please verify your email address.</p>
            <p><a href="${verificationUrl}" class="button">Verify Email Address</a></p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><code>${verificationUrl}</code></p>
            <div class="security-notice">
              <strong>Security Notice:</strong> This verification link will expire in 24 hours. If you didn't create an account with SolarConnect, please ignore this email.
            </div>
          </div>
          <div class="footer">
            <p>Best regards,<br>The SolarConnect Team</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </body>
      </html>
    `;

    const text = `
Welcome to SolarConnect!

Hello ${userName},

Thank you for registering with SolarConnect. To complete your account setup and start exploring our solar marketplace, please verify your email address.

Verification Link: ${verificationUrl}

Security Notice: This verification link will expire in 24 hours. If you didn't create an account with SolarConnect, please ignore this email.

Best regards,
The SolarConnect Team

This is an automated message. Please do not reply to this email.
    `.trim();

    return { subject, html, text };
  }  /**
 
  * Generate password reset template
   */
  private generatePasswordResetTemplate(data: PasswordResetData): { subject: string; html: string; text: string } {
    const resetUrl = `${this.config.baseUrl}/auth/reset-password?token=${encodeURIComponent(data.token)}`;
    const userName = data.userName || 'User';

    const subject = 'Reset Your SolarConnect Password';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px 0; }
            .button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
            .security-notice { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${this.sanitizeContent(userName)},</p>
            <p>We received a request to reset your SolarConnect account password. If you made this request, click the button below to set a new password:</p>
            <p><a href="${resetUrl}" class="button">Reset Password</a></p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><code>${resetUrl}</code></p>
            <div class="security-notice">
              <strong>Security Notice:</strong> This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>Best regards,<br>The SolarConnect Team</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Reset Request

Hello ${userName},

We received a request to reset your SolarConnect account password. If you made this request, use the link below to set a new password:

Reset Link: ${resetUrl}

Security Notice: This password reset link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
The SolarConnect Team

This is an automated message. Please do not reply to this email.
    `.trim();

    return { subject, html, text };
  }

  /**
   * Generate password change notification template
   */
  private generatePasswordChangeNotificationTemplate(data: PasswordChangeNotificationData): { subject: string; html: string; text: string } {
    const userName = data.userName || 'User';
    const timestamp = data.timestamp.toLocaleString();

    const subject = 'SolarConnect Password Changed';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px 0; }
            .info-box { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
            .security-notice { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Password Changed Successfully</h1>
          </div>
          <div class="content">
            <p>Hello ${this.sanitizeContent(userName)},</p>
            <p>This email confirms that your SolarConnect account password was successfully changed.</p>
            <div class="info-box">
              <strong>Change Details:</strong><br>
              Time: ${timestamp}<br>
              IP Address: ${this.sanitizeContent(data.ipAddress)}
            </div>
            <div class="security-notice">
              <strong>Security Notice:</strong> If you didn't make this change, please contact our support team immediately and consider changing your password again.
            </div>
          </div>
          <div class="footer">
            <p>Best regards,<br>The SolarConnect Team</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Changed Successfully

Hello ${userName},

This email confirms that your SolarConnect account password was successfully changed.

Change Details:
Time: ${timestamp}
IP Address: ${data.ipAddress}

Security Notice: If you didn't make this change, please contact our support team immediately and consider changing your password again.

Best regards,
The SolarConnect Team

This is an automated message. Please do not reply to this email.
    `.trim();

    return { subject, html, text };
  }

  /**
   * Generate security alert template
   */
  private generateSecurityAlertTemplate(data: SecurityAlertData): { subject: string; html: string; text: string } {
    const userName = data.userName || 'User';
    const timestamp = data.timestamp.toLocaleString();

    const subject = 'SolarConnect Security Alert';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8d7da; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px 0; }
            .alert-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⚠️ Security Alert</h1>
          </div>
          <div class="content">
            <p>Hello ${this.sanitizeContent(userName)},</p>
            <p>We detected suspicious activity on your SolarConnect account and wanted to notify you immediately.</p>
            <div class="alert-box">
              <strong>Alert Details:</strong><br>
              Event: ${this.sanitizeContent(data.eventType)}<br>
              Time: ${timestamp}<br>
              IP Address: ${this.sanitizeContent(data.ipAddress)}<br>
              ${data.details ? `Details: ${this.sanitizeContent(data.details)}` : ''}
            </div>
            <p><strong>What should you do?</strong></p>
            <ul>
              <li>If this was you, no action is needed</li>
              <li>If this wasn't you, please change your password immediately</li>
              <li>Consider enabling additional security measures</li>
              <li>Contact our support team if you have concerns</li>
            </ul>
          </div>
          <div class="footer">
            <p>Best regards,<br>The SolarConnect Security Team</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </body>
      </html>
    `;

    const text = `
⚠️ Security Alert

Hello ${userName},

We detected suspicious activity on your SolarConnect account and wanted to notify you immediately.

Alert Details:
Event: ${data.eventType}
Time: ${timestamp}
IP Address: ${data.ipAddress}
${data.details ? `Details: ${data.details}` : ''}

What should you do?
- If this was you, no action is needed
- If this wasn't you, please change your password immediately
- Consider enabling additional security measures
- Contact our support team if you have concerns

Best regards,
The SolarConnect Security Team

This is an automated message. Please do not reply to this email.
    `.trim();

    return { subject, html, text };
  }

  /**
   * Generate account lockout template
   */
  private generateAccountLockoutTemplate(data: AccountLockoutData): { subject: string; html: string; text: string } {
    const userName = data.userName || 'User';
    const timestamp = data.timestamp.toLocaleString();

    const subject = 'SolarConnect Account Temporarily Locked';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #fff3cd; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px 0; }
            .warning-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔒 Account Temporarily Locked</h1>
          </div>
          <div class="content">
            <p>Hello ${this.sanitizeContent(userName)},</p>
            <p>Your SolarConnect account has been temporarily locked for security reasons.</p>
            <div class="warning-box">
              <strong>Lockout Details:</strong><br>
              Reason: ${this.sanitizeContent(data.reason)}<br>
              Time: ${timestamp}<br>
              Duration: ${data.lockoutDuration} minutes
            </div>
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Your account will be automatically unlocked after ${data.lockoutDuration} minutes</li>
              <li>You can then try logging in again</li>
              <li>If you continue to have issues, please contact our support team</li>
            </ul>
            <p>This security measure helps protect your account from unauthorized access attempts.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The SolarConnect Security Team</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </body>
      </html>
    `;

    const text = `
🔒 Account Temporarily Locked

Hello ${userName},

Your SolarConnect account has been temporarily locked for security reasons.

Lockout Details:
Reason: ${data.reason}
Time: ${timestamp}
Duration: ${data.lockoutDuration} minutes

What happens next?
- Your account will be automatically unlocked after ${data.lockoutDuration} minutes
- You can then try logging in again
- If you continue to have issues, please contact our support team

This security measure helps protect your account from unauthorized access attempts.

Best regards,
The SolarConnect Security Team

This is an automated message. Please do not reply to this email.
    `.trim();

    return { subject, html, text };
  } 
 /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, token: string, userName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check rate limiting
      if (!this.checkRateLimit(email)) {
        return { success: false, error: 'Rate limit exceeded. Please try again later.' };
      }

      const data: EmailVerificationData = { email, token, userName };
      const template = this.generateEmailVerificationTemplate(data);

      const result = await this.resend.emails.send({
        from: this.config.fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string, userName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check rate limiting
      if (!this.checkRateLimit(email)) {
        return { success: false, error: 'Rate limit exceeded. Please try again later.' };
      }

      const data: PasswordResetData = { email, token, userName };
      const template = this.generatePasswordResetTemplate(data);

      const result = await this.resend.emails.send({
        from: this.config.fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  /**
   * Send password change notification email
   */
  async sendPasswordChangeNotification(
    email: string, 
    ipAddress: string, 
    userName?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check rate limiting
      if (!this.checkRateLimit(email)) {
        return { success: false, error: 'Rate limit exceeded. Please try again later.' };
      }

      const data: PasswordChangeNotificationData = { 
        email, 
        userName, 
        timestamp: new Date(), 
        ipAddress 
      };
      const template = this.generatePasswordChangeNotificationTemplate(data);

      const result = await this.resend.emails.send({
        from: this.config.fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to send password change notification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlert(
    email: string,
    eventType: string,
    ipAddress: string,
    userName?: string,
    details?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check rate limiting
      if (!this.checkRateLimit(email)) {
        return { success: false, error: 'Rate limit exceeded. Please try again later.' };
      }

      const data: SecurityAlertData = { 
        email, 
        userName, 
        eventType, 
        timestamp: new Date(), 
        ipAddress,
        details
      };
      const template = this.generateSecurityAlertTemplate(data);

      const result = await this.resend.emails.send({
        from: this.config.fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to send security alert:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  /**
   * Send account lockout notification email
   */
  async sendAccountLockoutNotification(
    email: string,
    reason: string,
    lockoutDuration: number,
    userName?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check rate limiting
      if (!this.checkRateLimit(email)) {
        return { success: false, error: 'Rate limit exceeded. Please try again later.' };
      }

      const data: AccountLockoutData = { 
        email, 
        userName, 
        lockoutDuration, 
        reason, 
        timestamp: new Date()
      };
      const template = this.generateAccountLockoutTemplate(data);

      const result = await this.resend.emails.send({
        from: this.config.fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to send account lockout notification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  /**
   * Clean up expired rate limit entries
   */
  cleanupRateLimit(): void {
    const now = Date.now();
    for (const [email, limit] of emailRateLimit.entries()) {
      if (now > limit.resetTime) {
        emailRateLimit.delete(email);
      }
    }
  }

  /**
   * Clear all rate limit entries (for testing)
   */
  clearRateLimit(): void {
    emailRateLimit.clear();
  }

  /**
   * Get rate limit status for an email
   */
  getRateLimitStatus(email: string): { remaining: number; resetTime: number } {
    const key = email.toLowerCase();
    const limit = emailRateLimit.get(key);
    
    if (!limit || Date.now() > limit.resetTime) {
      return { 
        remaining: this.config.rateLimit.maxEmails, 
        resetTime: Date.now() + this.config.rateLimit.windowMs 
      };
    }

    return { 
      remaining: Math.max(0, this.config.rateLimit.maxEmails - limit.count), 
      resetTime: limit.resetTime 
    };
  }
}

// Export a factory function for creating instances
export const createEmailService = (config?: Partial<EmailConfig>) => new EmailService(config);

// Export a default instance only if API key is available
export const emailService = process.env.RESEND_API_KEY ? new EmailService() : null;