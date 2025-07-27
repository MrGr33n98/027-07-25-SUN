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

    const favorites = await prisma.productFavorite.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                rating: true,
                verified: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ data: favorites })

  } catch (error) {
    console.error('Error fetching favorite products:', error)
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

    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Check if already favorited
    const existing = await prisma.productFavorite.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId
        }
      }
    })

    if (existing) {
      // Remove from favorites
      await prisma.productFavorite.delete({
        where: { id: existing.id }
      })
      
      return NextResponse.json({ favorited: false })
    } else {
      // Add to favorites
      await prisma.productFavorite.create({
        data: {
          userId: session.user.id,
          productId
        }
      })
      
      return NextResponse.json({ favorited: true })
    }

  } catch (error) {
    console.error('Error toggling product favorite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}