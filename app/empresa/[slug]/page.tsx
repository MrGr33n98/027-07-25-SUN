import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  Award, 
  Users, 
  Calendar,
  CheckCircle,
  MessageSquare,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { CompanyProducts } from '@/components/company/company-products'
import { CompanyProjects } from '@/components/company/company-projects'
import { CompanyReviews } from '@/components/company/company-reviews'
import { QuoteRequestForm } from '@/components/company/quote-request-form'

interface CompanyPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const company = await getCompanyBySlug(params.slug)
  
  if (!company) {
    return {
      title: 'Empresa não encontrada - SolarConnect',
      description: 'A empresa solicitada não foi encontrada.',
    }
  }

  return {
    title: `${company.name} - SolarConnect`,
    description: company.description,
    openGraph: {
      title: company.name,
      description: company.description,
      images: company.logo ? [company.logo] : [],
    },
  }
}

async function getCompanyBySlug(slug: string) {
  const company = await db.companyProfile.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        }
      },
      products: {
        where: { status: 'APPROVED' },
        take: 6,
        orderBy: { createdAt: 'desc' },
      },
      projects: {
        where: { status: 'APPROVED' },
        take: 4,
        orderBy: { completionDate: 'desc' },
      },
      reviews: {
        where: { status: 'APPROVED' },
        take: 6,
        orderBy: { createdAt: 'desc' },
      },
      companyCertifications: {
        include: {
          certification: true,
        },
        where: {
          status: 'VERIFIED',
        }
      }
    }
  })

  return company
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const company = await getCompanyBySlug(params.slug)

  if (!company) {
    notFound()
  }

  const averageRating = company.rating || 0
  const totalReviews = company.reviewCount || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {company.logo && (
              <div className="w-24 h-24 bg-white rounded-lg p-2 flex-shrink-0">
                <img
                  src={company.logo}
                  alt={`Logo ${company.name}`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">{company.name}</h1>
                {company.verified && (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verificada
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{averageRating.toFixed(1)}</span>
                  <span className="text-orange-100">({totalReviews} avaliações)</span>
                </div>
                
                {company.city && company.state && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{company.city}, {company.state}</span>
                  </div>
                )}
              </div>

              <p className="text-orange-100 text-lg max-w-2xl">
                {company.description}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50" asChild>
                <a href="#solicitar-orcamento">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Solicitar Orçamento
                </a>
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600">
                <Phone className="w-4 h-4 mr-2" />
                Entrar em Contato
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Company Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{company.yearsExperience}</div>
                  <div className="text-sm text-muted-foreground">Anos de Experiência</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Award className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{company.projectsCompleted}</div>
                  <div className="text-sm text-muted-foreground">Projetos Concluídos</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{company.teamSize || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Tamanho da Equipe</div>
                </CardContent>
              </Card>
            </div>

            {/* Specialties */}
            {company.specialties && company.specialties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Especialidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {company.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Areas */}
            {company.serviceAreas && company.serviceAreas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Áreas de Atendimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {company.serviceAreas.map((area) => (
                      <Badge key={area} variant="outline">
                        <MapPin className="w-3 h-3 mr-1" />
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {company.companyCertifications && company.companyCertifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Certificações</CardTitle>
                  <CardDescription>
                    Certificações verificadas da empresa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {company.companyCertifications.map((cert) => (
                      <div key={cert.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Award className="w-6 h-6 text-orange-500" />
                        <div>
                          <div className="font-medium">{cert.certification.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {cert.certification.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products */}
            {company.products && company.products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Produtos
                  </CardTitle>
                  <CardDescription>
                    Produtos oferecidos pela empresa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CompanyProducts products={company.products} companySlug={company.slug} />
                </CardContent>
              </Card>
            )}

            {/* Projects */}
            {company.projects && company.projects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Projetos Realizados</CardTitle>
                  <CardDescription>
                    Alguns dos projetos concluídos pela empresa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CompanyProjects projects={company.projects} />
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {company.reviews && company.reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Avaliações de Clientes</CardTitle>
                  <CardDescription>
                    O que nossos clientes falam sobre nós
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CompanyReviews reviews={company.reviews} />
                </CardContent>
              </Card>
            )}

            {/* Quote Request Form */}
            <div id="solicitar-orcamento">
              <QuoteRequestForm companyId={company.id} companyName={company.name} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {company.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{company.phone}</span>
                  </div>
                )}
                
                {company.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{company.email}</span>
                  </div>
                )}
                
                {company.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline"
                    >
                      Visitar Site
                    </a>
                  </div>
                )}

                {company.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{company.location}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" asChild>
                  <a href="#solicitar-orcamento">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Solicitar Orçamento
                  </a>
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Ligar Agora
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Star className="w-4 h-4 mr-2" />
                  Favoritar
                </Button>
              </CardContent>
            </Card>

            {/* Company Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fundada:</span>
                  <span>{new Date(company.createdAt).getFullYear()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projetos:</span>
                  <span>{company.projectsCompleted}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avaliação:</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {averageRating.toFixed(1)}
                  </span>
                </div>
                
                {company.verified && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="default" className="text-xs">
                      Verificada
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}