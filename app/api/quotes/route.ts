import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    let where: any = {}

    if (session.user.role === 'COMPANY') {
      // Get company profile
      const company = await prisma.companyProfile.findUnique({
        where: { userId: session.user.id }
      })
      
      if (!company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 })
      }
      
      where.companyId = company.id
    } else {
      // Customer can only see their own quotes
      where.userId = session.user.id
    }

    if (status) {
      where.status = status
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          items: true,
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              verified: true,
            }
          },
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              projectType: true,
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.quote.count({ where })
    ])

    return NextResponse.json({
      data: quotes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })

  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, items, validUntil, leadId, userId, terms, notes } = await request.json()

    if (!title || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Title and items are required' },
        { status: 400 }
      )
    }

    // Get company profile
    const company = await prisma.companyProfile.findUnique({
      where: { userId: session.user.id }
    })
    
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Calculate total value
    const totalValue = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice)
    }, 0)

    // Create quote with items
    const quote = await prisma.quote.create({
      data: {
        title,
        description,
        totalValue,
        validUntil: new Date(validUntil),
        companyId: company.id,
        leadId,
        userId,
        terms,
        notes,
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            category: item.category,
          }))
        }
      },
      include: {
        items: true,
        company: {
          select: {
            name: true,
          }
        }
      }
    })

    // Create notification for customer
    if (userId) {
      await prisma.notification.create({
        data: {
          title: 'Nova cotação recebida!',
          message: `${company.name} enviou uma cotação: ${title}`,
          type: 'QUOTE_RECEIVED',
          userId,
          data: {
            quoteId: quote.id,
            companyName: company.name,
          }
        }
      })
    }

    return NextResponse.json(quote, { status: 201 })

  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}