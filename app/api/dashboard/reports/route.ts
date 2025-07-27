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
    const period = searchParams.get('period') || '30d'

    // Get company profile
    const company = await prisma.companyProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Calculate date ranges
    const now = new Date()
    const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const currentPeriodStart = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - (daysAgo * 24 * 60 * 60 * 1000))

    // Get current period data
    const [
      currentLeads,
      currentProducts,
      currentReviews,
      currentRating,
      topProducts,
      leadSources
    ] = await Promise.all([
      // Current leads
      prisma.lead.count({
        where: { 
          companyId: company.id,
          createdAt: { gte: currentPeriodStart }
        }
      }),
      
      // Current products
      prisma.product.count({
        where: { 
          companyId: company.id,
          status: 'APPROVED'
        }
      }),
      
      // Current reviews
      prisma.review.count({
        where: { 
          companyId: company.id,
          status: 'APPROVED',
          createdAt: { gte: currentPeriodStart }
        }
      }),
      
      // Current rating
      prisma.review.aggregate({
        where: { 
          companyId: company.id,
          status: 'APPROVED'
        },
        _avg: { rating: true }
      }),
      
      // Top products (mock data for views)
      prisma.product.findMany({
        where: { 
          companyId: company.id,
          status: 'APPROVED'
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          name: true,
          createdAt: true,
        }
      }),
      
      // Lead sources (simplified)
      prisma.lead.groupBy({
        by: ['source'],
        where: { 
          companyId: company.id,
          createdAt: { gte: currentPeriodStart }
        },
        _count: true
      })
    ])

    // Get previous period data for comparison
    const [
      previousLeads,
      previousReviews,
    ] = await Promise.all([
      prisma.lead.count({
        where: { 
          companyId: company.id,
          createdAt: { 
            gte: previousPeriodStart,
            lt: currentPeriodStart
          }
        }
      }),
      
      prisma.review.count({
        where: { 
          companyId: company.id,
          status: 'APPROVED',
          createdAt: { 
            gte: previousPeriodStart,
            lt: currentPeriodStart
          }
        }
      })
    ])

    // Calculate changes
    const leadsChange = previousLeads > 0 
      ? ((currentLeads - previousLeads) / previousLeads) * 100
      : currentLeads > 0 ? 100 : 0

    const reviewsChange = previousReviews > 0 
      ? ((currentReviews - previousReviews) / previousReviews) * 100
      : currentReviews > 0 ? 100 : 0

    // Mock data for views and revenue (would need tracking implementation)
    const mockViews = Math.floor(Math.random() * 1000) + 500
    const mockRevenue = currentLeads * 2500 // Estimated revenue per lead

    // Format top products with mock view data
    const formattedTopProducts = topProducts.map((product, index) => ({
      name: product.name,
      views: Math.floor(Math.random() * 200) + 50,
      leads: Math.floor(Math.random() * 10) + 1,
    }))

    // Format lead sources
    const totalLeadSources = leadSources.reduce((sum, source) => sum + source._count, 0)
    const formattedLeadSources = leadSources.map(source => ({
      source: source.source || 'Direto',
      count: source._count,
      percentage: totalLeadSources > 0 ? (source._count / totalLeadSources) * 100 : 0
    }))

    // Add default sources if none exist
    if (formattedLeadSources.length === 0) {
      formattedLeadSources.push(
        { source: 'Marketplace', count: Math.floor(currentLeads * 0.6), percentage: 60 },
        { source: 'Busca Orgânica', count: Math.floor(currentLeads * 0.25), percentage: 25 },
        { source: 'Redes Sociais', count: Math.floor(currentLeads * 0.15), percentage: 15 }
      )
    }

    // Generate insights
    const insights = []
    
    if (leadsChange > 20) {
      insights.push({
        type: 'positive' as const,
        title: 'Crescimento Excepcional de Leads',
        description: `Seus leads aumentaram ${leadsChange.toFixed(1)}% no período. Continue investindo nas estratégias que estão funcionando!`
      })
    } else if (leadsChange < -10) {
      insights.push({
        type: 'negative' as const,
        title: 'Queda nos Leads',
        description: `Houve uma redução de ${Math.abs(leadsChange).toFixed(1)}% nos leads. Considere revisar sua estratégia de marketing.`
      })
    }

    if (currentRating._avg.rating && currentRating._avg.rating > 4.5) {
      insights.push({
        type: 'positive' as const,
        title: 'Excelente Avaliação',
        description: `Sua avaliação média de ${currentRating._avg.rating.toFixed(1)} estrelas está excelente! Isso ajuda a atrair mais clientes.`
      })
    }

    if (currentProducts < 5) {
      insights.push({
        type: 'neutral' as const,
        title: 'Oportunidade de Crescimento',
        description: 'Considere adicionar mais produtos ao seu catálogo para aumentar sua visibilidade no marketplace.'
      })
    }

    const reportData = {
      period,
      metrics: {
        views: { 
          current: mockViews, 
          previous: Math.floor(mockViews * 0.9), 
          change: 10 
        },
        leads: { 
          current: currentLeads, 
          previous: previousLeads, 
          change: leadsChange 
        },
        products: { 
          current: currentProducts, 
          previous: currentProducts, 
          change: 0 
        },
        reviews: { 
          current: currentReviews, 
          previous: previousReviews, 
          change: reviewsChange 
        },
        rating: { 
          current: currentRating._avg.rating || 0, 
          previous: currentRating._avg.rating || 0, 
          change: 0 
        },
        revenue: { 
          current: mockRevenue, 
          previous: previousLeads * 2500, 
          change: leadsChange 
        },
      },
      charts: {
        viewsOverTime: [], // Would need view tracking
        leadsOverTime: [], // Would need daily lead tracking
        topProducts: formattedTopProducts,
        leadSources: formattedLeadSources,
      },
      insights
    }

    return NextResponse.json(reportData)

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}