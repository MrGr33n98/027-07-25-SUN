import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Eye,
  Users,
  Star,
  Package,
  TrendingUp,
  MessageSquare,
  Calendar,
  Award
} from 'lucide-react'
import Link from 'next/link'
import { CompanyProfile } from '@prisma/client'

interface DashboardOverviewProps {
  company: CompanyProfile & {
    user: any
  }
}

export function DashboardOverview({ company }: DashboardOverviewProps) {
  // Mock data for demonstration
  const stats = {
    views: 1250,
    leads: 23,
    rating: company.rating,
    products: 8,
    growth: 12.5,
    messages: 5,
    projects: company.projectsCompleted,
  }

  const recentActivity = [
    {
      id: 1,
      type: 'lead',
      message: 'Nova solicitação de orçamento recebida',
      time: '2 horas atrás',
      icon: Users,
    },
    {
      id: 2,
      type: 'review',
      message: 'Nova avaliação 5 estrelas recebida',
      time: '1 dia atrás',
      icon: Star,
    },
    {
      id: 3,
      type: 'view',
      message: 'Seu perfil foi visualizado 50 vezes hoje',
      time: '2 dias atrás',
      icon: Eye,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.views.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.growth}% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Baseado em {company.reviewCount} avaliações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products}</div>
            <p className="text-xs text-muted-foreground">
              Produtos cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <Icon className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button asChild className="h-20 flex-col">
                <Link href="/dashboard/produtos/novo">
                  <Package className="w-6 h-6 mb-2" />
                  Adicionar Produto
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/dashboard/projetos/novo">
                  <Calendar className="w-6 h-6 mb-2" />
                  Novo Projeto
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/dashboard/perfil">
                  <Award className="w-6 h-6 mb-2" />
                  Editar Perfil
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/dashboard/mensagens">
                  <MessageSquare className="w-6 h-6 mb-2" />
                  Ver Mensagens
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {company.verified ? 'Verificada' : 'Pendente'}
              </div>
              <p className="text-sm text-gray-600">Status de Verificação</p>
              {!company.verified && (
                <Button size="sm" className="mt-2" asChild>
                  <Link href="/dashboard/verificacao">
                    Solicitar Verificação
                  </Link>
                </Button>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.projects}
              </div>
              <p className="text-sm text-gray-600">Projetos Concluídos</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {company.yearsExperience}
              </div>
              <p className="text-sm text-gray-600">Anos de Experiência</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}