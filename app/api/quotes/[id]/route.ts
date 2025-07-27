import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            verified: true,
            phone: true,
            email: true,
            website: true,
          }
        },
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            projectType: true,
            location: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Check permissions
    const hasAccess = 
      (session.user.role === 'COMPANY' && quote.company.id === session.user.id) ||
      (session.user.role === 'CUSTOMER' && quote.userId === session.user.id) ||
      session.user.role === 'ADMIN'

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Mark as viewed if customer is viewing
    if (session.user.role === 'CUSTOMER' && quote.status === 'SENT') {
      await prisma.quote.update({
        where: { id: params.id },
        data: { status: 'VIEWED' }
      })
    }

    return NextResponse.json(quote)

  } catch (error) {
    console.error('Error fetching quote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, title, description, items, validUntil, terms, notes } = await request.json()

    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: { company: true }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Check permissions for updates
    const canUpdate = 
      (session.user.role === 'COMPANY' && quote.company.userId === session.user.id) ||
      (session.user.role === 'CUSTOMER' && quote.userId === session.user.id && status) ||
      session.user.role === 'ADMIN'

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let updateData: any = {}

    // Customer can only update status (accept/reject)
    if (session.user.role === 'CUSTOMER') {
      if (status && ['ACCEPTED', 'REJECTED'].includes(status)) {
        updateData.status = status
        
        // Create notification for company
        await prisma.notification.create({
          data: {
            title: status === 'ACCEPTED' ? 'Cotação aceita!' : 'Cotação rejeitada',
            message: `${quote.user?.name || 'Cliente'} ${status === 'ACCEPTED' ? 'aceitou' : 'rejeitou'} sua cotação: ${quote.title}`,
            type: status === 'ACCEPTED' ? 'QUOTE_ACCEPTED' : 'QUOTE_REJECTED',
            userId: quote.company.userId,
            data: {
              quoteId: quote.id,
              customerName: quote.user?.name,
            }
          }
        })
      }
    } else {
      // Company can update all fields
      if (title) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (validUntil) updateData.validUntil = new Date(validUntil)
      if (terms !== undefined) updateData.terms = terms
      if (notes !== undefined) updateData.notes = notes
      if (status) updateData.status = status

      // Update items if provided
      if (items) {
        const totalValue = items.reduce((sum: number, item: any) => {
          return sum + (item.quantity * item.unitPrice)
        }, 0)
        
        updateData.totalValue = totalValue

        // Delete existing items and create new ones
        await prisma.quoteItem.deleteMany({
          where: { quoteId: params.id }
        })

        updateData.items = {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            category: item.category,
          }))
        }
      }
    }

    const updatedQuote = await prisma.quote.update({
      where: { id: params.id },
      data: updateData,
      include: {
        items: true,
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            verified: true,
          }
        }
      }
    })

    return NextResponse.json(updatedQuote)

  } catch (error) {
    console.error('Error updating quote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}