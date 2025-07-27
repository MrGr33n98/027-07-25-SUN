import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    // Get company profile
    const company = await prisma.companyProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Calculate date range
    const now = new Date()
    const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))

    // Get analytics data
    const [
      totalProducts,
      totalLeads,
      totalReviews,
      averageRating,
      totalMessages,
      recentLeads,
      recentProducts,
      recentReviews
    ] = await Promise.all([
      // Total products
      prisma.product.count({
        where: { 
          companyId: company.id,
          status: 'APPROVED'
        }
      }),
      
      // Total leads
      prisma.lead.count({
        where: { 
          companyId: company.id,
          createdAt: { gte: startDate }
        }
      }),
      
      // Total reviews
      prisma.review.count({
        where: { 
          companyId: company.id,
          status: 'APPROVED'
        }
      }),
      
      // Average rating
      prisma.review.aggregate({
        where: { 
          companyId: company.id,
          status: 'APPROVED'
        },
        _avg: { rating: true }
      }),
      
      // Total messages (received)
      prisma.message.count({
        where: { 
          receiverId: session.user.id,
          createdAt: { gte: startDate }
        }
      }),
      
      // Recent leads for activity
      prisma.lead.findMany({
        where: { 
          companyId: company.id,
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          name: true,
          projectType: true,
          createdAt: true,
        }
      }),
      
      // Recent products for activity
      prisma.product.findMany({
        where: { 
          companyId: company.id,
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          name: true,
          status: true,
          createdAt: true,
        }
      }),
      
      // Recent reviews for activity
      prisma.review.findMany({
        where: { 
          companyId: company.id,
          createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          customerName: true,
          rating: true,
          createdAt: true,
        }
      })
    ])

    // Calculate previous period for growth comparison
    const previousStartDate = new Date(startDate.getTime() - (daysAgo * 24 * 60 * 60 * 1000))
    
    const [previousLeads, previousProducts] = await Promise.all([
      prisma.lead.count({
        where: { 
          companyId: company.id,
          createdAt: { 
            gte: previousStartDate,
            lt: startDate
          }
        }
      }),
      
      prisma.product.count({
        where: { 
          companyId: company.id,
          createdAt: { 
            gte: previousStartDate,
            lt: startDate
          }
        }
      })
    ])

    // Calculate growth percentages
    const leadsGrowth = previousLeads > 0 
      ? Math.round(((totalLeads - previousLeads) / previousLeads) * 100)
      : totalLeads > 0 ? 100 : 0

    const productsGrowth = previousProducts > 0 
      ? Math.round(((totalProducts - previousProducts) / previousProducts) * 100)
      : totalProducts > 0 ? 100 : 0

    // Build recent activity
    const recentActivity = []
    
    // Add recent leads to activity
    recentLeads.forEach(lead => {
      recentActivity.push({
        type: 'lead',
        message: `Novo lead recebido de ${lead.name} para projeto ${lead.projectType}`,
        date: lead.createdAt.toISOString(),
      })
    })
    
    // Add recent products to activity
    recentProducts.forEach(product => {
      recentActivity.push({
        type: 'product',
        message: `Produto "${product.name}" foi ${product.status === 'APPROVED' ? 'aprovado' : 'enviado para moderação'}`,
        date: product.createdAt.toISOString(),
      })
    })
    
    // Add recent reviews to activity
    recentReviews.forEach(review => {
      recentActivity.push({
        type: 'review',
        message: `${review.customerName} avaliou sua empresa com ${review.rating} estrelas`,
        date: review.createdAt.toISOString(),
      })
    })

    // Sort activity by date
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const analyticsData = {
      totalViews: Math.floor(Math.random() * 1000) + 500, // Mock data - would need view tracking
      totalLeads,
      totalProducts,
      averageRating: averageRating._avg.rating || 0,
      totalReviews,
      totalMessages,
      monthlyGrowth: {
        views: Math.floor(Math.random() * 20) + 5, // Mock data
        leads: leadsGrowth,
        products: productsGrowth,
      },
      recentActivity: recentActivity.slice(0, 10),
    }

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}