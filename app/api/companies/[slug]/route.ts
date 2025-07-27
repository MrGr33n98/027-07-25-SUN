import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const company = await db.companyProfile.findUnique({
      where: { slug: params.slug },
      include: {
        products: {
          take: 6,
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        projects: {
          take: 6,
          orderBy: { completionDate: 'desc' },
        },
        _count: {
          select: {
            products: true,
            reviews: true,
            projects: true,
          },
        },
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}