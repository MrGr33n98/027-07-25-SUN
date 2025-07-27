'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  DollarSign,
  MessageSquare,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  location: string
  projectType: string
  budget?: string
  message: string
  status: string
  source?: string
  createdAt: string
}

export function LeadsList() {
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch leads from API
  useEffect(() => {
    fetchLeads()
  }, [selectedStatus])

  const fetchLeads = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/leads?status=${selectedStatus}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchLeads() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating lead status:', error)
    }
  }

  const statusLabels: Record<string, string> = {
    NEW: 'Novo',
    CONTACTED: 'Contatado',
    PROPOSAL_SENT: 'Proposta Enviada',
    NEGOTIATING: 'Negociando',
    CLOSED: 'Fechado',
    LOST: 'Perdido',
  }

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    CONTACTED: 'bg-yellow-100 text-yellow-800',
    PROPOSAL_SENT: 'bg-purple-100 text-purple-800',
    NEGOTIATING: 'bg-orange-100 text-orange-800',
    CLOSED: 'bg-green-100 text-green-800',
    LOST: 'bg-red-100 text-red-800',
  }

  const statusIcons: Record<string, any> = {
    NEW: AlertCircle,
    CONTACTED: Clock,
    PROPOSAL_SENT: MessageSquare,
    NEGOTIATING: DollarSign,
    CLOSED: CheckCircle,
    LOST: AlertCircle,
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusStats = () => {
    const stats = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: leads.length,
      new: stats.NEW || 0,
      contacted: stats.CONTACTED || 0,
      proposal_sent: stats.PROPOSAL_SENT || 0,
      closed: stats.CLOSED || 0,
    }
  }

  const stats = getStatusStats()

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <div className="text-sm text-gray-600">Novos</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
            <div className="text-sm text-gray-600">Contatados</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.proposal_sent}</div>
            <div className="text-sm text-gray-600">Propostas</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.closed}</div>
            <div className="text-sm text-gray-600">Fechados</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus('all')}
            >
              Todos ({stats.total})
            </Button>
            
            {Object.entries(statusLabels).map(([status, label]) => {
              const count = mockLeads.filter(lead => lead.status === status).length
              if (count === 0) return null
              
              return (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                >
                  {label} ({count})
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Carregando leads...</div>
        ) : leads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum lead encontrado
              </h3>
              <p className="text-gray-600 text-center">
                {selectedStatus === 'all' 
                  ? 'Você ainda não recebeu nenhuma solicitação de orçamento.'
                  : `Não há leads com status "${statusLabels[selectedStatus.toUpperCase()]}".`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          leads.map((lead) => {
          const StatusIcon = statusIcons[lead.status]
          
          return (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {lead.name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center ${statusColors[lead.status]}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusLabels[lead.status]}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          {lead.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2" />
                          {lead.phone}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {lead.location}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <strong>Tipo:</strong> {lead.projectType}
                        </div>
                        <div>
                          <strong>Orçamento:</strong> {lead.budget}
                        </div>
                        <div>
                          <strong>Origem:</strong> {lead.source}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-gray-700">
                        <strong>Mensagem:</strong> {lead.message}
                      </p>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      Recebido em {formatDate(lead.createdAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Phone className="w-4 h-4 mr-2" />
                      Contatar
                    </Button>
                    
                    <Button size="sm" variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Mensagem
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredLeads.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum lead encontrado
            </h3>
            <p className="text-gray-600 text-center">
              {selectedStatus === 'all' 
                ? 'Você ainda não recebeu nenhuma solicitação de orçamento.'
                : `Não há leads com status "${statusLabels[selectedStatus]}".`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}