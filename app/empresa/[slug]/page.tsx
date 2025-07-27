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