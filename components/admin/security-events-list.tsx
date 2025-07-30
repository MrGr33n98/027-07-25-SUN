'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Calendar,
  User,
  Globe
} from 'lucide-react'
import { SecurityEventFilter } from './security-dashboard'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SecurityEvent {
  id: string
  userId?: string
  email?: string
  eventType: string
  success: boolean
  ipAddress: string
  userAgent: string
  details?: Record<string, any>
  timestamp: string
  user?: {
    id: string
    email: string
    name?: string
  }
}

interface SecurityEventsListProps {
  filters: SecurityEventFilter
  refreshKey: number
  onRefresh: () => void
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  LOGIN_ATTEMPT: 'Tentativa de Login',
  REGISTRATION: 'Registro',
  PASSWORD_CHANGE: 'Alteração de Senha',
  PASSWORD_RESET_REQUEST: 'Solicitação de Reset',
  PASSWORD_RESET_COMPLETE: 'Reset Concluído',
  EMAIL_VERIFICATION: 'Verificação de Email',
  ACCOUNT_LOCKOUT: 'Bloqueio de Conta',
  ACCOUNT_UNLOCK: 'Desbloqueio de Conta',
  SUSPICIOUS_ACTIVITY: 'Atividade Suspeita',
  SESSION_CREATED: 'Sessão Criada',
  SESSION_EXPIRED: 'Sessão Expirada',
  TOKEN_GENERATED: 'Token Gerado',
  TOKEN_USED: 'Token Usado'
}

export function SecurityEventsList({ filters, refreshKey, onRefresh }: SecurityEventsListProps) {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [filters, refreshKey])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      
      if (filters.userId) params.append('userId', filters.userId)
      if (filters.email) params.append('email', filters.email)
      if (filters.eventType) params.append('eventType', filters.eventType)
      if (filters.success !== undefined) params.append('success', filters.success.toString())
      if (filters.ipAddress) params.append('ipAddress', filters.ipAddress)
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString())
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())
      
      const response = await fetch(`/api/admin/security/events?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Falha ao carregar eventos de segurança')
      }
      
      const data = await response.json()
      setEvents(data.events)
      setTotalCount(data.totalCount)
    } catch (error) {
      console.error('Error fetching security events:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevPage = () => {
    if (filters.offset && filters.offset > 0) {
      const newOffset = Math.max(0, filters.offset - (filters.limit || 50))
      // This would need to be handled by parent component
      // onFiltersChange({ ...filters, offset: newOffset })
    }
  }

  const handleNextPage = () => {
    const limit = filters.limit || 50
    const newOffset = (filters.offset || 0) + limit
    if (newOffset < totalCount) {
      // This would need to be handled by parent component
      // onFiltersChange({ ...filters, offset: newOffset })
    }
  }

  const getEventTypeColor = (eventType: string, success: boolean) => {
    if (!success) return 'destructive'
    
    switch (eventType) {
      case 'LOGIN_ATTEMPT':
        return 'default'
      case 'REGISTRATION':
        return 'secondary'
      case 'PASSWORD_CHANGE':
      case 'PASSWORD_RESET_COMPLETE':
        return 'default'
      case 'EMAIL_VERIFICATION':
        return 'secondary'
      case 'ACCOUNT_LOCKOUT':
        return 'destructive'
      case 'ACCOUNT_UNLOCK':
        return 'default'
      case 'SUSPICIOUS_ACTIVITY':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatUserAgent = (userAgent: string) => {
    if (userAgent.length > 50) {
      return userAgent.substring(0, 50) + '...'
    }
    return userAgent
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Eventos de Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Carregando eventos...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Eventos de Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center text-red-600 py-8">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Eventos de Segurança</CardTitle>
            <CardDescription>
              {totalCount} eventos encontrados
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum evento encontrado com os filtros aplicados
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div className="text-sm">
                            <div>{format(new Date(event.timestamp), 'dd/MM/yyyy', { locale: ptBR })}</div>
                            <div className="text-muted-foreground">
                              {format(new Date(event.timestamp), 'HH:mm:ss', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEventTypeColor(event.eventType, event.success)}>
                          {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div className="text-sm">
                            <div>{event.user?.name || event.email || 'N/A'}</div>
                            {event.user?.email && event.user.email !== event.email && (
                              <div className="text-muted-foreground text-xs">
                                {event.user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {event.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-sm ${event.success ? 'text-green-600' : 'text-red-600'}`}>
                            {event.success ? 'Sucesso' : 'Falha'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-mono">{event.ipAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {(filters.offset || 0) + 1} a {Math.min((filters.offset || 0) + (filters.limit || 50), totalCount)} de {totalCount} eventos
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={!filters.offset || filters.offset === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={(filters.offset || 0) + (filters.limit || 50) >= totalCount}
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Event Details Modal would go here */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Detalhes do Evento</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)}>
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <div className="mt-1">
                    <Badge variant={getEventTypeColor(selectedEvent.eventType, selectedEvent.success)}>
                      {EVENT_TYPE_LABELS[selectedEvent.eventType] || selectedEvent.eventType}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1 flex items-center space-x-2">
                    {selectedEvent.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={selectedEvent.success ? 'text-green-600' : 'text-red-600'}>
                      {selectedEvent.success ? 'Sucesso' : 'Falha'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Data/Hora</label>
                <div className="mt-1">
                  {format(new Date(selectedEvent.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Usuário</label>
                <div className="mt-1">
                  {selectedEvent.user?.name || selectedEvent.email || 'N/A'}
                  {selectedEvent.user?.email && (
                    <div className="text-sm text-muted-foreground">{selectedEvent.user.email}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Endereço IP</label>
                <div className="mt-1 font-mono">{selectedEvent.ipAddress}</div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">User Agent</label>
                <div className="mt-1 text-sm break-all">{selectedEvent.userAgent}</div>
              </div>

              {selectedEvent.details && Object.keys(selectedEvent.details).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Detalhes Adicionais</label>
                  <div className="mt-1 bg-gray-50 rounded p-3">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(selectedEvent.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}