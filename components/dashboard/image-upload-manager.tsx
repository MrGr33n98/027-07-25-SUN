"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/image-upload"
import { Badge } from "@/components/ui/badge"
import { 
  Image, 
  Upload, 
  Save, 
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useUploadThing } from "@/hooks/use-uploadthing"
import { CompanyProfile } from "@prisma/client"

interface ImageUploadManagerProps {
  company: CompanyProfile
}

export function ImageUploadManager({ company }: ImageUploadManagerProps) {
  const [logo, setLogo] = useState(company.logo || '')
  const [banner, setBanner] = useState(company.banner || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  // Upload hooks
  const { startUpload: uploadLogo, isUploading: logoUploading } = useUploadThing("companyLogo")
  const { startUpload: uploadBanner, isUploading: bannerUploading } = useUploadThing("companyBanner")

  // Upload handlers
  const handleLogoUpload = async (files: File[]) => {
    if (!files.length) return []
    
    try {
      const result = await uploadLogo(files)
      const urls = result?.map(file => file.url) || []
      if (urls.length > 0) {
        setLogo(urls[0])
        setMessage('Logo enviado com sucesso!')
      }
      return urls
    } catch (error) {
      console.error('Logo upload error:', error)
      setMessage('Erro no upload do logo')
      return []
    }
  }

  const handleBannerUpload = async (files: File[]) => {
    if (!files.length) return []
    
    try {
      const result = await uploadBanner(files)
      const urls = result?.map(file => file.url) || []
      if (urls.length > 0) {
        setBanner(urls[0])
        setMessage('Banner enviado com sucesso!')
      }
      return urls
    } catch (error) {
      console.error('Banner upload error:', error)
      setMessage('Erro no upload do banner')
      return []
    }
  }

  const handleSave = async () => {
    setIsUpdating(true)
    setMessage('')

    try {
      const response = await fetch('/api/dashboard/company-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logo: logo || null,
          banner: banner || null,
        }),
      })

      if (response.ok) {
        setMessage('Imagens atualizadas com sucesso!')
        router.refresh()
      } else {
        const error = await response.json()
        setMessage(error.message || 'Erro ao atualizar imagens')
      }
    } catch (error) {
      console.error('Save error:', error)
      setMessage('Erro ao salvar alterações')
    } finally {
      setIsUpdating(false)
    }
  }

  const hasChanges = logo !== (company.logo || '') || banner !== (company.banner || '')

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-md flex items-center gap-2 ${
          message.includes('sucesso') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.includes('sucesso') ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {message}
        </div>
      )}

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Logo da Empresa
          </CardTitle>
          <CardDescription>
            Faça upload do logo da sua empresa. Recomendado: 400x400px, PNG ou JPG, máximo 4MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={logo}
            onChange={(value) => setLogo(Array.isArray(value) ? value[0] || '' : value)}
            onUpload={handleLogoUpload}
            aspectRatio="square"
            maxSize={4 * 1024 * 1024}
            placeholder="Upload do logo da empresa"
            disabled={logoUploading || isUpdating}
          />
          
          {logoUploading && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando logo...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Banner Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Banner da Empresa
          </CardTitle>
          <CardDescription>
            Faça upload do banner da sua empresa. Recomendado: 1200x630px, PNG ou JPG, máximo 8MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={banner}
            onChange={(value) => setBanner(Array.isArray(value) ? value[0] || '' : value)}
            onUpload={handleBannerUpload}
            aspectRatio="video"
            maxSize={8 * 1024 * 1024}
            placeholder="Upload do banner da empresa"
            disabled={bannerUploading || isUpdating}
          />
          
          {bannerUploading && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando banner...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Images Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Imagens</CardTitle>
          <CardDescription>
            Visualize o status atual das imagens da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Image className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Logo</span>
              </div>
              <Badge variant={logo ? "default" : "secondary"}>
                {logo ? "Configurado" : "Não definido"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Image className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Banner</span>
              </div>
              <Badge variant={banner ? "default" : "secondary"}>
                {banner ? "Configurado" : "Não definido"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Actions */}
      {hasChanges && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alterações pendentes</p>
                <p className="text-sm text-muted-foreground">
                  Você tem alterações não salvas nas imagens
                </p>
              </div>
              
              <Button
                onClick={handleSave}
                disabled={isUpdating || logoUploading || bannerUploading}
                className="min-w-[140px]"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas para Melhores Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Logo:</strong> Use imagem quadrada (1:1) com fundo transparente (PNG) ou branco. Ideal: 400x400px
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Banner:</strong> Use proporção 16:9 ou similar. Ideal: 1200x630px para melhor visualização
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Formatos:</strong> PNG, JPG ou WebP. Evite imagens muito pesadas para carregamento rápido
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Qualidade:</strong> Use imagens de alta qualidade, mas comprima quando necessário
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}