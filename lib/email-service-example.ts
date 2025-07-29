/**
 * Example usage of the EmailService for authentication communications
 * This file demonstrates how to integrate the EmailService with authentication flows
 */

import { EmailService, createEmailService } from './email-service';

// Example: Using the email service in an authentication flow
export class AuthenticationEmailHandler {
  private emailService: EmailService;

  constructor() {
    // Create email service instance with custom configuration if needed
    this.emailService = createEmailService({
      fromEmail: 'SolarConnect Security <security@solarconnect.com>',
      rateLimit: {
        maxEmails: 10, // Allow 10 emails per hour per user
        windowMs: 60 * 60 * 1000, // 1 hour window
      }
    });
  }

  /**
   * Send welcome email with verification link after user registration
   */
  async sendWelcomeVerification(userEmail: string, verificationToken: string, userName?: string) {
    try {
      const result = await this.emailService.sendVerificationEmail(
        userEmail, 
        verificationToken, 
        userName
      );

      if (!result.success) {
        console.error('Failed to send welcome verification email:', result.error);
        // In production, you might want to queue this for retry
        return false;
      }

      console.log('Welcome verification email sent successfully to:', userEmail);
      return true;
    } catch (error) {
      console.error('Error sending welcome verification email:', error);
      return false;
    }
  }

  /**
   * Handle password reset request
   */
  async handlePasswordResetRequest(userEmail: string, resetToken: string, userName?: string) {
    try {
      // Check rate limiting before processing
      const rateLimitStatus = this.emailService.getRateLimitStatus(userEmail);
      if (rateLimitStatus.remaining <= 0) {
        const waitTime = Math.ceil((rateLimitStatus.resetTime - Date.now()) / 1000 / 60);
        throw new Error(`Rate limit exceeded. Please wait ${waitTime} minutes before requesting another password reset.`);
      }

      const result = await this.emailService.sendPasswordResetEmail(
        userEmail, 
        resetToken, 
        userName
      );

      if (!result.success) {
        console.error('Failed to send password reset email:', result.error);
        return { success: false, error: result.error };
      }

      console.log('Password reset email sent successfully to:', userEmail);
      return { success: true };
    } catch (error) {
      console.error('Error handling password reset request:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send password reset email' 
      };
    }
  }

  /**
   * Notify user of successful password change
   */
  async notifyPasswordChange(userEmail: string, ipAddress: string, userName?: string) {
    try {
      const result = await this.emailService.sendPasswordChangeNotification(
        userEmail, 
        ipAddress, 
        userName
      );

      if (!result.success) {
        console.error('Failed to send password change notification:', result.error);
        // This is a notification, so we don't fail the password change operation
        return false;
      }

      console.log('Password change notification sent successfully to:', userEmail);
      return true;
    } catch (error) {
      console.error('Error sending password change notification:', error);
      return false;
    }
  }

  /**
   * Send security alert for suspicious activity
   */
  async sendSuspiciousActivityAlert(
    userEmail: string, 
    eventType: string, 
    ipAddress: string, 
    userName?: string,
    details?: string
  ) {
    try {
      const result = await this.emailService.sendSecurityAlert(
        userEmail,
        eventType,
        ipAddress,
        userName,
        details
      );

      if (!result.success) {
        console.error('Failed to send security alert:', result.error);
        return false;
      }

      console.log('Security alert sent successfully to:', userEmail);
      return true;
    } catch (error) {
      console.error('Error sending security alert:', error);
      return false;
    }
  }

  /**
   * Notify user of account lockout
   */
  async notifyAccountLockout(
    userEmail: string, 
    reason: string, 
    lockoutDurationMinutes: number, 
    userName?: string
  ) {
    try {
      const result = await this.emailService.sendAccountLockoutNotification(
        userEmail,
        reason,
        lockoutDurationMinutes,
        userName
      );

      if (!result.success) {
        console.error('Failed to send account lockout notification:', result.error);
        return false;
      }

      console.log('Account lockout notification sent successfully to:', userEmail);
      return true;
    } catch (error) {
      console.error('Error sending account lockout notification:', error);
      return false;
    }
  }

  /**
   * Batch cleanup of expired rate limits (call periodically)
   */
  performMaintenance() {
    try {
      this.emailService.cleanupRateLimit();
      console.log('Email service maintenance completed');
    } catch (error) {
      console.error('Error during email service maintenance:', error);
    }
  }
}

// Example usage in API routes or authentication service
export const authEmailHandler = new AuthenticationEmailHandler();

// Example API route usage:
/*
// In your Next.js API route (e.g., /api/auth/register)
export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();
    
    // ... validate input and create user ...
    
    // Generate verification token
    const verificationToken = generateSecureToken();
    
    // Send welcome verification email
    const emailSent = await authEmailHandler.sendWelcomeVerification(
      email, 
      verificationToken, 
      name
    );
    
    if (!emailSent) {
      // Handle email sending failure
      console.warn('User registered but verification email failed to send');
    }
    
    return Response.json({ 
      success: true, 
      message: 'Registration successful. Please check your email for verification.' 
    });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: 'Registration failed' 
    }, { status: 500 });
  }
}
*/

// Example scheduled maintenance (e.g., in a cron job or background task)
/*
// Run every hour to clean up expired rate limits
setInterval(() => {
  authEmailHandler.performMaintenance();
}, 60 * 60 * 1000); // 1 hour
*/