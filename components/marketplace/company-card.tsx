'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Star, Award, Phone, ExternalLink, Heart } from 'lucide-react'
import { Company } from '@/types'
import { formatRating } from '@/lib/utils'

interface CompanyCardProps {
  company: Company
}

export function CompanyCard({ company }: CompanyCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited)
  }

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

  return (
    <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Company Header */}
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Company Logo */}
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-green-100 rounded-lg flex items-center justify-center">
              {company.logo ? (
                <img 
                  src={company.logo} 
                  alt={company.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-2xl font-bold text-orange-600">
                  {company.name.charAt(0)}
                </span>
              )}
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {company.name}
              </h3>
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex items-center">
                  {renderStars(Math.floor(company.rating || 0))}
                  <span className="ml-2 text-sm text-gray-600">
                    {formatRating(company.rating || 0)} ({company.reviewCount || 0} avaliações)
                  </span>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-1" />
                {company.city}, {company.state}
              </div>
            </div>
          </div>

          {/* Favorite Button */}
          <button
            onClick={toggleFavorite}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Heart 
              className={`w-5 h-5 ${
                isFavorited 
                  ? 'fill-red-500 text-red-500' 
                  : 'text-gray-400 hover:text-red-500'
              }`} 
            />
          </button>
        </div>

        {/* Company Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-500">
              {company.yearsExperience || 0}
            </div>
            <div className="text-xs text-gray-500">Anos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-500">
              {company.projectsCompleted || 0}
            </div>
            <div className="text-xs text-gray-500">Projetos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-500">
              {company.certifications?.length || 0}
            </div>
            <div className="text-xs text-gray-500">Certificações</div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {company.description}
        </p>

        {/* Specialties Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(company.specialties || []).slice(0, 3).map((specialty, index) => (
            <span 
              key={index} 
              className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full"
            >
              {specialty}
            </span>
          ))}
          {(company.specialties?.length || 0) > 3 && (
            <span className="text-xs text-gray-500">
              +{(company.specialties?.length || 0) - 3} mais
            </span>
          )}
        </div>

        {/* Verified Badge */}
        {company.verified && (
          <div className="flex items-center text-sm text-green-600 mb-4">
            <Award className="w-4 h-4 mr-2" />
            Empresa Verificada
          </div>
        )}

        {/* Company Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="border-orange-500 text-orange-500 hover:bg-orange-50"
            asChild
          >
            <a href={`tel:${company.phone}`}>
              <Phone className="w-4 h-4 mr-2" />
              Contato
            </a>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="border-green-500 text-green-500 hover:bg-green-50"
            asChild
          >
            <Link href={`/empresa/${company.slug}`}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Perfil
            </Link>
          </Button>
        </div>
        
        <Button 
          className="w-full mt-3 bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white"
          size="sm"
          asChild
        >
          <Link href={`/empresa/${company.slug}?action=quote`}>
            Solicitar Orçamento
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}