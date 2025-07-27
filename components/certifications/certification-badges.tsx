'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  Award, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Info,
  Star,
  Zap,
  Leaf,
  Users,
  Building2
} from 'lucide-react'

interface Certification {
  id: string
  name: string
  description: string
  icon?: string
  color: string
  category: string
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'REVOKED'
  issuedAt: string
  expiresAt?: string
  verifiedAt?: string
}

interface CertificationBadgesProps {
  companyId: string
  certifications: Certification[]
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function CertificationBadges({ 
  companyId, 
  certifications, 
  showDetails = false,
  size = 'md'
}: CertificationBadgesProps) {
  const [showAll, setShowAll] = useState(false)

  const getIcon = (iconName?: string, category?: string) => {
    const iconMap: Record<string, any> = {
      shield: Shield,
      award: Award,
      star: Star,
      zap: Zap,
      leaf: Leaf,
      users: Users,
      building: Building2,
    }

    if (iconName && iconMap[iconName]) {
      return iconMap[iconName]
    }

    // Default icons by category
    switch (category) {
      case 'quality':
        return Award
      case 'environmental':
        return Leaf
      case 'safety':
        return Shield
      case 'technical':
        return Zap
      case 'business':
        return Building2
      default:
        return Award
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="w-3 h-3 text-green-600" />
      case 'PENDING':
        return <Clock className="w-3 h-3 text-yellow-600" />
      case 'EXPIRED':
        return <AlertTriangle className="w-3 h-3 text-red-600" />
      case 'REVOKED':
        return <AlertTriangle className="w-3 h-3 text-red-600" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'Verificado'
      case 'PENDING':
        return 'Pendente'
      case 'EXPIRED':
        return 'Expirado'
      case 'REVOKED':
        return 'Revogado'
      default:
        return status
    }
  }

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'default'
      case 'PENDING':
        return 'secondary'
      case 'EXPIRED':
      case 'REVOKED':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false
    const expiryDate = new Date(expiresAt)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    return expiryDate <= thirtyDaysFromNow
  }

  const verifiedCertifications = certifications.filter(cert => cert.status === 'VERIFIED')
  const displayCertifications = showAll ? verifiedCertifications : verifiedCertifications.slice(0, 3)

  if (certifications.length === 0) {
    return null
  }

  if (!showDetails) {
    // Simple badge display
    return (
      <div className="flex flex-wrap gap-2">
        {displayCertifications.map((cert) => {
          const Icon = getIcon(cert.icon, cert.category)
          
          return (
            <Badge
              key={cert.id}
              variant={getBadgeVariant(cert.status)}
              className={`flex items-center space-x-1 ${
                size === 'sm' ? 'text-xs px-2 py-1' : 
                size === 'lg' ? 'text-sm px-3 py-2' : 
                'text-xs px-2 py-1'
              }`}
              style={{ backgroundColor: cert.color + '20', color: cert.color, borderColor: cert.color }}
            >
              <Icon className={`${
                size === 'sm' ? 'w-3 h-3' : 
                size === 'lg' ? 'w-4 h-4' : 
                'w-3 h-3'
              }`} />
              <span>{cert.name}</span>
              {getStatusIcon(cert.status)}
            </Badge>
          )
        })}
        
        {verifiedCertifications.length > 3 && !showAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(true)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            +{verifiedCertifications.length - 3} mais
          </Button>
        )}
      </div>
    )
  }

  // Detailed card display
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center">
        <Award className="w-5 h-5 mr-2" />
        Certificações e Badges
      </h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayCertifications.map((cert) => {
          const Icon = getIcon(cert.icon, cert.category)
          const expiringSoon = isExpiringSoon(cert.expiresAt)
          
          return (
            <Card key={cert.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: cert.color + '20' }}
                  >
                    <Icon 
                      className="w-5 h-5" 
                      style={{ color: cert.color }}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(cert.status)}
                    {expiringSoon && (
                      <AlertTriangle className="w-3 h-3 text-yellow-600" title="Expira em breve" />
                    )}
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-1">
                  {cert.name}
                </h4>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {cert.description}
                </p>
                
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <Badge variant={getBadgeVariant(cert.status)} className="text-xs">
                      {getStatusText(cert.status)}
                    </Badge>
                  </div>
                  
                  {cert.verifiedAt && (
                    <div className="flex items-center justify-between">
                      <span>Verificado em:</span>
                      <span>{formatDate(cert.verifiedAt)}</span>
                    </div>
                  )}
                  
                  {cert.expiresAt && (
                    <div className="flex items-center justify-between">
                      <span>Expira em:</span>
                      <span className={expiringSoon ? 'text-yellow-600 font-medium' : ''}>
                        {formatDate(cert.expiresAt)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {verifiedCertifications.length > 3 && !showAll && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(true)}
          >
            Ver todas as certificações ({verifiedCertifications.length})
          </Button>
        </div>
      )}
      
      {showAll && verifiedCertifications.length > 3 && (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setShowAll(false)}
          >
            Mostrar menos
          </Button>
        </div>
      )}
    </div>
  )
}