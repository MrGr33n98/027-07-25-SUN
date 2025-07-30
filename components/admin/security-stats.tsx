'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity,
  Users,
  Clock,
  TrendingUp
} from 'lucide-react'

interface SecurityStats {
  totalEvents: number
  successfulEvents: number
  failedEvents: number
  eventsByType: Record<string, number>
  eventsByHour: Array<{ hour: string; count: number }>
  topIpAddresses: Array<{ ipAddress: string; count: number }>
  suspiciousActivity: Array<{
    type: string
    count: number
    description: string
  }>
}

interface SecurityStatsProps {
  refreshKey: number
}

export function SecurityStats({ refreshKey }: SecurityStatsProps) {
  const [stats, setStats] = useState<SecurityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [refreshKey])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
      
      const response = await fetch(`/api/admin/security/stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      
      if (!response.ok) {
        throw new Error('Falha ao carregar estatísticas de segurança')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching security stats:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carregando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const successRate = stats.totalEvents > 0 
    ? ((stats.successfulEvents / stats.totalEvents) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Bem-sucedidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.successfulEvents.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Taxa de sucesso: {successRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Falhados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.failedEvents.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Requer atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividade Suspeita</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.suspiciousActivity.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Padrões detectados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Events by Type */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Eventos por Tipo</CardTitle>
            <CardDescription>Distribuição dos tipos de eventos de segurança</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.eventsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top IPs</CardTitle>
            <CardDescription>Endereços IP com mais atividade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topIpAddresses.slice(0, 5).map((ip, index) => (
                <div key={ip.ipAddress} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono">{ip.ipAddress}</span>
                    {index === 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Top
                      </Badge>
                    )}
                  </div>
                  <span className="font-medium">{ip.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suspicious Activity */}
      {stats.suspiciousActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Atividade Suspeita Detectada
            </CardTitle>
            <CardDescription>
              Padrões de comportamento que requerem atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.suspiciousActivity.map((activity, index) => (
                <div key={index} className="flex items-start justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive" className="text-xs">
                        {activity.type.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-sm font-medium">{activity.count} ocorrências</span>
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}