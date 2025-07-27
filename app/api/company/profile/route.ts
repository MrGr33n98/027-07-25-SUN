import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateSlug } from '@/lib/utils'

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

    // Check if company profile already exists
    const existingCompany = await db.companyProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Company profile already exists' },
        { status: 400 }
      )
    }

    // Check if slug is unique
    const slugExists = await db.companyProfile.findUnique({
      where: { slug: data.slug }
    })

    if (slugExists) {
      return NextResponse.json(
        { error: 'URL já está em uso. Escolha outra.' },
        { status: 400 }
      )
    }

    const company = await db.companyProfile.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        logo: data.logo,
        banner: data.banner,
        location: data.location,
        city: data.city,
        state: data.state,
        phone: data.phone,
        email: data.email,
        website: data.website,
        whatsapp: data.whatsapp,
        instagram: data.instagram,
        linkedin: data.linkedin,
        specialties: data.specialties,
        certifications: data.certifications,
        yearsExperience: data.yearsExperience,
        teamSize: data.teamSize,
        serviceAreas: data.serviceAreas,
        userId: session.user.id,
      },
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error creating company profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'COMPANY') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()

    // Check if slug is unique (excluding current company)
    const slugExists = await db.companyProfile.findFirst({
      where: {
        slug: data.slug,
        userId: { not: session.user.id }
      }
    })

    if (slugExists) {
      return NextResponse.json(
        { error: 'URL já está em uso. Escolha outra.' },
        { status: 400 }
      )
    }

    const company = await db.companyProfile.update({
      where: { userId: session.user.id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        logo: data.logo,
        banner: data.banner,
        location: data.location,
        city: data.city,
        state: data.state,
        phone: data.phone,
        email: data.email,
        website: data.website,
        whatsapp: data.whatsapp,
        instagram: data.instagram,
        linkedin: data.linkedin,
        specialties: data.specialties,
        certifications: data.certifications,
        yearsExperience: data.yearsExperience,
        teamSize: data.teamSize,
        serviceAreas: data.serviceAreas,
      },
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error updating company profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}