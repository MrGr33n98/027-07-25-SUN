import { Metadata } from 'next'
import { ProductComparison } from '@/components/products/product-comparison'

export const metadata: Metadata = {
  title: 'Comparar Produtos | SolarConnect',
  description: 'Compare produtos solares lado a lado. Analise especificações, preços e características para tomar a melhor decisão.',
  keywords: ['comparar produtos solares', 'comparação painéis solares', 'especificações produtos solares'],
}

export default function ComparisonPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Comparar Produtos
        </h1>
        <p className="text-gray-600">
          Compare produtos solares lado a lado para tomar a melhor decisão
        </p>
      </div>
      
      <ProductComparison />
    </div>
  )
}