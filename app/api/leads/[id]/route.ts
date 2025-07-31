import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Schema de validação para atualização de lead
const updateLeadSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED', 'LOST']).optional(),
  notes: z.string().optional()
})

// GET - Buscar lead específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'COMPANY') {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Busca o perfil da empresa
    const companyProfile = await db.companyProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!companyProfile) {
      return NextResponse.json(
        { message: 'Perfil da empresa não encontrado' },
        { status: 404 }
      )
    }

    // Buscar lead específico
    const lead = await db.lead.findFirst({
      where: {
        id: params.id,
        companyId: companyProfile.id
      },
      include: {
        quotes: {
          include: {
            items: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!lead) {
      return NextResponse.json(
        { message: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: lead })

  } catch (error) {
    console.error('Lead GET error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar lead
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'COMPANY') {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validar dados
    const validatedData = updateLeadSchema.parse(body)

    // Busca o perfil da empresa
    const companyProfile = await db.companyProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!companyProfile) {
      return NextResponse.json(
        { message: 'Perfil da empresa não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o lead pertence à empresa
    const existingLead = await db.lead.findFirst({
      where: {
        id: params.id,
        companyId: companyProfile.id
      }
    })

    if (!existingLead) {
      return NextResponse.json(
        { message: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar lead
    const updatedLead = await db.lead.update({
      where: { id: params.id },
      data: {
        status: validatedData.status || existingLead.status,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Lead atualizado com sucesso',
      data: updatedLead
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Dados inválidos',
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Lead PUT error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'COMPANY') {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Busca o perfil da empresa
    const companyProfile = await db.companyProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!companyProfile) {
      return NextResponse.json(
        { message: 'Perfil da empresa não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o lead pertence à empresa
    const existingLead = await db.lead.findFirst({
      where: {
        id: params.id,
        companyId: companyProfile.id
      }
    })

    if (!existingLead) {
      return NextResponse.json(
        { message: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    // Excluir lead (cascade vai excluir quotes relacionadas)
    await db.lead.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Lead excluído com sucesso'
    })

  } catch (error) {
    console.error('Lead DELETE error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}