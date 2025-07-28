import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CompanyHero } from '@/components/company/company-hero'
import { CompanyTabs } from '@/components/company/company-tabs'
import { db } from '@/lib/db'

interface CompanyPageProps {
  params: { slug: string }
  searchParams: { action?: string }
}

async function getCompany(slug: string) {
  const company = await db.companyProfile.findUnique({
    where: { slug },
  })

  if (!company) {
    // Return mock data for development
    const mockCompanies: { [key: string]: any } = {
      'solartech-brasil': {
        id: 'mock-1',
        name: 'SolarTech Brasil',
        slug: 'solartech-brasil',
        description: 'Especialistas em energia solar residencial e comercial com mais de 10 anos de experiência. Nossa equipe altamente qualificada oferece soluções completas em energia solar, desde o projeto até a instalação e manutenção.',
        city: 'São Paulo',
        state: 'SP',
        location: 'São Paulo, SP',
        phone: '(11) 99999-1111',
        email: 'contato@solartech.com.br',
        website: 'https://solartech.com.br',
        specialties: ['Residencial', 'Comercial', 'Instalação', 'Manutenção'],
        certifications: ['INMETRO', 'ABNT', 'ISO 9001'],
        yearsExperience: 10,
        projectsCompleted: 250,
        teamSize: 'MEDIUM',
        serviceAreas: ['São Paulo', 'Grande São Paulo', 'Interior de SP'],
        verified: true,
        rating: 4.8,
        reviewCount: 24,
        logo: null,
        banner: null,
        address: 'Rua das Flores, 123',
        zipCode: '01234-567',
        whatsapp: '11999991111',
        instagram: '@solartech_brasil',
        linkedin: 'solartech-brasil',
        status: 'ACTIVE',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date(),
        userId: 'mock-user-1'
      },
      'ecosolar-energia': {
        id: 'mock-2',
        name: 'EcoSolar Energia',
        slug: 'ecosolar-energia',
        description: 'Soluções sustentáveis em energia solar para residências e empresas. Comprometidos com a sustentabilidade e inovação tecnológica.',
        city: 'Rio de Janeiro',
        state: 'RJ',
        location: 'Rio de Janeiro, RJ',
        phone: '(21) 99999-2222',
        email: 'info@ecosolar.com.br',
        website: 'https://ecosolar.com.br',
        specialties: ['Sustentabilidade', 'Residencial', 'Consultoria'],
        certifications: ['INMETRO', 'ABNT'],
        yearsExperience: 8,
        projectsCompleted: 180,
        teamSize: 'SMALL',
        serviceAreas: ['Rio de Janeiro', 'Niterói', 'Região dos Lagos'],
        verified: true,
        rating: 4.6,
        reviewCount: 18,
        logo: null,
        banner: null,
        address: 'Av. Atlântica, 456',
        zipCode: '22070-001',
        whatsapp: '21999992222',
        instagram: '@ecosolar_energia',
        linkedin: 'ecosolar-energia',
        status: 'ACTIVE',
        createdAt: new Date('2021-03-15'),
        updatedAt: new Date(),
        userId: 'mock-user-2'
      },
      'solar-tech-brasil': {
        id: 'mock-1',
        name: 'SolarTech Brasil',
        slug: 'solar-tech-brasil',
        description: 'Especialistas em energia solar residencial e comercial com mais de 10 anos de experiência. Nossa equipe altamente qualificada oferece soluções completas em energia solar, desde o projeto até a instalação e manutenção.',
        city: 'São Paulo',
        state: 'SP',
        location: 'São Paulo, SP',
        phone: '(11) 99999-1111',
        email: 'contato@solartech.com.br',
        website: 'https://solartech.com.br',
        specialties: ['Residencial', 'Comercial', 'Instalação', 'Manutenção'],
        certifications: ['INMETRO', 'ABNT', 'ISO 9001'],
        yearsExperience: 10,
        projectsCompleted: 250,
        teamSize: 'MEDIUM',
        serviceAreas: ['São Paulo', 'Grande São Paulo', 'Interior de SP'],
        verified: true,
        rating: 4.8,
        reviewCount: 24,
        logo: null,
        banner: null,
        address: 'Rua das Flores, 123',
        zipCode: '01234-567',
        whatsapp: '11999991111',
        instagram: '@solartech_brasil',
        linkedin: 'solartech-brasil',
        status: 'ACTIVE',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date(),
        userId: 'mock-user-1'
      },
      'solar-power-mg': {
        id: 'mock-3',
        name: 'Solar Power MG',
        slug: 'solar-power-mg',
        description: 'Energia solar de qualidade para Minas Gerais e região. Especialistas em projetos industriais e comerciais de grande porte.',
        city: 'Belo Horizonte',
        state: 'MG',
        location: 'Belo Horizonte, MG',
        phone: '(31) 99999-3333',
        email: 'vendas@solarpowermg.com.br',
        website: null,
        specialties: ['Industrial', 'Comercial', 'Manutenção', 'Grande Porte'],
        certifications: ['INMETRO', 'ABNT', 'ISO 9001', 'ISO 14001'],
        yearsExperience: 12,
        projectsCompleted: 320,
        teamSize: 'LARGE',
        serviceAreas: ['Belo Horizonte', 'Região Metropolitana', 'Interior de MG'],
        verified: false,
        rating: 4.4,
        reviewCount: 15,
        logo: null,
        banner: null,
        address: 'Av. Afonso Pena, 789',
        zipCode: '30112-000',
        whatsapp: '31999993333',
        instagram: '@solarpowermg',
        linkedin: 'solar-power-mg',
        status: 'ACTIVE',
        createdAt: new Date('2019-06-10'),
        updatedAt: new Date(),
        userId: 'mock-user-3'
      }
    }

    // Check if we have mock data for this slug
    const mockCompany = mockCompanies[slug]
    if (mockCompany) {
      return mockCompany
    }

    // If no mock data either, return 404
    notFound()
  }

  return company
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const company = await getCompany(params.slug)

  return {
    title: `${company.name} - Energia Solar | SolarConnect`,
    description: company.description,
    keywords: `${company.name}, energia solar, painéis solares, ${company.verified ? 'empresa verificada' : ''}`,
    openGraph: {
      title: `${company.name} - Energia Solar`,
      description: company.description,
      images: company.logo ? [company.logo] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${company.name} - Energia Solar`,
      description: company.description,
      images: company.logo ? [company.logo] : [],
    },
  }
}

export default async function CompanyPage({ params, searchParams }: CompanyPageProps) {
  const company = await getCompany(params.slug)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <CompanyHero company={company} showQuoteForm={searchParams.action === 'quote'} />
        <CompanyTabs company={company} />
      </main>
      <Footer />
    </div>
  )
}