'use client'

export function ProductsSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Produtos de Energia Solar",
    "description": "Encontre os melhores produtos de energia solar: painéis solares, inversores, baterias, kits completos e acessórios das principais marcas.",
    "url": "https://solarconnect.com.br/produtos",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Produtos de Energia Solar",
      "description": "Catálogo completo de produtos para energia solar fotovoltaica",
      "numberOfItems": 500,
      "itemListElement": [
        {
          "@type": "Product",
          "name": "Painéis Solares",
          "description": "Painéis solares fotovoltaicos de alta eficiência",
          "category": "Energia Solar",
          "brand": "Várias Marcas",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "BRL",
            "lowPrice": "400",
            "highPrice": "1500",
            "offerCount": "150"
          }
        },
        {
          "@type": "Product",
          "name": "Inversores Fotovoltaicos",
          "description": "Inversores para sistemas de energia solar",
          "category": "Energia Solar",
          "brand": "Várias Marcas",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "BRL",
            "lowPrice": "800",
            "highPrice": "8000",
            "offerCount": "80"
          }
        },
        {
          "@type": "Product",
          "name": "Baterias Solares",
          "description": "Baterias para armazenamento de energia solar",
          "category": "Energia Solar",
          "brand": "Várias Marcas",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "BRL",
            "lowPrice": "1500",
            "highPrice": "8000",
            "offerCount": "45"
          }
        },
        {
          "@type": "Product",
          "name": "Kits Energia Solar",
          "description": "Kits completos para instalação de energia solar",
          "category": "Energia Solar",
          "brand": "Várias Marcas",
          "offers": {
            "@type": "AggregateOffer",
            "priceCurrency": "BRL",
            "lowPrice": "8000",
            "highPrice": "50000",
            "offerCount": "25"
          }
        }
      ]
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://solarconnect.com.br"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Produtos",
          "item": "https://solarconnect.com.br/produtos"
        }
      ]
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://solarconnect.com.br/produtos?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}