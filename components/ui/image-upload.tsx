'use client'

import { useState } from 'react'
import { UploadDropzone } from '@/lib/uploadthing'
import { Button } from '@/components/ui/button'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  endpoint: 'companyLogo' | 'companyBanner' | 'projectImages' | 'productImages'
  value?: string | string[]
  onChange: (url: string | string[]) => void
  multiple?: boolean
  className?: string
}

export function ImageUpload({
  endpoint,
  value,
  onChange,
  multiple = false,
  className = ''
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleUploadComplete = (res: any) => {
    setIsUploading(false)
    
    if (multiple) {
      const urls = res.map((file: any) => file.url)
      const currentUrls = Array.isArray(value) ? value : []
      onChange([...currentUrls, ...urls])
    } else {
      onChange(res[0]?.url || '')
    }
  }

  const handleRemove = (urlToRemove: string) => {
    if (multiple && Array.isArray(value)) {
      onChange(value.filter(url => url !== urlToRemove))
    } else {
      onChange('')
    }
  }

  const renderImages = () => {
    const urls = Array.isArray(value) ? value : value ? [value] : []
    
    if (urls.length === 0) return null

    return (
      <div className={`grid gap-4 mb-4 ${multiple ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
        {urls.map((url, index) => (
          <div key={index} className="relative group">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={url}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
              />
              <Button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-2 right-2 w-6 h-6 p-0 bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                size="sm"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const shouldShowUploader = () => {
    if (!multiple) return !value
    return !Array.isArray(value) || value.length < getMaxFiles()
  }

  const getMaxFiles = () => {
    switch (endpoint) {
      case 'projectImages':
        return 10
      case 'productImages':
        return 5
      default:
        return 1
    }
  }

  return (
    <div className={className}>
      {renderImages()}
      
      {shouldShowUploader() && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Upload className="w-8 h-8 text-gray-400 animate-pulse mb-2" />
              <p className="text-sm text-gray-600">Fazendo upload...</p>
            </div>
          ) : (
            <UploadDropzone
              endpoint={endpoint}
              onClientUploadComplete={handleUploadComplete}
              onUploadError={(error: Error) => {
                console.error('Upload error:', error)
                setIsUploading(false)
                alert('Erro no upload. Tente novamente.')
              }}
              onUploadBegin={() => setIsUploading(true)}
              appearance={{
                container: 'border-none p-0',
                uploadIcon: 'text-gray-400',
                label: 'text-gray-600 text-sm',
                allowedContent: 'text-gray-500 text-xs',
                button: 'bg-orange-500 hover:bg-orange-600 text-white ut-ready:bg-orange-500 ut-uploading:bg-orange-600',
              }}
            />
          )}
        </div>
      )}
      
      {multiple && Array.isArray(value) && value.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          {value.length} de {getMaxFiles()} imagens
        </p>
      )}
    </div>
  )
}