import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { searchFiltersSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = searchFiltersSchema.parse({
      query: searchParams.get('q') || undefined,
      location: searchParams.get('location') || undefined,
      categoria: searchParams.get('categoria') || undefined,
      especialidade: searchParams.get('especialidade') || undefined,
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

    if (filters.categoria) {
      where.specialties = { has: filters.categoria }
    }

    if (filters.especialidade) {
      where.specialties = { has: filters.especialidade }
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

    // For development, use mock data
    if (process.env.NODE_ENV === 'development' || companies.length === 0) {
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
          specialties: ['residencial', 'comercial', 'instalacao'],
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
          specialties: ['residencial', 'consultoria', 'projeto'],
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
          specialties: ['industrial', 'comercial', 'manutencao'],
          certifications: ['INMETRO', 'ABNT', 'ISO'],
          yearsExperience: 12,
          projectsCompleted: 320,
          verified: false,
          rating: 4.4,
          reviewCount: 15
        },
        {
          id: 'mock-4',
          name: 'Rural Solar',
          slug: 'rural-solar',
          description: 'Especialistas em energia solar para propriedades rurais e agronegócio.',
          city: 'Goiânia',
          state: 'GO',
          phone: '(62) 99999-4444',
          email: 'contato@ruralsolar.com.br',
          specialties: ['rural', 'projeto', 'financiamento'],
          certifications: ['INMETRO'],
          yearsExperience: 6,
          projectsCompleted: 95,
          verified: true,
          rating: 4.7,
          reviewCount: 12
        },
        {
          id: 'mock-5',
          name: 'EletroSolar Postos',
          slug: 'eletrosolar-postos',
          description: 'Soluções em energia solar para eletropostos e carregadores de veículos elétricos.',
          city: 'Curitiba',
          state: 'PR',
          phone: '(41) 99999-5555',
          email: 'info@eletrosolar.com.br',
          specialties: ['eletroposto', 'comercial', 'homologacao'],
          certifications: ['INMETRO', 'ANEEL'],
          yearsExperience: 5,
          projectsCompleted: 45,
          verified: true,
          rating: 4.9,
          reviewCount: 8
        },
        {
          id: 'mock-6',
          name: 'MonitorSolar Tech',
          slug: 'monitorsolar-tech',
          description: 'Especializada em monitoramento e manutenção de sistemas solares.',
          city: 'Salvador',
          state: 'BA',
          phone: '(71) 99999-6666',
          email: 'suporte@monitorsolar.com.br',
          specialties: ['monitoramento', 'manutencao', 'consultoria'],
          certifications: ['INMETRO'],
          yearsExperience: 7,
          projectsCompleted: 150,
          verified: false,
          rating: 4.3,
          reviewCount: 20
        }
      ]

      // Apply filters to mock data
      let filteredCompanies = mockCompanies

      if (filters.query) {
        filteredCompanies = filteredCompanies.filter(company =>
          company.name.toLowerCase().includes(filters.query!.toLowerCase()) ||
          company.description.toLowerCase().includes(filters.query!.toLowerCase()) ||
          company.specialties.some(s => s.toLowerCase().includes(filters.query!.toLowerCase()))
        )
      }

      if (filters.location) {
        filteredCompanies = filteredCompanies.filter(company =>
          company.city.toLowerCase().includes(filters.location!.toLowerCase()) ||
          company.state.toLowerCase().includes(filters.location!.toLowerCase())
        )
      }

      if (filters.categoria) {
        filteredCompanies = filteredCompanies.filter(company =>
          company.specialties.includes(filters.categoria!)
        )
      }

      if (filters.especialidade) {
        filteredCompanies = filteredCompanies.filter(company =>
          company.specialties.includes(filters.especialidade!)
        )
      }

      if (filters.minRating) {
        filteredCompanies = filteredCompanies.filter(company =>
          company.rating >= filters.minRating!
        )
      }

      if (filters.verified !== undefined) {
        filteredCompanies = filteredCompanies.filter(company =>
          company.verified === filters.verified
        )
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'rating':
          filteredCompanies.sort((a, b) => b.rating - a.rating)
          break
        case 'newest':
          // Mock: assume companies are already in newest order
          break
        default:
          filteredCompanies.sort((a, b) => b.rating - a.rating)
      }

      // Apply pagination
      const startIndex = (filters.page - 1) * filters.limit
      const endIndex = startIndex + filters.limit
      const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex)
      const totalPages = Math.ceil(filteredCompanies.length / filters.limit)

      return NextResponse.json({
        data: paginatedCompanies,
        total: filteredCompanies.length,
        page: filters.page,
        limit: filters.limit,
        totalPages,
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