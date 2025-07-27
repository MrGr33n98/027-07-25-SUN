import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, role, suspensionReason } = await request.json();
    const userId = params.id;

    // Prevent admin from changing their own role/status
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status.toUpperCase();
    if (role) updateData.role = role.toUpperCase();
    if (suspensionReason) updateData.suspensionReason = suspensionReason;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        company: true,
        phone: true,
        createdAt: true,
        lastLogin: true,
      }
    });

    // Create notification for user
    if (status) {
      const notificationType = status === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_ACTIVATED';
      const title = status === 'SUSPENDED' ? 'Conta Suspensa' : 'Conta Reativada';
      const message = status === 'SUSPENDED' 
        ? `Sua conta foi suspensa. ${suspensionReason || ''}`
        : 'Sua conta foi reativada e você pode acessar a plataforma novamente.';

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: notificationType,
          title,
          message,
          data: { reason: suspensionReason }
        }
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Prevent admin from deleting their own account
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}