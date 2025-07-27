'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FavoriteButton } from '@/components/ui/favorite-button'
import { 
  Heart, 
  Building2, 
  Package, 
  Star, 
  MapPin,
  DollarSign,
  Eye,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

interface FavoriteCompany {
  id: string
  company: {
    id: string
    name: string
    slug: string
    description: string
    logo?: string
    rating: number
    reviewCount: number
    location?: string
    verified: boolean
    _count: {
      products: number
      projects: number
      reviews: number
    }
  }
  createdAt: string
}

interface FavoriteProduct {
  id: string
  product: {
    id: string
    name: string
    price: number
    originalPrice?: number
    images: string[]
    category: string
    inStock: boolean
    company: {
      id: string
      name: string
      slug: string
      rating: number
      verified: boolean
    }
  }
  createdAt: string
}

export function FavoritesPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'companies' | 'products'>('companies')
  const [favoriteCompanies, setFavoriteCompanies] = useState<FavoriteCompany[]>([])
  const [favoriteProducts, setFavoriteProducts] = useState<FavoriteProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchFavorites()
    }
  }, [session, activeTab])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      const endpoint = activeTab === 'companies' ? 'companies' : 'products'
      const response = await fetch(`/api/favorites/${endpoint}`)
      
      if (response.ok) {
        const data = await response.json()
        if (activeTab === 'companies') {
          setFavoriteCompanies(data.data || [])
        } else {
          setFavoriteProducts(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
    } finally {
      setLoading(false)
    }
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

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Faça login para ver seus favoritos
          </h2>
          <p className="text-gray-600 mb-6">
            Salve empresas e produtos para acessá-los facilmente depois
          </p>
          <Button asChild>
            <Link href="/auth/signin">Fazer Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Favoritos</h1>
        <p className="text-gray-600">
          Gerencie suas empresas e produtos favoritos
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b mb-6">
        <button
          onClick={() => setActiveTab('companies')}
          className={`flex items-center space-x-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'companies'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Empresas</span>
          <Badge variant="secondary">{favoriteCompanies.length}</Badge>
        </button>
        
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center space-x-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produtos</span>
          <Badge variant="secondary">{favoriteProducts.length}</Badge>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <div className="space-y-6">
              {favoriteCompanies.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma empresa favorita
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Explore o marketplace e favorite empresas interessantes
                    </p>
                    <Button asChild>
                      <Link href="/marketplace">Explorar Empresas</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteCompanies.map((favorite) => (
                    <Card key={favorite.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {favorite.company.logo ? (
                              <img
                                src={favorite.company.logo}
                                alt={favorite.company.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-blue-600" />
                              </div>
                            )}
                            
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {favorite.company.name}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-sm text-gray-600 ml-1">
                                    {favorite.company.rating.toFixed(1)}
                                  </span>
                                </div>
                                {favorite.company.verified && (
                                  <Badge variant="secondary" className="text-xs">
                                    Verificada
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <FavoriteButton
                            type="company"
                            itemId={favorite.company.id}
                            size="sm"
                          />
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {favorite.company.description}
                        </p>

                        {favorite.company.location && (
                          <div className="flex items-center text-sm text-gray-600 mb-4">
                            <MapPin className="w-4 h-4 mr-1" />
                            {favorite.company.location}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <span>{favorite.company._count.products} produtos</span>
                          <span>{favorite.company._count.projects} projetos</span>
                          <span>{favorite.company._count.reviews} avaliações</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Favoritado em {formatDate(favorite.createdAt)}
                          </span>
                          
                          <Button size="sm" asChild>
                            <Link href={`/empresa/${favorite.company.slug}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Perfil
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {favoriteProducts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum produto favorito
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Explore nosso catálogo e favorite produtos interessantes
                    </p>
                    <Button asChild>
                      <Link href="/produtos">Explorar Produtos</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteProducts.map((favorite) => (
                    <Card key={favorite.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <img
                              src={favorite.product.images[0] || '/placeholder-product.jpg'}
                              alt={favorite.product.name}
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                            
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {favorite.product.name}
                            </h3>
                            
                            <Badge variant="outline" className="text-xs mb-2">
                              {favorite.product.category}
                            </Badge>
                          </div>
                          
                          <FavoriteButton
                            type="product"
                            itemId={favorite.product.id}
                            size="sm"
                          />
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">
                              {formatCurrency(favorite.product.price)}
                            </span>
                            {favorite.product.originalPrice && favorite.product.originalPrice > favorite.product.price && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatCurrency(favorite.product.originalPrice)}
                              </span>
                            )}
                          </div>
                          
                          <Badge 
                            variant={favorite.product.inStock ? 'default' : 'secondary'}
                            className="text-xs mt-1"
                          >
                            {favorite.product.inStock ? 'Em estoque' : 'Indisponível'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-1" />
                            {favorite.product.company.name}
                          </div>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                            {favorite.product.company.rating.toFixed(1)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Favoritado em {formatDate(favorite.createdAt)}
                          </span>
                          
                          <Button size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Produto
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}