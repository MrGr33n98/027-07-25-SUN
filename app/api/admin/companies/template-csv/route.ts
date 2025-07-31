import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Cabeçalhos do CSV template
    const headers = [
      'nome',
      'email',
      'descricao',
      'telefone',
      'cidade',
      'estado',
      'website',
      'whatsapp',
      'instagram',
      'linkedin',
      'especialidades',
      'anos_experiencia',
      'tamanho_equipe',
      'areas_atendimento'
    ]

    // Linha de exemplo para demonstrar o formato esperado
    const exampleRow = [
      'Solar Tech Ltda',
      'contato@solartech.com.br',
      'Empresa especializada em instalação de painéis solares residenciais e comerciais',
      '(11) 99999-9999',
      'São Paulo',
      'SP',
      'https://www.solartech.com.br',
      '5511999999999',
      '@solartech_oficial',
      'linkedin.com/company/solartech',
      'Instalação Residencial, Sistemas Comerciais, Manutenção',
      '5',
      'Pequena (1-10)',
      'São Paulo, ABC Paulista, Grande São Paulo'
    ]

    // Converte para CSV
    const csvRows = [
      headers.join(','), // Cabeçalho
      exampleRow.map(field => `"${field}"`).join(','), // Exemplo
      // Linha vazia para começar a preencher
      headers.map(() => '""').join(',')
    ]

    const csvContent = csvRows.join('\n')

    // Adiciona comentários no início do arquivo
    const csvWithComments = [
      '# Template para importação de empresas do SolarConnect',
      '# Instruções:',
      '# 1. Remova estas linhas de comentário antes de fazer upload',
      '# 2. Mantenha a linha de cabeçalho (primeira linha)',
      '# 3. A primeira linha após o cabeçalho é um exemplo - você pode removê-la',
      '# 4. Preencha os dados nas linhas seguintes',
      '# 5. Campos obrigatórios: nome, email, descricao',
      '# 6. Especialidades e áreas de atendimento devem ser separadas por vírgula',
      '# 7. Anos de experiência deve ser um número',
      '# 8. Use aspas duplas para textos que contenham vírgulas',
      '',
      csvContent
    ].join('\n')

    // Retorna o template como download
    return new NextResponse(csvWithComments, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="template_empresas_solarconnect.csv"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Template CSV error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}