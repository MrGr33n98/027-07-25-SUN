import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/products - List products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    const where = companyId ? { companyId } : {}

    const [products, total] = await Promise.all([
      db.product.findMany({
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
      db.product.count({ where }),
    ])

    return NextResponse.json({
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'COMPANY') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()

    // Get company profile
    const company = await db.companyProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    const product = await db.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        originalPrice: data.originalPrice || null,
        power: data.power || null,
        efficiency: data.efficiency || null,
        warranty: data.warranty || null,
        inStock: data.inStock,
        images: data.images || [],
        category: data.category,
        brand: data.brand || null,
        model: data.model || null,
        specifications: data.specifications || {},
        companyId: company.id,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}