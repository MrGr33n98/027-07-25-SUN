import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CompanyHeroStatic } from '@/components/company/company-hero-static'
import { CompanyTabsStatic } from '@/components/company/company-tabs-static'
import { CompanySchema } from '@/components/seo/company-schema'

// Dados completos da empresa
const companyData = {
  id: 'solartech-brasil',
  name: 'SolarTech Brasil',
  slug: 'solar-tech-brasil',
  description: 'Especialistas em energia solar residencial e comercial com mais de 10 anos de experiência no mercado. Nossa equipe altamente qualificada oferece soluções completas em energia solar fotovoltaica, desde o projeto personalizado até a instalação e manutenção preventiva.',
  longDescription: 'A SolarTech Brasil é uma empresa líder no segmento de energia solar fotovoltaica, atuando há mais de uma década no mercado brasileiro. Oferecemos soluções completas e personalizadas para residências, comércios e indústrias, sempre com foco na qualidade, eficiência e sustentabilidade. Nossa equipe é formada por engenheiros especializados e técnicos certificados, garantindo projetos seguros e de alta performance.',
  city: 'São Paulo',
  state: 'SP',
  address: 'Rua das Flores, 123, Vila Madalena',
  zipCode: '05435-000',
  phone: '(11) 99999-1111',
  email: 'contato@solartech.com.br',
  website: 'https://solartech.com.br',
  whatsapp: '5511999991111',
  instagram: '@solartech_brasil',
  linkedin: 'solartech-brasil',
  specialties: [
    'Energia Solar Residencial', 
    'Energia Solar Comercial', 
    'Instalação Fotovoltaica', 
    'Manutenção Preventiva', 
    'Projeto Personalizado'
  ],
  certifications: [
    'INMETRO', 
    'ABNT NBR 16690', 
    'ISO 9001:2015', 
    'NR-35', 
    'Certificação ANEEL'
  ],
  yearsExperience: 10,
  projectsCompleted: 250,
  teamSize: 'MEDIUM',
  serviceAreas: [
    'São Paulo', 
    'Grande São Paulo', 
    'Interior de SP', 
    'Campinas', 
    'Santos'
  ],
  verified: true,
  rating: 4.8,
  reviewCount: 24,
  logo: null,
  banner: null,
  foundedYear: 2014,
  cnpj: '12.345.678/0001-90',
  businessHours: {
    monday: '08:00-18:00',
    tuesday: '08:00-18:00',
    wednesday: '08:00-18:00',
    thursday: '08:00-18:00',
    friday: '08:00-18:00',
    saturday: '08:00-12:00',
    sunday: 'Fechado'
  },
  services: [
    'Projeto de Sistema Fotovoltaico',
    'Instalação de Painéis Solares',
    'Homologação junto à Concessionária',
    'Monitoramento de Performance',
    'Manutenção Preventiva e Corretiva',
    'Consultoria em Eficiência Energética'
  ],
  awards: [
    'Melhor Empresa de Energia Solar SP 2023',
    'Certificação ISO 9001:2015',
    'Prêmio Sustentabilidade 2022'
  ]
}

export const metadata: Metadata = {
  title: `${companyData.name} - Energia Solar em ${companyData.city} | Painéis Solares Fotovoltaicos`,
  description: `${companyData.description} Orçamento gratuito em ${companyData.city}, ${companyData.state}. ${companyData.projectsCompleted}+ projetos realizados. Avaliação ${companyData.rating}⭐`,
  keywords: [
    'energia solar',
    'painéis solares',
    'energia fotovoltaica',
    'instalação solar',
    companyData.city,
    companyData.state,
    'energia renovável',
    'sustentabilidade',
    'economia de energia',
    'sistema fotovoltaico',
    'energia limpa',
    'placas solares',
    'SolarTech Brasil',
    'empresa energia solar São Paulo',
    'instalação painéis solares SP'
  ].join(', '),
  authors: [{ name: companyData.name }],
  creator: companyData.name,
  publisher: 'SolarConnect',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: `${companyData.name} - Energia Solar em ${companyData.city}`,
    description: companyData.description,
    url: `https://solarconnect.com.br/empresa/${companyData.slug}`,
    siteName: 'SolarConnect',
    images: [
      {
        url: '/og-solartech-brasil.jpg',
        width: 1200,
        height: 630,
        alt: `${companyData.name} - Energia Solar`,
      },
    ],
    locale: 'pt_BR',
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${companyData.name} - Energia Solar`,
    description: companyData.description,
    images: ['/og-solartech-brasil.jpg'],
    creator: '@solarconnect_br',
  },
  alternates: {
    canonical: `https://solarconnect.com.br/empresa/${companyData.slug}`,
  },
  other: {
    'geo.region': `BR-${companyData.state}`,
    'geo.placename': companyData.city,
    'geo.position': '-23.5505;-46.6333', // Coordenadas de São Paulo
    'ICBM': '-23.5505, -46.6333',
    'business:contact_data:street_address': companyData.address,
    'business:contact_data:locality': companyData.city,
    'business:contact_data:region': companyData.state,
    'business:contact_data:postal_code': companyData.zipCode,
    'business:contact_data:country_name': 'Brasil',
    'business:contact_data:phone_number': companyData.phone,
    'business:contact_data:website': companyData.website,
  },
}

// ISR configuration for company pages
export const revalidate = 3600 // Revalidate every hour

export default function SolarTechBrasilPage() {
  return (
    <>
      <CompanySchema company={companyData} />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <CompanyHeroStatic company={companyData} />
          <CompanyTabsStatic company={companyData} />
        </main>
        <Footer />
      </div>
    </>
  )
}