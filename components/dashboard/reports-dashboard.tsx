'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Users,
  Package,
  Star,
  DollarSign,
  Eye,
  MessageCircle,
  Filter
} from 'lucide-react'

interface ReportData {
  period: string
  metrics: {
    views: { current: number; previous: number; change: number }
    leads: { current: number; previous: number; change: number }
    products: { current: number; previous: number; change: number }
    reviews: { current: number; previous: number; change: number }
    rating: { current: number; previous: number; change: number }
    revenue: { current: number; previous: number; change: number }
  }
  charts: {
    viewsOverTime: Array<{ date: string; views: number }>
    leadsOverTime: Array<{ date: string; leads: number }>
    topProducts: Array<{ name: string; views: number; leads: number }>
    leadSources: Array<{ source: string; count: number; percentage: number }>
  }
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral'
    title: string
    description: string
  }>
}

export function ReportsDashboard() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const [exportingPDF, setExportingPDF] = useState(false)

  useEffect(() => {
    fetchReportData()
  }, [period])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/reports?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = async () => {
    try {
      setExportingPDF(true)
      const response = await fetch(`/api/dashboard/reports/export?period=${period}&format=pdf`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio-${period}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
    } finally {
      setExportingPDF(false)
    }
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <div className="flex space-x-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Erro ao carregar dados do relatório</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">
            Análise detalhada do desempenho da sua empresa
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Period Selector */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { value: '7d', label: '7d' },
              { value: '30d', label: '30d' },
              { value: '90d', label: '90d' },
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
          
          <Button
            variant="outline"
            onClick={exportToPDF}
            disabled={exportingPDF}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportingPDF ? 'Exportando...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: 'Visualizações',
            icon: Eye,
            current: reportData.metrics.views.current,
            change: reportData.metrics.views.change,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
          },
          {
            title: 'Leads Recebidos',
            icon: Users,
            current: reportData.metrics.leads.current,
            change: reportData.metrics.leads.change,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
          },
          {
            title: 'Produtos Ativos',
            icon: Package,
            current: reportData.metrics.products.current,
            change: reportData.metrics.products.change,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
          },
          {
            title: 'Avaliação Média',
            icon: Star,
            current: reportData.metrics.rating.current,
            change: reportData.metrics.rating.change,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
            isRating: true,
          },
          {
            title: 'Novas Avaliações',
            icon: MessageCircle,
            current: reportData.metrics.reviews.current,
            change: reportData.metrics.reviews.change,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-100',
          },
          {
            title: 'Receita Estimada',
            icon: DollarSign,
            current: reportData.metrics.revenue.current,
            change: reportData.metrics.revenue.change,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-100',
            isCurrency: true,
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
                    <div className="flex items-baseline">
                      <p className="text-2xl font-bold text-gray-900">
                        {metric.isCurrency 
                          ? formatCurrency(metric.current)
                          : metric.isRating
                          ? metric.current.toFixed(1)
                          : formatNumber(metric.current)
                        }
                      </p>
                      {metric.isRating && (
                        <span className="ml-1 text-lg">⭐</span>
                      )}
                    </div>
                    
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

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Visualizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.charts.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{formatNumber(product.views)} visualizações</span>
                      <span>{formatNumber(product.leads)} leads</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Origem dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.charts.leadSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-gray-900">
                      {source.source}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      {formatNumber(source.count)}
                    </span>
                    <Badge variant="outline">
                      {source.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'positive'
                    ? 'bg-green-50 border-green-400'
                    : insight.type === 'negative'
                    ? 'bg-red-50 border-red-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <h4 className="font-medium text-gray-900 mb-1">
                  {insight.title}
                </h4>
                <p className="text-sm text-gray-700">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}