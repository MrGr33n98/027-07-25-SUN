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
    const date = searchParams.get('date')

    let where: any = {}

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { company: { name: { contains: q, mode: 'insensitive' } } },
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (date && date !== 'all') {
      const now = new Date()
      let startDate: Date
      let endDate: Date

      switch (date) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          break
        case 'tomorrow':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2)
          break
        case 'week':
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          startOfWeek.setHours(0, 0, 0, 0)
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 7)
          startDate = startOfWeek
          endDate = endOfWeek
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          break
        default:
          startDate = new Date(0)
          endDate = new Date()
      }

      where.date = {
        gte: startDate,
        lt: endDate
      }
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          },
          company: {
            select: {
              name: true,
              verified: true,
            }
          }
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where })
    ])

    return NextResponse.json({
      data: appointments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}