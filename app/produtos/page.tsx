import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductsHero } from '@/components/products/products-hero'
import { ProductsGrid } from '@/components/products/products-grid'
import { ProductsFilters } from '@/components/products/products-filters'
import { ProductsSchema } from '@/components/seo/products-schema'

export const metadata: Metadata = {
  title: 'Produtos de Energia Solar | Painéis, Inversores e Kits Fotovoltaicos - SolarConnect',
  description: 'Encontre os melhores produtos de energia solar: painéis solares, inversores, baterias, kits completos e acessórios. Compare preços e especificações técnicas das principais marcas.',
  keywords: [
    'produtos energia solar',
    'painéis solares',
    'inversores fotovoltaicos',
    'baterias solares',
    'kits energia solar',
    'equipamentos fotovoltaicos',
    'placas solares preço',
    'inversor solar',
    'sistema fotovoltaico',
    'energia renovável',
    'sustentabilidade',
    'economia energia'
  ].join(', '),
  authors: [{ name: 'SolarConnect' }],
  creator: 'SolarConnect',
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
    title: 'Produtos de Energia Solar | SolarConnect',
    description: 'Encontre os melhores produtos de energia solar com os melhores preços. Painéis, inversores, baterias e kits completos.',
    url: 'https://solarconnect.com.br/produtos',
    siteName: 'SolarConnect',
    images: [
      {
        url: '/og-produtos.jpg',
        width: 1200,
        height: 630,
        alt: 'Produtos de Energia Solar - SolarConnect',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Produtos de Energia Solar | SolarConnect',
    description: 'Encontre os melhores produtos de energia solar com os melhores preços.',
    images: ['/og-produtos.jpg'],
    creator: '@solarconnect_br',
  },
  alternates: {
    canonical: 'https://solarconnect.com.br/produtos',
  },
}

interface ProductsPageProps {
  searchParams: {
    categoria?: string
    marca?: string
    preco_min?: string
    preco_max?: string
    potencia_min?: string
    potencia_max?: string
    ordenar?: string
    pagina?: string
    q?: string
  }
}

// ISR configuration for products page
export const revalidate = 600 // Revalidate every 10 minutes

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <>
      <ProductsSchema />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <ProductsHero />
          <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1">
                  <ProductsFilters searchParams={searchParams} />
                </div>
                
                {/* Products Grid */}
                <div className="lg:col-span-3">
                  <ProductsGrid searchParams={searchParams} />
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  )
}