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
  AlertTriangle,
  RefreshCw,
  Unlock,
  Clock,
  User,
  Calendar,
  Shield
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface LockedAccount {
  id: string
  email: string
  name?: string
  failedLoginAttempts: number
  accountLockedUntil: string
  lastLoginAt?: string
  lastLoginIP?: string
  lockoutReason?: string
  lockoutDuration?: number
}

interface AccountLockoutManagementProps {
  refreshKey: number
  onRefresh: () => void
}

export function AccountLockoutManagement({ refreshKey, onRefresh }: AccountLockoutManagementProps) {
  const [lockedAccounts, setLockedAccounts] = useState<LockedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unlockingAccounts, setUnlockingAccounts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchLockedAccounts()
  }, [refreshKey])

  const fetchLockedAccounts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/security/locked-accounts')
      
      if (!response.ok) {
        throw new Error('Falha ao carregar contas bloqueadas')
      }
      
      const data = await response.json()
      setLockedAccounts(data.accounts)
    } catch (error) {
      console.error('Error fetching locked accounts:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlockAccount = async (accountId: string, email: string) => {
    try {
      setUnlockingAccounts(prev => new Set(prev).add(accountId))
      
      const response = await fetch('/api/admin/security/unlock-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: accountId }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Falha ao desbloquear conta')
      }
      
      toast.success(`Conta ${email} desbloqueada com sucesso`)
      
      // Remove the account from the list
      setLockedAccounts(prev => prev.filter(account => account.id !== accountId))
      onRefresh()
    } catch (error) {
      console.error('Error unlocking account:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao desbloquear conta')
    } finally {
      setUnlockingAccounts(prev => {
        const newSet = new Set(prev)
        newSet.delete(accountId)
        return newSet
      })
    }
  }

  const isAccountStillLocked = (lockedUntil: string) => {
    return new Date(lockedUntil) > new Date()
  }

  const getTimeRemaining = (lockedUntil: string) => {
    const now = new Date()
    const unlockTime = new Date(lockedUntil)
    const diffMs = unlockTime.getTime() - now.getTime()
    
    if (diffMs <= 0) return 'Expirado'
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`
    if (diffHours > 0) return `${diffHours}h ${diffMinutes % 60}m`
    return `${diffMinutes}m`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contas Bloqueadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Carregando contas bloqueadas...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contas Bloqueadas</CardTitle>
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
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bloqueadas</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {lockedAccounts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Contas atualmente bloqueadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bloqueios Ativos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {lockedAccounts.filter(account => isAccountStillLocked(account.accountLockedUntil)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ainda dentro do período de bloqueio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bloqueios Expirados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {lockedAccounts.filter(account => !isAccountStillLocked(account.accountLockedUntil)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Podem ser desbloqueadas automaticamente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Locked Accounts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contas Bloqueadas</CardTitle>
              <CardDescription>
                Gerencie contas que foram bloqueadas por tentativas de login falhadas
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchLockedAccounts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lockedAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <div className="text-lg font-medium mb-2">Nenhuma conta bloqueada</div>
              <div>Todas as contas estão desbloqueadas no momento</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tentativas Falhadas</TableHead>
                    <TableHead>Bloqueado Até</TableHead>
                    <TableHead>Tempo Restante</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lockedAccounts.map((account) => {
                    const isStillLocked = isAccountStillLocked(account.accountLockedUntil)
                    const timeRemaining = getTimeRemaining(account.accountLockedUntil)
                    
                    return (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{account.name || account.email}</div>
                              {account.name && (
                                <div className="text-sm text-muted-foreground">{account.email}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {account.failedLoginAttempts} tentativas
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div className="text-sm">
                              <div>
                                {format(new Date(account.accountLockedUntil), 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                              <div className="text-muted-foreground">
                                {format(new Date(account.accountLockedUntil), 'HH:mm:ss', { locale: ptBR })}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <Badge variant={isStillLocked ? "destructive" : "secondary"}>
                              {timeRemaining}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {account.lastLoginAt ? (
                            <div className="text-sm">
                              <div>
                                {format(new Date(account.lastLoginAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </div>
                              {account.lastLoginIP && (
                                <div className="text-muted-foreground font-mono text-xs">
                                  {account.lastLoginIP}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnlockAccount(account.id, account.email)}
                            disabled={unlockingAccounts.has(account.id)}
                          >
                            {unlockingAccounts.has(account.id) ? (
                              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Unlock className="w-4 h-4 mr-1" />
                            )}
                            Desbloquear
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}