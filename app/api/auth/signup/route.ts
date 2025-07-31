import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db } from '@/lib/db'
import { z } from 'zod'

const signupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
  userType: z.enum(['USER', 'COMPANY']),
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  acceptTerms: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.userType === 'COMPANY') {
    return data.companyName && data.cnpj && data.phone && data.city && data.state
  }
  return true
}, {
  message: "Todos os campos da empresa são obrigatórios",
  path: ["companyName"],
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate request body
    const validatedData = signupSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Um usuário com este email já existe' },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await hash(validatedData.password, 12)
    
    // Create user
    const user = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash: hashedPassword,
        role: validatedData.userType === 'COMPANY' ? 'COMPANY' : 'CUSTOMER',
      }
    })
    
    // If it's a company, create company profile
    if (validatedData.userType === 'COMPANY' && validatedData.companyName) {
      const slug = validatedData.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      await db.companyProfile.create({
        data: {
          userId: user.id,
          name: validatedData.companyName,
          slug: `${slug}-${user.id.slice(-8)}`, // Add unique suffix
          description: `Empresa de energia solar ${validatedData.companyName}`,
          city: validatedData.city,
          state: validatedData.state,
          phone: validatedData.phone,
          email: validatedData.email,
        }
      })
    }
    
    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user
    
    return NextResponse.json({
      message: 'Conta criada com sucesso!',
      user: userWithoutPassword
    })
    
  } catch (error) {
    console.error('Signup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}