'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Users, 
  Building2, 
  Package, 
  Star,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  DollarSign,
  Eye,
  MessageCircle
} from 'lucide-react'

interface PlatformStats {
  totalUsers: number
  totalCompanies: number
  totalProducts: number
  totalReviews: number
  averageRating: number
  monthlyGrowth: {
    users: number
    companies: number
    products: number
    reviews: number
  }
  topCategories: Array<{
    category: string
    count: number
    percentage: number
  }>
  recentActivity: Array<{
    type: string
    description: string
    date: string
  }>
}

export function AdminReportsManagement() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    fetchStats()
  }, [period])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/reports?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(`/api/admin/reports/export?format=${format}&period=${period}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio-plataforma-${period}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />
    return null
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Erro ao carregar relatórios</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { value: '7d', label: '7 dias' },
              { value: '30d', label: '30 dias' },
              { value: '90d', label: '90 dias' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  period === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => exportReport('pdf')}
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => exportReport('excel')}
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total de Usuários',
            value: stats.totalUsers,
            change: stats.monthlyGrowth.users,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
          },
          {
            title: 'Empresas Cadastradas',
            value: stats.totalCompanies,
            change: stats.monthlyGrowth.companies,
            icon: Building2,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
          },
          {
            title: 'Produtos Ativos',
            value: stats.totalProducts,
            change: stats.monthlyGrowth.products,
            icon: Package,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
          },
          {
            title: 'Avaliações',
            value: stats.totalReviews,
            change: stats.monthlyGrowth.reviews,
            icon: Star,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
          },
        ].map((metric, index) => {
          const Icon = metric.icon
          
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(metric.value)}
                    </p>
                    
                    {metric.change !== 0 && (
                      <div className={`flex items-center mt-2 text-sm ${getChangeColor(metric.change)}`}>
                        {getChangeIcon(metric.change)}
                        <span className="ml-1">
                          {formatPercentage(metric.change)} vs período anterior
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Additional Metrics */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categorias Mais Populares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        #{index + 1}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {category.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      {formatNumber(category.count)} produtos
                    </span>
                    <Badge variant="outline">
                      {category.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card>
          <CardHeader>
            <CardTitle>Saúde da Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Avaliação Média</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-bold text-green-600">
                    {stats.averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Taxa de Crescimento</span>
                </div>
                <span className="font-bold text-blue-600">
                  {formatPercentage(stats.monthlyGrowth.users)}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Empresas Ativas</span>
                </div>
                <span className="font-bold text-purple-600">
                  {Math.round((stats.totalCompanies / stats.totalUsers) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}