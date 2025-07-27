import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get overview metrics
    const [
      totalUsers,
      totalProducts,
      totalReviews,
      totalLeads,
      newUsers,
      newProducts,
      newReviews,
      newLeads,
      usersByRole,
      productsByCategory,
      productsByStatus,
      reviewsByRating
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.product.count(),
      prisma.review.count(),
      prisma.lead.count(),
      
      // New in period
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.product.count({ where: { createdAt: { gte: startDate } } }),
      prisma.review.count({ where: { createdAt: { gte: startDate } } }),
      prisma.lead.count({ where: { createdAt: { gte: startDate } } }),
      
      // Breakdowns
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      prisma.product.groupBy({
        by: ['category'],
        _count: { category: true }
      }),
      prisma.product.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.review.groupBy({
        by: ['rating'],
        _count: { rating: true }
      })
    ]);

    // Get daily growth data for charts
    const dailyGrowth = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(CASE WHEN table_name = 'User' THEN 1 END) as users,
        COUNT(CASE WHEN table_name = 'Product' THEN 1 END) as products,
        COUNT(CASE WHEN table_name = 'Review' THEN 1 END) as reviews,
        COUNT(CASE WHEN table_name = 'Lead' THEN 1 END) as leads
      FROM (
        SELECT created_at, 'User' as table_name FROM "User" WHERE created_at >= ${startDate}
        UNION ALL
        SELECT created_at, 'Product' as table_name FROM "Product" WHERE created_at >= ${startDate}
        UNION ALL
        SELECT created_at, 'Review' as table_name FROM "Review" WHERE created_at >= ${startDate}
        UNION ALL
        SELECT created_at, 'Lead' as table_name FROM "Lead" WHERE created_at >= ${startDate}
      ) combined
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    const reports = {
      overview: {
        totalUsers,
        totalProducts,
        totalReviews,
        totalLeads,
        newUsers,
        newProducts,
        newReviews,
        newLeads,
        growth: {
          users: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : '0',
          products: totalProducts > 0 ? ((newProducts / totalProducts) * 100).toFixed(1) : '0',
          reviews: totalReviews > 0 ? ((newReviews / totalReviews) * 100).toFixed(1) : '0',
          leads: totalLeads > 0 ? ((newLeads / totalLeads) * 100).toFixed(1) : '0',
        }
      },
      breakdowns: {
        usersByRole: usersByRole.map(item => ({
          name: item.role,
          value: item._count.role
        })),
        productsByCategory: productsByCategory.map(item => ({
          name: item.category,
          value: item._count.category
        })),
        productsByStatus: productsByStatus.map(item => ({
          name: item.status,
          value: item._count.status
        })),
        reviewsByRating: reviewsByRating.map(item => ({
          name: `${item.rating} estrelas`,
          value: item._count.rating
        }))
      },
      dailyGrowth
    };

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching admin reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}