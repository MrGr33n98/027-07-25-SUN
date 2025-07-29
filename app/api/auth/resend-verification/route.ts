import { NextRequest, NextResponse } from 'next/server';
import { authenticationService } from '@/lib/authentication-service';
import { withAuthRateLimit } from '@/lib/auth-rate-limiter';

/**
 * POST /api/auth/resend-verification
 * Resend email verification token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email address is required' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please enter a valid email address' 
        },
        { status: 400 }
      );
    }

    // Set email header for rate limiting
    const requestWithEmail = new NextRequest(req.url, {
      method: req.method,
      headers: {
        ...Object.fromEntries(req.headers.entries()),
        'x-email': email.toLowerCase(),
      },
      body: req.body,
    });

    // Apply rate limiting based on email
    const rateLimitResponse = await withAuthRateLimit(requestWithEmail, 'emailVerification', email.toLowerCase());
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Resend verification email
    const result = await authenticationService.resendEmailVerification(email, req);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.',
      user: result.user,
    });

  } catch (error) {
    console.error('Resend verification API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}