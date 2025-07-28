import { Metadata } from 'next'
import { Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { MarketplaceContent } from '@/components/marketplace/marketplace-content'
import { MarketplaceSkeleton } from '@/components/marketplace/marketplace-skeleton'

export const metadata: Metadata = {
  title: 'Marketplace - SolarConnect',
  description: 'Encontre as melhores empresas de energia solar do Brasil. Compare produtos, preços e avaliações.',
  openGraph: {
    title: 'Marketplace - SolarConnect',
    description: 'Encontre as melhores empresas de energia solar do Brasil',
    images: ['/og-marketplace.jpg'],
  },
}

interface MarketplacePageProps {
  searchParams: {
    q?: string
    location?: string
    minRating?: string
    verified?: string
    sortBy?: string
    page?: string
    categoria?: string
    especialidade?: string
  }
}

// ISR configuration for marketplace
export const revalidate = 300 // Revalidate every 5 minutes

export default function MarketplacePage({ searchParams }: MarketplacePageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Marketplace de Energia Solar
            </h1>
            <p className="text-gray-600">
              Encontre as melhores empresas e produtos de energia solar do Brasil
            </p>
          </div>
          
          <Suspense fallback={<MarketplaceSkeleton />}>
            <MarketplaceContent searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}