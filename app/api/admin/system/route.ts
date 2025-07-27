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

    // Get system health metrics
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // Get database stats
    const [userCount, productCount, reviewCount, leadCount] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.review.count(),
      prisma.lead.count()
    ]);

    // Mock system metrics (in a real app, you'd get these from actual system monitoring)
    const systemMetrics = {
      services: [
        {
          name: 'Database',
          status: dbLatency < 100 ? 'healthy' : dbLatency < 500 ? 'warning' : 'error',
          latency: `${dbLatency}ms`,
          uptime: '99.9%'
        },
        {
          name: 'API Server',
          status: 'healthy',
          latency: '45ms',
          uptime: '99.8%'
        },
        {
          name: 'File Storage',
          status: 'healthy',
          latency: '23ms',
          uptime: '99.9%'
        },
        {
          name: 'Email Service',
          status: 'healthy',
          latency: '156ms',
          uptime: '99.7%'
        }
      ],
      performance: {
        cpuUsage: Math.floor(Math.random() * 30) + 20, // Mock CPU usage
        memoryUsage: Math.floor(Math.random() * 40) + 30, // Mock memory usage
        diskUsage: Math.floor(Math.random() * 20) + 40, // Mock disk usage
        activeConnections: Math.floor(Math.random() * 100) + 50
      },
      database: {
        totalRecords: userCount + productCount + reviewCount + leadCount,
        users: userCount,
        products: productCount,
        reviews: reviewCount,
        leads: leadCount,
        size: '2.3 GB',
        connections: Math.floor(Math.random() * 10) + 5
      }
    };

    return NextResponse.json(systemMetrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}