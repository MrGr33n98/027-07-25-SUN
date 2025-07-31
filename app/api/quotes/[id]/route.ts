import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Schema de validação para atualização de orçamento
const updateQuoteSchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres').optional(),
  description: z.string().optional(),
  totalValue: z.number().positive('Valor total deve ser positivo').optional(),
  validUntil: z.string().refine((date) => {
    const validUntilDate = new Date(date)
    return validUntilDate > new Date()
  }, 'Data de validade deve ser futura').optional(),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(2, 'Descrição do item é obrigatória'),
    quantity: z.number().int().positive('Quantidade deve ser positiva'),
    unitPrice: z.number().positive('Preço unitário deve ser positivo'),
    category: z.string().optional()
  })).optional()
})

// GET - Buscar orçamento específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Verificar se é uma empresa ou o cliente que está acessando
    if (session.user.role === 'COMPANY') {
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

      // Buscar orçamento da empresa
      const quote = await db.quote.findFirst({
        where: {
          id: params.id,
          companyId: companyProfile.id
        },
        include: {
          items: true,
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              location: true,
              projectType: true,
              budget: true,
              message: true
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
      })

      if (!quote) {
        return NextResponse.json(
          { message: 'Orçamento não encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json({ data: quote })

    } else if (session.user.role === 'CUSTOMER') {
      // Cliente pode ver seus próprios orçamentos
      const quote = await db.quote.findFirst({
        where: {
          id: params.id,
          userId: session.user.id
        },
        include: {
          items: true,
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              phone: true,
              email: true,
              website: true,
              rating: true,
              reviewCount: true
            }
          }
        }
      })

      if (!quote) {
        return NextResponse.json(
          { message: 'Orçamento não encontrado' },
          { status: 404 }
        )
      }

      // Marcar como visualizado se ainda não foi
      if (quote.status === 'SENT') {
        await db.quote.update({
          where: { id: params.id },
          data: { status: 'VIEWED' }
        })
      }

      return NextResponse.json({ data: quote })
    }

    return NextResponse.json(
      { message: 'Acesso negado' },
      { status: 403 }
    )

  } catch (error) {
    console.error('Quote GET error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar orçamento
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
    const validatedData = updateQuoteSchema.parse(body)

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

    // Verificar se o orçamento pertence à empresa
    const existingQuote = await db.quote.findFirst({
      where: {
        id: params.id,
        companyId: companyProfile.id
      },
      include: {
        items: true
      }
    })

    if (!existingQuote) {
      return NextResponse.json(
        { message: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {
      updatedAt: new Date()
    }

    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.totalValue !== undefined) updateData.totalValue = validatedData.totalValue
    if (validatedData.validUntil !== undefined) updateData.validUntil = new Date(validatedData.validUntil)
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.terms !== undefined) updateData.terms = validatedData.terms
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes

    // Atualizar orçamento em transação se houver itens
    const updatedQuote = await db.$transaction(async (tx) => {
      // Atualizar orçamento
      const quote = await tx.quote.update({
        where: { id: params.id },
        data: updateData
      })

      // Atualizar itens se fornecidos
      if (validatedData.items) {
        // Remover itens existentes
        await tx.quoteItem.deleteMany({
          where: { quoteId: params.id }
        })

        // Criar novos itens
        const itemsWithTotals = validatedData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          category: item.category,
          quoteId: params.id
        }))

        await tx.quoteItem.createMany({
          data: itemsWithTotals
        })
      }

      return quote
    })

    // Buscar orçamento atualizado com itens
    const finalQuote = await db.quote.findUnique({
      where: { id: params.id },
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
      message: 'Orçamento atualizado com sucesso',
      data: finalQuote
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

    console.error('Quote PUT error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir orçamento
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

    // Verificar se o orçamento pertence à empresa
    const existingQuote = await db.quote.findFirst({
      where: {
        id: params.id,
        companyId: companyProfile.id
      }
    })

    if (!existingQuote) {
      return NextResponse.json(
        { message: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }

    // Não permitir exclusão de orçamentos já enviados
    if (existingQuote.status !== 'DRAFT') {
      return NextResponse.json(
        { message: 'Não é possível excluir orçamentos já enviados' },
        { status: 400 }
      )
    }

    // Excluir orçamento (cascade vai excluir itens relacionados)
    await db.quote.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Orçamento excluído com sucesso'
    })

  } catch (error) {
    console.error('Quote DELETE error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}