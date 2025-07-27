import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/projects - List projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        orderBy: { completionDate: 'desc' },
        skip,
        take: limit,
        include: {
          company: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      }),
      db.project.count({ where }),
    ])

    return NextResponse.json({
      data: projects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create project
export async function POST(request: NextRequest) {
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

    const project = await db.project.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        power: data.power,
        completionDate: new Date(data.completionDate),
        projectType: data.projectType,
        client: data.client || null,
        duration: data.duration || null,
        challenges: data.challenges || null,
        solutions: data.solutions || null,
        results: data.results || null,
        images: data.images || [],
        companyId: company.id,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}