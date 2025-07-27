'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  Star, 
  Eye,
  MessageCircle,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react'

interface AnalyticsData {
  totalViews: number
  totalLeads: number
  totalProducts: number
  averageRating: number
  totalReviews: number
  totalMessages: number
  monthlyGrowth: {
    views: number
    leads: number
    products: number
  }
  recentActivity: Array<{
    type: string
    message: string
    date: string
  }>
}

export function AnalyticsOverview() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/analytics?range=${timeRange}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
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

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Erro ao carregar dados de analytics</p>
      </div>
    )
  }

  const stats = [
    {
      title: 'Visualizações',
      value: data.totalViews.toLocaleString(),
      icon: Eye,
      change: data.monthlyGrowth.views,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Leads Recebidos',
      value: data.totalLeads.toLocaleString(),
      icon: Users,
      change: data.monthlyGrowth.leads,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Produtos Ativos',
      value: data.totalProducts.toLocaleString(),
      icon: Package,
      change: data.monthlyGrowth.products,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Avaliação Média',
      value: data.averageRating.toFixed(1),
      icon: Star,
      change: 0,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      suffix: '⭐',
    },
    {
      title: 'Total de Avaliações',
      value: data.totalReviews.toLocaleString(),
      icon: MessageCircle,
      change: 0,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Mensagens',
      value: data.totalMessages.toLocaleString(),
      icon: MessageCircle,
      change: 0,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
        <div className="flex space-x-2">
          {[
            { value: '7d', label: '7 dias' },
            { value: '30d', label: '30 dias' },
            { value: '90d', label: '90 dias' },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === range.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.change > 0
          const isNegative = stat.change < 0
          
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      {stat.suffix && (
                        <span className="ml-1 text-lg">{stat.suffix}</span>
                      )}
                    </div>
                    
                    {stat.change !== 0 && (
                      <div className={`flex items-center mt-2 text-sm ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        <span>
                          {Math.abs(stat.change)}% vs mês anterior
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhuma atividade recente
              </p>
            ) : (
              data.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
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
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}