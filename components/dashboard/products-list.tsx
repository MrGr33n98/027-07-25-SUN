'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  Edit, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  Plus
} from 'lucide-react'
import Link from 'next/link'

interface ProductsListProps {
  products: any[] // TODO: Type this properly when Product model is added
}

export function ProductsList({ products }: ProductsListProps) {
  // Mock products for demonstration
  const mockProducts = [
    {
      id: '1',
      name: 'Painel Solar 450W Monocristalino',
      price: 890,
      power: 450,
      efficiency: 21.2,
      inStock: true,
      category: 'Painel Solar',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'Inversor String 5kW',
      price: 2500,
      power: 5000,
      efficiency: 97.5,
      inStock: true,
      category: 'Inversor',
      createdAt: new Date('2024-01-10'),
    },
    {
      id: '3',
      name: 'Bateria Lítio 10kWh',
      price: 15000,
      power: 10000,
      efficiency: 95.0,
      inStock: false,
      category: 'Bateria',
      createdAt: new Date('2024-01-05'),
    },
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR')
  }

  if (mockProducts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum produto cadastrado
          </h3>
          <p className="text-gray-600 text-center mb-6">
            Comece adicionando produtos ao seu catálogo para atrair mais clientes
          </p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <Link href="/dashboard/produtos/novo">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Produto
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Products Grid */}
      <div className="grid gap-6">
        {mockProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {product.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.inStock 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.inStock ? 'Em estoque' : 'Indisponível'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-medium">Preço:</span>
                      <div className="text-lg font-bold text-orange-600">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Potência:</span>
                      <div>{product.power}W</div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Eficiência:</span>
                      <div>{product.efficiency}%</div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Categoria:</span>
                      <div>{product.category}</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Cadastrado em {formatDate(product.createdAt)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination would go here */}
      <div className="flex justify-center pt-6">
        <p className="text-sm text-gray-500">
          Mostrando {mockProducts.length} de {mockProducts.length} produtos
        </p>
      </div>
    </div>
  )
}