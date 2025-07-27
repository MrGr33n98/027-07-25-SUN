'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Calendar,
  Mail,
  Shield,
  Building2
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  emailVerified: boolean
  company?: {
    name: string
    verified: boolean
  }
}

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for now
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao@email.com',
        role: 'CUSTOMER',
        createdAt: '2024-01-15T10:00:00Z',
        emailVerified: true,
      },
      {
        id: '2',
        name: 'Solar Tech Ltda',
        email: 'contato@solartech.com.br',
        role: 'COMPANY',
        createdAt: '2023-06-15T10:00:00Z',
        emailVerified: true,
        company: {
          name: 'Solar Tech Soluções',
          verified: true,
        },
      },
      {
        id: '3',
        name: 'Admin Teste',
        email: 'admin@test.com',
        role: 'ADMIN',
        createdAt: '2024-01-27T10:00:00Z',
        emailVerified: true,
      },
    ]
    
    setUsers(mockUsers)
    setIsLoading(false)
  }, [])

  const roleLabels: Record<string, string> = {
    CUSTOMER: 'Cliente',
    COMPANY: 'Empresa',
    ADMIN: 'Administrador',
  }

  const roleColors: Record<string, string> = {
    CUSTOMER: 'bg-blue-100 text-blue-800',
    COMPANY: 'bg-green-100 text-green-800',
    ADMIN: 'bg-red-100 text-red-800',
  }

  const roleIcons: Record<string, any> = {
    CUSTOMER: Users,
    COMPANY: Building2,
    ADMIN: Shield,
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusStats = () => {
    return {
      total: users.length,
      customers: users.filter(u => u.role === 'CUSTOMER').length,
      companies: users.filter(u => u.role === 'COMPANY').length,
      admins: users.filter(u => u.role === 'ADMIN').length,
    }
  }

  const stats = getStatusStats()

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.customers}</div>
            <div className="text-sm text-gray-600">Clientes</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.companies}</div>
            <div className="text-sm text-gray-600">Empresas</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
            <div className="text-sm text-gray-600">Admins</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="flex gap-2">
              <Button
                variant={roleFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('all')}
              >
                Todos ({stats.total})
              </Button>
              
              <Button
                variant={roleFilter === 'CUSTOMER' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('CUSTOMER')}
              >
                Clientes ({stats.customers})
              </Button>
              
              <Button
                variant={roleFilter === 'COMPANY' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('COMPANY')}
              >
                Empresas ({stats.companies})
              </Button>
              
              <Button
                variant={roleFilter === 'ADMIN' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter('ADMIN')}
              >
                Admins ({stats.admins})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Carregando usuários...</div>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-gray-600 text-center">
                Tente ajustar os filtros de busca.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => {
            const RoleIcon = roleIcons[user.role]
            
            return (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <RoleIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            {user.name}
                            {user.emailVerified && (
                              <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center ${roleColors[user.role]}`}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {roleLabels[user.role]}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Cadastrado em {formatDate(user.createdAt)}
                        </div>
                        
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          {user.emailVerified ? 'Email verificado' : 'Email não verificado'}
                        </div>
                        
                        {user.company && (
                          <>
                            <div>
                              <strong>Empresa:</strong> {user.company.name}
                            </div>
                            <div>
                              <strong>Status:</strong> {user.company.verified ? 'Verificada' : 'Pendente'}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      
                      {user.role !== 'ADMIN' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Suspender
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}