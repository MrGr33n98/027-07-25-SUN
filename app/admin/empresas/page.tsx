'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  Building2, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle,
  Eye,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar
} from 'lucide-react'

interface Company {
  id: string
  name: string
  description: string
  verified: boolean
  status: string
  phone: string
  email: string
  website?: string
  address: string
  city: string
  state: string
  createdAt: string
  user: {
    name: string
    email: string
    status: string
  }
  _count: {
    products: number
    reviews: number
    appointments: number
  }
  averageRating: number
}

function CompaniesManagement() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verifiedFilter, setVerifiedFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { q: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(verifiedFilter !== 'all' && { verified: verifiedFilter }),
      })

      const response = await fetch(`/api/admin/companies?${params}`)
      const data = await response.json()

      if (response.ok) {
        setCompanies(data.data)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [currentPage, searchTerm, statusFilter, verifiedFilter])

  const handleVerificationChange = async (companyId: string, verified: boolean) => {
    try {
      const response = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified })
      })

      if (response.ok) {
        fetchCompanies()
      }
    } catch (error) {
      console.error('Error updating company verification:', error)
    }
  }

  const handleStatusChange = async (companyId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchCompanies()
      }
    } catch (error) {
      console.error('Error updating company status:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar empresas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="SUSPENDED">Suspenso</option>
            <option value="PENDING">Pendente</option>
          </select>

          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas verificações</option>
            <option value="true">Verificadas</option>
            <option value="false">Não verificadas</option>
          </select>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Carregando empresas...
          </div>
        ) : companies.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhuma empresa encontrada
          </div>
        ) : (
          companies.map((company) => (
            <div key={company.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        {company.name}
                        {company.verified && (
                          <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{company.user.name}</p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {company.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-2" />
                    {company.city}, {company.state}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Phone className="w-4 h-4 mr-2" />
                    {company.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Mail className="w-4 h-4 mr-2" />
                    {company.email}
                  </div>
                  {company.website && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Globe className="w-4 h-4 mr-2" />
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Website
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">
                      {company.averageRating ? company.averageRating.toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      ({company._count.reviews} avaliações)
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(company.status)}`}>
                    {company.status === 'ACTIVE' ? 'Ativo' : company.status === 'SUSPENDED' ? 'Suspenso' : 'Pendente'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{company._count.products}</div>
                    <div className="text-xs text-gray-500">Produtos</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{company._count.appointments}</div>
                    <div className="text-xs text-gray-500">Agendamentos</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{company._count.reviews}</div>
                    <div className="text-xs text-gray-500">Avaliações</div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Cadastrada em {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleVerificationChange(company.id, !company.verified)}
                      className={`flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                        company.verified
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {company.verified ? (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Remover verificação
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verificar
                        </>
                      )}
                    </button>
                  </div>
                  
                  <select
                    value={company.status}
                    onChange={(e) => handleStatusChange(company.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Ativo</option>
                    <option value="SUSPENDED">Suspenso</option>
                    <option value="PENDING">Pendente</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Próximo
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminCompaniesPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Carregando...</div>
  }

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Empresas</h1>
        <p className="text-gray-600">
          Visualize e gerencie todas as empresas da plataforma
        </p>
      </div>

      <CompaniesManagement />
    </div>
  )
}