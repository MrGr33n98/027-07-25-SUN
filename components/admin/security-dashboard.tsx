'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SecurityEventsList } from './security-events-list'
import { SecurityStats } from './security-stats'
import { AccountLockoutManagement } from './account-lockout-management'
import { SecurityFilters } from './security-filters'
import { Shield, AlertTriangle, Users, Activity } from 'lucide-react'

export interface SecurityEventFilter {
  userId?: string
  email?: string
  eventType?: string
  success?: boolean
  ipAddress?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export function SecurityDashboard() {
  const [filters, setFilters] = useState<SecurityEventFilter>({
    limit: 50,
    offset: 0
  })
  const [refreshKey, setRefreshKey] = useState(0)

  const handleFiltersChange = (newFilters: SecurityEventFilter) => {
    setFilters({ ...newFilters, offset: 0 })
    setRefreshKey(prev => prev + 1)
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Segurança</h1>
          <p className="text-muted-foreground">
            Monitore eventos de segurança e gerencie contas bloqueadas
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Eventos de Segurança
          </TabsTrigger>
          <TabsTrigger value="lockouts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Contas Bloqueadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SecurityStats refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Eventos</CardTitle>
              <CardDescription>
                Filtre os eventos de segurança por critérios específicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityFilters 
                filters={filters} 
                onFiltersChange={handleFiltersChange}
              />
            </CardContent>
          </Card>
          
          <SecurityEventsList 
            filters={filters} 
            refreshKey={refreshKey}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="lockouts" className="space-y-4">
          <AccountLockoutManagement 
            refreshKey={refreshKey}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}