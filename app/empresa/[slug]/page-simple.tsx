import { notFound } from 'next/navigation'

interface CompanyPageProps {
  params: { slug: string }
}

async function getCompany(slug: string) {
  // Mock data for testing
  const mockCompanies: { [key: string]: any } = {
    'solar-tech-brasil': {
      id: 'mock-1',
      name: 'SolarTech Brasil',
      slug: 'solar-tech-brasil',
      description: 'Especialistas em energia solar residencial e comercial.',
      city: 'São Paulo',
      state: 'SP',
      phone: '(11) 99999-1111',
      email: 'contato@solartech.com.br',
      verified: true,
      rating: 4.8,
      reviewCount: 24
    }
  }

  const mockCompany = mockCompanies[slug]
  if (!mockCompany) {
    notFound()
  }

  return mockCompany
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const company = await getCompany(params.slug)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {company.name}
          </h1>
          
          <div className="flex items-center mb-4">
            {company.verified && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
                ✓ Verificada
              </span>
            )}
            <span className="text-lg font-semibold">
              ⭐ {company.rating} ({company.reviewCount} avaliações)
            </span>
          </div>

          <p className="text-gray-700 mb-6">
            {company.description}
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Localização</h3>
              <p className="text-gray-600">{company.city}, {company.state}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Contato</h3>
              <p className="text-gray-600">
                📞 {company.phone}<br/>
                ✉️ {company.email}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium">
              Solicitar Orçamento
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}