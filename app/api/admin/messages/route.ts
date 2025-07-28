import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const q = searchParams.get('q')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    let where: any = {}

    if (q) {
      where.OR = [
        { subject: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { sender: { name: { contains: q, mode: 'insensitive' } } },
        { sender: { email: { contains: q, mode: 'insensitive' } } },
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (priority && priority !== 'all') {
      where.priority = priority
    }

    const [messages, total] = await Promise.all([
      prisma.supportMessage.findMany({
        where,
        include: {
          sender: {
            select: {
              name: true,
              email: true,
              role: true,
            }
          },
          recipient: {
            select: {
              name: true,
              email: true,
              role: true,
            }
          },
          replies: {
            include: {
              sender: {
                select: {
                  name: true,
                  role: true,
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.supportMessage.count({ where })
    ])

    return NextResponse.json({
      data: messages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}