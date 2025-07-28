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

    // Get companies with pagination and reviews
    const [companies, total] = await Promise.all([
      db.companyProfile.findMany({
        where,
        include: {
          reviews: {
            where: { status: 'APPROVED' },
            select: { rating: true }
          }
        },
        orderBy,
        skip,
        take: filters.limit,
      }),
      db.companyProfile.count({ where }),
    ])

    // If no companies found, return mock data for development
    if (companies.length === 0 && filters.page === 1) {
      const mockCompanies = [
        {
          id: 'mock-1',
          name: 'SolarTech Brasil',
          slug: 'solar-tech-brasil',
          description: 'Especialistas em energia solar residencial e comercial com mais de 10 anos de experiência.',
          city: 'São Paulo',
          state: 'SP',
          phone: '(11) 99999-1111',
          email: 'contato@solartech.com.br',
          website: 'https://solartech.com.br',
          specialties: ['Residencial', 'Comercial', 'Instalação'],
          certifications: ['INMETRO', 'ABNT'],
          yearsExperience: 10,
          projectsCompleted: 250,
          verified: true,
          rating: 4.8,
          reviewCount: 24
        },
        {
          id: 'mock-2',
          name: 'EcoSolar Energia',
          slug: 'ecosolar-energia',
          description: 'Soluções sustentáveis em energia solar para residências e empresas.',
          city: 'Rio de Janeiro',
          state: 'RJ',
          phone: '(21) 99999-2222',
          email: 'info@ecosolar.com.br',
          website: 'https://ecosolar.com.br',
          specialties: ['Sustentabilidade', 'Residencial', 'Consultoria'],
          certifications: ['INMETRO'],
          yearsExperience: 8,
          projectsCompleted: 180,
          verified: true,
          rating: 4.6,
          reviewCount: 18
        },
        {
          id: 'mock-3',
          name: 'Solar Power MG',
          slug: 'solar-power-mg',
          description: 'Energia solar de qualidade para Minas Gerais e região.',
          city: 'Belo Horizonte',
          state: 'MG',
          phone: '(31) 99999-3333',
          email: 'vendas@solarpowermg.com.br',
          specialties: ['Industrial', 'Comercial', 'Manutenção'],
          certifications: ['INMETRO', 'ABNT', 'ISO'],
          yearsExperience: 12,
          projectsCompleted: 320,
          verified: false,
          rating: 4.4,
          reviewCount: 15
        }
      ]

      return NextResponse.json({
        data: mockCompanies,
        total: mockCompanies.length,
        page: 1,
        limit: filters.limit,
        totalPages: 1,
      })
    }

    // Calculate rating and reviewCount for each company
    const companiesWithRating = companies.map(company => {
      const approvedReviews = company.reviews || []
      const reviewCount = approvedReviews.length
      const rating = reviewCount > 0 
        ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
        : 0

      return {
        ...company,
        rating: Number(rating.toFixed(1)),
        reviewCount,
        reviews: undefined // Remove reviews from response
      }
    })

    const totalPages = Math.ceil(total / filters.limit)

    return NextResponse.json({
      data: companiesWithRating,
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