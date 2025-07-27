import { prisma } from '@/lib/prisma'

export interface SearchFilters {
  query?: string
  location?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  verified?: boolean
  inStock?: boolean
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest'
  page?: number
  limit?: number
}

export interface SearchResult<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
  facets?: {
    categories: Array<{ name: string; count: number }>
    priceRanges: Array<{ range: string; count: number }>
    locations: Array<{ name: string; count: number }>
    ratings: Array<{ rating: number; count: number }>
  }
}

// Simulated Elasticsearch-like search functionality
export class SearchEngine {
  // Search companies
  static async searchCompanies(filters: SearchFilters): Promise<SearchResult<any>> {
    const {
      query,
      location,
      minRating,
      verified,
      sortBy = 'relevance',
      page = 1,
      limit = 12
    } = filters

    let where: any = {}
    let orderBy: any = {}

    // Build where clause
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { specialties: { hasSome: [query] } },
      ]
    }

    if (location) {
      where.OR = [
        ...(where.OR || []),
        { city: { contains: location, mode: 'insensitive' } },
        { state: { contains: location, mode: 'insensitive' } },
        { location: { contains: location, mode: 'insensitive' } },
      ]
    }

    if (minRating) {
      where.rating = { gte: minRating }
    }

    if (verified !== undefined) {
      where.verified = verified
    }

    // Build order by clause
    switch (sortBy) {
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      default:
        // For relevance, we'll use a combination of rating and review count
        orderBy = [
          { rating: 'desc' },
          { reviewCount: 'desc' }
        ]
    }

    const [companies, total, facets] = await Promise.all([
      prisma.companyProfile.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          companyCertifications: {
            where: { status: 'VERIFIED' },
            include: {
              certification: {
                select: {
                  name: true,
                  icon: true,
                  color: true,
                }
              }
            }
          },
          _count: {
            select: {
              products: true,
              projects: true,
              reviews: true,
            }
          }
        }
      }),
      prisma.companyProfile.count({ where }),
      this.getCompanyFacets(where)
    ])

    return {
      data: companies,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      facets
    }
  }

  // Search products
  static async searchProducts(filters: SearchFilters): Promise<SearchResult<any>> {
    const {
      query,
      category,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'relevance',
      page = 1,
      limit = 12
    } = filters

    let where: any = {
      status: 'APPROVED'
    }
    let orderBy: any = {}

    // Build where clause
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
        { model: { contains: query, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice
      if (maxPrice !== undefined) where.price.lte = maxPrice
    }

    if (inStock !== undefined) {
      where.inStock = inStock
    }

    // Build order by clause
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' }
        break
      case 'price_desc':
        orderBy = { price: 'desc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'rating':
        orderBy = { company: { rating: 'desc' } }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }

    const [products, total, facets] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      prisma.product.count({ where }),
      this.getProductFacets(where)
    ])

    return {
      data: products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      facets
    }
  }

  // Get company facets for filtering
  private static async getCompanyFacets(baseWhere: any) {
    const [locations, ratings] = await Promise.all([
      // Get top locations
      prisma.companyProfile.groupBy({
        by: ['city'],
        where: { ...baseWhere, city: { not: null } },
        _count: true,
        orderBy: { _count: { city: 'desc' } },
        take: 10
      }),
      
      // Get rating distribution
      prisma.companyProfile.groupBy({
        by: ['rating'],
        where: baseWhere,
        _count: true,
        orderBy: { rating: 'desc' }
      })
    ])

    return {
      locations: locations.map(l => ({ name: l.city!, count: l._count })),
      ratings: ratings
        .filter(r => r.rating > 0)
        .map(r => ({ rating: Math.floor(r.rating), count: r._count }))
        .reduce((acc, curr) => {
          const existing = acc.find(item => item.rating === curr.rating)
          if (existing) {
            existing.count += curr.count
          } else {
            acc.push(curr)
          }
          return acc
        }, [] as Array<{ rating: number; count: number }>)
        .sort((a, b) => b.rating - a.rating)
    }
  }

  // Get product facets for filtering
  private static async getProductFacets(baseWhere: any) {
    const [categories, priceRanges] = await Promise.all([
      // Get categories
      prisma.product.groupBy({
        by: ['category'],
        where: baseWhere,
        _count: true,
        orderBy: { _count: { category: 'desc' } }
      }),
      
      // Get price ranges
      prisma.product.findMany({
        where: baseWhere,
        select: { price: true }
      })
    ])

    // Calculate price ranges
    const prices = priceRanges.map(p => Number(p.price))
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceStep = (maxPrice - minPrice) / 5

    const priceRangeCounts = [
      { range: `R$ ${minPrice.toFixed(0)} - R$ ${(minPrice + priceStep).toFixed(0)}`, count: 0 },
      { range: `R$ ${(minPrice + priceStep).toFixed(0)} - R$ ${(minPrice + priceStep * 2).toFixed(0)}`, count: 0 },
      { range: `R$ ${(minPrice + priceStep * 2).toFixed(0)} - R$ ${(minPrice + priceStep * 3).toFixed(0)}`, count: 0 },
      { range: `R$ ${(minPrice + priceStep * 3).toFixed(0)} - R$ ${(minPrice + priceStep * 4).toFixed(0)}`, count: 0 },
      { range: `R$ ${(minPrice + priceStep * 4).toFixed(0)} - R$ ${maxPrice.toFixed(0)}`, count: 0 },
    ]

    prices.forEach(price => {
      const rangeIndex = Math.min(Math.floor((price - minPrice) / priceStep), 4)
      priceRangeCounts[rangeIndex].count++
    })

    return {
      categories: categories.map(c => ({ name: c.category, count: c._count })),
      priceRanges: priceRangeCounts.filter(r => r.count > 0)
    }
  }

  // Global search across all entities
  static async globalSearch(query: string, limit: number = 20) {
    if (!query || query.length < 2) {
      return {
        companies: [],
        products: [],
        total: 0
      }
    }

    const [companies, products] = await Promise.all([
      prisma.companyProfile.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { specialties: { hasSome: [query] } },
          ]
        },
        take: Math.floor(limit / 2),
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          rating: true,
          verified: true,
          location: true,
        }
      }),
      
      prisma.product.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } },
          ]
        },
        take: Math.floor(limit / 2),
        select: {
          id: true,
          name: true,
          price: true,
          images: true,
          category: true,
          company: {
            select: {
              name: true,
              slug: true,
            }
          }
        }
      })
    ])

    return {
      companies,
      products,
      total: companies.length + products.length
    }
  }

  // Search suggestions/autocomplete
  static async getSearchSuggestions(query: string, limit: number = 10) {
    if (!query || query.length < 2) {
      return []
    }

    const [companyNames, productNames, categories] = await Promise.all([
      prisma.companyProfile.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' }
        },
        select: { name: true },
        take: Math.floor(limit / 3)
      }),
      
      prisma.product.findMany({
        where: {
          status: 'APPROVED',
          name: { contains: query, mode: 'insensitive' }
        },
        select: { name: true },
        take: Math.floor(limit / 3)
      }),
      
      // Get unique categories that match
      prisma.product.findMany({
        where: {
          status: 'APPROVED',
          category: { contains: query, mode: 'insensitive' }
        },
        select: { category: true },
        distinct: ['category'],
        take: Math.floor(limit / 3)
      })
    ])

    const suggestions = [
      ...companyNames.map(c => ({ text: c.name, type: 'company' })),
      ...productNames.map(p => ({ text: p.name, type: 'product' })),
      ...categories.map(c => ({ text: c.category, type: 'category' }))
    ]

    return suggestions.slice(0, limit)
  }
}