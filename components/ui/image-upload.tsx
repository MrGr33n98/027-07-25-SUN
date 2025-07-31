"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  X, 
  ImageIcon, 
  Loader2,
  AlertCircle 
} from "lucide-react"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value?: string | string[]
  onChange: (value: string | string[]) => void
  onUpload?: (files: File[]) => Promise<string[]>
  multiple?: boolean
  maxFiles?: number
  maxSize?: number
  accept?: { [key: string]: string[] }
  disabled?: boolean
  className?: string
  aspectRatio?: "square" | "video" | "auto"
  placeholder?: string
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  multiple = false,
  maxFiles = 1,
  maxSize = 4 * 1024 * 1024, // 4MB
  accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
  disabled = false,
  className,
  aspectRatio = "auto",
  placeholder = "Upload de imagem"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const images = Array.isArray(value) ? value : value ? [value] : []

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles,
    maxSize,
    disabled: disabled || uploading,
    onDrop: async (acceptedFiles, rejectedFiles) => {
      setError(null)
      
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0]
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`Arquivo muito grande. Tamanho máximo: ${maxSize / (1024 * 1024)}MB`)
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Tipo de arquivo não suportado. Use PNG, JPG, JPEG ou WebP')
        } else {
          setError('Erro no upload do arquivo')
        }
        return
      }

      if (acceptedFiles.length === 0) return

      if (!onUpload) {
        // If no upload handler, just create object URLs for preview
        const urls = acceptedFiles.map(file => URL.createObjectURL(file))
        if (multiple) {
          onChange([...images, ...urls])
        } else {
          onChange(urls[0])
        }
        return
      }

      setUploading(true)
      try {
        const uploadedUrls = await onUpload(acceptedFiles)
        if (multiple) {
          onChange([...images, ...uploadedUrls])
        } else {
          onChange(uploadedUrls[0])
        }
      } catch (error) {
        console.error('Upload error:', error)
        setError('Erro no upload. Tente novamente.')
      } finally {
        setUploading(false)
      }
    }
  })

  const removeImage = (index: number) => {
    if (multiple) {
      const newImages = images.filter((_, i) => i !== index)
      onChange(newImages)
    } else {
      onChange('')
    }
  }

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square"
      case "video":
        return "aspect-video"
      default:
        return "aspect-auto"
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled && "cursor-not-allowed opacity-50",
          "hover:border-primary hover:bg-primary/5"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground" />
          )}
          
          <div>
            <p className="text-sm font-medium">
              {uploading ? 'Enviando...' : placeholder}
            </p>
            <p className="text-xs text-muted-foreground">
              {isDragActive
                ? 'Solte os arquivos aqui...'
                : `PNG, JPG, WebP até ${maxSize / (1024 * 1024)}MB`}
            </p>
            {maxFiles > 1 && (
              <p className="text-xs text-muted-foreground">
                Máximo {maxFiles} arquivos
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Preview Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((imageUrl, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0 relative">
                <div className={cn("relative", getAspectRatioClass())}>
                  <Image
                    src={imageUrl}
                    alt={`Upload ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 w-6 h-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(index)
                  }}
                  disabled={disabled || uploading}
                >
                  <X className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Info */}
      {images.length > 0 && multiple && (
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{images.length} de {maxFiles} imagens</span>
          {images.length < maxFiles && (
            <Badge variant="outline">
              <ImageIcon className="w-3 h-3 mr-1" />
              Adicionar mais
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}