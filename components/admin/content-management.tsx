'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Image as ImageIcon, 
  Plus, 
  Edit, 
  Trash2,
  Eye,
  Save,
  X,
  Upload
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface ContentItem {
  id: string
  title: string
  type: 'page' | 'banner' | 'announcement'
  content: string
  status: 'published' | 'draft'
  slug?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export function AdminContentManagement() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      setLoading(true)
      // Mock data for now - would be replaced with actual API call
      const mockContent: ContentItem[] = [
        {
          id: '1',
          title: 'Página Inicial - Banner Principal',
          type: 'banner',
          content: 'Encontre as melhores soluções em energia solar',
          status: 'published',
          imageUrl: '/banner-home.jpg',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T14:30:00Z'
        },
        {
          id: '2',
          title: 'Sobre Nós',
          type: 'page',
          content: 'O SolarConnect é a maior plataforma de energia solar do Brasil...',
          status: 'published',
          slug: 'sobre-nos',
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-18T16:45:00Z'
        },
        {
          id: '3',
          title: 'Promoção de Janeiro',
          type: 'announcement',
          content: 'Desconto especial de 20% em todos os produtos até o final do mês!',
          status: 'published',
          createdAt: '2024-01-01T08:00:00Z',
          updatedAt: '2024-01-01T08:00:00Z'
        }
      ]
      setContent(mockContent)
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveContent = async (item: Partial<ContentItem>) => {
    try {
      // Mock save - would be replaced with actual API call
      if (editingItem) {
        // Update existing
        setContent(prev => prev.map(c => 
          c.id === editingItem.id 
            ? { ...c, ...item, updatedAt: new Date().toISOString() }
            : c
        ))
        addToast({
          type: 'success',
          title: 'Conteúdo atualizado',
          message: 'As alterações foram salvas com sucesso'
        })
      } else {
        // Create new
        const newItem: ContentItem = {
          id: Date.now().toString(),
          title: item.title || '',
          type: item.type || 'page',
          content: item.content || '',
          status: item.status || 'draft',
          slug: item.slug,
          imageUrl: item.imageUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setContent(prev => [newItem, ...prev])
        addToast({
          type: 'success',
          title: 'Conteúdo criado',
          message: 'Novo conteúdo adicionado com sucesso'
        })
      }
      
      setEditingItem(null)
      setIsCreating(false)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível salvar o conteúdo'
      })
    }
  }

  const deleteContent = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este conteúdo?')) return

    try {
      setContent(prev => prev.filter(c => c.id !== id))
      addToast({
        type: 'success',
        title: 'Conteúdo excluído',
        message: 'Conteúdo removido com sucesso'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível excluir o conteúdo'
      })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'banner':
        return <ImageIcon className="w-4 h-4" />
      case 'announcement':
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      page: { label: 'Página', variant: 'default' as const },
      banner: { label: 'Banner', variant: 'secondary' as const },
      announcement: { label: 'Anúncio', variant: 'outline' as const },
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.page
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'published' ? 'default' : 'secondary'}>
        {status === 'published' ? 'Publicado' : 'Rascunho'}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conteúdo da Plataforma</h2>
          <p className="text-gray-600">Gerencie páginas, banners e anúncios</p>
        </div>
        
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Conteúdo
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingItem) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem ? 'Editar Conteúdo' : 'Novo Conteúdo'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContentForm
              item={editingItem}
              onSave={saveContent}
              onCancel={() => {
                setEditingItem(null)
                setIsCreating(false)
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Content List */}
      <div className="space-y-4">
        {content.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getTypeIcon(item.type)}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    {getTypeBadge(item.type)}
                    {getStatusBadge(item.status)}
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {item.content}
                  </p>
                  
                  {item.slug && (
                    <p className="text-sm text-blue-600 mb-2">
                      URL: /{item.slug}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Criado: {formatDate(item.createdAt)}</span>
                    <span>Atualizado: {formatDate(item.updatedAt)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" />
                    Visualizar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingItem(item)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteContent(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Content Form Component
function ContentForm({ 
  item, 
  onSave, 
  onCancel 
}: { 
  item: ContentItem | null
  onSave: (item: Partial<ContentItem>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    type: item?.type || 'page',
    content: item?.content || '',
    status: item?.status || 'draft',
    slug: item?.slug || '',
    imageUrl: item?.imageUrl || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título *
          </label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="page">Página</option>
            <option value="banner">Banner</option>
            <option value="announcement">Anúncio</option>
          </select>
        </div>
      </div>
      
      {formData.type === 'page' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug (URL)
          </label>
          <Input
            value={formData.slug}
            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
            placeholder="sobre-nos"
          />
        </div>
      )}
      
      {formData.type === 'banner' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL da Imagem
          </label>
          <Input
            value={formData.imageUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
            placeholder="https://exemplo.com/imagem.jpg"
          />
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Conteúdo *
        </label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          rows={6}
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
        </select>
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
      </div>
    </form>
  )
}