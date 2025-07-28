'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Grid,
  List,
  Star,
  Heart,
  ShoppingCart,
  Zap,
  Shield,
  Truck,
  Eye,
  Compare,
  Filter,
  ArrowUpDown
} from 'lucide-react'

interface ProductsGridProps {
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

export function ProductsGrid({ searchParams }: ProductsGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favorites, setFavorites] = useState<string[]>([])

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  // Mock products data
  const products = [
    {
      id: '1',
      name: 'Painel Solar Canadian Solar 450W Monocristalino',
      brand: 'Canadian Solar',
      model: 'CS3W-450MS',
      price: 890,
      originalPrice: 1200,
      power: 450,
      efficiency: 21.2,
      warranty: 25,
      inStock: true,
      rating: 4.8,
      reviewCount: 124,
      image: '/products/painel-canadian-450w.jpg',
      category: 'Painéis Solares',
      features: ['Monocristalino', 'Half Cell', 'PERC', 'Bifacial'],
      certifications: ['INMETRO', 'IEC', 'UL'],
      freeShipping: true,
      fastDelivery: true
    },
    {
      id: '2',
      name: 'Inversor Growatt 5kW String Monofásico',
      brand: 'Growatt',
      model: 'MIN 5000TL-X',
      price: 2450,
      originalPrice: 2800,
      power: 5000,
      efficiency: 97.6,
      warranty: 10,
      inStock: true,
      rating: 4.6,
      reviewCount: 89,
      image: '/products/inversor-growatt-5kw.jpg',
      category: 'Inversores',
      features: ['String', 'Monofásico', 'WiFi', 'Monitoramento'],
      certifications: ['INMETRO', 'IEC', 'ABNT'],
      freeShipping: true,
      fastDelivery: false
    },
    {
      id: '3',
      name: 'Bateria Lítio Freedom 150Ah 12V',
      brand: 'Freedom',
      model: 'FLB-150-12',
      price: 3200,
      originalPrice: 3600,
      power: 1800,
      efficiency: 95,
      warranty: 8,
      inStock: false,
      rating: 4.7,
      reviewCount: 56,
      image: '/products/bateria-freedom-150ah.jpg',
      category: 'Baterias',
      features: ['Lítio', 'BMS', 'Ciclo Profundo', 'Bluetooth'],
      certifications: ['INMETRO', 'CE', 'UN38.3'],
      freeShipping: false,
      fastDelivery: false
    },
    {
      id: '4',
      name: 'Kit Solar Residencial 5kWp Completo',
      brand: 'SolarKit',
      model: 'RES-5KWP-COMP',
      price: 18900,
      originalPrice: 22000,
      power: 5000,
      efficiency: 21,
      warranty: 25,
      inStock: true,
      rating: 4.9,
      reviewCount: 203,
      image: '/products/kit-solar-5kwp.jpg',
      category: 'Kits Completos',
      features: ['Completo', 'Instalação', 'Homologação', 'Garantia'],
      certifications: ['INMETRO', 'ANEEL', 'ABNT'],
      freeShipping: true,
      fastDelivery: true
    },
    {
      id: '5',
      name: 'Painel Solar JinkoSolar 540W Monocristalino',
      brand: 'JinkoSolar',
      model: 'JKM540M-7RL3',
      price: 1050,
      originalPrice: 1300,
      power: 540,
      efficiency: 21.8,
      warranty: 25,
      inStock: true,
      rating: 4.7,
      reviewCount: 167,
      image: '/products/painel-jinko-540w.jpg',
      category: 'Painéis Solares',
      features: ['Monocristalino', 'Tiger Pro', 'Half Cell', 'PERC'],
      certifications: ['INMETRO', 'IEC', 'TUV'],
      freeShipping: true,
      fastDelivery: true
    },
    {
      id: '6',
      name: 'Microinversor Enphase IQ7+ 290W',
      brand: 'Enphase',
      model: 'IQ7PLUS-72-2-INT',
      price: 680,
      originalPrice: 750,
      power: 290,
      efficiency: 97.5,
      warranty: 25,
      inStock: true,
      rating: 4.8,
      reviewCount: 92,
      image: '/products/microinversor-enphase.jpg',
      category: 'Inversores',
      features: ['Microinversor', 'Monitoramento', 'WiFi', 'App'],
      certifications: ['INMETRO', 'UL', 'IEC'],
      freeShipping: true,
      fastDelivery: false
    }
  ]

