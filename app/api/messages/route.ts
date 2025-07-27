import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await prisma.message.findMany({
        where: {
          conversationId,
          OR: [
            { senderId: session.user.id },
            { receiverId: session.user.id }
          ]
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      })

      return NextResponse.json({ data: messages })
    } else {
      // Get all conversations for the user
      const conversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              id: session.user.id
            }
          }
        },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })

      return NextResponse.json({ data: conversations })
    }

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, receiverId, conversationId } = await request.json()

    if (!content || !receiverId) {
      return NextResponse.json(
        { error: 'Content and receiverId are required' },
        { status: 400 }
      )
    }

    let finalConversationId = conversationId

    // If no conversation ID provided, find or create conversation
    if (!finalConversationId) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          participants: {
            every: {
              id: {
                in: [session.user.id, receiverId]
              }
            }
          }
        }
      })

      if (existingConversation) {
        finalConversationId = existingConversation.id
      } else {
        const newConversation = await prisma.conversation.create({
          data: {
            participants: {
              connect: [
                { id: session.user.id },
                { id: receiverId }
              ]
            }
          }
        })
        finalConversationId = newConversation.id
      }
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        receiverId,
        conversationId: finalConversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: finalConversationId },
      data: { updatedAt: new Date() }
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        title: 'Nova mensagem',
        message: `${session.user.name} enviou uma mensagem: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        type: 'MESSAGE_RECEIVED',
        userId: receiverId,
        data: {
          conversationId: finalConversationId,
          senderId: session.user.id,
        }
      }
    })

    return NextResponse.json(message)

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}