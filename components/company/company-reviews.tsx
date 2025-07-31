import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Star, CheckCircle, ThumbsUp, User } from "lucide-react"

interface Review {
  id: string
  rating: number
  title: string
  comment: string
  customerName: string
  customerLocation: string
  projectType: string
  installationDate?: Date | null
  verified: boolean
  helpful: number
  status: string
  createdAt: Date
}

interface CompanyReviewsProps {
  reviews: Review[]
}

export function CompanyReviews({ reviews }: CompanyReviewsProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'há 1 dia'
    if (diffDays < 30) return `há ${diffDays} dias`
    if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`
    return `há ${Math.floor(diffDays / 365)} anos`
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="p-6">
          <CardContent className="p-0">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-orange-600" />
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{review.customerName}</h4>
                    {review.verified && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {getTimeAgo(review.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({review.rating}/5)
                  </span>
                </div>

                <h5 className="font-medium mb-2">{review.title}</h5>
                
                <p className="text-gray-700 mb-3 leading-relaxed">
                  {review.comment}
                </p>

                <div className="flex flex-wrap gap-2 mb-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    📍 {review.customerLocation}
                  </span>
                  <span>•</span>
                  <span>{review.projectType}</span>
                  {review.installationDate && (
                    <>
                      <span>•</span>
                      <span>
                        Instalação: {formatDate(review.installationDate)}
                      </span>
                    </>
                  )}
                </div>

                {review.helpful > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{review.helpful} pessoas acharam útil</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {reviews.length === 0 && (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma avaliação disponível</p>
          <p className="text-sm text-muted-foreground mt-2">
            Seja o primeiro a avaliar esta empresa!
          </p>
        </div>
      )}
    </div>
  )
}