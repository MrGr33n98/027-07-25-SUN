import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, MapPin, Zap, Clock } from "lucide-react"

interface Project {
  id: string
  title: string
  description: string
  images: string[]
  location: string
  power: number
  completionDate: Date
  projectType: string
  client?: string | null
  duration?: string | null
  status: string
}

interface CompanyProjectsProps {
  projects: Project[]
}

export function CompanyProjects({ projects }: CompanyProjectsProps) {
  const getProjectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'RESIDENCIAL': 'Residencial',
      'COMERCIAL': 'Comercial',
      'INDUSTRIAL': 'Industrial',
      'RURAL': 'Rural',
      'PUBLICO': 'Público'
    }
    return labels[type] || type
  }

  const getProjectTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'RESIDENCIAL': 'bg-blue-500',
      'COMERCIAL': 'bg-green-500',
      'INDUSTRIAL': 'bg-purple-500',
      'RURAL': 'bg-amber-500',
      'PUBLICO': 'bg-red-500'
    }
    return colors[type] || 'bg-gray-500'
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {projects.map((project) => (
        <Card key={project.id} className="overflow-hidden">
          <div className="aspect-video bg-gray-100 relative">
            {project.images && project.images.length > 0 ? (
              <img
                src={project.images[0]}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Zap className="w-12 h-12" />
              </div>
            )}
            
            <div className="absolute top-3 left-3">
              <Badge className={getProjectTypeColor(project.projectType)}>
                {getProjectTypeLabel(project.projectType)}
              </Badge>
            </div>
          </div>

          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">
              {project.title}
            </h3>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {project.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{project.location}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span>{project.power.toFixed(1)} kWp</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <span>
                  Concluído em {new Date(project.completionDate).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {project.duration && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Duração: {project.duration}</span>
                </div>
              )}
            </div>

            {project.client && (
              <div className="text-sm">
                <span className="text-muted-foreground">Cliente: </span>
                <span className="font-medium">{project.client}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {projects.length === 0 && (
        <div className="col-span-full text-center py-8">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum projeto disponível</p>
        </div>
      )}
    </div>
  )
}