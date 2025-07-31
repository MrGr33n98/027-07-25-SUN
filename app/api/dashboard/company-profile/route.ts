import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateCompanyProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  location: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  yearsExperience: z.number().min(0).optional(),
  teamSize: z.string().optional(),
  serviceAreas: z.array(z.string()).optional(),
})

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (session.user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = updateCompanyProfileSchema.parse(body)

    // Verificar se a empresa existe
    const existingCompany = await db.companyProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!existingCompany) {
      return NextResponse.json({ error: 'Perfil da empresa não encontrado' }, { status: 404 })
    }

    // Gerar novo slug se o nome mudou
    let slug = existingCompany.slug
    if (validatedData.name !== existingCompany.name) {
      const baseSlug = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      slug = `${baseSlug}-${session.user.id.slice(-8)}`
    }

    // Atualizar perfil da empresa
    const updatedCompany = await db.companyProfile.update({
      where: { userId: session.user.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        phone: validatedData.phone || null,
        email: validatedData.email || null,
        website: validatedData.website || null,
        whatsapp: validatedData.whatsapp || null,
        instagram: validatedData.instagram || null,
        linkedin: validatedData.linkedin || null,
        city: validatedData.city || null,
        state: validatedData.state || null,
        location: validatedData.location || null,
        specialties: validatedData.specialties || [],
        yearsExperience: validatedData.yearsExperience || 0,
        teamSize: validatedData.teamSize || null,
        serviceAreas: validatedData.serviceAreas || [],
        slug,
      }
    })

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso!',
      company: updatedCompany
    })

  } catch (error) {
    console.error('Error updating company profile:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (session.user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const company = await db.companyProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Perfil da empresa não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ company })

  } catch (error) {
    console.error('Error fetching company profile:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}