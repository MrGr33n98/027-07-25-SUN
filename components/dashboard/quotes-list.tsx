'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Clock, 
  DollarSign,
  Eye,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Plus
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface QuoteItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category?: string
}

interface Quote {
  id: string
  title: string
  description?: string
  totalValue: number
  validUntil: string
  status: string
  terms?: string
  notes?: string
  createdAt: string
  updatedAt: string
  items: QuoteItem[]
  lead?: {
    id: string
    name: string
    email: string
    projectType: string
  }
  user?: {
    id: string
    name: string
    email: string
  }
}

export function QuotesList() {
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch quotes from API
  useEffect(() => {
    fetchQuotes()
  }, [selectedStatus])

  const fetchQuotes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/quotes?status=${selectedStatus}`)
      if (response.ok) {
        const data = await response.json()
        setQuotes(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching quotes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuoteStatus = async (quoteId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchQuotes() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating quote status:', error)
    }
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'Rascunho',
    SENT: 'Enviado',
    VIEWED: 'Visualizado',
    ACCEPTED: 'Aceito',
    REJECTED: 'Rejeitado',
    EXPIRED: 'Expirado',
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    VIEWED: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-orange-100 text-orange-800',
  }

  const statusIcons: Record<string, any> = {
    DRAFT: Edit,
    SENT: Send,
    VIEWED: Eye,
    ACCEPTED: CheckCircle,
    REJECTED: XCircle,
    EXPIRED: AlertCircle,
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  const getStatusStats = () => {
    const stats = quotes.reduce((acc, quote) => {
      acc[quote.status] = (acc[quote.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: quotes.length,
      draft: stats.DRAFT || 0,
      sent: stats.SENT || 0,
      viewed: stats.VIEWED || 0,
      accepted: stats.ACCEPTED || 0,
      rejected: stats.REJECTED || 0,
    }
  }

  const stats = getStatusStats()

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <div className="text-sm text-gray-600">Rascunhos</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            <div className="text-sm text-gray-600">Enviados</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.viewed}</div>
            <div className="text-sm text-gray-600">Visualizados</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-sm text-gray-600">Aceitos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejeitados</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus('all')}
          >
            Todos ({stats.total})
          </Button>
          
          {Object.entries(statusLabels).map(([status, label]) => {
            const count = quotes.filter(quote => quote.status === status).length
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

        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Quotes List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Carregando orçamentos...</div>
        ) : quotes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum orçamento encontrado
              </h3>
              <p className="text-gray-600 text-center">
                {selectedStatus === 'all' 
                  ? 'Você ainda não criou nenhum orçamento.'
                  : `Não há orçamentos com status "${statusLabels[selectedStatus.toUpperCase()]}".`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          quotes.map((quote) => {
            const StatusIcon = statusIcons[quote.status]
            const expired = isExpired(quote.validUntil)
            
            return (
              <Card key={quote.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {quote.title}
                        </h3>
                        <Badge className={`text-xs px-2 py-1 rounded-full flex items-center ${statusColors[quote.status]}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusLabels[quote.status]}
                        </Badge>
                        {expired && quote.status !== 'EXPIRED' && (
                          <Badge variant="destructive" className="text-xs">
                            Expirado
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            <span className="font-semibold text-green-600">
                              {formatCurrency(quote.totalValue)}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Válido até {formatDate(quote.validUntil)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Criado em {formatDate(quote.createdAt)}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {quote.lead && (
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              {quote.lead.name} - {quote.lead.projectType}
                            </div>
                          )}
                          <div>
                            <strong>Itens:</strong> {quote.items.length}
                          </div>
                          {quote.description && (
                            <div className="text-xs text-gray-500 truncate">
                              {quote.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Items preview */}
                      <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <h4 className="font-medium text-sm mb-2">Itens do Orçamento:</h4>
                        <div className="space-y-1">
                          {quote.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span className="truncate">
                                {item.quantity}x {item.description}
                              </span>
                              <span className="font-medium">
                                {formatCurrency(item.totalPrice)}
                              </span>
                            </div>
                          ))}
                          {quote.items.length > 3 && (
                            <div className="text-xs text-gray-500">
                              + {quote.items.length - 3} item(s) adicional(is)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      
                      {quote.status === 'DRAFT' && (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => updateQuoteStatus(quote.id, 'SENT')}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Enviar
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