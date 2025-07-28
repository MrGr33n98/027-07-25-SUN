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

    const body = await request.json()
    const { status, role } = body

    // Prevent admin from changing their own role or status
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own account' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (role) updateData.role = role

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        companyProfile: {
          select: {
            name: true,
            verified: true,
          }
        },
        _count: {
          select: {
            appointments: true,
            reviews: true,
          }
        }
      }
    })

    // Create notification for user about status/role change
    if (status || role) {
      let title = ''
      let message = ''
      let type = 'ACCOUNT_UPDATE'

      if (status === 'SUSPENDED') {
        title = 'Conta suspensa'
        message = 'Sua conta foi suspensa por um administrador. Entre em contato conosco se tiver dúvidas.'
        type = 'ACCOUNT_SUSPENDED'
      } else if (status === 'ACTIVE') {
        title = 'Conta reativada'
        message = 'Sua conta foi reativada e você pode usar normalmente a plataforma.'
        type = 'ACCOUNT_ACTIVATED'
      } else if (role) {
        title = 'Papel alterado'
        message = `Seu papel na plataforma foi alterado para ${role === 'ADMIN' ? 'Administrador' : role === 'COMPANY' ? 'Empresa' : 'Usuário'}.`
        type = 'ROLE_CHANGED'
      }

      if (title) {
        await prisma.notification.create({
          data: {
            title,
            message,
            type,
            userId: params.id,
            data: {
              changedBy: session.user.id,
              newStatus: status,
              newRole: role,
            }
          }
        })
      }
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
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

    // Prevent admin from deleting their own account
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user has dependencies
    const userWithDeps = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            appointments: true,
            reviews: true,
            companyProfile: true,
          }
        }
      }
    })

    if (!userWithDeps) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If user has dependencies, just deactivate instead of delete
    if (userWithDeps._count.appointments > 0 || userWithDeps._count.reviews > 0 || userWithDeps._count.companyProfile > 0) {
      await prisma.user.update({
        where: { id: params.id },
        data: { 
          status: 'SUSPENDED',
          email: `deleted_${Date.now()}_${userWithDeps.email}`,
          name: '[Usuário Removido]'
        }
      })
    } else {
      // Safe to delete if no dependencies
      await prisma.user.delete({
        where: { id: params.id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}