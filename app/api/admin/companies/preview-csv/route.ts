import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface CSVPreviewData {
  headers: string[]
  rows: string[][]
  validRows: number
  invalidRows: number
  errors: string[]
}

// Função para validar uma linha do CSV
function validateCSVRow(row: string[], headers: string[]): { isValid: boolean, errors: string[] } {
  const errors: string[] = []
  
  // Verifica se tem o mínimo de campos obrigatórios
  if (!row[0] || row[0].trim() === '') {
    errors.push('Nome da empresa é obrigatório')
  }
  
  if (!row[1] || row[1].trim() === '') {
    errors.push('Email é obrigatório')
  }
  
  // Valida formato do email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (row[1] && !emailRegex.test(row[1].trim())) {
    errors.push('Email inválido')
  }
  
  if (!row[2] || row[2].trim() === '') {
    errors.push('Descrição é obrigatória')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Função para processar CSV
function processCSV(csvContent: string): CSVPreviewData {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line)
  
  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
      validRows: 0,
      invalidRows: 0,
      errors: ['Arquivo CSV está vazio']
    }
  }
  
  // Primeira linha são os headers
  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''))
  const dataLines = lines.slice(1)
  
  const expectedHeaders = [
    'nome', 'email', 'descricao', 'telefone', 'cidade', 'estado', 
    'website', 'whatsapp', 'instagram', 'linkedin', 'especialidades',
    'anos_experiencia', 'tamanho_equipe', 'areas_atendimento'
  ]
  
  const errors: string[] = []
  let validRows = 0
  let invalidRows = 0
  
  // Valida headers
  const missingHeaders = expectedHeaders.filter(expected => 
    !headers.some(header => header.toLowerCase().includes(expected.replace('_', '').toLowerCase()))
  )
  
  if (missingHeaders.length > 0) {
    errors.push(`Headers obrigatórios ausentes: ${missingHeaders.join(', ')}`)
  }
  
  // Processa cada linha
  const rows = dataLines.map(line => {
    const row = line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    const validation = validateCSVRow(row, headers)
    
    if (validation.isValid) {
      validRows++
    } else {
      invalidRows++
      errors.push(...validation.errors.map(error => `Linha ${dataLines.indexOf(line) + 2}: ${error}`))
    }
    
    return row
  })
  
  return {
    headers,
    rows,
    validRows,
    invalidRows,
    errors: errors.slice(0, 20) // Limita a 20 erros para não sobrecarregar a UI
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

    // Verifica se é um arquivo CSV
    if (!csvFile.name.endsWith('.csv') && csvFile.type !== 'text/csv') {
      return NextResponse.json(
        { message: 'Apenas arquivos CSV são aceitos' },
        { status: 400 }
      )
    }

    // Verifica tamanho do arquivo (máximo 10MB)
    if (csvFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'Arquivo muito grande. Máximo 10MB' },
        { status: 400 }
      )
    }

    // Lê o conteúdo do arquivo
    const csvContent = await csvFile.text()
    
    // Processa o CSV
    const previewData = processCSV(csvContent)
    
    return NextResponse.json(previewData)
    
  } catch (error) {
    console.error('Preview CSV error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}