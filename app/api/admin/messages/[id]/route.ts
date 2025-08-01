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
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const message = await prisma.supportMessage.findUnique({
      where: { id: params.id },
      include: {
        sender: {
          select: {
            name: true,
            email: true,
            role: true,
          }
        },
        recipient: {
          select: {
            name: true,
            email: true,
            role: true,
          }
        },
        replies: {
          include: {
            sender: {
              select: {
                name: true,
                role: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error fetching message:', error)
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
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, priority } = await request.json()

    const updateData: any = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority

    const message = await prisma.supportMessage.update({
      where: { id: params.id },
      data: updateData,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Create notification for sender about status change
    if (status) {
      let title = ''
      let messageText = ''
      let type = 'MESSAGE_UPDATE'

      switch (status) {
        case 'IN_PROGRESS':
          title = 'Mensagem em andamento'
          messageText = 'Sua mensagem está sendo processada por nossa equipe.'
          break
        case 'RESOLVED':
          title = 'Mensagem resolvida'
          messageText = 'Sua mensagem foi resolvida. Obrigado pelo contato!'
          type = 'MESSAGE_RESOLVED'
          break
        case 'CLOSED':
          title = 'Mensagem fechada'
          messageText = 'Sua mensagem foi fechada.'
          break
      }

      if (title) {
        await prisma.notification.create({
          data: {
            title,
            message: messageText,
            type: type as any,
            userId: message.sender.id,
            data: {
              messageId: message.id,
              messageSubject: message.subject,
              newStatus: status,
              updatedBy: session.user.id,
            }
          }
        })
      }
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}