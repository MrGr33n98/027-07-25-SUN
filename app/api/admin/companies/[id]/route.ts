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
    const { verified, status } = body

    const updateData: any = {}
    if (typeof verified === 'boolean') updateData.verified = verified
    if (status) updateData.status = status

    const company = await prisma.companyProfile.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Create notification for company about verification/status change
    let title = ''
    let message = ''
    let type = 'COMPANY_UPDATE'

    if (typeof verified === 'boolean') {
      if (verified) {
        title = 'Empresa verificada!'
        message = 'Parabéns! Sua empresa foi verificada e agora possui o selo de confiança.'
        type = 'COMPANY_VERIFIED'
      } else {
        title = 'Verificação removida'
        message = 'A verificação da sua empresa foi removida. Entre em contato conosco se tiver dúvidas.'
        type = 'COMPANY_UNVERIFIED'
      }
    }

    if (status) {
      if (status === 'SUSPENDED') {
        title = 'Empresa suspensa'
        message = 'Sua empresa foi suspensa por um administrador. Entre em contato conosco se tiver dúvidas.'
        type = 'COMPANY_SUSPENDED'
      } else if (status === 'ACTIVE') {
        title = 'Empresa reativada'
        message = 'Sua empresa foi reativada e você pode usar normalmente a plataforma.'
        type = 'COMPANY_ACTIVATED'
      }
    }

    if (title) {
      await prisma.notification.create({
        data: {
          title,
          message,
          type,
          userId: company.user.id,
          data: {
            companyId: company.id,
            companyName: company.name,
            changedBy: session.user.id,
            verified: updateData.verified,
            status: updateData.status,
          }
        }
      })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error updating company:', error)
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

    // Check if company has dependencies
    const companyWithDeps = await prisma.companyProfile.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true,
            reviews: true,
            appointments: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    if (!companyWithDeps) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // If company has dependencies, just suspend instead of delete
    if (companyWithDeps._count.products > 0 || companyWithDeps._count.reviews > 0 || companyWithDeps._count.appointments > 0) {
      await prisma.companyProfile.update({
        where: { id: params.id },
        data: { 
          status: 'SUSPENDED',
          name: `[Empresa Removida] ${companyWithDeps.name}`,
        }
      })

      // Notify user
      await prisma.notification.create({
        data: {
          title: 'Empresa removida',
          message: 'Sua empresa foi removida da plataforma por um administrador.',
          type: 'COMPANY_REMOVED',
          userId: companyWithDeps.user.id,
          data: {
            companyId: companyWithDeps.id,
            companyName: companyWithDeps.name,
            removedBy: session.user.id,
          }
        }
      })
    } else {
      // Safe to delete if no dependencies
      await prisma.companyProfile.delete({
        where: { id: params.id }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}