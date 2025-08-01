
import { NextRequest, NextResponse } from 'next/server';
import { authenticationService } from '../../../../lib/authentication-service';
import { AuthErrorHandler, AuthError, AuthErrorType, withAuthErrorHandling } from '../../../../lib/auth-error-handler';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  name: z.string().optional(),
  role: z.enum(['CUSTOMER', 'COMPANY']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

async function registerHandler(req: Request): Promise<NextResponse> {
  const nextReq = req as NextRequest;
  const ipAddress = nextReq.headers.get('x-forwarded-for')?.split(',')[0] ||
                   nextReq.headers.get('x-real-ip') ||
                   'unknown';
  const userAgent = nextReq.headers.get('user-agent') || 'unknown';

  const body = await nextReq.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    throw AuthErrorHandler.createValidationError(errors);
  }

  const result = await authenticationService.register(parsed.data, nextReq);

  if (!result.success) {
    if (result.error?.includes('Too many')) {
      throw AuthErrorHandler.createRateLimitError(900, 'registration'); // 15 minutes
    }
    
    if (result.error?.includes('already exists')) {
      throw new AuthError(
        AuthErrorType.VALIDATION_ERROR,
        'An account with this email address already exists',
        `Registration attempt with existing email: ${parsed.data.email}`,
        400,
        { field: 'email' }
      );
    }

    if (result.validationErrors && result.validationErrors.length > 0) {
      throw new AuthError(
        AuthErrorType.VALIDATION_ERROR,
        result.validationErrors[0],
        `Registration validation failed: ${result.validationErrors.join(', ')}`,
        400
      );
    }

    throw new AuthError(
      AuthErrorType.INTERNAL_ERROR,
      'Registration failed. Please try again.',
      `Registration failed for ${parsed.data.email}: ${result.error}`,
      500
    );
  }

  return AuthErrorHandler.createSuccessResponse(
    {
      user: result.user,
      message: 'Account created successfully! Please check your email to verify your account.'
    },
    'Registration completed successfully'
  );
}

export const POST = withAuthErrorHandling(registerHandler, 'user_registration');
