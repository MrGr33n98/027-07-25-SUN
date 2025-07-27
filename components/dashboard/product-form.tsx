'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/ui/image-upload'
import { 
  Package, 
  Save, 
  DollarSign,
  Zap,
  Award,
  Image as ImageIcon
} from 'lucide-react'

interface ProductFormProps {
  product?: any // TODO: Type this properly when Product model is added
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    originalPrice: product?.originalPrice || '',
    power: product?.power || '',
    efficiency: product?.efficiency || '',
    warranty: product?.warranty || '',
    category: product?.category || '',
    brand: product?.brand || '',
    model: product?.model || '',
    inStock: product?.inStock ?? true,
    images: product?.images || [],
    specifications: product?.specifications || {},
  })

  const [newSpecKey, setNewSpecKey] = useState('')
  const [newSpecValue, setNewSpecValue] = useState('')

  const categories = [
    'PAINEL_SOLAR',
    'INVERSOR',
    'BATERIA',
    'ESTRUTURA',
    'CABO',
    'ACESSORIO',
    'KIT_COMPLETO',
  ]

  const categoryLabels: Record<string, string> = {
    PAINEL_SOLAR: 'Painel Solar',
    INVERSOR: 'Inversor',
    BATERIA: 'Bateria',
    ESTRUTURA: 'Estrutura',
    CABO: 'Cabo',
    ACESSORIO: 'Acessório',
    KIT_COMPLETO: 'Kit Completo',
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [newSpecKey.trim()]: newSpecValue.trim()
        }
      }))
      setNewSpecKey('')
      setNewSpecValue('')
    }
  }

  const removeSpecification = (key: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications }
      delete newSpecs[key]
      return {
        ...prev,
        specifications: newSpecs
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/products', {
        method: product ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: product?.id,
        }),
      })

      if (response.ok) {
        router.push('/dashboard/produtos')
        router.refresh()
      } else {
        throw new Error('Erro ao salvar produto')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Erro ao salvar produto. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Produto *
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Painel Solar 450W Monocristalino"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {categoryLabels[category]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição do Produto *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              placeholder="Descreva as características e benefícios do produto..."
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca
              </label>
              <Input
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Ex: Canadian Solar"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo
              </label>
              <Input
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Ex: CS3W-450MS"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Preços
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Atual (R$) *
              </label>
              <Input
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder="890.00"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Original (R$)
              </label>
              <Input
                name="originalPrice"
                type="number"
                step="0.01"
                value={formData.originalPrice}
                onChange={handleChange}
                placeholder="1200.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe em branco se não houver desconto
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="inStock"
              checked={formData.inStock}
              onChange={handleCheckboxChange}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">
              Produto em estoque
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Technical Specifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Especificações Técnicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Potência (W)
              </label>
              <Input
                name="power"
                type="number"
                value={formData.power}
                onChange={handleChange}
                placeholder="450"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Eficiência (%)
              </label>
              <Input
                name="efficiency"
                type="number"
                step="0.1"
                value={formData.efficiency}
                onChange={handleChange}
                placeholder="21.2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Garantia (anos)
              </label>
              <Input
                name="warranty"
                type="number"
                value={formData.warranty}
                onChange={handleChange}
                placeholder="25"
              />
            </div>
          </div>

          {/* Custom Specifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Especificações Adicionais
            </label>
            
            {Object.entries(formData.specifications).length > 0 && (
              <div className="space-y-2 mb-4">
                {Object.entries(formData.specifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">
                      <strong>{key}:</strong> {value}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSpecification(key)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-2">
              <Input
                value={newSpecKey}
                onChange={(e) => setNewSpecKey(e.target.value)}
                placeholder="Nome da especificação"
              />
              <Input
                value={newSpecValue}
                onChange={(e) => setNewSpecValue(e.target.value)}
                placeholder="Valor"
              />
              <Button type="button" onClick={addSpecification} variant="outline">
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ImageIcon className="w-5 h-5 mr-2" />
            Imagens do Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            endpoint="productImages"
            value={formData.images}
            onChange={(urls) => setFormData(prev => ({ ...prev, images: urls as string[] }))}
            multiple
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {isLoading ? (
            'Salvando...'
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {product ? 'Atualizar Produto' : 'Criar Produto'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}