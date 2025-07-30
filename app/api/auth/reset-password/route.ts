
import { NextRequest, NextResponse } from 'next/server';
import { authenticationService } from '../../../../lib/authentication-service';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid request body', errors: parsed.error.format() }, { status: 400 });
    }

    const { token, password, confirmPassword } = parsed.data;
    const result = await authenticationService.resetPassword(token, password, confirmPassword, req);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset failed:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
