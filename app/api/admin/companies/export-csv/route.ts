import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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

    // Busca todas as empresas com seus usuários
    const companies = await db.companyProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Cabeçalhos do CSV
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
      'areas_atendimento',
      'verificada',
      'avaliacao',
      'total_avaliacoes',
      'projetos_concluidos',
      'data_criacao'
    ]

    // Converte os dados para CSV
    const csvRows = [
      headers.join(','), // Linha de cabeçalho
      ...companies.map(company => [
        `"${company.name}"`,
        `"${company.user.email}"`,
        `"${company.description.replace(/"/g, '""')}"`, // Escapa aspas duplas
        `"${company.phone || ''}"`,
        `"${company.city || ''}"`,
        `"${company.state || ''}"`,
        `"${company.website || ''}"`,
        `"${company.whatsapp || ''}"`,
        `"${company.instagram || ''}"`,
        `"${company.linkedin || ''}"`,
        `"${company.specialties.join(', ')}"`,
        company.yearsExperience,
        `"${company.teamSize || ''}"`,
        `"${company.serviceAreas.join(', ')}"`,
        company.verified ? 'SIM' : 'NAO',
        company.rating.toFixed(1),
        company.reviewCount,
        company.projectsCompleted,
        `"${company.createdAt.toISOString().split('T')[0]}"`
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')

    // Retorna o CSV como download
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="empresas_${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Export CSV error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}