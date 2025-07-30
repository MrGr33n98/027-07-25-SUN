import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { securityLogger } from '@/lib/security-logger'
import { SecurityEventType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    const filters = {
      userId: searchParams.get('userId') || undefined,
      email: searchParams.get('email') || undefined,
      eventType: searchParams.get('eventType') as SecurityEventType || undefined,
      success: searchParams.get('success') ? searchParams.get('success') === 'true' : undefined,
      ipAddress: searchParams.get('ipAddress') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    }

    const events = await securityLogger.getSecurityEvents(filters)
    
    // Get total count for pagination (simplified - in production you'd want a separate count query)
    const totalCount = events.length >= filters.limit! ? filters.offset! + events.length + 1 : filters.offset! + events.length

    return NextResponse.json({
      events,
      totalCount,
      filters
    })
  } catch (error) {
    console.error('Error fetching security events:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}