  const sortOptions = [
    { value: 'relevancia', label: 'Mais Relevantes' },
    { value: 'preco_menor', label: 'Menor Preço' },
    { value: 'preco_maior', label: 'Maior Preço' },
    { value: 'avaliacao', label: 'Melhor Avaliação' },
    { value: 'mais_vendidos', label: 'Mais Vendidos' },
    { value: 'lancamentos', label: 'Lançamentos' }
  ]

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const calculateDiscount = (price: number, originalPrice: number) => {
    return Math.round(((originalPrice - price) / originalPrice) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header with results and controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-lg shadow-sm p-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {products.length} produtos encontrados
          </h2>
          <p className="text-gray-600 text-sm">
            {searchParams.q && `Resultados para "${searchParams.q}"`}
            {searchParams.categoria && ` em ${searchParams.categoria}`}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent">
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* View Mode */}
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1'
      }`}>
        {products.map((product) => (
          <Card key={product.id} className={`hover:shadow-xl transition-all duration-300 overflow-hidden ${
            viewMode === 'list' ? 'flex flex-row' : ''
          }`}>
            {/* Product Image */}
            <div className={`relative ${
              viewMode === 'list' ? 'w-48 flex-shrink-0' : 'h-48'
            } bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center`}>
              {/* Placeholder for product image */}
              <div className="text-center">
                <Zap className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <div className="text-sm text-gray-500">{product.category}</div>
              </div>
              
              {/* Badges */}
              <div className="absolute top-2 left-2 space-y-1">
                {!product.inStock && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Esgotado
                  </span>
                )}
                {product.originalPrice > product.price && (
                  <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                    -{calculateDiscount(product.price, product.originalPrice)}%
                  </span>
                )}
                {product.freeShipping && (
                  <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Frete Grátis
                  </span>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="absolute top-2 right-2 space-y-1">
                <button
                  onClick={() => toggleFavorite(product.id)}
                  className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                >
                  <Heart className={`w-4 h-4 ${
                    favorites.includes(product.id) 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-gray-600'
                  }`} />
                </button>
                <button className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all">
                  <Compare className="w-4 h-4 text-gray-600" />
                </button>
                <button className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all">
                  <Eye className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
              <div className={viewMode === 'list' ? 'flex justify-between h-full' : ''}>
                <div className={viewMode === 'list' ? 'flex-1 pr-4' : ''}>
                  {/* Brand and Model */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {product.brand}
                    </span>
                    <span className="text-xs text-gray-500">{product.model}</span>
                  </div>

                  {/* Product Name */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {renderStars(Math.floor(product.rating))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.rating} ({product.reviewCount})
                    </span>
                  </div>

                  {/* Specifications */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                    <div>
                      <span className="text-gray-500">Potência:</span>
                      <span className="font-medium ml-1">{product.power}W</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Eficiência:</span>
                      <span className="font-medium ml-1">{product.efficiency}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Garantia:</span>
                      <span className="font-medium ml-1">{product.warranty} anos</span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="w-3 h-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">Certificado</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.features.slice(0, 3).map((feature, index) => (
                      <span key={index} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        {feature}
                      </span>
                    ))}
                    {product.features.length > 3 && (
                      <span className="text-xs text-gray-500">+{product.features.length - 3}</span>
                    )}
                  </div>

                  {/* Shipping Info */}
                  <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                    {product.freeShipping && (
                      <div className="flex items-center">
                        <Truck className="w-3 h-3 mr-1 text-green-500" />
                        Frete Grátis
                      </div>
                    )}
                    {product.fastDelivery && (
                      <div className="flex items-center">
                        <Zap className="w-3 h-3 mr-1 text-orange-500" />
                        Entrega Rápida
                      </div>
                    )}
                  </div>
                </div>

                {/* Price and Actions */}
                <div className={`${viewMode === 'list' ? 'flex flex-col justify-between items-end' : ''}`}>
                  <div className={`${viewMode === 'list' ? 'text-right' : 'mb-4'}`}>
                    {product.originalPrice > product.price && (
                      <div className="text-sm text-gray-500 line-through">
                        {formatPrice(product.originalPrice)}
                      </div>
                    )}
                    <div className="text-2xl font-bold text-orange-600">
                      {formatPrice(product.price)}
                    </div>
                    <div className="text-xs text-gray-500">
                      ou 12x de {formatPrice(product.price / 12)}
                    </div>
                  </div>

                  <div className={`space-y-2 ${viewMode === 'list' ? 'w-48' : ''}`}>
                    <Button 
                      className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white"
                      disabled={!product.inStock}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {product.inStock ? 'Adicionar ao Carrinho' : 'Indisponível'}
                    </Button>
                    
                    <Button variant="outline" className="w-full text-sm">
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-8">
        <Button variant="outline" size="sm" disabled>
          Anterior
        </Button>
        <Button variant="outline" size="sm" className="bg-orange-500 text-white">
          1
        </Button>
        <Button variant="outline" size="sm">
          2
        </Button>
        <Button variant="outline" size="sm">
          3
        </Button>
        <span className="text-gray-500">...</span>
        <Button variant="outline" size="sm">
          10
        </Button>
        <Button variant="outline" size="sm">
          Próximo
        </Button>
      </div>
    </div>
  )
}