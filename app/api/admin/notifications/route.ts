import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (type && type !== 'all') {
      where.type = type
    }
    
    if (status && status !== 'all') {
      where.status = status
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: notifications,
      total,
      totalPages,
      currentPage: page
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, message, type, targetUsers } = body

    // Validate input
    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'Title, message and type are required' },
        { status: 400 }
      )
    }

    const validTypes = ['INFO', 'WARNING', 'SUCCESS', 'ERROR', 'MAINTENANCE']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Create notifications
    const notifications = []
    
    if (targetUsers && targetUsers.length > 0) {
      // Send to specific users
      for (const userId of targetUsers) {
        const notification = await prisma.notification.create({
          data: {
            title,
            message,
            type,
            userId,
            status: 'UNREAD'
          }
        })
        notifications.push(notification)
      }
    } else {
      // Send to all users
      const users = await prisma.user.findMany({
        select: { id: true }
      })
      
      for (const user of users) {
        const notification = await prisma.notification.create({
          data: {
            title,
            message,
            type,
            userId: user.id,
            status: 'UNREAD'
          }
        })
        notifications.push(notification)
      }
    }

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: 'NOTIFICATION_SEND',
        details: {
          title,
          type,
          targetCount: notifications.length
        }
      }
    }).catch(() => {
      // Log creation is optional
    })

    return NextResponse.json({
      success: true,
      count: notifications.length
    })

  } catch (error) {
    console.error('Error creating notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}