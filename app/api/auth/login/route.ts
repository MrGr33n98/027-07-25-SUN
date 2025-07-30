import { NextRequest, NextResponse } from 'next/server';
import { authenticationService } from '../../../../lib/authentication-service';
import { AuthErrorHandler, AuthError, AuthErrorType, withAuthErrorHandling } from '../../../../lib/auth-error-handler';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

async function loginHandler(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    throw AuthErrorHandler.createValidationError(errors);
  }

  const result = await authenticationService.login(parsed.data, req);

  if (!result.success) {
    // Handle rate limiting
    if (result.error?.includes('Too many')) {
      throw AuthErrorHandler.createRateLimitError(900, 'login'); // 15 minutes
    }

    // Handle account lockout
    if (result.accountLocked && result.lockoutDuration) {
      throw AuthErrorHandler.createAccountLockoutError(result.lockoutDuration);
    }

    // Handle email verification requirement
    if (result.requiresEmailVerification) {
      throw new AuthError(
        AuthErrorType.EMAIL_NOT_VERIFIED,
        'Please verify your email address before logging in. Check your inbox for a verification link.',
        `Login attempt with unverified email: ${parsed.data.email}`,
        403,
        {
          suggestions: [
            'Check your email inbox and spam folder',
            'Click the verification link in the email',
            'Request a new verification email if needed'
          ]
        }
      );
    }

    // Generic invalid credentials error (security-first approach)
    throw new AuthError(
      AuthErrorType.INVALID_CREDENTIALS,
      'Invalid email or password. Please check your credentials and try again.',
      `Login failed for ${parsed.data.email}: ${result.error}`,
      401
    );
  }

  // Successful login
  return AuthErrorHandler.createSuccessResponse(
    {
      user: result.user,
      sessionId: result.sessionId,
      message: 'Login successful'
    },
    'User logged in successfully'
  );
}

export const POST = withAuthErrorHandling(loginHandler, 'user_login');