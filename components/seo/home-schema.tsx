'use client'

export function HomeSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SolarConnect",
    "description": "O maior marketplace de energia solar do Brasil. Conecte-se com as melhores empresas de energia solar.",
    "url": "https://solarconnect.com.br",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://solarconnect.com.br/marketplace?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "sameAs": [
      "https://facebook.com/solarconnect",
      "https://instagram.com/solarconnect_br",
      "https://linkedin.com/company/solarconnect",
      "https://twitter.com/solarconnect_br"
    ],
    "publisher": {
      "@type": "Organization",
      "@id": "https://solarconnect.com.br/#organization"
    },
    "mainEntity": {
      "@type": "Organization",
      "@id": "https://solarconnect.com.br/#organization",
      "name": "SolarConnect",
      "description": "Marketplace líder em energia solar no Brasil",
      "url": "https://solarconnect.com.br",
      "logo": {
        "@type": "ImageObject",
        "url": "https://solarconnect.com.br/logo.png",
        "width": 300,
        "height": 100
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+55-11-99999-9999",
        "contactType": "customer service",
        "availableLanguage": "Portuguese"
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "BR",
        "addressRegion": "SP",
        "addressLocality": "São Paulo"
      },
      "foundingDate": "2020",
      "numberOfEmployees": "50-100",
      "knowsAbout": [
        "Energia Solar",
        "Painéis Fotovoltaicos",
        "Inversores Solares",
        "Instalação Solar",
        "Sustentabilidade",
        "Energia Renovável"
      ],
      "serviceArea": {
        "@type": "Country",
        "name": "Brasil"
      }
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}