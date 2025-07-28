import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache, CacheKeys, CacheTags } from '@/lib/cache-manager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type') // 'company' | 'product' | 'all'
    const category = searchParams.get('category')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchQuery = query.trim()
    const cacheKey = `search:${searchQuery}:${type}:${category}:${limit}`

    const results = await cache.get(
      cacheKey,
      async () => {
        const searchResults = []

        // Search companies
        if (!type || type === 'all' || type === 'company') {
          const companies = await prisma.company.findMany({
            where: {
              AND: [
                {
                  OR: [
                    { name: { contains: searchQuery, mode: 'insensitive' } },
                    { description: { contains: searchQuery, mode: 'insensitive' } },
                    { specialties: { hasSome: [searchQuery] } },
                    { serviceAreas: { hasSome: [searchQuery] } }
                  ]
                },
                { status: 'ACTIVE' }
              ]
            },
            select: {
              id: true,
              name: true,
              description: true,
              logo: true,
              rating: true,
              reviewCount: true,
              city: true,
              state: true,
              specialties: true,
              verified: true,
              slug: true
            },
            take: Math.ceil(limit / 2),
            orderBy: [
              { verified: 'desc' },
              { rating: 'desc' },
              { reviewCount: 'desc' }
            ]
          })

          companies.forEach(company => {
            searchResults.push({
              id: company.id,
              type: 'company',
              title: company.name,
              subtitle: company.specialties.slice(0, 2).join(', '),
              description: company.description || '',
              image: company.logo,
              rating: company.rating,
              location: `${company.city}, ${company.state}`,
              url: `/empresa/${company.slug}`
            })
          })
        }

        // Search products
        if (!type || type === 'all' || type === 'product') {
          const products = await prisma.product.findMany({
            where: {
              AND: [
                {
                  OR: [
                    { name: { contains: searchQuery, mode: 'insensitive' } },
                    { description: { contains: searchQuery, mode: 'insensitive' } },
                    { category: { contains: searchQuery, mode: 'insensitive' } },
                    { brand: { contains: searchQuery, mode: 'insensitive' } },
                    { specifications: { path: ['tags'], array_contains: [searchQuery] } }
                  ]
                },
                { status: 'ACTIVE' },
                ...(category ? [{ category }] : [])
              ]
            },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              images: true,
              category: true,
              brand: true,
              power: true,
              efficiency: true,
              inStock: true,
              company: {
                select: {
                  name: true,
                  city: true,
                  state: true,
                  verified: true
                }
              }
            },
            take: Math.ceil(limit / 2),
            orderBy: [
              { inStock: 'desc' },
              { createdAt: 'desc' }
            ]
          })

          products.forEach(product => {
            searchResults.push({
              id: product.id,
              type: 'product',
              title: product.name,
              subtitle: `${product.brand} - ${product.category}`,
              description: product.description || '',
              image: product.images[0],
              price: product.price ? Number(product.price) : undefined,
              location: `${product.company.city}, ${product.company.state}`,
              category: product.category,
              url: `/produto/${product.id}`
            })
          })
        }

        // Sort results by relevance (companies first if verified, then by rating/stock)
        return searchResults
          .sort((a, b) => {
            if (a.type === 'company' && b.type === 'product') return -1
            if (a.type === 'product' && b.type === 'company') return 1
            
            if (a.type === 'company' && b.type === 'company') {
              return (b.rating || 0) - (a.rating || 0)
            }
            
            return 0
          })
          .slice(0, limit)
      },
      { ttl: 300, tags: [CacheTags.COMPANIES, CacheTags.PRODUCTS] } // 5 minutes cache
    )

    return NextResponse.json({ results })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}