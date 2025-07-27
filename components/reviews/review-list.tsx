'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Star, ThumbsUp, Flag, Calendar, MapPin } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface Review {
  id: string
  rating: number
  title: string
  comment: string
  customerName: string
  customerLocation: string
  projectType: string
  installationDate?: string
  verified: boolean
  helpful: number
  createdAt: string
  user?: {
    image?: string
  }
}

interface ReviewListProps {
  companyId: string
  showAddReview?: boolean
}

export function ReviewList({ companyId, showAddReview = false }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful'>('newest')
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const { addToast } = useToast()

  useEffect(() => {
    fetchReviews()
  }, [companyId, sortBy, filterRating])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        companyId,
        sortBy,
        ...(filterRating && { rating: filterRating.toString() })
      })
      
      const response = await fetch(`/api/reviews?${params}`)
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

  const handleHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
      })
      
      if (response.ok) {
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, helpful: review.helpful + 1 }
            : review
        ))
        
        addToast({
          type: 'success',
          title: 'Obrigado!',
          message: 'Sua avaliação foi registrada'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível registrar sua avaliação'
      })
    }
  }

  const handleReport = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/report`, {
        method: 'POST',
      })
      
      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Denúncia enviada',
          message: 'A avaliação será analisada pela nossa equipe'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível enviar a denúncia'
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRatingStats = () => {
    if (reviews.length === 0) return { average: 0, distribution: [0, 0, 0, 0, 0] }
    
    const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    const distribution = [1, 2, 3, 4, 5].map(rating => 
      reviews.filter(review => review.rating === rating).length
    )
    
    return { average, distribution }
  }

  const { average, distribution } = getRatingStats()

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
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
      {/* Rating Summary */}
      {reviews.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {average.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(average)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-600">
                  Baseado em {reviews.length} avaliações
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <span className="text-sm w-8">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${reviews.length > 0 ? (distribution[rating - 1] / reviews.length) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">
                      {distribution[rating - 1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigas</option>
            <option value="rating_high">Maior avaliação</option>
            <option value="rating_low">Menor avaliação</option>
            <option value="helpful">Mais úteis</option>
          </select>

          <select
            value={filterRating || ''}
            onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
            className="p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todas as avaliações</option>
            <option value="5">5 estrelas</option>
            <option value="4">4 estrelas</option>
            <option value="3">3 estrelas</option>
            <option value="2">2 estrelas</option>
            <option value="1">1 estrela</option>
          </select>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma avaliação ainda
              </h3>
              <p className="text-gray-600">
                Seja o primeiro a avaliar esta empresa!
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar>
                    <AvatarImage src={review.user?.image} />
                    <AvatarFallback>
                      {review.customerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">
                            {review.customerName}
                          </h4>
                          {review.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verificado
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {review.customerLocation}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(review.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <h5 className="font-medium text-gray-900 mb-2">
                      {review.title}
                    </h5>

                    <p className="text-gray-700 mb-3">
                      {review.comment}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Projeto: {review.projectType}</span>
                        {review.installationDate && (
                          <span>
                            Instalação: {formatDate(review.installationDate)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHelpful(review.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Útil ({review.helpful})
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReport(review.id)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <Flag className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}