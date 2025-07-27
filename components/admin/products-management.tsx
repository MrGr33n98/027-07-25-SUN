'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  DollarSign
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  status: string
  inStock: boolean
  images: string[]
  company: {
    name: string
    verified: boolean
  }
  createdAt: string
}

export function AdminProductsManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const { addToast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [searchQuery, statusFilter, categoryFilter])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)
      
      const response = await fetch(`/api/admin/products?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProductStatus = async (productId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Status atualizado',
          message: `Produto ${status === 'APPROVED' ? 'aprovado' : 'rejeitado'} com sucesso`
        })
        fetchProducts()
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível atualizar o status'
      })
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Produto excluído',
          message: 'Produto removido com sucesso'
        })
        fetchProducts()
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível excluir o produto'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendente', variant: 'secondary' as const, icon: AlertTriangle },
      APPROVED: { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle },
      REJECTED: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
      FLAGGED: { label: 'Sinalizado', variant: 'destructive' as const, icon: AlertTriangle },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todos os status</option>
              <option value="PENDING">Pendente</option>
              <option value="APPROVED">Aprovado</option>
              <option value="REJECTED">Rejeitado</option>
              <option value="FLAGGED">Sinalizado</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">Todas as categorias</option>
              <option value="PAINEL_SOLAR">Painéis Solares</option>
              <option value="INVERSOR">Inversores</option>
              <option value="BATERIA">Baterias</option>
              <option value="ESTRUTURA">Estruturas</option>
              <option value="CABO">Cabos</option>
              <option value="ACESSORIO">Acessórios</option>
              <option value="KIT_COMPLETO">Kits Completos</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <div className="space-y-4">
        {products.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros de busca
              </p>
            </CardContent>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={product.images[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {product.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Building2 className="w-4 h-4" />
                          <span>{product.company.name}</span>
                          {product.company.verified && (
                            <Badge variant="secondary" className="text-xs">
                              Verificada
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(product.status)}
                        <Badge variant={product.inStock ? 'default' : 'secondary'}>
                          {product.inStock ? 'Em estoque' : 'Indisponível'}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          <span className="font-medium text-green-600">
                            {formatCurrency(product.price)}
                          </span>
                        </div>
                        <Badge variant="outline">{product.category}</Badge>
                        <span>Criado em {formatDate(product.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        
                        {product.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateProductStatus(product.id, 'APPROVED')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprovar
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateProductStatus(product.id, 'REJECTED')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}