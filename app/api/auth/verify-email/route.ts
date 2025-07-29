import { NextRequest, NextResponse } from 'next/server';
import { authenticationService } from '@/lib/authentication-service';
import { withAuthRateLimit } from '@/lib/auth-rate-limiter';

/**
 * POST /api/auth/verify-email
 * Verify email address using verification token
 */
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await withAuthRateLimit(req, 'emailVerification');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await req.json();
    const { token } = body;

    // Validate input
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Verification token is required' 
        },
        { status: 400 }
      );
    }

    // Verify email
    const result = await authenticationService.verifyEmail(token, req);

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
      message: 'Email verified successfully',
      user: result.user,
    });

  } catch (error) {
    console.error('Email verification API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/verify-email?token=...
 * Verify email address using verification token (for email links)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    // Validate input
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Verification token is required' 
        },
        { status: 400 }
      );
    }

    // Verify email
    const result = await authenticationService.verifyEmail(token, req);

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
      message: 'Email verified successfully',
      user: result.user,
    });

  } catch (error) {
    console.error('Email verification API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}