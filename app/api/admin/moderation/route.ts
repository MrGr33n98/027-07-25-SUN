import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

    let pendingProducts: any[] = []
    let pendingProjects: any[] = []
    let pendingReviews: any[] = []

    if (type === 'all' || type === 'products') {
      pendingProducts = await prisma.product.findMany({
        where: {
          OR: [
            { status: 'PENDING' },
            { status: 'FLAGGED' }
          ]
        },
        include: {
          company: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    if (type === 'all' || type === 'projects') {
      pendingProjects = await prisma.project.findMany({
        where: {
          OR: [
            { status: 'PENDING' },
            { status: 'FLAGGED' }
          ]
        },
        include: {
          company: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    if (type === 'all' || type === 'reviews') {
      pendingReviews = await prisma.review.findMany({
        where: {
          OR: [
            { status: 'PENDING' },
            { status: 'FLAGGED' }
          ]
        },
        include: {
          company: {
            select: {
              name: true
            }
          },
          user: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    return NextResponse.json({
      products: pendingProducts,
      projects: pendingProjects,
      reviews: pendingReviews
    })

  } catch (error) {
    console.error('Error fetching moderation data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}