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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const q = searchParams.get('q')
    const status = searchParams.get('status')
    const verified = searchParams.get('verified')

    let where: any = {}

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (verified && verified !== 'all') {
      where.verified = verified === 'true'
    }

    const [companies, total] = await Promise.all([
      prisma.companyProfile.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          },
          _count: {
            select: {
              products: true,
              reviews: true,
              appointments: true,
            }
          },
          reviews: {
            select: {
              rating: true,
            },
            where: {
              status: 'APPROVED'
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.companyProfile.count({ where })
    ])

    // Calculate average rating for each company
    const companiesWithRating = companies.map(company => {
      const ratings = company.reviews.map(r => r.rating)
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0

      return {
        ...company,
        averageRating,
        reviews: undefined // Remove reviews array from response
      }
    })

    return NextResponse.json({
      data: companiesWithRating,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}