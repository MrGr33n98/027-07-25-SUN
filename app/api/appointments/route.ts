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
      // Customer can only see their own appointments
      where.userId = session.user.id
    }

    if (status) {
      where.status = status
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
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
        orderBy: { date: 'asc' },
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, date, duration, location, companyId, notes } = await request.json()

    if (!title || !date || !location || !companyId) {
      return NextResponse.json(
        { error: 'Title, date, location and companyId are required' },
        { status: 400 }
      )
    }

    // Check if the time slot is available
    const appointmentDate = new Date(date)
    const endTime = new Date(appointmentDate.getTime() + (duration || 60) * 60000)

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        companyId,
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        },
        OR: [
          {
            AND: [
              { date: { lte: appointmentDate } },
              { date: { gte: new Date(appointmentDate.getTime() - 60 * 60000) } }
            ]
          }
        ]
      }
    })

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: 'Time slot not available' },
        { status: 400 }
      )
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        title,
        description,
        date: appointmentDate,
        duration: duration || 60,
        location,
        companyId,
        userId: session.user.id,
        notes,
      },
      include: {
        company: {
          select: {
            name: true,
            userId: true,
          }
        },
        user: {
          select: {
            name: true,
          }
        }
      }
    })

    // Create notification for company
    await prisma.notification.create({
      data: {
        title: 'Nova visita agendada!',
        message: `${appointment.user.name} agendou uma visita: ${title}`,
        type: 'APPOINTMENT_SCHEDULED',
        userId: appointment.company.userId,
        data: {
          appointmentId: appointment.id,
          customerName: appointment.user.name,
          date: appointmentDate.toISOString(),
        }
      }
    })

    return NextResponse.json(appointment, { status: 201 })

  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}