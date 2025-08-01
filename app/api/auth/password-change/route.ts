
import { NextRequest, NextResponse } from 'next/server';
import { authenticationService } from '../../../../lib/authentication-service';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid request body', errors: parsed.error.format() }, { status: 400 });
    }

    const { currentPassword, newPassword, confirmPassword } = parsed.data;
    const result = await authenticationService.changePassword(session.user.id, currentPassword, newPassword, confirmPassword, req);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change failed:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
