import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import {
  sendEmail,
  createNewLeadEmailTemplate,
  createLeadConfirmationEmailTemplate
} from '@/lib/email'

// Schema de validação para criação de lead
const createLeadSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 caracteres'),
  location: z.string().min(2, 'Localização é obrigatória'),
  projectType: z.string().min(2, 'Tipo de projeto é obrigatório'),
  budget: z.string().optional(),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
  source: z.string().optional(),
  companyId: z.string().cuid('ID da empresa inválido')
})

// GET - Listar leads da empresa
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {
      companyId: companyProfile.id
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }

    // Buscar leads com paginação
    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          quotes: {
            select: {
              id: true,
              status: true,
              totalValue: true,
              createdAt: true
            }
          }
        }
      }),
      db.lead.count({ where })
    ])

    return NextResponse.json({
      data: leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Leads GET error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo lead (público)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados
    const validatedData = createLeadSchema.parse(body)

    // Verificar se a empresa existe
    const company = await db.companyProfile.findUnique({
      where: { id: validatedData.companyId },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    if (!company) {
      return NextResponse.json(
        { message: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // Criar o lead
    const lead = await db.lead.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        location: validatedData.location,
        projectType: validatedData.projectType,
        budget: validatedData.budget,
        message: validatedData.message,
        source: validatedData.source || 'website',
        companyId: validatedData.companyId,
        status: 'NEW'
      }
    })

    // Criar notificação para a empresa
    await db.notification.create({
      data: {
        title: 'Novo Lead Recebido',
        message: `${validatedData.name} enviou uma solicitação de orçamento para ${validatedData.projectType}`,
        type: 'LEAD_RECEIVED',
        userId: company.userId,
        data: {
          leadId: lead.id,
          leadName: validatedData.name,
          projectType: validatedData.projectType
        }
      }
    })

    // Enviar email para a empresa
    try {
      const emailHtml = createNewLeadEmailTemplate({
        companyName: company.name,
        leadName: validatedData.name,
        leadEmail: validatedData.email,
        leadPhone: validatedData.phone,
        projectType: validatedData.projectType,
        location: validatedData.location,
        budget: validatedData.budget,
        message: validatedData.message,
        dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard/leads`
      })

      await sendEmail({
        to: company.user.email,
        subject: `Novo Lead: ${validatedData.name} - ${validatedData.projectType}`,
        html: emailHtml,
        replyTo: validatedData.email
      })
    } catch (emailError) {
      console.error('Error sending lead notification email:', emailError)
      // Não falha a operação se o email não for enviado
    }

    // Enviar email de confirmação para o cliente
    try {
      const confirmationHtml = createLeadConfirmationEmailTemplate({
        customerName: validatedData.name,
        companyName: company.name,
        projectType: validatedData.projectType,
        message: validatedData.message
      })

      await sendEmail({
        to: validatedData.email,
        subject: `Confirmação: Sua solicitação foi enviada para ${company.name}`,
        html: confirmationHtml
      })
    } catch (emailError) {
      console.error('Error sending lead confirmation email:', emailError)
      // Não falha a operação se o email não for enviado
    }

    return NextResponse.json({
      message: 'Solicitação enviada com sucesso',
      data: lead
    }, { status: 201 })

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

    console.error('Leads POST error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}