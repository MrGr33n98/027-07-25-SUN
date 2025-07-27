'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toast'

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<string[]>
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number
  multiple?: boolean
  className?: string
}

interface UploadedFile {
  file: File
  url?: string
  progress: number
  error?: string
  status: 'uploading' | 'success' | 'error'
}

export function FileUpload({
  onUpload,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
  },
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = true,
  className = ''
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const { addToast } = useToast()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Validate file count
    if (files.length + acceptedFiles.length > maxFiles) {
      addToast({
        type: 'error',
        title: 'Muitos arquivos',
        message: `Máximo de ${maxFiles} arquivos permitidos`
      })
      return
    }

    // Validate file sizes
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      addToast({
        type: 'error',
        title: 'Arquivo muito grande',
        message: `Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`
      })
      return
    }

    // Add files to state with uploading status
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }))

    setFiles(prev => [...prev, ...newFiles])
    setUploading(true)

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setFiles(prev => prev.map(f => 
          newFiles.some(nf => nf.file === f.file) 
            ? { ...f, progress: i }
            : f
        ))
      }

      // Actually upload files
      const urls = await onUpload(acceptedFiles)
      
      // Update files with success status and URLs
      setFiles(prev => prev.map(f => {
        const fileIndex = newFiles.findIndex(nf => nf.file === f.file)
        if (fileIndex !== -1) {
          return {
            ...f,
            url: urls[fileIndex],
            status: 'success' as const,
            progress: 100
          }
        }
        return f
      }))

      addToast({
        type: 'success',
        title: 'Upload concluído',
        message: `${acceptedFiles.length} arquivo(s) enviado(s) com sucesso`
      })

    } catch (error) {
      // Update files with error status
      setFiles(prev => prev.map(f => 
        newFiles.some(nf => nf.file === f.file)
          ? { ...f, status: 'error' as const, error: 'Erro no upload' }
          : f
      ))

      addToast({
        type: 'error',
        title: 'Erro no upload',
        message: 'Não foi possível enviar os arquivos'
      })
    } finally {
      setUploading(false)
    }
  }, [files, maxFiles, maxSize, onUpload, addToast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    disabled: uploading
  })

  const removeFile = (fileToRemove: UploadedFile) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove.file))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />
    }
    return <File className="w-8 h-8 text-gray-500" />
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        
        {isDragActive ? (
          <p className="text-blue-600">Solte os arquivos aqui...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500">
              Máximo {maxFiles} arquivos, até {(maxSize / 1024 / 1024).toFixed(1)}MB cada
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Arquivos:</h4>
          {files.map((uploadedFile, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              {getFileIcon(uploadedFile.file)}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                
                {uploadedFile.status === 'uploading' && (
                  <Progress value={uploadedFile.progress} className="mt-2" />
                )}
                
                {uploadedFile.status === 'error' && (
                  <div className="flex items-center mt-1 text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span className="text-xs">{uploadedFile.error}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {uploadedFile.status === 'success' && (
                  <span className="text-green-600 text-sm">✓</span>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(uploadedFile)}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}