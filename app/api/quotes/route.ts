import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Schema de validação para criação de orçamento
const createQuoteSchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  description: z.string().optional(),
  totalValue: z.number().positive('Valor total deve ser positivo'),
  validUntil: z.string().refine((date) => {
    const validUntilDate = new Date(date)
    return validUntilDate > new Date()
  }, 'Data de validade deve ser futura'),
  leadId: z.string().cuid('ID do lead inválido').optional(),
  userId: z.string().cuid('ID do usuário inválido').optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(2, 'Descrição do item é obrigatória'),
    quantity: z.number().int().positive('Quantidade deve ser positiva'),
    unitPrice: z.number().positive('Preço unitário deve ser positivo'),
    category: z.string().optional()
  })).min(1, 'Pelo menos um item é obrigatório')
})

// GET - Listar orçamentos da empresa
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

    // Buscar orçamentos com paginação
    const [quotes, total] = await Promise.all([
      db.quote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: true,
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              projectType: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      db.quote.count({ where })
    ])

    return NextResponse.json({
      data: quotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Quotes GET error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo orçamento
export async function POST(request: NextRequest) {
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
    const validatedData = createQuoteSchema.parse(body)

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

    // Verificar se o lead existe e pertence à empresa (se fornecido)
    if (validatedData.leadId) {
      const lead = await db.lead.findFirst({
        where: {
          id: validatedData.leadId,
          companyId: companyProfile.id
        }
      })

      if (!lead) {
        return NextResponse.json(
          { message: 'Lead não encontrado' },
          { status: 404 }
        )
      }
    }

    // Calcular preços dos itens
    const itemsWithTotals = validatedData.items.map(item => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice
    }))

    // Verificar se o total bate
    const calculatedTotal = itemsWithTotals.reduce((sum, item) => sum + item.totalPrice, 0)
    
    if (Math.abs(calculatedTotal - validatedData.totalValue) > 0.01) {
      return NextResponse.json(
        { message: 'Valor total não confere com a soma dos itens' },
        { status: 400 }
      )
    }

    // Criar o orçamento
    const quote = await db.quote.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        totalValue: validatedData.totalValue,
        validUntil: new Date(validatedData.validUntil),
        terms: validatedData.terms,
        notes: validatedData.notes,
        companyId: companyProfile.id,
        leadId: validatedData.leadId,
        userId: validatedData.userId,
        status: 'DRAFT',
        items: {
          create: itemsWithTotals
        }
      },
      include: {
        items: true,
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            projectType: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Orçamento criado com sucesso',
      data: quote
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

    console.error('Quotes POST error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}