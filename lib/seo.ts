import { Metadata } from 'next'

interface SEOProps {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  noIndex?: boolean
}

export function generateSEO({
  title,
  description,
  keywords = [],
  image = '/og-image.jpg',
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  noIndex = false
}: SEOProps): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://solarconnect.com.br'
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl
  const fullTitle = `${title} | SolarConnect`
  
  const defaultKeywords = [
    'energia solar',
    'painéis solares',
    'sustentabilidade',
    'energia renovável',
    'marketplace solar',
    'instalação solar',
    'empresas solares'
  ]

  const allKeywords = [...defaultKeywords, ...keywords].join(', ')

  return {
    title: fullTitle,
    description,
    keywords: allKeywords,
    authors: author ? [{ name: author }] : [{ name: 'SolarConnect' }],
    robots: noIndex ? 'noindex,nofollow' : 'index,follow',
    
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName: 'SolarConnect',
      images: [
        {
          url: image.startsWith('http') ? image : `${baseUrl}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'pt_BR',
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image.startsWith('http') ? image : `${baseUrl}${image}`],
      creator: '@solarconnect',
    },
    
    alternates: {
      canonical: fullUrl,
    },
    
    other: {
      'application-name': 'SolarConnect',
      'apple-mobile-web-app-title': 'SolarConnect',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'format-detection': 'telephone=no',
      'mobile-web-app-capable': 'yes',
      'msapplication-config': '/browserconfig.xml',
      'msapplication-TileColor': '#f97316',
      'msapplication-tap-highlight': 'no',
      'theme-color': '#f97316',
    },
  }
}

// Structured Data helpers
export function generateCompanyStructuredData(company: {
  name: string
  description: string
  logo?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  rating?: number
  reviewCount?: number
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://solarconnect.com.br'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: company.name,
    description: company.description,
    image: company.logo ? `${baseUrl}${company.logo}` : undefined,
    url: company.website,
    telephone: company.phone,
    email: company.email,
    address: company.address ? {
      '@type': 'PostalAddress',
      addressLocality: company.address,
      addressCountry: 'BR'
    } : undefined,
    aggregateRating: company.rating && company.reviewCount ? {
      '@type': 'AggregateRating',
      ratingValue: company.rating,
      reviewCount: company.reviewCount,
      bestRating: 5,
      worstRating: 1
    } : undefined,
    serviceArea: {
      '@type': 'Country',
      name: 'Brasil'
    },
    priceRange: '$$',
    category: 'Energia Solar'
  }
}

export function generateProductStructuredData(product: {
  name: string
  description: string
  price: number
  currency?: string
  brand?: string
  image?: string
  availability?: 'InStock' | 'OutOfStock'
  rating?: number
  reviewCount?: number
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://solarconnect.com.br'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image ? `${baseUrl}${product.image}` : undefined,
    brand: product.brand ? {
      '@type': 'Brand',
      name: product.brand
    } : undefined,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'BRL',
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      seller: {
        '@type': 'Organization',
        name: 'SolarConnect'
      }
    },
    aggregateRating: product.rating && product.reviewCount ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1
    } : undefined,
    category: 'Energia Solar'
  }
}

export function generateBreadcrumbStructuredData(items: Array<{
  name: string
  url: string
}>) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://solarconnect.com.br'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`
    }))
  }
}