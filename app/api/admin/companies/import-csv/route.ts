import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

// Função para criar slug único
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim()
}

// Função para garantir slug único
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1
  
  while (await db.companyProfile.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

// Função para processar uma linha do CSV
async function processCSVRow(row: string[], headers: string[]): Promise<{ success: boolean, error?: string }> {
  try {
    // Mapeia os índices das colunas
    const nameIndex = headers.findIndex(h => h.toLowerCase().includes('nome'))
    const emailIndex = headers.findIndex(h => h.toLowerCase().includes('email'))
    const descriptionIndex = headers.findIndex(h => h.toLowerCase().includes('descricao'))
    const phoneIndex = headers.findIndex(h => h.toLowerCase().includes('telefone'))
    const cityIndex = headers.findIndex(h => h.toLowerCase().includes('cidade'))
    const stateIndex = headers.findIndex(h => h.toLowerCase().includes('estado'))
    const websiteIndex = headers.findIndex(h => h.toLowerCase().includes('website'))
    const whatsappIndex = headers.findIndex(h => h.toLowerCase().includes('whatsapp'))
    const instagramIndex = headers.findIndex(h => h.toLowerCase().includes('instagram'))
    const linkedinIndex = headers.findIndex(h => h.toLowerCase().includes('linkedin'))
    const specialtiesIndex = headers.findIndex(h => h.toLowerCase().includes('especialidades'))
    const experienceIndex = headers.findIndex(h => h.toLowerCase().includes('anos') || h.toLowerCase().includes('experiencia'))
    const teamSizeIndex = headers.findIndex(h => h.toLowerCase().includes('equipe') || h.toLowerCase().includes('tamanho'))
    const serviceAreasIndex = headers.findIndex(h => h.toLowerCase().includes('areas') || h.toLowerCase().includes('atendimento'))
    
    const name = row[nameIndex]?.trim()
    const email = row[emailIndex]?.trim()
    const description = row[descriptionIndex]?.trim()
    
    if (!name || !email || !description) {
      return { success: false, error: 'Campos obrigatórios ausentes (nome, email, descrição)' }
    }
    
    // Verifica se email já existe
    const existingUserByEmail = await db.user.findUnique({ where: { email } })
    if (existingUserByEmail) {
      return { success: false, error: `Email ${email} já está em uso` }
    }
    
    // Verifica se empresa já existe
    const existingCompanyByName = await db.companyProfile.findFirst({ where: { name } })
    if (existingCompanyByName) {
      return { success: false, error: `Empresa ${name} já existe` }
    }
    
    // Cria usuário
    const hashedPassword = await hash('123456789', 12) // Senha padrão
    const user = await db.user.create({
      data: {
        name,
        email,
        role: 'COMPANY',
        passwordHash: hashedPassword,
        emailVerified: new Date(),
      }
    })
    
    // Prepara dados da empresa
    const baseSlug = createSlug(name)
    const slug = await ensureUniqueSlug(baseSlug)
    
    const specialties = specialtiesIndex >= 0 && row[specialtiesIndex] 
      ? row[specialtiesIndex].split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      : []
      
    const serviceAreas = serviceAreasIndex >= 0 && row[serviceAreasIndex]
      ? row[serviceAreasIndex].split(',').map(s => s.trim()).filter(Boolean)
      : []
    
    const yearsExperience = experienceIndex >= 0 && row[experienceIndex] 
      ? parseInt(row[experienceIndex]) || 0
      : 0
    
    // Cria perfil da empresa
    await db.companyProfile.create({
      data: {
        name,
        slug,
        description,
        email,
        phone: phoneIndex >= 0 ? row[phoneIndex]?.trim() || null : null,
        city: cityIndex >= 0 ? row[cityIndex]?.trim() || null : null,
        state: stateIndex >= 0 ? row[stateIndex]?.trim() || null : null,
        website: websiteIndex >= 0 ? row[websiteIndex]?.trim() || null : null,
        whatsapp: whatsappIndex >= 0 ? row[whatsappIndex]?.trim() || null : null,
        instagram: instagramIndex >= 0 ? row[instagramIndex]?.trim() || null : null,
        linkedin: linkedinIndex >= 0 ? row[linkedinIndex]?.trim() || null : null,
        specialties,
        serviceAreas,
        yearsExperience,
        teamSize: teamSizeIndex >= 0 ? row[teamSizeIndex]?.trim() || null : null,
        verified: false,
        rating: 0,
        reviewCount: 0,
        projectsCompleted: 0,
        userId: user.id,
      }
    })
    
    return { success: true }
    
  } catch (error) {
    console.error('Error processing CSV row:', error)
    return { success: false, error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}` }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const csvFile = formData.get('csvFile') as File
    
    if (!csvFile) {
      return NextResponse.json(
        { message: 'Arquivo CSV não fornecido' },
        { status: 400 }
      )
    }

    // Lê o conteúdo do arquivo
    const csvContent = await csvFile.text()
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line)
    
    if (lines.length === 0) {
      return NextResponse.json(
        { message: 'Arquivo CSV está vazio' },
        { status: 400 }
      )
    }
    
    // Primeira linha são os headers
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''))
    const dataLines = lines.slice(1)
    
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    }
    
    // Processa cada linha
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i]
      const row = line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      
      const processResult = await processCSVRow(row, headers)
      
      if (processResult.success) {
        result.success++
      } else {
        result.failed++
        result.errors.push(`Linha ${i + 2}: ${processResult.error}`)
      }
      
      // Limita a 50 erros para não sobrecarregar
      if (result.errors.length >= 50) {
        result.errors.push(`... e mais ${dataLines.length - i - 1} erros`)
        break
      }
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Import CSV error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}