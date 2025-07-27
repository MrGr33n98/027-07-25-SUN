import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { searchFiltersSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = searchFiltersSchema.parse({
      query: searchParams.get('q') || undefined,
      location: searchParams.get('location') || undefined,
      minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
      verified: searchParams.get('verified') === 'true' ? true : undefined,
      sortBy: searchParams.get('sortBy') || 'relevance',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 12,
    })

    const skip = (filters.page - 1) * filters.limit

    // Build where clause
    const where: any = {}
    
    if (filters.query) {
      where.OR = [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { specialties: { hasSome: [filters.query] } },
      ]
    }

    if (filters.location) {
      where.OR = [
        ...(where.OR || []),
        { city: { contains: filters.location, mode: 'insensitive' } },
        { state: { contains: filters.location, mode: 'insensitive' } },
        { location: { contains: filters.location, mode: 'insensitive' } },
      ]
    }

    if (filters.minRating) {
      where.rating = { gte: filters.minRating }
    }

    if (filters.verified !== undefined) {
      where.verified = filters.verified
    }

    // Build orderBy clause
    let orderBy: any = {}
    switch (filters.sortBy) {
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      default:
        orderBy = { rating: 'desc' } // Default to rating for relevance
    }

    // Get companies with pagination
    const [companies, total] = await Promise.all([
      db.companyProfile.findMany({
        where,
        orderBy,
        skip,
        take: filters.limit,
      }),
      db.companyProfile.count({ where }),
    ])

    const totalPages = Math.ceil(total / filters.limit)

    return NextResponse.json({
      data: companies,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}