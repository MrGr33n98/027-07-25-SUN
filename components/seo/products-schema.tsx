'use client'

interface ProductsSchemaProps {
  category?: string
  searchQuery?: string
  totalProducts?: number
}

export function ProductsSchema({ 
  category, 
  searchQuery, 
  totalProducts = 500 
}: ProductsSchemaProps) {
  const baseUrl = "https://solarconnect.com.br"
  const currentUrl = category 
    ? `${baseUrl}/produtos?categoria=${category}`
    : `${baseUrl}/produtos`

  const pageTitle = category 
    ? `${getCategoryName(category)} - Produtos de Energia Solar`
    : "Produtos de Energia Solar"

  const pageDescription = category
    ? `Encontre os melhores ${getCategoryName(category).toLowerCase()} para energia solar. Produtos certificados das principais marcas com melhor preço.`
    : "Encontre os melhores produtos de energia solar: painéis solares, inversores, baterias, kits completos e acessórios das principais marcas."

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": pageTitle,
    "description": pageDescription,
    "url": currentUrl,
    "mainEntity": {
      "@type": "ItemList",
      "name": pageTitle,
      "description": pageDescription,
      "numberOfItems": totalProducts,
      "itemListElement": getProductCategories(category)
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": getBreadcrumbs(category)
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/produtos?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "provider": {
      "@type": "Organization",
      "name": "Solar Connect",
      "url": baseUrl,
      "logo": `${baseUrl}/logo.png`
    }
  }

  // Add FAQ schema for better SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Quais são os melhores painéis solares?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Os melhores painéis solares são os monocristalinos de alta eficiência, como Canadian Solar, JinkoSolar, Trina Solar e LONGi Solar, que oferecem eficiência superior a 20% e garantia de 25 anos."
        }
      },
      {
        "@type": "Question",
        "name": "Como escolher o inversor solar ideal?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Para escolher o inversor ideal, considere: potência do sistema, tipo (string, micro ou híbrido), eficiência, garantia e compatibilidade com painéis. Marcas como Growatt, Fronius e WEG são referência no mercado."
        }
      },
      {
        "@type": "Question",
        "name": "Preciso de bateria no sistema solar?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Baterias são opcionais em sistemas conectados à rede (on-grid). São essenciais em sistemas isolados (off-grid) ou para backup de energia. Baterias de lítio LiFePO4 são as mais recomendadas."
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}

function getCategoryName(categoryId?: string): string {
  const categories: Record<string, string> = {
    'paineis-fotovoltaicos': 'Painéis Fotovoltaicos',
    'inversores-string': 'Inversores String',
    'microinversores': 'Microinversores',
    'inversores-hibridos': 'Inversores Híbridos',
    'baterias-litio': 'Baterias de Lítio',
    'baterias-chumbo': 'Baterias Chumbo-Ácido',
    'estruturas-telhado': 'Estruturas para Telhado',
    'estruturas-solo': 'Estruturas para Solo',
    'cabos-cc': 'Cabos CC Fotovoltaicos',
    'cabos-ca': 'Cabos CA',
    'conectores-mc4': 'Conectores MC4',
    'fusíveis-cc': 'Fusíveis CC',
    'disjuntores-cc': 'Disjuntores CC',
    'string-box': 'String Box',
    'medidores-energia': 'Medidores de Energia',
    'monitoramento': 'Sistemas de Monitoramento',
    'eletropostos': 'Eletropostos/Carregadores VE',
    'kits-residencial': 'Kits Residenciais',
    'kits-comercial': 'Kits Comerciais',
    'kits-industrial': 'Kits Industriais'
  }
  
  return categoryId ? categories[categoryId] || 'Produtos' : 'Produtos'
}

function getBreadcrumbs(category?: string) {
  const breadcrumbs = [
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

  if (category) {
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 3,
      "name": getCategoryName(category),
      "item": `https://solarconnect.com.br/produtos?categoria=${category}`
    })
  }

  return breadcrumbs
}

function getProductCategories(category?: string) {
  const allProducts = [
    {
      "@type": "Product",
      "name": "Painel Solar Monocristalino 550W",
      "description": "Painel solar monocristalino de alta eficiência 550W com tecnologia PERC",
      "category": "Painéis Solares",
      "brand": "Canadian Solar",
      "model": "CS3W-550MS",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "BRL",
        "lowPrice": "650",
        "highPrice": "850",
        "offerCount": "25",
        "availability": "https://schema.org/InStock"
      },
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Potência",
          "value": "550W"
        },
        {
          "@type": "PropertyValue",
          "name": "Eficiência",
          "value": "21.2%"
        },
        {
          "@type": "PropertyValue",
          "name": "Garantia",
          "value": "25 anos"
        }
      ]
    },
    {
      "@type": "Product",
      "name": "Inversor String 5kW Trifásico",
      "description": "Inversor string 5kW trifásico com MPPT duplo e monitoramento WiFi",
      "category": "Inversores",
      "brand": "Growatt",
      "model": "MIN 5000TL-X",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "BRL",
        "lowPrice": "2800",
        "highPrice": "3500",
        "offerCount": "15",
        "availability": "https://schema.org/InStock"
      },
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Potência",
          "value": "5000W"
        },
        {
          "@type": "PropertyValue",
          "name": "Eficiência",
          "value": "98.4%"
        },
        {
          "@type": "PropertyValue",
          "name": "Garantia",
          "value": "10 anos"
        }
      ]
    },
    {
      "@type": "Product",
      "name": "Bateria Lítio LiFePO4 100Ah",
      "description": "Bateria de lítio ferro fosfato 100Ah 12V para sistemas solares",
      "category": "Baterias",
      "brand": "Pylontech",
      "model": "US2000C",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "BRL",
        "lowPrice": "3200",
        "highPrice": "4000",
        "offerCount": "12",
        "availability": "https://schema.org/InStock"
      },
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Capacidade",
          "value": "100Ah"
        },
        {
          "@type": "PropertyValue",
          "name": "Tensão",
          "value": "12V"
        },
        {
          "@type": "PropertyValue",
          "name": "Ciclos",
          "value": "6000+"
        }
      ]
    },
    {
      "@type": "Product",
      "name": "Kit Solar Residencial 5kWp",
      "description": "Kit completo para sistema solar residencial 5kWp com painéis, inversor e estruturas",
      "category": "Kits Solares",
      "brand": "Solar Connect",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "BRL",
        "lowPrice": "18000",
        "highPrice": "25000",
        "offerCount": "8",
        "availability": "https://schema.org/InStock"
      },
      "additionalProperty": [
        {
          "@type": "PropertyValue",
          "name": "Potência",
          "value": "5000Wp"
        },
        {
          "@type": "PropertyValue",
          "name": "Geração Mensal",
          "value": "650 kWh"
        },
        {
          "@type": "PropertyValue",
          "name": "Área Necessária",
          "value": "30m²"
        }
      ]
    }
  ]

  // Filter products by category if specified
  if (category) {
    return allProducts.filter(product => {
      const categoryMap: Record<string, string[]> = {
        'paineis-fotovoltaicos': ['Painéis Solares'],
        'inversores-string': ['Inversores'],
        'baterias-litio': ['Baterias'],
        'kits-residencial': ['Kits Solares']
      }
      
      return categoryMap[category]?.includes(product.category) || false
    })
  }

  return allProducts
}