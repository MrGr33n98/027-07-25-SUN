import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Hero } from '@/components/sections/hero'
import { HomeSchema } from '@/components/seo/home-schema'

export const metadata: Metadata = {
  title: 'SolarConnect - Marketplace de Energia Solar | Encontre as Melhores Empresas',
  description: 'Conecte-se com as melhores empresas de energia solar do Brasil. Compare produtos, preços e avaliações. Orçamento gratuito e instalação profissional.',
  keywords: [
    'energia solar',
    'painéis solares',
    'energia fotovoltaica',
    'instalação solar',
    'empresas energia solar',
    'orçamento energia solar',
    'marketplace solar',
    'sustentabilidade',
    'energia renovável',
    'economia energia',
    'placas solares',
    'sistema fotovoltaico'
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
    title: 'SolarConnect - Marketplace de Energia Solar',
    description: 'Conecte-se com as melhores empresas de energia solar do Brasil. Compare produtos, preços e avaliações.',
    url: 'https://solarconnect.com.br',
    siteName: 'SolarConnect',
    images: [
      {
        url: '/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'SolarConnect - Marketplace de Energia Solar',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SolarConnect - Marketplace de Energia Solar',
    description: 'Conecte-se com as melhores empresas de energia solar do Brasil.',
    images: ['/og-home.jpg'],
    creator: '@solarconnect_br',
  },
  alternates: {
    canonical: 'https://solarconnect.com.br',
  },
}

// Static generation for homepage
export const revalidate = 3600 // Revalidate every hour

export default function HomePage() {
  return (
    <>
      <HomeSchema />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Hero />
          {/* TODO: Add more sections like Features, Companies, Testimonials */}
        </main>
        <Footer />
      </div>
    </>
  )
}