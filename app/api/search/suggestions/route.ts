import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache, CacheKeys, CacheTags } from '@/lib/cache-manager'

export async function GET() {
  try {
    const suggestions = await cache.get(
      'search:suggestions',
      async () => {
        const results = []

        // Get trending categories
        const categories = await prisma.product.groupBy({
          by: ['category'],
          _count: {
            category: true
          },
          orderBy: {
            _count: {
              category: 'desc'
            }
          },
          take: 5
        })

        categories.forEach(cat => {
          results.push({
            id: `category_${cat.category}`,
            text: cat.category,
            type: 'category',
            count: cat._count.category
          })
        })

        // Get trending brands
        const brands = await prisma.product.groupBy({
          by: ['brand'],
          _count: {
            brand: true
          },
          where: {
            brand: { not: null }
          },
          orderBy: {
            _count: {
              brand: 'desc'
            }
          },
          take: 5
        })

        brands.forEach(brand => {
          results.push({
            id: `brand_${brand.brand}`,
            text: brand.brand!,
            type: 'trending',
            count: brand._count.brand
          })
        })

        // Get popular search terms (you can track these in a separate table)
        const popularTerms = [
          { text: 'painéis solares', count: 1250 },
          { text: 'inversor solar', count: 890 },
          { text: 'energia solar residencial', count: 750 },
          { text: 'bateria solar', count: 620 },
          { text: 'kit energia solar', count: 580 },
          { text: 'instalação solar', count: 450 },
          { text: 'microinversor', count: 380 },
          { text: 'estrutura solar', count: 320 }
        ]

        popularTerms.forEach((term, index) => {
          results.push({
            id: `popular_${index}`,
            text: term.text,
            type: 'trending',
            count: term.count
          })
        })

        return results.slice(0, 15) // Limit to 15 suggestions
      },
      { ttl: 3600, tags: [CacheTags.PRODUCTS] } // 1 hour cache
    )

    return NextResponse.json({ suggestions })

  } catch (error) {
    console.error('Suggestions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}