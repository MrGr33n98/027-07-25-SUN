import { NextRequest } from 'next/server'

export interface ImageUploadOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  quality?: number // 0-100
  maxWidth?: number
  maxHeight?: number
  generateThumbnail?: boolean
  thumbnailSize?: number
}

export interface UploadResult {
  url: string
  thumbnailUrl?: string
  width: number
  height: number
  size: number
  format: string
}

export class ImageUploadService {
  private static instance: ImageUploadService
  private readonly defaultOptions: ImageUploadOptions = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    quality: 85,
    maxWidth: 1920,
    maxHeight: 1080,
    generateThumbnail: true,
    thumbnailSize: 300
  }

  static getInstance(): ImageUploadService {
    if (!ImageUploadService.instance) {
      ImageUploadService.instance = new ImageUploadService()
    }
    return ImageUploadService.instance
  }

  async uploadImage(
    file: File,
    folder: string = 'uploads',
    options: ImageUploadOptions = {}
  ): Promise<UploadResult> {
    const opts = { ...this.defaultOptions, ...options }

    // Validate file
    this.validateFile(file, opts)

    // Process image
    const processedImage = await this.processImage(file, opts)
    
    // Generate filename
    const filename = this.generateFilename(file.name)
    const path = `${folder}/${filename}`

    // Upload to storage (implement your preferred storage solution)
    const uploadResult = await this.uploadToStorage(processedImage, path)

    // Generate thumbnail if requested
    let thumbnailUrl: string | undefined
    if (opts.generateThumbnail) {
      const thumbnail = await this.generateThumbnail(processedImage, opts.thumbnailSize!)
      const thumbnailPath = `${folder}/thumbnails/${filename}`
      const thumbnailResult = await this.uploadToStorage(thumbnail, thumbnailPath)
      thumbnailUrl = thumbnailResult.url
    }

    return {
      url: uploadResult.url,
      thumbnailUrl,
      width: uploadResult.width,
      height: uploadResult.height,
      size: uploadResult.size,
      format: uploadResult.format
    }
  }

  private validateFile(file: File, options: ImageUploadOptions): void {
    // Check file size
    if (file.size > options.maxSize!) {
      throw new Error(`File size exceeds maximum allowed size of ${options.maxSize! / 1024 / 1024}MB`)
    }

    // Check file type
    if (!options.allowedTypes!.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes!.join(', ')}`)
    }
  }

  private async processImage(file: File, options: ImageUploadOptions): Promise<ProcessedImage> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        const { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          options.maxWidth!,
          options.maxHeight!
        )

        // Set canvas size
        canvas.width = width
        canvas.height = height

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                width,
                height,
                format: this.getOutputFormat(file.type)
              })
            } else {
              reject(new Error('Failed to process image'))
            }
          },
          this.getOutputFormat(file.type),
          options.quality! / 100
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  private async generateThumbnail(processedImage: ProcessedImage, size: number): Promise<ProcessedImage> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // Calculate thumbnail dimensions (square crop)
        const minDimension = Math.min(img.width, img.height)
        const scale = size / minDimension

        canvas.width = size
        canvas.height = size

        // Center crop
        const sx = (img.width - minDimension) / 2
        const sy = (img.height - minDimension) / 2

        ctx.drawImage(
          img,
          sx, sy, minDimension, minDimension,
          0, 0, size, size
        )

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                width: size,
                height: size,
                format: processedImage.format
              })
            } else {
              reject(new Error('Failed to generate thumbnail'))
            }
          },
          processedImage.format,
          0.8 // Slightly lower quality for thumbnails
        )
      }

      img.onerror = () => reject(new Error('Failed to load image for thumbnail'))
      img.src = URL.createObjectURL(processedImage.blob)
    })
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight }

    // Scale down if necessary
    if (width > maxWidth) {
      height = (height * maxWidth) / width
      width = maxWidth
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height
      height = maxHeight
    }

    return { width: Math.round(width), height: Math.round(height) }
  }

  private getOutputFormat(inputType: string): string {
    // Convert to WebP for better compression, fallback to JPEG
    if (this.supportsWebP()) {
      return 'image/webp'
    }
    return inputType === 'image/png' ? 'image/png' : 'image/jpeg'
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas')
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }

  private generateFilename(originalName: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const extension = this.getFileExtension(originalName)
    return `${timestamp}_${random}.${extension}`
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'jpg'
  }

  private async uploadToStorage(processedImage: ProcessedImage, path: string): Promise<StorageResult> {
    // This is a placeholder - implement your preferred storage solution
    // Examples: AWS S3, Cloudinary, Vercel Blob, etc.
    
    if (process.env.NODE_ENV === 'development') {
      // For development, you might want to save locally or use a mock service
      return this.mockUpload(processedImage, path)
    }

    // Example implementation for different storage providers:
    
    // AWS S3
    if (process.env.AWS_S3_BUCKET) {
      return this.uploadToS3(processedImage, path)
    }

    // Cloudinary
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      return this.uploadToCloudinary(processedImage, path)
    }

    // Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      return this.uploadToVercelBlob(processedImage, path)
    }

    throw new Error('No storage provider configured')
  }

  private async mockUpload(processedImage: ProcessedImage, path: string): Promise<StorageResult> {
    // Mock implementation for development
    const url = `http://localhost:3000/api/images/${path}`
    
    return {
      url,
      width: processedImage.width,
      height: processedImage.height,
      size: processedImage.blob.size,
      format: processedImage.format
    }
  }

  private async uploadToS3(processedImage: ProcessedImage, path: string): Promise<StorageResult> {
    // AWS S3 implementation
    const formData = new FormData()
    formData.append('file', processedImage.blob)
    formData.append('path', path)

    const response = await fetch('/api/upload/s3', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to upload to S3')
    }

    const result = await response.json()
    
    return {
      url: result.url,
      width: processedImage.width,
      height: processedImage.height,
      size: processedImage.blob.size,
      format: processedImage.format
    }
  }

  private async uploadToCloudinary(processedImage: ProcessedImage, path: string): Promise<StorageResult> {
    // Cloudinary implementation
    const formData = new FormData()
    formData.append('file', processedImage.blob)
    formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET!)
    formData.append('public_id', path)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )

    if (!response.ok) {
      throw new Error('Failed to upload to Cloudinary')
    }

    const result = await response.json()
    
    return {
      url: result.secure_url,
      width: processedImage.width,
      height: processedImage.height,
      size: processedImage.blob.size,
      format: processedImage.format
    }
  }

  private async uploadToVercelBlob(processedImage: ProcessedImage, path: string): Promise<StorageResult> {
    // Vercel Blob implementation
    const formData = new FormData()
    formData.append('file', processedImage.blob)
    formData.append('filename', path)

    const response = await fetch('/api/upload/blob', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to upload to Vercel Blob')
    }

    const result = await response.json()
    
    return {
      url: result.url,
      width: processedImage.width,
      height: processedImage.height,
      size: processedImage.blob.size,
      format: processedImage.format
    }
  }
}

interface ProcessedImage {
  blob: Blob
  width: number
  height: number
  format: string
}

interface StorageResult {
  url: string
  width: number
  height: number
  size: number
  format: string
}

// Export singleton instance
export const imageUpload = ImageUploadService.getInstance()

// React hook for image upload
export function useImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadImage = async (
    file: File,
    folder?: string,
    options?: ImageUploadOptions
  ): Promise<UploadResult> => {
    setUploading(true)
    setProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await imageUpload.uploadImage(file, folder, options)
      
      clearInterval(progressInterval)
      setProgress(100)
      
      return result
    } catch (error) {
      throw error
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  return {
    uploadImage,
    uploading,
    progress
  }
}

// Utility function to validate image files on the client
export function validateImageFile(file: File, options: ImageUploadOptions = {}): string | null {
  const opts = { 
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    ...options 
  }

  if (file.size > opts.maxSize!) {
    return `Arquivo muito grande. Tamanho máximo: ${opts.maxSize! / 1024 / 1024}MB`
  }

  if (!opts.allowedTypes!.includes(file.type)) {
    return `Tipo de arquivo não permitido. Tipos aceitos: ${opts.allowedTypes!.join(', ')}`
  }

  return null
}

// Add missing import
import { useState } from 'react'