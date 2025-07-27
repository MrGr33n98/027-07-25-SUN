'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/ui/image-upload'
import { 
  Image as ImageIcon, 
  Save, 
  MapPin,
  Calendar,
  Zap,
  FileText
} from 'lucide-react'

interface ProjectFormProps {
  project?: any // TODO: Type this properly when Project model is added
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    location: project?.location || '',
    power: project?.power || '',
    completionDate: project?.completionDate ? 
      new Date(project.completionDate).toISOString().split('T')[0] : '',
    projectType: project?.projectType || '',
    images: project?.images || [],
    client: project?.client || '',
    duration: project?.duration || '',
    challenges: project?.challenges || '',
    solutions: project?.solutions || '',
    results: project?.results || '',
  })

  const projectTypes = [
    'RESIDENCIAL',
    'COMERCIAL',
    'INDUSTRIAL',
    'RURAL',
    'PUBLICO',
  ]

  const projectTypeLabels: Record<string, string> = {
    RESIDENCIAL: 'Residencial',
    COMERCIAL: 'Comercial',
    INDUSTRIAL: 'Industrial',
    RURAL: 'Rural',
    PUBLICO: 'Público',
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: project ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: project?.id,
          completionDate: new Date(formData.completionDate),
        }),
      })

      if (response.ok) {
        router.push('/dashboard/projetos')
        router.refresh()
      } else {
        throw new Error('Erro ao salvar projeto')
      }
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Erro ao salvar projeto. Tente novamente.')
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
            <FileText className="w-5 h-5 mr-2" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título do Projeto *
            </label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Sistema Residencial 5kWp - Família Silva"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição do Projeto *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              placeholder="Descreva o projeto, objetivos e principais características..."
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <Input
                name="client"
                value={formData.client}
                onChange={handleChange}
                placeholder="Nome do cliente (opcional)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Projeto *
              </label>
              <select
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                required
              >
                <option value="">Selecione o tipo</option>
                {projectTypes.map(type => (
                  <option key={type} value={type}>
                    {projectTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Detalhes Técnicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Localização *
              </label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Cidade, Estado"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Potência (kWp) *
              </label>
              <Input
                name="power"
                type="number"
                step="0.1"
                value={formData.power}
                onChange={handleChange}
                placeholder="5.4"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Conclusão *
              </label>
              <Input
                name="completionDate"
                type="date"
                value={formData.completionDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duração do Projeto
            </label>
            <Input
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="Ex: 3 semanas, 2 meses"
            />
          </div>
        </CardContent>
      </Card>

      {/* Project Story */}
      <Card>
        <CardHeader>
          <CardTitle>História do Projeto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desafios Enfrentados
            </label>
            <textarea
              name="challenges"
              value={formData.challenges}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              placeholder="Quais foram os principais desafios deste projeto?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Soluções Implementadas
            </label>
            <textarea
              name="solutions"
              value={formData.solutions}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              placeholder="Como vocês resolveram os desafios?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resultados Obtidos
            </label>
            <textarea
              name="results"
              value={formData.results}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              placeholder="Quais foram os resultados e benefícios para o cliente?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ImageIcon className="w-5 h-5 mr-2" />
            Imagens do Projeto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            endpoint="projectImages"
            value={formData.images}
            onChange={(urls) => setFormData(prev => ({ ...prev, images: urls as string[] }))}
            multiple
          />
          <p className="text-sm text-gray-500 mt-2">
            Adicione fotos do antes, durante e depois da instalação. Máximo 10 imagens.
          </p>
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
              {project ? 'Atualizar Projeto' : 'Criar Projeto'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}