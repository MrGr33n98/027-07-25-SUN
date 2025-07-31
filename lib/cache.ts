import { unstable_cache } from 'next/cache'
import { db as prisma } from '@/lib/db'

// Cache tags for revalidation
export const CACHE_TAGS = {
  companies: 'companies',
  products: 'products',
  projects: 'projects',
  reviews: 'reviews',
  leads: 'leads',
  notifications: 'notifications',
} as const

// Cache durations in seconds
export const CACHE_DURATIONS = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
  day: 86400, // 24 hours
} as const

// Cached company queries
export const getCachedCompanies = unstable_cache(
  async (filters: {
    query?: string
    location?: string
    minRating?: number
    verified?: boolean
    sortBy?: string
    page?: number
    limit?: number
  }) => {
    const {
      query,
      location,
      minRating,
      verified,
      sortBy = 'relevance',
      page = 1,
      limit = 12
    } = filters

    const where: any = {}

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

    const orderBy: any = {}
    switch (sortBy) {
      case 'rating':
        orderBy.rating = 'desc'
        break
      case 'newest':
        orderBy.createdAt = 'desc'
        break
      default:
        orderBy.rating = 'desc'
    }

    const [companies, total] = await Promise.all([
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
          _count: {
            select: {
              products: true,
              projects: true,
              reviews: true,
            }
          }
        }
      }),
      prisma.companyProfile.count({ where })
    ])

    return {
      data: companies,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  },
  ['companies'],
  {
    tags: [CACHE_TAGS.companies],
    revalidate: CACHE_DURATIONS.medium,
  }
)

export const getCachedProducts = unstable_cache(
  async (filters: {
    companyId?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    sortBy?: string
    page?: number
    limit?: number
  }) => {
    const {
      companyId,
      category,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'newest',
      page = 1,
      limit = 12
    } = filters

    const where: any = {
      status: 'APPROVED'
    }

    if (companyId) {
      where.companyId = companyId
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

    const orderBy: any = {}
    switch (sortBy) {
      case 'price_asc':
        orderBy.price = 'asc'
        break
      case 'price_desc':
        orderBy.price = 'desc'
        break
      case 'newest':
        orderBy.createdAt = 'desc'
        break
      default:
        orderBy.createdAt = 'desc'
    }

    const [products, total] = await Promise.all([
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
      prisma.product.count({ where })
    ])

    return {
      data: products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  },
  ['products'],
  {
    tags: [CACHE_TAGS.products],
    revalidate: CACHE_DURATIONS.medium,
  }
)

export const getCachedCompanyStats = unstable_cache(
  async (companyId: string) => {
    const [
      productCount,
      projectCount,
      reviewCount,
      averageRating,
      leadCount
    ] = await Promise.all([
      prisma.product.count({
        where: { companyId, status: 'APPROVED' }
      }),
      prisma.project.count({
        where: { companyId, status: 'APPROVED' }
      }),
      prisma.review.count({
        where: { companyId, status: 'APPROVED' }
      }),
      prisma.review.aggregate({
        where: { companyId, status: 'APPROVED' },
        _avg: { rating: true }
      }),
      prisma.lead.count({
        where: { companyId }
      })
    ])

    return {
      productCount,
      projectCount,
      reviewCount,
      averageRating: averageRating._avg.rating || 0,
      leadCount,
    }
  },
  ['company-stats'],
  {
    tags: [CACHE_TAGS.companies, CACHE_TAGS.products, CACHE_TAGS.reviews],
    revalidate: CACHE_DURATIONS.long,
  }
)

// Cache invalidation helpers
export async function revalidateCompanies() {
  const { revalidateTag } = await import('next/cache')
  revalidateTag(CACHE_TAGS.companies)
}

export async function revalidateProducts() {
  const { revalidateTag } = await import('next/cache')
  revalidateTag(CACHE_TAGS.products)
}

export async function revalidateReviews() {
  const { revalidateTag } = await import('next/cache')
  revalidateTag(CACHE_TAGS.reviews)
}

// Memory cache for frequently accessed data
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>()

  set(key: string, data: any, ttl: number = CACHE_DURATIONS.medium) {
    const expires = Date.now() + (ttl * 1000)
    this.cache.set(key, { data, expires })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }
}

export const memoryCache = new MemoryCache()