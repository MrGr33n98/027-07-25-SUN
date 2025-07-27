import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        company: {
          include: {
            _count: {
              select: {
                products: true,
                projects: true,
                reviews: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: favorites })

  } catch (error) {
    console.error('Error fetching favorite companies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId } = await request.json()

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_companyId: {
          userId: session.user.id,
          companyId
        }
      }
    })

    if (existing) {
      // Remove from favorites
      await prisma.favorite.delete({
        where: { id: existing.id }
      })
      
      return NextResponse.json({ favorited: false })
    } else {
      // Add to favorites
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          companyId
        }
      })
      
      return NextResponse.json({ favorited: true })
    }

  } catch (error) {
    console.error('Error toggling company favorite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}