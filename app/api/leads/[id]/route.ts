import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// PUT /api/leads/[id] - Update lead status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'COMPANY') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()

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

    // Update lead
    const lead = await db.lead.update({
      where: {
        id: params.id,
        companyId: company.id, // Ensure lead belongs to company
      },
      data: {
        status: data.status,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}