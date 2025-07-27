import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createProductModerationNotification, createProjectModerationNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, id, reason } = await request.json()

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID are required' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'product':
        result = await prisma.product.update({
          where: { id },
          data: { 
            status: 'REJECTED',
            moderatedAt: new Date(),
            moderatedBy: session.user.id,
            rejectionReason: reason || 'Não especificado'
          },
          include: {
            company: {
              select: {
                userId: true
              }
            }
          }
        })
        
        // Send notification to company
        await createProductModerationNotification(
          result.company.userId,
          result.name,
          false,
          reason
        )
        break

      case 'project':
        result = await prisma.project.update({
          where: { id },
          data: { 
            status: 'REJECTED',
            moderatedAt: new Date(),
            moderatedBy: session.user.id,
            rejectionReason: reason || 'Não especificado'
          },
          include: {
            company: {
              select: {
                userId: true
              }
            }
          }
        })
        
        // Send notification to company
        await createProjectModerationNotification(
          result.company.userId,
          result.title,
          false,
          reason
        )
        break

      case 'review':
        result = await prisma.review.update({
          where: { id },
          data: { 
            status: 'REJECTED',
            moderatedAt: new Date(),
            moderatedBy: session.user.id,
            rejectionReason: reason || 'Não especificado'
          }
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ 
      success: true, 
      message: `${type} rejected successfully`,
      data: result
    })

  } catch (error) {
    console.error('Error rejecting item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}