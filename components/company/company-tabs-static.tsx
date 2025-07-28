'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Building2, 
  Package, 
  Star, 
  Image as ImageIcon,
  MapPin,
  Calendar,
  User,
  ThumbsUp,
  Award,
  Zap,
  Shield,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  MessageCircle
} from 'lucide-react'

interface CompanyTabsStaticProps {
  company: {
    name: string
    description: string
    specialties: string[]
    certifications: string[]
    yearsExperience: number
    projectsCompleted: number
    rating: number
    reviewCount: number
    serviceAreas: string[]
    phone: string
    email: string
    foundedYear: number
  }
}

export function CompanyTabsStatic({ company }: CompanyTabsStaticProps) {
  const [activeTab, setActiveTab] = useState('sobre')

  const tabs = [
    { id: 'sobre', label: 'Sobre a Empresa', icon: Building2 },
    { id: 'servicos', label: 'Serviços', icon: Zap },
    { id: 'projetos', label: 'Projetos', icon: ImageIcon },
    { id: 'avaliacoes', label: 'Avaliações', icon: Star },
  ]

  // Mock data for demonstration
  const mockServices = [
    {
      id: 1,
      name: 'Projeto de Sistema Fotovoltaico',
      description: 'Desenvolvimento de projeto personalizado com análise de consumo e dimensionamento adequado.',
      features: ['Análise de consumo', 'Dimensionamento', 'Simulação 3D', 'Documentação técnica'],
      price: 'Gratuito no orçamento'
    },
    {
      id: 2,
      name: 'Instalação de Painéis Solares',
      description: 'Instalação completa com equipe especializada e equipamentos de segurança.',
      features: ['Equipe certificada', 'Equipamentos de segurança', 'Garantia de instalação', 'Teste de funcionamento'],
      price: 'A partir de R$ 15.000'
    },
    {
      id: 3,
      name: 'Homologação e Conexão',
      description: 'Processo completo de homologação junto à concessionária de energia.',
      features: ['Documentação', 'Protocolo na concessionária', 'Acompanhamento', 'Conexão final'],
      price: 'Incluso no projeto'
    },
    {
      id: 4,
      name: 'Monitoramento e Manutenção',
      description: 'Acompanhamento da performance e manutenção preventiva do sistema.',
      features: ['Monitoramento remoto', 'Relatórios mensais', 'Manutenção preventiva', 'Suporte técnico'],
      price: 'A partir de R$ 200/mês'
    }
  ]

  const mockProjects = [
    {
      id: 1,
      title: 'Residência Familiar - 5kWp',
      location: 'Vila Madalena, São Paulo',
      power: 5.0,
      completionDate: '2024-01-15',
      type: 'Residencial',
      savings: 'R$ 450/mês',
      description: 'Sistema fotovoltaico residencial com 16 painéis de 315W, inversor string e monitoramento remoto.'
    },
    {
      id: 2,
      title: 'Comércio Local - 15kWp',
      location: 'Pinheiros, São Paulo',
      power: 15.0,
      completionDate: '2023-12-10',
      type: 'Comercial',
      savings: 'R$ 1.200/mês',
      description: 'Instalação comercial com 48 painéis de alta eficiência e sistema de monitoramento avançado.'
    },
    {
      id: 3,
      title: 'Indústria Têxtil - 50kWp',
      location: 'Osasco, São Paulo',
      power: 50.0,
      completionDate: '2023-11-20',
      type: 'Industrial',
      savings: 'R$ 4.500/mês',
      description: 'Grande projeto industrial com 160 painéis e sistema de microinversores para máxima eficiência.'
    }
  ]

  const mockReviews = [
    {
      id: 1,
      rating: 5,
      title: 'Excelente atendimento e qualidade impecável',
      comment: 'Desde o primeiro contato até a finalização do projeto, a equipe da SolarTech se mostrou extremamente profissional. O sistema está funcionando perfeitamente há 8 meses e já consegui uma redução de 95% na conta de luz. Recomendo sem hesitação!',
      customerName: 'João Silva',
      customerLocation: 'Vila Madalena, SP',
      projectType: 'Residencial - 5kWp',
      date: '2024-01-20',
      verified: true,
      helpful: 12,
      savings: 'R$ 450/mês'
    },
    {
      id: 2,
      rating: 5,
      title: 'Investimento que vale muito a pena',
      comment: 'Instalei um sistema de 15kWp no meu comércio e o retorno foi imediato. A equipe cumpriu todos os prazos e a qualidade da instalação é excelente. O monitoramento pelo app é muito prático.',
      customerName: 'Maria Santos',
      customerLocation: 'Pinheiros, SP',
      projectType: 'Comercial - 15kWp',
      date: '2023-12-15',
      verified: true,
      helpful: 8,
      savings: 'R$ 1.200/mês'
    },
    {
      id: 3,
      title: 'Profissionalismo e transparência',
      comment: 'Fiquei impressionado com a transparência em todo o processo. Explicaram cada etapa, cumpriram o cronograma e o pós-venda é excelente. Sistema funcionando perfeitamente!',
      customerName: 'Carlos Oliveira',
      customerLocation: 'Butantã, SP',
      projectType: 'Residencial - 8kWp',
      date: '2023-11-30',
      verified: true,
      helpful: 15,
      savings: 'R$ 680/mês',
      rating: 5
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-8 p-2">
          <div className="flex flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 font-medium text-sm rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-orange-500 to-green-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px] bg-white rounded-lg shadow-sm p-8">
          {/* Sobre Tab */}
          {activeTab === 'sobre' && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold mb-4">Sobre a {company.name}</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {company.description}
                </p>
                
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Por que escolher a {company.name}?</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                      <div>
                        <strong>Experiência Comprovada:</strong> Mais de {company.yearsExperience} anos no mercado de energia solar
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                      <div>
                        <strong>Projetos Realizados:</strong> Mais de {company.projectsCompleted} sistemas instalados com sucesso
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                      <div>
                        <strong>Certificações:</strong> Empresa certificada pelos principais órgãos do setor
                      </div>
                    </div>
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                      <div>
                        <strong>Atendimento Personalizado:</strong> Cada projeto é único e desenvolvido sob medida
                      </div>
                    </div>
                  </div>
                </div>

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
              </div>

              <div>
                <h4 className="font-semibold mb-4">Informações da Empresa</h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fundada em</span>
                    <span className="font-medium">{company.foundedYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projetos Concluídos</span>
                    <span className="font-medium">{company.projectsCompleted}+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Anos de Experiência</span>
                    <span className="font-medium">{company.yearsExperience}+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avaliação Média</span>
                    <span className="font-medium">{company.rating.toFixed(1)} ⭐</span>
                  </div>
                </div>

                {company.certifications && company.certifications.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Certificações e Licenças</h4>
                    <div className="space-y-2">
                      {company.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center text-green-600">
                          <Shield className="w-4 h-4 mr-2" />
                          {cert}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {company.serviceAreas && company.serviceAreas.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Áreas de Atendimento</h4>
                    <div className="text-gray-700">
                      {company.serviceAreas.join(', ')}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-orange-800">Entre em Contato</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-700">
                      <Phone className="w-4 h-4 mr-2" />
                      {company.phone}
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Mail className="w-4 h-4 mr-2" />
                      {company.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Serviços Tab */}
          {activeTab === 'servicos' && (
            <div>
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Nossos Serviços</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Oferecemos soluções completas em energia solar, desde o projeto até a manutenção, 
                  garantindo máxima eficiência e economia para nossos clientes.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {mockServices.map((service, index) => (
                  <div key={service.id} className="relative">
                    <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-orange-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-orange-500">
                      <CardContent className="p-6">
                        <div className="flex items-start mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-green-100 rounded-lg flex items-center justify-center mr-4">
                            <Zap className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-900 mb-2">{service.name}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <h5 className="font-semibold mb-3 text-gray-900">O que está incluído:</h5>
                          <div className="grid grid-cols-1 gap-2">
                            {service.features.map((feature, index) => (
                              <div key={index} className="flex items-center text-sm text-gray-700">
                                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                </div>
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">A partir de</div>
                            <div className="text-xl font-bold text-orange-600">
                              {service.price}
                            </div>
                          </div>
                          <Button className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white">
                            Solicitar Orçamento
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 text-center">
                <div className="bg-gradient-to-r from-orange-50 to-green-50 rounded-xl p-8 border border-orange-200">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Precisa de um orçamento personalizado?</h4>
                  <p className="text-gray-600 mb-6">
                    Nossa equipe está pronta para desenvolver a solução ideal para seu projeto. 
                    Entre em contato e receba uma proposta sem compromisso.
                  </p>
                  <Button size="lg" className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white">
                    <Phone className="w-5 h-5 mr-2" />
                    Falar com Especialista
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Projetos Tab */}
          {activeTab === 'projetos' && (
            <div>
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Projetos Realizados</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Conheça alguns dos nossos projetos mais recentes e veja como ajudamos nossos clientes 
                  a economizar na conta de energia com soluções personalizadas.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {mockProjects.map((project, index) => (
                  <Card key={project.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    <div className="relative h-56 bg-gradient-to-br from-orange-400 via-orange-500 to-green-500 overflow-hidden">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                      <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
                      }}></div>
                      
                      <div className="relative h-full flex items-center justify-center text-white">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-8 h-8" />
                          </div>
                          <div className="text-3xl font-bold mb-2">{project.power}kWp</div>
                          <div className="text-sm opacity-90">{project.type}</div>
                        </div>
                      </div>
                      
                      {/* Project Number */}
                      <div className="absolute top-4 left-4 w-8 h-8 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <h4 className="font-bold text-lg text-gray-900 mb-3">{project.title}</h4>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <MapPin className="w-4 h-4 text-gray-500" />
                          </div>
                          <span>{project.location}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <Calendar className="w-4 h-4 text-gray-500" />
                          </div>
                          <span>Concluído em {formatDate(project.completionDate)}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{project.description}</p>
                      
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-green-800">
                            Economia Mensal:
                          </span>
                          <span className="text-lg font-bold text-green-600">{project.savings}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-12 text-center">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8 border">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Quer ver seu projeto aqui?</h4>
                  <p className="text-gray-600 mb-6">
                    Desenvolvemos projetos personalizados para cada necessidade. 
                    Solicite seu orçamento e junte-se aos nossos clientes satisfeitos.
                  </p>
                  <Button size="lg" className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Solicitar Meu Projeto
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Avaliações Tab */}
          {activeTab === 'avaliacoes' && (
            <div>
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">O que nossos clientes dizem</h3>
                <div className="flex items-center justify-center mb-4">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-orange-600 mb-2">{company.rating.toFixed(1)}</div>
                    <div className="flex items-center justify-center mb-2">
                      {renderStars(Math.floor(company.rating))}
                    </div>
                    <div className="text-gray-500">Baseado em {company.reviewCount} avaliações verificadas</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                {mockReviews.map((review, index) => (
                  <div key={review.id} className="relative">
                    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                      <CardContent className="p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-start">
                            <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-green-100 rounded-full flex items-center justify-center mr-4">
                              <User className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="flex">
                                  {renderStars(review.rating)}
                                </div>
                                {review.verified && (
                                  <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                                    ✓ Avaliação Verificada
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-lg text-gray-900 mb-1">{review.title}</h4>
                              <div className="text-sm text-gray-500">
                                {review.customerName} • {review.customerLocation}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500 mb-1">
                              {formatDate(review.date)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {review.projectType}
                            </div>
                          </div>
                        </div>
                        
                        <blockquote className="text-gray-700 leading-relaxed mb-6 text-lg italic">
                          "{review.comment}"
                        </blockquote>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-6">
                            {review.savings && (
                              <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                                <div className="text-xs text-green-600 font-medium mb-1">Economia Mensal</div>
                                <div className="text-lg font-bold text-green-700">
                                  {review.savings}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-500">
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            {review.helpful} pessoas acharam esta avaliação útil
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Quote decoration */}
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-r from-orange-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      "
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 text-center">
                <div className="bg-gradient-to-r from-orange-50 to-green-50 rounded-xl p-8 border border-orange-200">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">Seja nosso próximo cliente satisfeito!</h4>
                  <p className="text-gray-600 mb-6">
                    Junte-se aos nossos {company.projectsCompleted}+ clientes que já economizam com energia solar. 
                    Solicite seu orçamento gratuito e comece a economizar hoje mesmo.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Solicitar Orçamento Gratuito
                    </Button>
                    <Button size="lg" variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                      <Phone className="w-5 h-5 mr-2" />
                      Falar com Especialista
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}