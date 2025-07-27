import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { ToastProvider } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SolarConnect - Marketplace de Energia Solar',
  description: 'Conecte-se com as melhores empresas de energia solar do Brasil. Encontre produtos, serviços e soluções sustentáveis para sua casa ou empresa.',
  keywords: 'energia solar, painéis solares, sustentabilidade, energia renovável, marketplace',
  authors: [{ name: 'SolarConnect' }],
  openGraph: {
    title: 'SolarConnect - Marketplace de Energia Solar',
    description: 'Conecte-se com as melhores empresas de energia solar do Brasil',
    url: 'https://solarconnect.com.br',
    siteName: 'SolarConnect',
    images: [
      {
        url: '/og-image.jpg',
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
    description: 'Conecte-se com as melhores empresas de energia solar do Brasil',
    images: ['/og-image.jpg'],
  },
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ToastProvider>
          <Providers>
            {children}
          </Providers>
        </ToastProvider>
      </body>
    </html>
  )
}