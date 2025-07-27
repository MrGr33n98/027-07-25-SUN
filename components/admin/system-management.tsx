'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Server, 
  Database, 
  Cpu, 
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Trash2,
  Eye
} from 'lucide-react'

interface SystemStatus {
  server: {
    status: 'online' | 'offline' | 'maintenance'
    uptime: string
    version: string
    lastRestart: string
  }
  database: {
    status: 'connected' | 'disconnected' | 'slow'
    connections: number
    maxConnections: number
    responseTime: number
  }
  performance: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    networkLatency: number
  }
  services: Array<{
    name: string
    status: 'running' | 'stopped' | 'error'
    port?: number
    lastCheck: string
  }>
}

interface LogEntry {
  id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: string
  source: string
  details?: any
}

export function AdminSystemManagement() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    server: {
      status: 'online',
      uptime: '15 dias, 3 horas',
      version: '1.2.3',
      lastRestart: '2024-01-10T08:30:00Z'
    },
    database: {
      status: 'connected',
      connections: 45,
      maxConnections: 100,
      responseTime: 12
    },
    performance: {
      cpuUsage: 35,
      memoryUsage: 68,
      diskUsage: 42,
      networkLatency: 8
    },
    services: [
      { name: 'API Server', status: 'running', port: 3000, lastCheck: '2024-01-25T10:30:00Z' },
      { name: 'Database', status: 'running', port: 5432, lastCheck: '2024-01-25T10:30:00Z' },
      { name: 'Redis Cache', status: 'running', port: 6379, lastCheck: '2024-01-25T10:30:00Z' },
      { name: 'Email Service', status: 'running', lastCheck: '2024-01-25T10:29:00Z' },
      { name: 'File Storage', status: 'running', lastCheck: '2024-01-25T10:30:00Z' }
    ]
  })

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      level: 'info',
      message: 'Sistema iniciado com sucesso',
      timestamp: '2024-01-25T10:30:15Z',
      source: 'system'
    },
    {
      id: '2',
      level: 'warn',
      message: 'Alto uso de memória detectado (85%)',
      timestamp: '2024-01-25T10:25:30Z',
      source: 'monitor'
    },
    {
      id: '3',
      level: 'error',
      message: 'Falha na conexão com serviço externo',
      timestamp: '2024-01-25T10:20:45Z',
      source: 'api',
      details: { service: 'payment-gateway', error: 'timeout' }
    },
    {
      id: '4',
      level: 'info',
      message: 'Backup automático concluído',
      timestamp: '2024-01-25T09:00:00Z',
      source: 'backup'
    }
  ])

  const [loading, setLoading] = useState(false)
  const [logFilter, setLogFilter] = useState('all')

  const refreshStatus = async () => {
    setLoading(true)
    // Mock refresh - would be replaced with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
  }

  const restartService = async (serviceName: string) => {
    if (!confirm(`Tem certeza que deseja reiniciar o serviço ${serviceName}?`)) return
    
    // Mock restart - would be replaced with actual API call
    setSystemStatus(prev => ({
      ...prev,
      services: prev.services.map(service =>
        service.name === serviceName
          ? { ...service, status: 'running', lastCheck: new Date().toISOString() }
          : service
      )
    }))
  }

  const exportLogs = async () => {
    // Mock export - would be replaced with actual API call
    const dataStr = JSON.stringify(logs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const clearLogs = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os logs?')) return
    setLogs([])
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      online: { label: 'Online', variant: 'default' as const, icon: CheckCircle },
      running: { label: 'Executando', variant: 'default' as const, icon: CheckCircle },
      connected: { label: 'Conectado', variant: 'default' as const, icon: CheckCircle },
      offline: { label: 'Offline', variant: 'destructive' as const, icon: AlertTriangle },
      stopped: { label: 'Parado', variant: 'destructive' as const, icon: AlertTriangle },
      disconnected: { label: 'Desconectado', variant: 'destructive' as const, icon: AlertTriangle },
      error: { label: 'Erro', variant: 'destructive' as const, icon: AlertTriangle },
      maintenance: { label: 'Manutenção', variant: 'secondary' as const, icon: AlertTriangle },
      slow: { label: 'Lento', variant: 'secondary' as const, icon: AlertTriangle },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    )
  }

  const getLogLevelBadge = (level: string) => {
    const levelConfig = {
      info: { variant: 'default' as const, color: 'text-blue-600' },
      warn: { variant: 'secondary' as const, color: 'text-yellow-600' },
      error: { variant: 'destructive' as const, color: 'text-red-600' },
      debug: { variant: 'outline' as const, color: 'text-gray-600' },
    }
    
    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.info
    
    return (
      <Badge variant={config.variant} className="text-xs">
        {level.toUpperCase()}
      </Badge>
    )
  }

  const getUsageColor = (usage: number) => {
    if (usage >= 80) return 'bg-red-500'
    if (usage >= 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const filteredLogs = logFilter === 'all' 
    ? logs 
    : logs.filter(log => log.level === logFilter)

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Servidor
                </p>
                {getStatusBadge(systemStatus.server.status)}
                <p className="text-xs text-gray-500 mt-2">
                  Uptime: {systemStatus.server.uptime}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Banco de Dados
                </p>
                {getStatusBadge(systemStatus.database.status)}
                <p className="text-xs text-gray-500 mt-2">
                  {systemStatus.database.connections}/{systemStatus.database.maxConnections} conexões
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  CPU
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStatus.performance.cpuUsage}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${getUsageColor(systemStatus.performance.cpuUsage)}`}
                    style={{ width: `${systemStatus.performance.cpuUsage}%` }}
                  />
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Cpu className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Memória
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStatus.performance.memoryUsage}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${getUsageColor(systemStatus.performance.memoryUsage)}`}
                    style={{ width: `${systemStatus.performance.memoryUsage}%` }}
                  />
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Status dos Serviços</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatus}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemStatus.services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                    {getStatusBadge(service.status)}
                  </div>
                  {service.port && (
                    <span className="text-sm text-gray-500">:{service.port}</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500">
                    {formatDate(service.lastCheck)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => restartService(service.name)}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reiniciar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Logs do Sistema</CardTitle>
          <div className="flex items-center space-x-2">
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todos</option>
              <option value="error">Erros</option>
              <option value="warn">Avisos</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {getLogLevelBadge(log.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{log.message}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                    <span>{formatDate(log.timestamp)}</span>
                    <span>Fonte: {log.source}</span>
                  </div>
                  {log.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer">
                        Ver detalhes
                      </summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}