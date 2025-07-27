'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Plus, 
  Zap, 
  Shield, 
  Star, 
  DollarSign,
  Package,
  Truck,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  power?: number
  efficiency?: number
  warranty?: number
  brand?: string
  model?: string
  images: string[]
  inStock: boolean
  category: string
  company: {
    name: string
    rating: number
    verified: boolean
  }
  specifications?: Record<string, any>
}

interface ProductComparisonProps {
  initialProducts?: Product[]
  maxProducts?: number
}

export function ProductComparison({ 
  initialProducts = [], 
  maxProducts = 4 
}: ProductComparisonProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchProducts()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const searchProducts = async () => {
    try {
      setSearching(true)
      const response = await fetch(`/api/products?q=${encodeURIComponent(searchQuery)}&limit=10`)
      
      if (response.ok) {
        const data = await response.json()
        // Filter out products already in comparison
        const filtered = data.data.filter((product: Product) => 
          !products.some(p => p.id === product.id)
        )
        setSearchResults(filtered)
      }
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setSearching(false)
    }
  }

  const addProduct = (product: Product) => {
    if (products.length >= maxProducts) {
      addToast({
        type: 'warning',
        title: 'Limite atingido',
        message: `Você pode comparar no máximo ${maxProducts} produtos`
      })
      return
    }

    setProducts(prev => [...prev, product])
    setSearchQuery('')
    setSearchResults([])
    
    addToast({
      type: 'success',
      title: 'Produto adicionado',
      message: `${product.name} foi adicionado à comparação`
    })
  }

  const removeProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const getComparisonRows = () => {
    const rows = [
      {
        label: 'Preço',
        key: 'price',
        render: (product: Product) => (
          <div>
            <div className="font-semibold text-lg">
              {formatPrice(product.price)}
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </div>
            )}
          </div>
        )
      },
      {
        label: 'Potência',
        key: 'power',
        render: (product: Product) => product.power ? `${product.power}W` : 'N/A'
      },
      {
        label: 'Eficiência',
        key: 'efficiency',
        render: (product: Product) => product.efficiency ? `${product.efficiency}%` : 'N/A'
      },
      {
        label: 'Garantia',
        key: 'warranty',
        render: (product: Product) => product.warranty ? `${product.warranty} anos` : 'N/A'
      },
      {
        label: 'Marca',
        key: 'brand',
        render: (product: Product) => product.brand || 'N/A'
      },
      {
        label: 'Modelo',
        key: 'model',
        render: (product: Product) => product.model || 'N/A'
      },
      {
        label: 'Disponibilidade',
        key: 'inStock',
        render: (product: Product) => (
          <Badge variant={product.inStock ? 'default' : 'secondary'}>
            {product.inStock ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Em estoque
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                Indisponível
              </>
            )}
          </Badge>
        )
      },
      {
        label: 'Empresa',
        key: 'company',
        render: (product: Product) => (
          <div>
            <div className="font-medium">{product.company.name}</div>
            <div className="flex items-center text-sm text-gray-600">
              <Star className="w-3 h-3 mr-1 fill-current text-yellow-400" />
              {product.company.rating.toFixed(1)}
              {product.company.verified && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Verificada
                </Badge>
              )}
            </div>
          </div>
        )
      }
    ]

    return rows
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Compare Produtos
          </h3>
          <p className="text-gray-600 mb-4">
            Adicione produtos para comparar suas especificações lado a lado
          </p>
          
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="Buscar produtos para comparar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">
                      {product.company.name} • {formatPrice(product.price)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Product Search */}
      {products.length < maxProducts && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Adicionar outro produto à comparação..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addProduct(product)}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">
                          {product.company.name} • {formatPrice(product.price)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                {products.length}/{maxProducts} produtos
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Produtos</CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Product Headers */}
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left w-32"></th>
                  {products.map((product) => (
                    <th key={product.id} className="p-4 text-center min-w-64">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(product.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        
                        <div className="mb-3">
                          <img
                            src={product.images[0] || '/placeholder-product.jpg'}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg mx-auto"
                          />
                        </div>
                        
                        <h3 className="font-semibold text-sm mb-1">
                          {product.name}
                        </h3>
                        
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Comparison Rows */}
              <tbody>
                {getComparisonRows().map((row, index) => (
                  <tr key={row.key} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-4 font-medium text-gray-900">
                      {row.label}
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center">
                        {typeof row.render === 'function' ? row.render(product) : product[row.key as keyof Product]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={() => setProducts([])}>
          Limpar Comparação
        </Button>
        <Button>
          Salvar Comparação
        </Button>
      </div>
    </div>
  )
}