
import { NextRequest, NextResponse } from 'next/server';
import { authenticationService } from '../../../../lib/authentication-service';
import { AuthErrorHandler, AuthError, AuthErrorType, withAuthErrorHandling } from '../../../../lib/auth-error-handler';
import { z } from 'zod';

const passwordResetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

async function passwordResetHandler(req: Request): Promise<NextResponse> {
  const nextReq = req as NextRequest;
  const body = await nextReq.json();
  const parsed = passwordResetRequestSchema.safeParse(body);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    throw AuthErrorHandler.createValidationError(errors, 'email');
  }

  const { email } = parsed.data;
  const result = await authenticationService.requestPasswordReset(email, nextReq);

  if (!result.success && result.error) {
    if (result.error.includes('Too many')) {
      throw AuthErrorHandler.createRateLimitError(3600, 'password reset'); // 1 hour
    }
    
    if (result.error.includes('Failed to send')) {
      throw new AuthError(
        AuthErrorType.SERVICE_UNAVAILABLE,
        'Unable to send password reset email at this time. Please try again later.',
        `Email service failed for password reset: ${email}`,
        503
      );
    }
  }

  // Always return success to prevent email enumeration attacks
  return AuthErrorHandler.createSuccessResponse(
    {
      message: 'If an account with that email exists, a password reset link has been sent to your inbox.',
      email: email // Include for UI feedback, but don't reveal if account exists
    },
    'Password reset request processed'
  );
}

export const POST = withAuthErrorHandling(passwordResetHandler, 'password_reset_request');
