'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Search, X } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { SecurityEventFilter } from './security-dashboard'

interface SecurityFiltersProps {
  filters: SecurityEventFilter
  onFiltersChange: (filters: SecurityEventFilter) => void
}

const EVENT_TYPES = [
  { value: 'LOGIN_ATTEMPT', label: 'Tentativa de Login' },
  { value: 'REGISTRATION', label: 'Registro' },
  { value: 'PASSWORD_CHANGE', label: 'Alteração de Senha' },
  { value: 'PASSWORD_RESET_REQUEST', label: 'Solicitação de Reset' },
  { value: 'PASSWORD_RESET_COMPLETE', label: 'Reset Concluído' },
  { value: 'EMAIL_VERIFICATION', label: 'Verificação de Email' },
  { value: 'ACCOUNT_LOCKOUT', label: 'Bloqueio de Conta' },
  { value: 'ACCOUNT_UNLOCK', label: 'Desbloqueio de Conta' },
  { value: 'SUSPICIOUS_ACTIVITY', label: 'Atividade Suspeita' },
  { value: 'SESSION_CREATED', label: 'Sessão Criada' },
  { value: 'SESSION_EXPIRED', label: 'Sessão Expirada' },
  { value: 'TOKEN_GENERATED', label: 'Token Gerado' },
  { value: 'TOKEN_USED', label: 'Token Usado' }
]

export function SecurityFilters({ filters, onFiltersChange }: SecurityFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SecurityEventFilter>(filters)

  const handleFilterChange = (key: keyof SecurityEventFilter, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
  }

  const handleClearFilters = () => {
    const clearedFilters: SecurityEventFilter = {
      limit: 50,
      offset: 0
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = () => {
    return !!(
      localFilters.userId ||
      localFilters.email ||
      localFilters.eventType ||
      localFilters.success !== undefined ||
      localFilters.ipAddress ||
      localFilters.startDate ||
      localFilters.endDate
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Email Filter */}
        <div className="space-y-2">
          <Label htmlFor="email">Email do Usuário</Label>
          <Input
            id="email"
            placeholder="usuario@exemplo.com"
            value={localFilters.email || ''}
            onChange={(e) => handleFilterChange('email', e.target.value || undefined)}
          />
        </div>

        {/* Event Type Filter */}
        <div className="space-y-2">
          <Label>Tipo de Evento</Label>
          <Select
            value={localFilters.eventType || ''}
            onValueChange={(value) => handleFilterChange('eventType', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os tipos</SelectItem>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Success Filter */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={localFilters.success === undefined ? '' : localFilters.success.toString()}
            onValueChange={(value) => 
              handleFilterChange('success', value === '' ? undefined : value === 'true')
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              <SelectItem value="true">Sucesso</SelectItem>
              <SelectItem value="false">Falha</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* IP Address Filter */}
        <div className="space-y-2">
          <Label htmlFor="ipAddress">Endereço IP</Label>
          <Input
            id="ipAddress"
            placeholder="192.168.1.1"
            value={localFilters.ipAddress || ''}
            onChange={(e) => handleFilterChange('ipAddress', e.target.value || undefined)}
          />
        </div>

        {/* Start Date Filter */}
        <div className="space-y-2">
          <Label>Data Inicial</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localFilters.startDate ? (
                  format(localFilters.startDate, 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span>Selecionar data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={localFilters.startDate}
                onSelect={(date) => handleFilterChange('startDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date Filter */}
        <div className="space-y-2">
          <Label>Data Final</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localFilters.endDate ? (
                  format(localFilters.endDate, 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span>Selecionar data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={localFilters.endDate}
                onSelect={(date) => handleFilterChange('endDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button onClick={handleApplyFilters}>
            <Search className="w-4 h-4 mr-2" />
            Aplicar Filtros
          </Button>
          {hasActiveFilters() && (
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          {hasActiveFilters() && 'Filtros ativos aplicados'}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="border-t pt-4">
        <Label className="text-sm font-medium">Filtros Rápidos</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
              setLocalFilters(prev => ({
                ...prev,
                startDate: yesterday,
                endDate: today
              }))
            }}
          >
            Últimas 24h
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
              setLocalFilters(prev => ({
                ...prev,
                startDate: weekAgo,
                endDate: today
              }))
            }}
          >
            Última Semana
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLocalFilters(prev => ({
                ...prev,
                success: false,
                startDate: undefined,
                endDate: undefined
              }))
            }}
          >
            Apenas Falhas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLocalFilters(prev => ({
                ...prev,
                eventType: 'SUSPICIOUS_ACTIVITY',
                startDate: undefined,
                endDate: undefined
              }))
            }}
          >
            Atividade Suspeita
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLocalFilters(prev => ({
                ...prev,
                eventType: 'ACCOUNT_LOCKOUT',
                startDate: undefined,
                endDate: undefined
              }))
            }}
          >
            Bloqueios
          </Button>
        </div>
      </div>
    </div>
  )
}