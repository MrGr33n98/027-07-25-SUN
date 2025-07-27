import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const date = searchParams.get('date')

    if (!companyId || !date) {
      return NextResponse.json(
        { error: 'CompanyId and date are required' },
        { status: 400 }
      )
    }

    // Generate time slots for the day (9 AM to 6 PM)
    const timeSlots = []
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        timeSlots.push(time)
      }
    }

    // Get existing appointments for the date
    const startOfDay = new Date(`${date}T00:00:00`)
    const endOfDay = new Date(`${date}T23:59:59`)

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        companyId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      },
      select: {
        date: true,
        duration: true,
      }
    })

    // Check availability for each slot
    const availableSlots = timeSlots.map(time => {
      const slotDateTime = new Date(`${date}T${time}:00`)
      
      // Check if this slot conflicts with any existing appointment
      const isAvailable = !existingAppointments.some(appointment => {
        const appointmentStart = new Date(appointment.date)
        const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000)
        
        return slotDateTime >= appointmentStart && slotDateTime < appointmentEnd
      })

      return {
        time,
        available: isAvailable
      }
    })

    return NextResponse.json({ slots: availableSlots })

  } catch (error) {
    console.error('Error fetching available slots:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}