import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, createPasswordResetEmailTemplate } from '@/lib/email'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

const resetRequestSchema = z.object({
  email: z.string().email('Email inválido')
})

const resetCompleteSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
})

// POST - Solicitar reset de senha
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = resetRequestSchema.parse(body)

    // Buscar usuário pelo email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Sempre retorna sucesso por segurança (não revela se email existe)
    if (!user) {
      return NextResponse.json({
        message: 'Se o email existir, você receberá instruções para redefinir sua senha.'
      })
    }

    // Gerar token único
    const resetToken = randomBytes(32).toString('hex')
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Salvar token no banco
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry
      }
    })

    // Criar URL de reset
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`

    // Enviar email
    try {
      const emailHtml = createPasswordResetEmailTemplate({
        userName: user.name || 'Usuário',
        resetUrl,
        expiresIn: '1 hora'
      })

      await sendEmail({
        to: user.email,
        subject: 'Redefinir senha - SolarConnect',
        html: emailHtml
      })
    } catch (emailError) {
      console.error('Error sending reset email:', emailError)
      return NextResponse.json(
        { message: 'Erro ao enviar email. Tente novamente.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Se o email existir, você receberá instruções para redefinir sua senha.'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Dados inválidos',
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Password reset request error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Completar reset de senha
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetCompleteSchema.parse(body)

    // Buscar usuário pelo token
    const user = await db.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: {
          gt: new Date() // Token ainda válido
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Atualizar senha e limpar token
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        // Reset tentativas de login falho
        failedLoginAttempts: 0,
        accountLockedUntil: null
      }
    })

    return NextResponse.json({
      message: 'Senha redefinida com sucesso!'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Dados inválidos',
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Password reset complete error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
