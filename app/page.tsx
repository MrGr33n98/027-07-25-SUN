import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Hero } from '@/components/sections/hero'

export const metadata: Metadata = {
  title: 'SolarConnect - O Maior Marketplace de Energia Solar do Brasil',
  description: 'Conecte-se com as melhores empresas de energia solar do Brasil. Compare produtos, encontre soluções personalizadas e transforme sua energia em economia sustentável.',
  keywords: 'energia solar, painéis solares, marketplace solar, empresas energia solar, sustentabilidade',
  openGraph: {
    title: 'SolarConnect - O Maior Marketplace de Energia Solar do Brasil',
    description: 'Conecte-se com as melhores empresas de energia solar do Brasil',
    images: ['/og-home.jpg'],
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        {/* TODO: Add more sections like Features, Companies, Testimonials */}
      </main>
      <Footer />
    </div>
  )
}