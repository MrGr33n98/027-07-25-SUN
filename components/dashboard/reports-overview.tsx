import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Star,
  Package,
  MessageSquare,
  Calendar,
  DollarSign
} from 'lucide-react'

export function ReportsOverview() {
  // Mock data for demonstration
  const monthlyData = {
    views: {
      current: 1250,
      previous: 980,
      change: 27.6,
    },
    leads: {
      current: 23,
      previous: 18,
      change: 27.8,
    },
    conversion: {
      current: 12.5,
      previous: 15.2,
      change: -17.8,
    },
    rating: {
      current: 4.8,
      previous: 4.6,
      change: 4.3,
    },
  }

  const weeklyStats = [
    { day: 'Seg', views: 180, leads: 3, messages: 8 },
    { day: 'Ter', views: 220, leads: 5, messages: 12 },
    { day: 'Qua', views: 190, leads: 2, messages: 6 },
    { day: 'Qui', views: 250, leads: 4, messages: 15 },
    { day: 'Sex', views: 280, leads: 6, messages: 18 },
    { day: 'Sáb', views: 160, leads: 2, messages: 4 },
    { day: 'Dom', views: 120, leads: 1, messages: 2 },
  ]

  const topProducts = [
    { name: 'Painel Solar 450W', views: 340, leads: 12 },
    { name: 'Inversor 5kW', views: 280, leads: 8 },
    { name: 'Kit Completo 10kWp', views: 220, leads: 15 },
    { name: 'Bateria Lítio 10kWh', views: 180, leads: 5 },
  ]

  const renderTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />
    } else if (change < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" />
    }
    return null
  }

  const renderTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyData.views.current.toLocaleString()}</div>
            <div className={`flex items-center text-xs ${renderTrendColor(monthlyData.views.change)}`}>
              {renderTrendIcon(monthlyData.views.change)}
              <span className="ml-1">
                {Math.abs(monthlyData.views.change)}% em relação ao mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyData.leads.current}</div>
            <div className={`flex items-center text-xs ${renderTrendColor(monthlyData.leads.change)}`}>
              {renderTrendIcon(monthlyData.leads.change)}
              <span className="ml-1">
                {Math.abs(monthlyData.leads.change)}% em relação ao mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyData.conversion.current}%</div>
            <div className={`flex items-center text-xs ${renderTrendColor(monthlyData.conversion.change)}`}>
              {renderTrendIcon(monthlyData.conversion.change)}
              <span className="ml-1">
                {Math.abs(monthlyData.conversion.change)}% em relação ao mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyData.rating.current}</div>
            <div className={`flex items-center text-xs ${renderTrendColor(monthlyData.rating.change)}`}>
              {renderTrendIcon(monthlyData.rating.change)}
              <span className="ml-1">
                {Math.abs(monthlyData.rating.change)}% em relação ao mês anterior
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="font-medium text-sm">{stat.day}</div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <Eye className="w-3 h-3 mr-1 text-blue-500" />
                      {stat.views}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1 text-green-500" />
                      {stat.leads}
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1 text-orange-500" />
                      {stat.messages}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Visualizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{product.name}</div>
                    <div className="text-xs text-gray-500">
                      {product.views} visualizações
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      {product.leads} leads
                    </div>
                    <div className="text-xs text-gray-500">
                      {((product.leads / product.views) * 100).toFixed(1)}% conversão
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Novos leads:</span>
                <span className="font-medium">23</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Propostas enviadas:</span>
                <span className="font-medium">15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Projetos fechados:</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Taxa de fechamento:</span>
                <span className="font-medium text-green-600">34.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total cadastrados:</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Mais visualizado:</span>
                <span className="font-medium">Painel 450W</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Categoria popular:</span>
                <span className="font-medium">Painéis Solares</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Oportunidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Em negociação:</span>
                <span className="font-medium">R$ 180.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Fechado este mês:</span>
                <span className="font-medium text-green-600">R$ 95.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ticket médio:</span>
                <span className="font-medium">R$ 11.875</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}