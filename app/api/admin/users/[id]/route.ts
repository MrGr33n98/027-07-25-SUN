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
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { status, role } = body

    // Validate input
    if (status && !['ACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    if (role && !['USER', 'COMPANY', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(role && { role }),
        updatedAt: new Date()
      },
      include: {
        companyProfile: {
          select: {
            name: true,
            verified: true
          }
        },
        _count: {
          select: {
            appointments: true,
            reviews: true
          }
        }
      }
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: 'USER_UPDATE',
        targetId: id,
        details: {
          changes: { status, role },
          targetType: 'USER'
        }
      }
    }).catch(() => {
      // Log creation is optional, don't fail the request
    })

    return NextResponse.json(updatedUser)

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
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Soft delete - just mark as deleted
    await prisma.user.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        email: `deleted_${Date.now()}_${existingUser.email}`,
        updatedAt: new Date()
      }
    })

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: 'USER_DELETE',
        targetId: id,
        details: {
          targetType: 'USER',
          originalEmail: existingUser.email
        }
      }
    }).catch(() => {
      // Log creation is optional
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}