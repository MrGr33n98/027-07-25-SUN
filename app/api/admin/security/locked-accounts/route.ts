import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Get all accounts that have a lockout time set (even if expired)
    const lockedAccounts = await prisma.user.findMany({
      where: {
        accountLockedUntil: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        failedLoginAttempts: true,
        accountLockedUntil: true,
        lastLoginAt: true,
        lastLoginIP: true,
      },
      orderBy: {
        accountLockedUntil: 'desc'
      }
    })

    const accounts = lockedAccounts.map(account => ({
      ...account,
      accountLockedUntil: account.accountLockedUntil!.toISOString(),
      lastLoginAt: account.lastLoginAt?.toISOString(),
    }))

    return NextResponse.json({
      accounts,
      totalCount: accounts.length
    })
  } catch (error) {
    console.error('Error fetching locked accounts:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}