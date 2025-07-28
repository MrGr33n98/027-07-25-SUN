'use client'

interface CompanySchemaProps {
  company: {
    name: string
    description: string
    address: string
    city: string
    state: string
    zipCode: string
    phone: string
    email: string
    website?: string
    rating: number
    reviewCount: number
    foundedYear: number
    serviceAreas: string[]
    services?: string[]
  }
}

export function CompanySchema({ company }: CompanySchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://solarconnect.com.br/empresa/${company.name.toLowerCase().replace(/\s+/g, '-')}`,
    "name": company.name,
    "description": company.description,
    "url": company.website,
    "telephone": company.phone,
    "email": company.email,
    "foundingDate": company.foundedYear.toString(),
    "address": {
      "@type": "PostalAddress",
      "streetAddress": company.address,
      "addressLocality": company.city,
      "addressRegion": company.state,
      "postalCode": company.zipCode,
      "addressCountry": "BR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "-23.5505",
      "longitude": "-46.6333"
    },
    "areaServed": company.serviceAreas.map(area => ({
      "@type": "City",
      "name": area
    })),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": company.rating,
      "reviewCount": company.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    },
    "priceRange": "$$",
    "paymentAccepted": ["Cash", "Credit Card", "Bank Transfer"],
    "currenciesAccepted": "BRL",
    "openingHours": [
      "Mo-Fr 08:00-18:00",
      "Sa 08:00-12:00"
    ],
    "sameAs": [
      company.website,
      `https://instagram.com/${company.name.toLowerCase().replace(/\s+/g, '')}`,
      `https://linkedin.com/company/${company.name.toLowerCase().replace(/\s+/g, '-')}`
    ].filter(Boolean),
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Serviços de Energia Solar",
      "itemListElement": company.services?.map((service, index) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service
        }
      })) || []
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}