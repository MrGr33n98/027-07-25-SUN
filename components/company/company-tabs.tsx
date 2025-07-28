'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Building2, 
  Package, 
  Star, 
  Image as ImageIcon,
  MapPin,
  Calendar,
  User,
  ThumbsUp
} from 'lucide-react'
import { Company } from '@/types'

interface CompanyTabsProps {
  company: Company
}

export function CompanyTabs({ company }: CompanyTabsProps) {
  const [activeTab, setActiveTab] = useState('sobre')

  const tabs = [
    { id: 'sobre', label: 'Sobre', icon: Building2 },
    { id: 'projetos', label: 'Projetos', icon: ImageIcon },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'avaliacoes', label: 'Avaliações', icon: Star },
  ]

  // Mock data for demonstration
  const mockProjects = [
    {
      id: 1,
      title: 'Sistema Residencial 5kWp',
      location: 'São Paulo, SP',
      power: 5.0,
      completionDate: '2024-01-15',
      type: 'Residencial',
      image: '/placeholder-project.jpg'
    },
    {
      id: 2,
      title: 'Instalação Comercial 15kWp',
      location: 'Campinas, SP',
      power: 15.0,
      completionDate: '2023-12-10',
      type: 'Comercial',
      image: '/placeholder-project.jpg'
    }
  ]

  const mockProducts = [
    {
      id: 1,
      name: 'Painel Solar 450W Monocristalino',
      price: 890,
      power: 450,
      efficiency: 21.2,
      warranty: 25,
      inStock: true
    },
    {
      id: 2,
      name: 'Inversor String 5kW',
      price: 2500,
      power: 5000,
      efficiency: 97.5,
      warranty: 10,
      inStock: true
    }
  ]

  const mockReviews = [
    {
      id: 1,
      rating: 5,
      title: 'Excelente atendimento e qualidade',
      comment: 'Equipe muito profissional, instalação rápida e sistema funcionando perfeitamente. Recomendo!',
      customerName: 'João Silva',
      customerLocation: 'São Paulo, SP',
      projectType: 'Residencial',
      date: '2024-01-20',
      verified: true,
      helpful: 12
    },
    {
      id: 2,
      rating: 4,
      title: 'Bom custo-benefício',
      comment: 'Projeto bem executado, prazo cumprido. Apenas algumas pequenas questões na documentação.',
      customerName: 'Maria Santos',
      customerLocation: 'Campinas, SP',
      projectType: 'Comercial',
      date: '2023-12-15',
      verified: true,
      helpful: 8
    }
  ]

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-gray-200 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {/* Sobre Tab */}
          {activeTab === 'sobre' && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-4">Sobre a Empresa</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {company.description}
                </p>
                
                {company.specialties && company.specialties.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Especialidades</h4>
                    <div className="flex flex-wrap gap-2">
                      {company.specialties.map((specialty, index) => (
                        <span 
                          key={index}
                          className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {company.certifications && company.certifications.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Certificações</h4>
                    <div className="space-y-2">
                      {company.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center text-green-600">
                          <Star className="w-4 h-4 mr-2" />
                          {cert}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-4">Informações Detalhadas</h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fundada em</span>
                    <span className="font-medium">
                      {new Date().getFullYear() - (company.yearsExperience || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projetos Concluídos</span>
                    <span className="font-medium">{company.projectsCompleted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Equipe</span>
                    <span className="font-medium">{company.teamSize || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avaliação Média</span>
                    <span className="font-medium">{(company.rating || 0).toFixed(1)} ⭐</span>
                  </div>
                </div>

                {company.serviceAreas && company.serviceAreas.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Áreas de Atendimento</h4>
                    <div className="text-gray-700">
                      {company.serviceAreas.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projetos Tab */}
          {activeTab === 'projetos' && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Projetos Realizados</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockProjects.map((project) => (
                  <Card key={project.id} className="overflow-hidden">
                    <div className="h-48 bg-gradient-to-br from-orange-100 to-green-100 flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-gray-400" />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">{project.title}</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {project.location}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(project.completionDate)}
                        </div>
                        <div className="flex justify-between">
                          <span>Potência:</span>
                          <span className="font-medium">{project.power}kWp</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tipo:</span>
                          <span className="font-medium">{project.type}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Produtos Tab */}
          {activeTab === 'produtos' && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Produtos Disponíveis</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-6">
                      <h4 className="font-semibold mb-3">{product.name}</h4>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Potência:</span>
                          <span className="font-medium">{product.power}W</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Eficiência:</span>
                          <span className="font-medium">{product.efficiency}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Garantia:</span>
                          <span className="font-medium">{product.warranty} anos</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-orange-600">
                          {formatPrice(product.price)}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          product.inStock 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.inStock ? 'Em estoque' : 'Indisponível'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Avaliações Tab */}
          {activeTab === 'avaliacoes' && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Avaliações dos Clientes</h3>
              <div className="space-y-6">
                {mockReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex">
                              {renderStars(review.rating)}
                            </div>
                            {review.verified && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Verificada
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold">{review.title}</h4>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.date)}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{review.comment}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {review.customerName}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {review.customerLocation}
                          </div>
                          <span>Projeto: {review.projectType}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {review.helpful} pessoas acharam útil
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}