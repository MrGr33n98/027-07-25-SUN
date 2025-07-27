import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/reviews - List reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = companyId ? { companyId } : {}

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          company: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      }),
      db.review.count({ where }),
    ])

    return NextResponse.json({
      data: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create review
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const review = await db.review.create({
      data: {
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        customerName: data.customerName,
        customerLocation: data.customerLocation,
        projectType: data.projectType,
        installationDate: data.installationDate ? new Date(data.installationDate) : null,
        companyId: data.companyId,
        userId: data.userId || null,
      },
    })

    // Update company rating
    const companyReviews = await db.review.findMany({
      where: { companyId: data.companyId },
      select: { rating: true },
    })

    const averageRating = companyReviews.reduce((sum, review) => sum + review.rating, 0) / companyReviews.length

    await db.companyProfile.update({
      where: { id: data.companyId },
      data: {
        rating: averageRating,
        reviewCount: companyReviews.length,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}