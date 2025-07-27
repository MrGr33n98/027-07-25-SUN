'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Package,
  Image as ImageIcon,
  Star,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Calendar,
  User,
  Building2
} from 'lucide-react'

export function ModerationManagement() {
  const [activeTab, setActiveTab] = useState('products')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    products: [],
    projects: [],
    reviews: []
  })
  const { addToast } = useToast()

  useEffect(() => {
    fetchModerationData()
  }, [])

  const fetchModerationData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/moderation')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching moderation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const pendingProducts = data.products
  const pendingProjects = data.projects
  const pendingReviews = data.reviews

  const tabs = [
    { id: 'products', label: 'Produtos', icon: Package, count: pendingProducts.length },
    { id: 'projects', label: 'Projetos', icon: ImageIcon, count: pendingProjects.length },
    { id: 'reviews', label: 'Avaliações', icon: Star, count: pendingReviews.length },
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleApprove = async (type: string, id: string) => {
    try {
      const response = await fetch('/api/admin/moderation/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, id }),
      })

      if (response.ok) {
        await fetchModerationData() // Refresh data
        addToast({
          type: 'success',
          title: 'Item aprovado!',
          message: `${type === 'product' ? 'Produto' : type === 'project' ? 'Projeto' : 'Avaliação'} aprovado com sucesso.`
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erro ao aprovar',
          message: 'Não foi possível aprovar o item. Tente novamente.'
        })
      }
    } catch (error) {
      console.error('Error approving item:', error)
      addToast({
        type: 'error',
        title: 'Erro ao aprovar',
        message: 'Ocorreu um erro inesperado. Tente novamente.'
      })
    }
  }

  const handleReject = async (type: string, id: string, reason?: string) => {
    try {
      const response = await fetch('/api/admin/moderation/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, id, reason }),
      })

      if (response.ok) {
        await fetchModerationData() // Refresh data
        addToast({
          type: 'success',
          title: 'Item rejeitado!',
          message: `${type === 'product' ? 'Produto' : type === 'project' ? 'Projeto' : 'Avaliação'} rejeitado com sucesso.`
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erro ao rejeitar',
          message: 'Não foi possível rejeitar o item. Tente novamente.'
        })
      }
    } catch (error) {
      console.error('Error rejecting item:', error)
      addToast({
        type: 'error',
        title: 'Erro ao rejeitar',
        message: 'Ocorreu um erro inesperado. Tente novamente.'
      })
    }
  }

  const renderProducts = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : pendingProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum produto pendente</div>
      ) : (
        pendingProducts.map((product: any) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Building2 className="w-4 h-4 mr-1" />
                        {product.company?.name}
                      </p>
                    </div>
                    
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.status === 'FLAGGED' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.status === 'FLAGGED' ? 'Sinalizado' : 'Pendente'}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <strong>Preço:</strong> R$ {Number(product.price).toLocaleString()}
                    </div>
                    <div>
                      <strong>Imagens:</strong> {product.images?.length || 0}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(product.createdAt)}
                    </div>
                  </div>

                  {product.flagReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center text-red-800">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        <strong>Motivo da Sinalização:</strong>
                      </div>
                      <p className="text-red-700 text-sm mt-1">{product.flagReason}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar
                  </Button>
                  
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove('product', product.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleReject('product', product.id)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  const renderProjects = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : pendingProjects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum projeto pendente</div>
      ) : (
        pendingProjects.map((project: any) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Building2 className="w-4 h-4 mr-1" />
                        {project.company?.name}
                      </p>
                    </div>
                    
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      project.status === 'FLAGGED' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status === 'FLAGGED' ? 'Sinalizado' : 'Pendente'}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <strong>Potência:</strong> {project.power}kWp
                    </div>
                    <div>
                      <strong>Imagens:</strong> {project.images?.length || 0}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(project.createdAt)}
                    </div>
                  </div>

                  {project.flagReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center text-red-800">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        <strong>Motivo da Sinalização:</strong>
                      </div>
                      <p className="text-red-700 text-sm mt-1">{project.flagReason}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar
                  </Button>
                  
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove('project', project.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleReject('project', project.id)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  const renderReviews = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : pendingReviews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhuma avaliação pendente</div>
      ) : (
        pendingReviews.map((review: any) => (
          <Card key={review.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {review.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          para {review.company?.name}
                        </span>
                      </div>
                    </div>
                    
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      review.status === 'FLAGGED' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {review.status === 'FLAGGED' ? 'Sinalizado' : 'Pendente'}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {review.user?.name || review.customerName}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(review.createdAt)}
                    </div>
                  </div>

                  {review.flagReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center text-red-800">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        <strong>Motivo da Sinalização:</strong>
                      </div>
                      <p className="text-red-700 text-sm mt-1">{review.flagReason}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Completa
                  </Button>
                  
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove('review', review.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleReject('review', review.id)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Card key={tab.id}>
              <CardContent className="p-6 text-center">
                <Icon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <div className="text-2xl font-bold text-gray-900">{tab.count}</div>
                <div className="text-sm text-gray-600">{tab.label} Pendentes</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <div className="flex space-x-1 border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {activeTab === 'products' && renderProducts()}
          {activeTab === 'projects' && renderProjects()}
          {activeTab === 'reviews' && renderReviews()}
        </CardContent>
      </Card>
    </div>
  )
}