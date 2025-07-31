import { Metadata } from 'next'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Star, 
  MapPin, 
  Award, 
  CheckCircle, 
  Users, 
  Calendar,
  Search,
  Filter
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Marketplace - SolarConnect',
  description: 'Encontre as melhores empresas de energia solar do Brasil',
}

interface SearchParams {
  searchParams: {
    search?: string
    city?: string
    state?: string
    specialty?: string
    verified?: string
  }
}

async function getCompanies(params: SearchParams['searchParams']) {
  const where: any = {}

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
      { specialties: { hasSome: [params.search.toLowerCase()] } }
    ]
  }

  if (params.city) {
    where.city = { contains: params.city, mode: 'insensitive' }
  }

  if (params.state) {
    where.state = params.state.toUpperCase()
  }

  if (params.specialty) {
    where.specialties = { has: params.specialty.toLowerCase() }
  }

  if (params.verified === 'true') {
    where.verified = true
  }

  const companies = await db.companyProfile.findMany({
    where,
    orderBy: [
      { verified: 'desc' },
      { rating: 'desc' },
      { reviewCount: 'desc' }
    ],
    include: {
      _count: {
        select: {
          products: { where: { status: 'APPROVED' } },
          projects: { where: { status: 'APPROVED' } },
          reviews: { where: { status: 'APPROVED' } }
        }
      }
    }
  })

  return companies
}

export default async function MarketplacePage({ searchParams }: SearchParams) {
  const companies = await getCompanies(searchParams)

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Encontre a Empresa Ideal para Seu Projeto Solar
            </h1>
            <p className="text-xl text-orange-100 mb-8">
              Conecte-se com as melhores empresas de energia solar do Brasil. 
              Compare preços, avaliações e solicite orçamentos gratuitos.
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-lg p-4 shadow-lg max-w-2xl mx-auto">
              <form method="GET" className="flex gap-2">
                <div className="flex-grow relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    name="search"
                    placeholder="Buscar por empresa, cidade ou especialidade..."
                    defaultValue={searchParams.search}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">
                  Buscar
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </h2>
          
          <form method="GET" className="grid md:grid-cols-5 gap-4">
            <Input
              name="search"
              placeholder="Buscar empresas..."
              defaultValue={searchParams.search}
            />
            
            <Input
              name="city"
              placeholder="Cidade"
              defaultValue={searchParams.city}
            />
            
            <select
              name="state"
              defaultValue={searchParams.state}
              className="px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="">Todos os Estados</option>
              <option value="SP">São Paulo</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="MG">Minas Gerais</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="PR">Paraná</option>
              <option value="SC">Santa Catarina</option>
              <option value="GO">Goiás</option>
              <option value="BA">Bahia</option>
            </select>
            
            <select
              name="specialty"
              defaultValue={searchParams.specialty}
              className="px-3 py-2 border border-input rounded-md text-sm"
            >
              <option value="">Todas as Especialidades</option>
              <option value="residencial">Residencial</option>
              <option value="comercial">Comercial</option>
              <option value="industrial">Industrial</option>
              <option value="rural">Rural</option>
              <option value="manutencao">Manutenção</option>
              <option value="financiamento">Financiamento</option>
            </select>
            
            <Button type="submit">
              Aplicar Filtros
            </Button>
          </form>
        </div>

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Empresas Encontradas ({companies.length})
          </h2>
          <p className="text-muted-foreground">
            Empresas verificadas e avaliadas pelos nossos clientes
          </p>
        </div>

        {/* Companies Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Card key={company.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-br from-orange-100 to-yellow-100 relative">
                {company.banner ? (
                  <img
                    src={company.banner}
                    alt={`Banner ${company.name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      {company.logo ? (
                        <img
                          src={company.logo}
                          alt={`Logo ${company.name}`}
                          className="w-16 h-16 mx-auto mb-2 object-contain"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-orange-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <span className="text-2xl font-bold text-orange-600">
                            {company.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {company.verified && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verificada
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{company.name}</CardTitle>
                
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {renderStars(company.rating)}
                  </div>
                  <span className="text-sm font-medium">
                    {company.rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({company.reviewCount})
                  </span>
                </div>

                {company.city && company.state && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{company.city}, {company.state}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {company.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
                  <div>
                    <div className="font-semibold text-orange-600">
                      {company.yearsExperience}
                    </div>
                    <div className="text-muted-foreground">Anos</div>
                  </div>
                  <div>
                    <div className="font-semibold text-orange-600">
                      {company.projectsCompleted}
                    </div>
                    <div className="text-muted-foreground">Projetos</div>
                  </div>
                  <div>
                    <div className="font-semibold text-orange-600">
                      {company._count.products}
                    </div>
                    <div className="text-muted-foreground">Produtos</div>
                  </div>
                </div>

                {/* Specialties */}
                {company.specialties && company.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {company.specialties.slice(0, 3).map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {company.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{company.specialties.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <Button asChild className="w-full">
                  <Link href={`/empresa/${company.slug}`}>
                    Ver Perfil Completo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {companies.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">
              Nenhuma empresa encontrada
            </h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros de busca ou remover alguns critérios
            </p>
            <Button asChild>
              <Link href="/marketplace">
                Ver Todas as Empresas
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}