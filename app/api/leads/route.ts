import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/leads - List leads for company
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'COMPANY') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit

    // Get company profile
    const company = await db.companyProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    const where: any = { companyId: company.id }
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.lead.count({ where }),
    ])

    return NextResponse.json({
      data: leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/leads - Create lead (from quote form)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const lead = await db.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        projectType: data.projectType,
        budget: data.budget,
        message: data.message,
        source: data.source || 'Website',
        companyId: data.companyId,
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}