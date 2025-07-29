import { NextRequest, NextResponse } from 'next/server';
import { authenticationService } from '@/lib/authentication-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/auth/verification-status
 * Check email verification status for the current user
 */
export async function GET(req: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required' 
        },
        { status: 401 }
      );
    }

    // Check verification status
    const status = await authenticationService.checkEmailVerificationStatus(session.user.id);

    return NextResponse.json({
      success: true,
      isVerified: status.isVerified,
      requiresVerification: status.requiresVerification,
      user: status.user,
    });

  } catch (error) {
    console.error('Verification status API error:', error);
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
 * POST /api/auth/verification-status
 * Check email verification status for a specific user ID (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required' 
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId } = body;

    // Validate input
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID is required' 
        },
        { status: 400 }
      );
    }

    // Check if current user is admin or checking their own status
    if (session.user.role !== 'ADMIN' && session.user.id !== userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient permissions' 
        },
        { status: 403 }
      );
    }

    // Check verification status
    const status = await authenticationService.checkEmailVerificationStatus(userId);

    // Get token status if user is not verified
    let tokenStatus = null;
    if (!status.isVerified) {
      tokenStatus = await authenticationService.getEmailVerificationTokenStatus(userId);
    }

    return NextResponse.json({
      success: true,
      isVerified: status.isVerified,
      requiresVerification: status.requiresVerification,
      user: status.user,
      tokenStatus,
    });

  } catch (error) {
    console.error('Verification status API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}