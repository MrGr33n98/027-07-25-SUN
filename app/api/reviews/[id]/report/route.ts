import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason } = await request.json()

    // Update review to flagged status
    await prisma.review.update({
      where: { id: params.id },
      data: {
        status: 'FLAGGED',
        flagReason: reason || 'Denunciado por usuário'
      }
    })

    // Create notification for admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          title: 'Avaliação denunciada',
          message: `Uma avaliação foi denunciada e precisa de moderação`,
          type: 'SYSTEM_UPDATE',
          userId: admin.id,
          data: {
            reviewId: params.id,
            reportedBy: session.user.id,
            reason
          }
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error reporting review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}