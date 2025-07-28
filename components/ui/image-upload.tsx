'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useImageUpload, validateImageFile, ImageUploadOptions } from '@/lib/image-upload'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onUpload: (url: string, thumbnailUrl?: string) => void
  onError?: (error: string) => void
  folder?: string
  options?: ImageUploadOptions
  className?: string
  multiple?: boolean
  maxFiles?: number
  preview?: boolean
  disabled?: boolean
  accept?: string
  placeholder?: string
}

export function ImageUpload({
  onUpload,
  onError,
  folder = 'uploads',
  options,
  className,
  multiple = false,
  maxFiles = 5,
  preview = true,
  disabled = false,
  accept = 'image/*',
  placeholder = 'Clique para fazer upload ou arraste uma imagem'
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<Array<{
    url: string
    thumbnailUrl?: string
    name: string
  }>>([])
  const [error, setError] = useState<string | null>(null)
  
  const { uploadImage, uploading, progress } = useImageUpload()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled) return

    const fileArray = Array.from(files)
    
    // Check max files limit
    if (multiple && uploadedImages.length + fileArray.length > maxFiles) {
      const errorMsg = `Máximo de ${maxFiles} arquivos permitidos`
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    for (const file of fileArray) {
      // Validate file
      const validationError = validateImageFile(file, options)
      if (validationError) {
        setError(validationError)
        onError?.(validationError)
        continue
      }

      try {
        setError(null)
        const result = await uploadImage(file, folder, options)
        
        const newImage = {
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          name: file.name
        }

        if (multiple) {
          setUploadedImages(prev => [...prev, newImage])
        } else {
          setUploadedImages([newImage])
        }

        onUpload(result.url, result.thumbnailUrl)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro ao fazer upload'
        setError(errorMsg)
        onError?.(errorMsg)
      }
    }
  }, [uploadImage, folder, options, onUpload, onError, disabled, multiple, maxFiles, uploadedImages.length])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const removeImage = useCallback((index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }, [])

  const openFileDialog = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }, [disabled])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
          dragActive 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          uploading && 'pointer-events-none'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center text-center">
          {uploading ? (
            <>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-orange-600 animate-pulse" />
              </div>
              <p className="text-sm text-gray-600 mb-2">Fazendo upload...</p>
              <div className="w-full max-w-xs">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{progress}%</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-2">{placeholder}</p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WebP até {options?.maxSize ? Math.round(options.maxSize / 1024 / 1024) : 5}MB
              </p>
              {multiple && (
                <p className="text-xs text-gray-500 mt-1">
                  Máximo {maxFiles} arquivos
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Preview */}
      {preview && uploadedImages.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">
            Imagens carregadas ({uploadedImages.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={image.thumbnailUrl || image.url}
                    alt={image.name}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(index)
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Image Name */}
                <p className="text-xs text-gray-500 mt-1 truncate" title={image.name}>
                  {image.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button (Alternative) */}
      {!uploading && uploadedImages.length === 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={openFileDialog}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Selecionar {multiple ? 'Imagens' : 'Imagem'}
        </Button>
      )}
    </div>
  )
}

// Specialized components for common use cases
export function ProfileImageUpload({
  onUpload,
  currentImage,
  ...props
}: Omit<ImageUploadProps, 'multiple' | 'maxFiles'> & {
  currentImage?: string
}) {
  return (
    <div className="space-y-4">
      {currentImage && (
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
            <Image
              src={currentImage}
              alt="Profile"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      
      <ImageUpload
        {...props}
        onUpload={onUpload}
        multiple={false}
        maxFiles={1}
        folder="profiles"
        options={{
          maxSize: 2 * 1024 * 1024, // 2MB
          maxWidth: 400,
          maxHeight: 400,
          generateThumbnail: true,
          thumbnailSize: 150,
          ...props.options
        }}
        placeholder="Clique para alterar foto do perfil"
      />
    </div>
  )
}

export function ProductImageUpload({
  onUpload,
  ...props
}: ImageUploadProps) {
  return (
    <ImageUpload
      {...props}
      onUpload={onUpload}
      multiple={true}
      maxFiles={10}
      folder="products"
      options={{
        maxSize: 5 * 1024 * 1024, // 5MB
        maxWidth: 1200,
        maxHeight: 1200,
        generateThumbnail: true,
        thumbnailSize: 300,
        ...props.options
      }}
      placeholder="Adicione fotos do produto (até 10 imagens)"
    />
  )
}

export function CompanyGalleryUpload({
  onUpload,
  ...props
}: ImageUploadProps) {
  return (
    <ImageUpload
      {...props}
      onUpload={onUpload}
      multiple={true}
      maxFiles={20}
      folder="companies/gallery"
      options={{
        maxSize: 8 * 1024 * 1024, // 8MB
        maxWidth: 1920,
        maxHeight: 1080,
        generateThumbnail: true,
        thumbnailSize: 400,
        ...props.options
      }}
      placeholder="Adicione fotos da empresa e projetos (até 20 imagens)"
    />
  )
}