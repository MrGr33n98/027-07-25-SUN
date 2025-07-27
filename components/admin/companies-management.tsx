'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Building2,
  Search,
  Filter,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Star,
  MapPin,
  Calendar
} from 'lucide-react'

export function CompaniesManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Mock companies data
  const mockCompanies = [
    {
      id: '1',
      name: 'Solar Tech Soluções',
      email: 'contato@solartech.com.br',
      slug: 'solar-tech-solucoes',
      location: 'São Paulo, SP',
      rating: 4.8,
      reviewCount: 45,
      projectsCount: 120,
      productsCount: 15,
      status: 'active',
      verified: true,
      createdAt: new Date('2023-06-15'),
      lastActivity: new Date('2024-01-20'),
    },
    {
      id: '2',
      name: 'Energia Verde Sustentável',
      email: 'info@energiaverde.com.br',
      slug: 'energia-verde-sustentavel',
      location: 'Campinas, SP',
      rating: 4.6,
      reviewCount: 32,
      projectsCount: 85,
      productsCount: 12,
      status: 'pending',
      verified: false,
      createdAt: new Date('2024-01-10'),
      lastActivity: new Date('2024-01-19'),
    },
    {
      id: '3',
      name: 'Sol Brasileiro',
      email: 'contato@solbrasileiro.com.br',
      slug: 'sol-brasileiro',
      location: 'Rio de Janeiro, RJ',
      rating: 4.4,
      reviewCount: 28,
      projectsCount: 65,
      productsCount: 8,
      status: 'suspended',
      verified: false,
      createdAt: new Date('2023-11-20'),
      lastActivity: new Date('2024-01-15'),
    },
  ]

  const statusLabels: Record<string, string> = {
    active: 'Ativa',
    pending: 'Pendente',
    suspended: 'Suspensa',
    rejected: 'Rejeitada',
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800',
    rejected: 'bg-gray-100 text-gray-800',
  }

  const statusIcons: Record<string, any> = {
    active: CheckCircle,
    pending: AlertTriangle,
    suspended: Ban,
    rejected: XCircle,
  }

  const filteredCompanies = mockCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.location.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR')
  }

  const getStatusStats = () => {
    return {
      total: mockCompanies.length,
      active: mockCompanies.filter(c => c.status === 'active').length,
      pending: mockCompanies.filter(c => c.status === 'pending').length,
      suspended: mockCompanies.filter(c => c.status === 'suspended').length,
    }
  }

  const stats = getStatusStats()

  const handleStatusChange = (companyId: string, newStatus: string) => {
    // TODO: Implement status change API call
    console.log(`Changing company ${companyId} status to ${newStatus}`)
  }

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
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Ativas</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pendentes</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
            <div className="text-sm text-gray-600">Suspensas</div>
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
                  placeholder="Buscar por nome, email ou localização..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Todas ({stats.total})
              </Button>
              
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Ativas ({stats.active})
              </Button>
              
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pendentes ({stats.pending})
              </Button>
              
              <Button
                variant={statusFilter === 'suspended' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('suspended')}
              >
                Suspensas ({stats.suspended})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      <div className="space-y-4">
        {filteredCompanies.map((company) => {
          const StatusIcon = statusIcons[company.status]
          
          return (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-green-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-orange-600" />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          {company.name}
                          {company.verified && (
                            <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{company.email}</p>
                      </div>
                      
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center ${statusColors[company.status]}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusLabels[company.status]}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {company.location}
                      </div>
                      
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-2 text-yellow-500" />
                        {company.rating} ({company.reviewCount} avaliações)
                      </div>
                      
                      <div>
                        <strong>Projetos:</strong> {company.projectsCount}
                      </div>
                      
                      <div>
                        <strong>Produtos:</strong> {company.productsCount}
                      </div>
                    </div>

                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Cadastrada em {formatDate(company.createdAt)}
                      </div>
                      <div>
                        Última atividade: {formatDate(company.lastActivity)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Perfil
                    </Button>
                    
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    
                    {company.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusChange(company.id, 'active')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleStatusChange(company.id, 'rejected')}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                    
                    {company.status === 'active' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleStatusChange(company.id, 'suspended')}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Suspender
                      </Button>
                    )}
                    
                    {company.status === 'suspended' && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusChange(company.id, 'active')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Reativar
                      </Button>
                    )}
                    
                    <Button size="sm" variant="ghost">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredCompanies.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma empresa encontrada
            </h3>
            <p className="text-gray-600 text-center">
              Tente ajustar os filtros de busca.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}