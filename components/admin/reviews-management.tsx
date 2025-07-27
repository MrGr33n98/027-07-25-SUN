'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Star, 
  Search, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Building2,
  User,
  Calendar,
  Flag,
  Eye
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface Review {
  id: string
  title: string
  comment: string
  rating: number
  customerName: string
  customerLocation: string
  projectType: string
  status: string
  flagReason?: string
  company: {
    name: string
    verified: boolean
  }
  createdAt: string
}

export function AdminReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const { addToast } = useToast()

  useEffect(() => {
    fetchReviews()
  }, [searchQuery, statusFilter, ratingFilter])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (ratingFilter !== 'all') params.set('rating', ratingFilter)
      
      const response = await fetch(`/api/admin/reviews?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateReviewStatus = async (reviewId: string, status: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Status atualizado',
          message: `Avaliação ${status === 'APPROVED' ? 'aprovada' : 'rejeitada'} com sucesso`
        })
        fetchReviews()
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível atualizar o status'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendente', variant: 'secondary' as const, icon: AlertTriangle },
      APPROVED: { label: 'Aprovada', variant: 'default' as const, icon: CheckCircle },
      REJECTED: { label: 'Rejeitada', variant: 'destructive' as const, icon: XCircle },
      FLAGGED: { label: 'Sinalizada', variant: 'destructive' as const, icon: Flag },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar avaliações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todos os status</option>
              <option value="PENDING">Pendente</option>
              <option value="APPROVED">Aprovada</option>
              <option value="REJECTED">Rejeitada</option>
              <option value="FLAGGED">Sinalizada</option>
            </select>
            
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todas as avaliações</option>
              <option value="5">5 estrelas</option>
              <option value="4">4 estrelas</option>
              <option value="3">3 estrelas</option>
              <option value="2">2 estrelas</option>
              <option value="1">1 estrela</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma avaliação encontrada
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros de busca
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {review.title}
                      </h3>
                      {getStatusBadge(review.status)}
                    </div>
                    
                    <div className="flex items-center space-x-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {review.rating}/5 estrelas
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-4">
                      {review.comment}
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        <span>{review.customerName} - {review.customerLocation}</span>
                      </div>
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-2" />
                        <span>{review.company.name}</span>
                        {review.company.verified && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Verificada
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span>Projeto: {review.projectType}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                    
                    {review.flagReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center text-red-800">
                          <Flag className="w-4 h-4 mr-2" />
                          <strong>Motivo da Sinalização:</strong>
                        </div>
                        <p className="text-red-700 text-sm mt-1">{review.flagReason}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-2">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" />
                    Ver Detalhes
                  </Button>
                  
                  {review.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateReviewStatus(review.id, 'APPROVED')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateReviewStatus(review.id, 'REJECTED', 'Rejeitada pelo administrador')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                  
                  {review.status === 'FLAGGED' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateReviewStatus(review.id, 'APPROVED')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateReviewStatus(review.id, 'REJECTED', 'Conteúdo inadequado')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Remover
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}