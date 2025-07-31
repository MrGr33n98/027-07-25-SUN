import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail, createQuoteEmailTemplate } from '@/lib/email'

// POST - Enviar orçamento por email
export async function POST(
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
    const { customerEmail, customerName } = body

    if (!customerEmail || !customerName) {
      return NextResponse.json(
        { message: 'Email e nome do cliente são obrigatórios' },
        { status: 400 }
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

    // Buscar orçamento completo
    const quote = await db.quote.findFirst({
      where: {
        id: params.id,
        companyId: companyProfile.id
      },
      include: {
        items: true,
        company: {
          select: {
            name: true,
            logo: true,
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

    // Verificar se orçamento não está expirado
    if (new Date(quote.validUntil) < new Date()) {
      return NextResponse.json(
        { message: 'Este orçamento já expirou' },
        { status: 400 }
      )
    }

    // Criar URL para visualização do orçamento (público)
    const quoteUrl = `${process.env.NEXTAUTH_URL}/orcamento/${quote.id}`

    // Criar template do email
    const emailHtml = createQuoteEmailTemplate({
      customerName,
      companyName: quote.company.name,
      companyLogo: quote.company.logo || undefined,
      quoteTitle: quote.title,
      totalValue: Number(quote.totalValue),
      validUntil: quote.validUntil.toISOString(),
      items: quote.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      })),
      terms: quote.terms || undefined,
      quoteUrl
    })

    // Enviar email
    const emailResult = await sendEmail({
      to: customerEmail,
      subject: `Orçamento de ${quote.company.name} - ${quote.title}`,
      html: emailHtml,
      from: `${quote.company.name} <noreply@solarconnect.com.br>`,
      replyTo: quote.company.email || undefined
    })

    if (!emailResult.success) {
      return NextResponse.json(
        { message: 'Erro ao enviar email' },
        { status: 500 }
      )
    }

    // Atualizar status do orçamento para SENT se ainda estiver DRAFT
    if (quote.status === 'DRAFT') {
      await db.quote.update({
        where: { id: params.id },
        data: { status: 'SENT' }
      })
    }

    // Registrar o envio do email
    await db.notification.create({
      data: {
        title: 'Orçamento Enviado por Email',
        message: `Orçamento "${quote.title}" foi enviado para ${customerName} (${customerEmail})`,
        type: 'QUOTE_RECEIVED',
        userId: session.user.id,
        data: {
          quoteId: quote.id,
          customerEmail,
          customerName
        }
      }
    })

    return NextResponse.json({
      message: 'Orçamento enviado por email com sucesso',
      data: {
        quoteId: quote.id,
        emailSent: true,
        recipientEmail: customerEmail,
        recipientName: customerName,
        sentAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Quote email send error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}