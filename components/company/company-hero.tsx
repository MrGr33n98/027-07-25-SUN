'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  MapPin, 
  Star, 
  Award, 
  Phone, 
  Mail, 
  Globe, 
  MessageCircle,
  Share2,
  Heart
} from 'lucide-react'
import { Company } from '@/types'
import { formatRating } from '@/lib/utils'
import { QuoteModal } from './quote-modal'

interface CompanyHeroProps {
  company: Company
  showQuoteForm?: boolean
}

export function CompanyHero({ company, showQuoteForm = false }: CompanyHeroProps) {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(showQuoteForm)
  const [isFavorited, setIsFavorited] = useState(false)

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: company.name,
          text: company.description,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      // TODO: Show toast notification
    }
  }

  return (
    <>
      <section className="bg-gradient-to-br from-orange-50 to-green-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-start space-x-6 mb-6">
                {/* Company Logo */}
                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {company.logo ? (
                    <img 
                      src={company.logo} 
                      alt={company.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-orange-600">
                      {company.name.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {company.name}
                    </h1>
                    {company.verified && (
                      <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        <Award className="w-4 h-4 mr-1" />
                        Verificada
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex items-center">
                      {renderStars(Math.floor(company.rating))}
                      <span className="ml-2 text-lg font-semibold text-gray-900">
                        {formatRating(company.rating)}
                      </span>
                    </div>
                    <span className="text-gray-600">
                      ({company.reviewCount} avaliações)
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-5 h-5 mr-2" />
                    {company.location}
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 leading-relaxed">
                    {company.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => setIsQuoteModalOpen(true)}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Solicitar Orçamento
                </Button>

                {company.phone && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-green-500 text-green-600 hover:bg-green-50"
                    asChild
                  >
                    <a href={`tel:${company.phone}`}>
                      <Phone className="w-5 h-5 mr-2" />
                      Ligar
                    </a>
                  </Button>
                )}

                {company.email && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    asChild
                  >
                    <a href={`mailto:${company.email}`}>
                      <Mail className="w-5 h-5 mr-2" />
                      E-mail
                    </a>
                  </Button>
                )}

                {company.website && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    asChild
                  >
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-5 h-5 mr-2" />
                      Site
                    </a>
                  </Button>
                )}

                <Button 
                  variant="ghost" 
                  size="lg"
                  onClick={() => setIsFavorited(!isFavorited)}
                >
                  <Heart className={`w-5 h-5 mr-2 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                  {isFavorited ? 'Favoritado' : 'Favoritar'}
                </Button>

                <Button 
                  variant="ghost" 
                  size="lg"
                  onClick={handleShare}
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Informações</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Anos de experiência</span>
                      <span className="font-semibold">{company.yearsExperience || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Projetos realizados</span>
                      <span className="font-semibold">{company.projectsCompleted || 0}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tamanho da equipe</span>
                      <span className="font-semibold">{company.teamSize || 'N/A'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Certificações</span>
                      <span className="font-semibold">{company.certifications?.length || 0}</span>
                    </div>
                  </div>

                  {/* Specialties */}
                  {company.specialties && company.specialties.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Especialidades</h4>
                      <div className="flex flex-wrap gap-2">
                        {company.specialties.map((specialty, index) => (
                          <span 
                            key={index}
                            className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service Areas */}
                  {company.serviceAreas && company.serviceAreas.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Áreas de Atendimento</h4>
                      <div className="text-sm text-gray-600">
                        {company.serviceAreas.join(', ')}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Modal */}
      <QuoteModal 
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        company={company}
      />
    </>
  )
}