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

    const { status, rejectionReason } = await request.json();
    const productId = params.id;

    const updateData: any = { status: status.toUpperCase() };
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Create notification for product owner
    await prisma.notification.create({
      data: {
        userId: product.userId,
        type: status === 'APPROVED' ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED',
        title: status === 'APPROVED' ? 'Produto Aprovado' : 'Produto Rejeitado',
        message: status === 'APPROVED' 
          ? `Seu produto "${product.name}" foi aprovado e está disponível no marketplace.`
          : `Seu produto "${product.name}" foi rejeitado. ${rejectionReason || ''}`,
        data: { productId: product.id }
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
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

    const productId = params.id;

    await prisma.product.delete({
      where: { id: productId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}