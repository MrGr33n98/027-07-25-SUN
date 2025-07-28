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
  Heart,
  Clock,
  Shield,
  Users,
  Zap,
  CheckCircle
} from 'lucide-react'

interface CompanyHeroStaticProps {
  company: {
    name: string
    description: string
    city: string
    state: string
    phone: string
    email: string
    website?: string
    verified: boolean
    rating: number
    reviewCount: number
    yearsExperience: number
    projectsCompleted: number
    specialties: string[]
    certifications: string[]
    serviceAreas: string[]
  }
}

export function CompanyHeroStatic({ company }: CompanyHeroStaticProps) {
  const [isFavorited, setIsFavorited] = useState(false)

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating
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
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <>
      {/* Banner Hero */}
      <section className="relative h-80 bg-gradient-to-r from-orange-600 via-orange-500 to-green-500 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        {/* Content */}
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-4xl">
            <div className="flex items-center mb-3">
              <div className="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-5">
                <span className="text-xl font-bold text-white">
                  {company.name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {company.name}
                </h1>
                {company.verified && (
                  <div className="flex items-center bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium w-fit">
                    <Award className="w-4 h-4 mr-2" />
                    Empresa Verificada
                  </div>
                )}
              </div>
            </div>

            <p className="text-lg text-white text-opacity-90 mb-4 max-w-2xl leading-relaxed">
              {company.description}
            </p>

            <div className="flex flex-wrap gap-3 mb-4">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-semibold">{company.yearsExperience}+ anos</span>
                </div>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
                <div className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  <span className="font-semibold">{company.projectsCompleted}+ projetos</span>
                </div>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
                <div className="flex items-center">
                  {renderStars(Math.floor(company.rating))}
                  <span className="ml-2 font-semibold">{company.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-6"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Solicitar Orçamento Grátis
              </Button>

              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-orange-600 font-semibold"
                asChild
              >
                <a href={`tel:${company.phone}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  {company.phone}
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-32 w-20 h-20 bg-white bg-opacity-10 rounded-full blur-lg"></div>
      </section>

      {/* Company Info Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Key Metrics */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                  <Clock className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {company.yearsExperience}+
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Anos de Experiência</div>
                </div>

                <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <Zap className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {company.projectsCompleted}+
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Projetos Realizados</div>
                </div>

                <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <Shield className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {company.certifications.length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Certificações</div>
                </div>

                <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <Users className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {company.serviceAreas.length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Cidades Atendidas</div>
                </div>
              </div>

              {/* Company Details */}
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Por que escolher a {company.name}?</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Experiência Comprovada</h3>
                        <p className="text-gray-600 text-sm">Mais de {company.yearsExperience} anos no mercado de energia solar com {company.projectsCompleted}+ projetos realizados</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                        <Award className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Empresa Verificada</h3>
                        <p className="text-gray-600 text-sm">Certificada pelos principais órgãos do setor e com todas as licenças em dia</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                        <Star className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Alta Satisfação</h3>
                        <p className="text-gray-600 text-sm">Avaliação {company.rating.toFixed(1)}⭐ baseada em {company.reviewCount} avaliações reais de clientes</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Informações de Contato</h2>
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <MapPin className="w-6 h-6 text-gray-500 mr-4" />
                      <div>
                        <div className="font-medium text-gray-900">Localização</div>
                        <div className="text-gray-600">{company.city}, {company.state}</div>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <Phone className="w-6 h-6 text-gray-500 mr-4" />
                      <div>
                        <div className="font-medium text-gray-900">Telefone</div>
                        <div className="text-gray-600">{company.phone}</div>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <Mail className="w-6 h-6 text-gray-500 mr-4" />
                      <div>
                        <div className="font-medium text-gray-900">E-mail</div>
                        <div className="text-gray-600">{company.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-3">
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white font-semibold"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Solicitar Orçamento Gratuito
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
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
                    </div>

                    <div className="flex justify-center space-x-4 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFavorited(!isFavorited)}
                      >
                        <Heart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                        {isFavorited ? 'Favoritado' : 'Favoritar'}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShare}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Compartilhar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-orange-600 mb-1">{company.rating.toFixed(1)}</div>
                      <div className="flex items-center justify-center mb-2">
                        {renderStars(Math.floor(company.rating))}
                      </div>
                      <div className="text-sm text-gray-500">{company.reviewCount} avaliações</div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">Fundada em</span>
                        <span className="font-semibold text-sm">
                          {new Date().getFullYear() - company.yearsExperience}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">Projetos</span>
                        <span className="font-semibold text-sm">{company.projectsCompleted}+</span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 text-sm">Certificações</span>
                        <span className="font-semibold text-sm">{company.certifications.length}</span>
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-sm">Especialidades</h4>
                      <div className="flex flex-wrap gap-1">
                        {company.specialties.slice(0, 3).map((specialty, index) => (
                          <span
                            key={index}
                            className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                        {company.specialties.length > 3 && (
                          <span className="text-xs text-gray-500">+{company.specialties.length - 3} mais</span>
                        )}
                      </div>
                    </div>

                    {/* Service Areas */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-sm">Atendimento</h4>
                      <div className="text-xs text-gray-600 leading-relaxed">
                        {company.serviceAreas.slice(0, 3).join(', ')}
                        {company.serviceAreas.length > 3 && ` e mais ${company.serviceAreas.length - 3} cidades`}
                      </div>
                    </div>

                    {/* Quick Contact */}
                    <div className="bg-gradient-to-r from-orange-50 to-green-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 text-sm text-center">Contato Rápido</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-center text-gray-700">
                          <Phone className="w-3 h-3 mr-2" />
                          {company.phone}
                        </div>
                        <div className="flex items-center justify-center text-gray-700">
                          <Mail className="w-3 h-3 mr-2" />
                          {company.email}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}