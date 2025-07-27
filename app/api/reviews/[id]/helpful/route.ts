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

    const review = await prisma.review.update({
      where: { id: params.id },
      data: {
        helpful: {
          increment: 1
        }
      }
    })

    return NextResponse.json({ success: true, helpful: review.helpful })

  } catch (error) {
    console.error('Error marking review as helpful:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}