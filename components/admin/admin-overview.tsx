import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Building2,
  Users,
  Package,
  Star,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  Shield
} from 'lucide-react'
import Link from 'next/link'

export function AdminOverview() {
  // Mock data for demonstration
  const stats = {
    companies: {
      total: 1247,
      active: 1180,
      pending: 67,
      growth: 12.5,
    },
    users: {
      total: 15420,
      active: 12350,
      new_this_month: 890,
      growth: 8.3,
    },
    products: {
      total: 8940,
      active: 8120,
      pending_review: 45,
      growth: 15.2,
    },
    reviews: {
      total: 3240,
      average_rating: 4.6,
      pending_moderation: 12,
      growth: 22.1,
    },
  }

  const recentActivity = [
    {
      id: 1,
      type: 'company_registered',
      message: 'Nova empresa cadastrada: EcoSolar Inovação',
      time: '2 horas atrás',
      icon: Building2,
      color: 'text-green-600',
    },
    {
      id: 2,
      type: 'review_reported',
      message: 'Avaliação denunciada por conteúdo inadequado',
      time: '4 horas atrás',
      icon: AlertTriangle,
      color: 'text-red-600',
    },
    {
      id: 3,
      type: 'product_approved',
      message: '15 produtos aprovados na moderação',
      time: '6 horas atrás',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      id: 4,
      type: 'user_milestone',
      message: 'Plataforma atingiu 15.000 usuários cadastrados',
      time: '1 dia atrás',
      icon: Users,
      color: 'text-blue-600',
    },
  ]

  const pendingActions = [
    {
      id: 1,
      title: 'Empresas aguardando verificação',
      count: 67,
      href: '/admin/empresas?status=pending',
      icon: Building2,
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      id: 2,
      title: 'Produtos aguardando moderação',
      count: 45,
      href: '/admin/produtos?status=pending',
      icon: Package,
      color: 'bg-orange-100 text-orange-800',
    },
    {
      id: 3,
      title: 'Avaliações para moderar',
      count: 12,
      href: '/admin/avaliacoes?status=pending',
      icon: Star,
      color: 'bg-purple-100 text-purple-800',
    },
    {
      id: 4,
      title: 'Denúncias abertas',
      count: 8,
      href: '/admin/denuncias?status=open',
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-800',
    },
  ]

  const systemHealth = {
    uptime: '99.9%',
    response_time: '120ms',
    database_size: '2.4GB',
    storage_used: '45GB',
    cdn_bandwidth: '1.2TB',
    active_sessions: 1247,
  }

  const renderTrendIcon = (growth: number) => {
    return growth > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.companies.total.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              {renderTrendIcon(stats.companies.growth)}
              <span className="ml-1">+{stats.companies.growth}% este mês</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.companies.active} ativas, {stats.companies.pending} pendentes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              {renderTrendIcon(stats.users.growth)}
              <span className="ml-1">+{stats.users.growth}% este mês</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.users.new_this_month} novos este mês
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.products.total.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              {renderTrendIcon(stats.products.growth)}
              <span className="ml-1">+{stats.products.growth}% este mês</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.products.pending_review} aguardando revisão
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviews.total.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              {renderTrendIcon(stats.reviews.growth)}
              <span className="ml-1">+{stats.reviews.growth}% este mês</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Média: {stats.reviews.average_rating} ⭐
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Ações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingActions.map((action) => {
                const Icon = action.icon
                return (
                  <div key={action.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${action.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.count} itens</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={action.href}>Ver</Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}>
                      <Icon className="w-4 h-4" />
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
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {systemHealth.uptime}
              </div>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {systemHealth.response_time}
              </div>
              <p className="text-sm text-gray-600">Tempo Resposta</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {systemHealth.database_size}
              </div>
              <p className="text-sm text-gray-600">Banco de Dados</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {systemHealth.storage_used}
              </div>
              <p className="text-sm text-gray-600">Armazenamento</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {systemHealth.cdn_bandwidth}
              </div>
              <p className="text-sm text-gray-600">Bandwidth CDN</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {systemHealth.active_sessions.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Sessões Ativas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild className="h-20 flex-col bg-blue-600 hover:bg-blue-700">
              <Link href="/admin/empresas">
                <Building2 className="w-6 h-6 mb-2" />
                Gerenciar Empresas
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/admin/usuarios">
                <Users className="w-6 h-6 mb-2" />
                Gerenciar Usuários
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/admin/moderacao">
                <Shield className="w-6 h-6 mb-2" />
                Moderação
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/admin/relatorios">
                <MessageSquare className="w-6 h-6 mb-2" />
                Relatórios
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}