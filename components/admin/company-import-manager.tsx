"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Users,
  Database,
  Eye
} from "lucide-react"
import { useDropzone } from "react-dropzone"

interface CSVPreviewData {
  headers: string[]
  rows: string[][]
  validRows: number
  invalidRows: number
  errors: string[]
}

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export function CompanyImportManager() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<CSVPreviewData | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        setCsvFile(file)
        await processCSVPreview(file)
      }
    }
  })

  const processCSVPreview = async (file: File) => {
    const formData = new FormData()
    formData.append('csvFile', file)

    try {
      const response = await fetch('/api/admin/companies/preview-csv', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const preview = await response.json()
        setPreviewData(preview)
        setStep('preview')
      } else {
        const error = await response.json()
        alert(`Erro ao processar CSV: ${error.message}`)
      }
    } catch (error) {
      console.error('Preview error:', error)
      alert('Erro ao processar arquivo CSV')
    }
  }

  const handleImport = async () => {
    if (!csvFile) return

    setImporting(true)
    const formData = new FormData()
    formData.append('csvFile', csvFile)

    try {
      const response = await fetch('/api/admin/companies/import-csv', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setImportResult(result)
        setStep('result')
      } else {
        const error = await response.json()
        alert(`Erro na importação: ${error.message}`)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Erro na importação')
    } finally {
      setImporting(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)

    try {
      const response = await fetch('/api/admin/companies/export-csv', {
        method: 'GET',
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `empresas_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Erro ao exportar dados')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Erro ao exportar dados')
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/companies/template-csv', {
        method: 'GET',
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'template_empresas.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        alert('Erro ao baixar template')
      }
    } catch (error) {
      console.error('Template download error:', error)
      alert('Erro ao baixar template')
    }
  }

  const resetProcess = () => {
    setCsvFile(null)
    setPreviewData(null)
    setImportResult(null)
    setStep('upload')
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={handleDownloadTemplate}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Baixar Template
        </Button>
        
        <Button
          onClick={handleExport}
          disabled={exporting}
          variant="outline"
          className="flex items-center gap-2"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Exportar Empresas
        </Button>
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload de Arquivo CSV
            </CardTitle>
            <CardDescription>
              Faça upload de um arquivo CSV com os dados das empresas para importação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isDragActive ? 'Solte o arquivo aqui' : 'Arraste seu arquivo CSV ou clique para selecionar'}
              </h3>
              <p className="text-muted-foreground">
                Formatos aceitos: .csv (máximo 10MB)
              </p>
            </div>

            {csvFile && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">{csvFile.name}</span>
                  <Badge variant="secondary">
                    {(csvFile.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Step */}
      {step === 'preview' && previewData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview dos Dados
            </CardTitle>
            <CardDescription>
              Visualize os dados antes de importar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Válidos</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {previewData.validRows}
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-900">Inválidos</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {previewData.invalidRows}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Total</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {previewData.rows.length}
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-orange-900">Colunas</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {previewData.headers.length}
                </div>
              </div>
            </div>

            {/* Errors */}
            {previewData.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">Erros Encontrados:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {previewData.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sample Data */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2">
                <h4 className="font-medium">Preview dos Dados (primeiras 5 linhas)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {previewData.headers.map((header, index) => (
                        <th key={index} className="px-4 py-2 text-left text-sm font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.slice(0, 5).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-t">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-2 text-sm">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button onClick={resetProcess} variant="outline">
                Cancelar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={importing || previewData.validRows === 0}
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Importar {previewData.validRows} Empresas
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result Step */}
      {step === 'result' && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Resultado da Importação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Importadas</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {importResult.success}
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-900">Falharam</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {importResult.failed}
                </div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">Erros na Importação:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={resetProcess}>
              <Upload className="w-4 h-4 mr-2" />
              Nova Importação
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instruções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>1. Baixe o template:</strong> Use o botão "Baixar Template" para obter o formato correto do CSV
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>2. Preencha os dados:</strong> Complete o arquivo com os dados das empresas
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>3. Faça o upload:</strong> Arraste o arquivo ou clique para selecionar
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>4. Revise os dados:</strong> Verifique o preview antes de importar
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>5. Confirme a importação:</strong> Clique em "Importar" para processar
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}