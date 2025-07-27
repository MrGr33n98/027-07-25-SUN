'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Image as ImageIcon, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin,
  Calendar,
  Zap,
  Plus
} from 'lucide-react'
import Link from 'next/link'

export function ProjectsList() {
  // Mock projects for demonstration
  const mockProjects = [
    {
      id: '1',
      title: 'Sistema Residencial 5kWp - Família Silva',
      description: 'Instalação completa de sistema fotovoltaico residencial com 12 painéis solares de 450W cada.',
      location: 'São Paulo, SP',
      power: 5.4,
      completionDate: new Date('2024-01-15'),
      type: 'Residencial',
      images: ['/placeholder-project.jpg'],
      status: 'Concluído',
    },
    {
      id: '2',
      title: 'Instalação Comercial 15kWp - Loja ABC',
      description: 'Sistema comercial para redução de custos energéticos em estabelecimento comercial.',
      location: 'Campinas, SP',
      power: 15.0,
      completionDate: new Date('2023-12-10'),
      type: 'Comercial',
      images: ['/placeholder-project.jpg'],
      status: 'Concluído',
    },
    {
      id: '3',
      title: 'Projeto Industrial 50kWp - Fábrica XYZ',
      description: 'Grande instalação industrial com sistema de monitoramento avançado.',
      location: 'Santos, SP',
      power: 50.0,
      completionDate: new Date('2024-02-01'),
      type: 'Industrial',
      images: ['/placeholder-project.jpg'],
      status: 'Em andamento',
    },
  ]

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-green-100 text-green-800'
      case 'Em andamento':
        return 'bg-blue-100 text-blue-800'
      case 'Planejamento':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (mockProjects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ImageIcon className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum projeto cadastrado
          </h3>
          <p className="text-gray-600 text-center mb-6">
            Mostre seus trabalhos realizados para atrair mais clientes
          </p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <Link href="/dashboard/projetos/novo">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Projeto
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockProjects.map((project) => (
        <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          {/* Project Image */}
          <div className="h-48 bg-gradient-to-br from-orange-100 to-green-100 flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-gray-400" />
          </div>

          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900 line-clamp-2">
                {project.title}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {project.description}
            </p>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                {project.location}
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                {formatDate(project.completionDate)}
              </div>
              
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2 text-gray-400" />
                {project.power}kWp
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                {project.type}
              </span>

              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
                
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}