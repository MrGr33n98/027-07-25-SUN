import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Get the original message
    const originalMessage = await prisma.supportMessage.findUnique({
      where: { id: params.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!originalMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Create the reply
    const reply = await prisma.supportMessageReply.create({
      data: {
        content: content.trim(),
        messageId: params.id,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: {
            name: true,
            role: true,
          }
        }
      }
    })

    // Update message status to IN_PROGRESS if it was OPEN
    if (originalMessage.status === 'OPEN') {
      await prisma.supportMessage.update({
        where: { id: params.id },
        data: { status: 'IN_PROGRESS' }
      })
    }

    // Create notification for original sender
    await prisma.notification.create({
      data: {
        title: 'Nova resposta à sua mensagem',
        message: `Você recebeu uma resposta do administrador sobre: "${originalMessage.subject}"`,
        type: 'MESSAGE_REPLY',
        userId: originalMessage.sender.id,
        data: {
          messageId: originalMessage.id,
          messageSubject: originalMessage.subject,
          replyId: reply.id,
          repliedBy: session.user.id,
        }
      }
    })

    return NextResponse.json(reply)
  } catch (error) {
    console.error('Error creating reply:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}