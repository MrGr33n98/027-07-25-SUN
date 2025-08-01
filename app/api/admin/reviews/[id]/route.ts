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

    const { status, moderationNote } = await request.json();
    const reviewId = params.id;

    const updateData: any = { 
      status: status.toUpperCase(),
      moderatedAt: new Date(),
      moderatedBy: session.user.id
    };
    
    if (moderationNote) {
      updateData.moderationNote = moderationNote;
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        company: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Create notification for review author if associated user exists
    if (review.userId) {
      await prisma.notification.create({
        data: {
          userId: review.userId,
          type: 'REVIEW_RECEIVED',
          title: status === 'APPROVED' ? 'Avaliação Aprovada' : 'Avaliação Rejeitada',
          message: status === 'APPROVED'
            ? `Sua avaliação para "${review.company.name}" foi aprovada.`
            : `Sua avaliação para "${review.company.name}" foi rejeitada. ${moderationNote || ''}`,
          data: { reviewId: review.id, companyId: review.companyId }
        }
      });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
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

    const reviewId = params.id;

    await prisma.review.delete({
      where: { id: reviewId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}