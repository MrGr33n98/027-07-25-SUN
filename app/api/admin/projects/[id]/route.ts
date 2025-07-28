import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, reason } = await request.json()

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        status,
        moderatedAt: new Date(),
        moderatedBy: session.user.id,
        ...(reason && { rejectionReason: reason })
      },
      include: {
        company: {
          select: {
            userId: true,
            name: true,
          }
        }
      }
    })

    // Create notification for company
    await prisma.notification.create({
      data: {
        title: status === 'APPROVED' ? 'Projeto aprovado!' : 'Projeto rejeitado',
        message: status === 'APPROVED' 
          ? `Seu projeto "${project.title}" foi aprovado e está visível no portfólio`
          : `Seu projeto "${project.title}" foi rejeitado. ${reason ? `Motivo: ${reason}` : ''}`,
        type: status === 'APPROVED' ? 'PROJECT_APPROVED' : 'PROJECT_REJECTED',
        userId: project.company.userId,
        data: {
          projectId: project.id,
          projectTitle: project.title,
          reason
        }
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.project.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}