import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { securityLogger } from '@/lib/security-logger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Get user details before unlocking
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        accountLockedUntil: true,
        failedLoginAttempts: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (!user.accountLockedUntil) {
      return NextResponse.json(
        { error: 'Conta não está bloqueada' },
        { status: 400 }
      )
    }

    // Unlock the account
    await prisma.user.update({
      where: { id: userId },
      data: {
        accountLockedUntil: null,
        failedLoginAttempts: 0
      }
    })

    // Log the unlock event
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await securityLogger.logAccountUnlock(
      user.email,
      'admin',
      clientIP,
      userAgent,
      userId,
      session.user.id,
      {
        adminEmail: session.user.email,
        adminName: session.user.name,
        previousFailedAttempts: user.failedLoginAttempts,
        wasLockedUntil: user.accountLockedUntil.toISOString()
      }
    )

    return NextResponse.json({
      success: true,
      message: `Conta ${user.email} desbloqueada com sucesso`
    })
  } catch (error) {
    console.error('Error unlocking account:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}