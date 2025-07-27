'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Globe, 
  FileText, 
  BarChart3,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface SEOSettings {
  siteName: string
  siteDescription: string
  keywords: string[]
  ogImage: string
  twitterHandle: string
  googleAnalyticsId: string
  googleSearchConsoleId: string
  robotsTxt: string
  sitemapEnabled: boolean
}

interface SEOMetrics {
  totalPages: number
  indexedPages: number
  avgLoadTime: number
  mobileScore: number
  desktopScore: number
  lastCrawl: string
}

export function AdminSEOManagement() {
  const [settings, setSettings] = useState<SEOSettings>({
    siteName: 'SolarConnect',
    siteDescription: 'A maior plataforma de energia solar do Brasil',
    keywords: ['energia solar', 'painéis solares', 'sustentabilidade'],
    ogImage: '/og-image.jpg',
    twitterHandle: '@solarconnect',
    googleAnalyticsId: '',
    googleSearchConsoleId: '',
    robotsTxt: `User-agent: *\nAllow: /\n\nSitemap: https://solarconnect.com.br/sitemap.xml`,
    sitemapEnabled: true
  })
  
  const [metrics, setMetrics] = useState<SEOMetrics>({
    totalPages: 1247,
    indexedPages: 1198,
    avgLoadTime: 2.3,
    mobileScore: 94,
    desktopScore: 97,
    lastCrawl: '2024-01-25T10:30:00Z'
  })
  
  const [loading, setLoading] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const { addToast } = useToast()

  const saveSettings = async () => {
    try {
      setLoading(true)
      // Mock save - would be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      addToast({
        type: 'success',
        title: 'Configurações salvas',
        message: 'As configurações de SEO foram atualizadas com sucesso'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível salvar as configurações'
      })
    } finally {
      setLoading(false)
    }
  }

  const generateSitemap = async () => {
    try {
      setLoading(true)
      // Mock generation - would be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      addToast({
        type: 'success',
        title: 'Sitemap gerado',
        message: 'O sitemap foi atualizado com sucesso'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível gerar o sitemap'
      })
    } finally {
      setLoading(false)
    }
  }

  const addKeyword = () => {
    if (newKeyword.trim() && !settings.keywords.includes(newKeyword.trim())) {
      setSettings(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }))
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setSettings(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'default'
    if (score >= 70) return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      {/* SEO Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Páginas Indexadas
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.indexedPages}/{metrics.totalPages}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {((metrics.indexedPages / metrics.totalPages) * 100).toFixed(1)}% indexado
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Tempo de Carregamento
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.avgLoadTime}s
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Excelente performance
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Score Mobile
                </p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics.mobileScore)}`}>
                  {metrics.mobileScore}
                </p>
                <Badge variant={getScoreBadge(metrics.mobileScore)} className="mt-1">
                  {metrics.mobileScore >= 90 ? 'Excelente' : 
                   metrics.mobileScore >= 70 ? 'Bom' : 'Precisa melhorar'}
                </Badge>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Score Desktop
                </p>
                <p className={`text-2xl font-bold ${getScoreColor(metrics.desktopScore)}`}>
                  {metrics.desktopScore}
                </p>
                <Badge variant={getScoreBadge(metrics.desktopScore)} className="mt-1">
                  {metrics.desktopScore >= 90 ? 'Excelente' : 
                   metrics.desktopScore >= 70 ? 'Bom' : 'Precisa melhorar'}
                </Badge>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO Settings */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Site
              </label>
              <Input
                value={settings.siteName}
                onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição do Site
              </label>
              <Textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Palavras-chave
              </label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Adicionar palavra-chave"
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                />
                <Button onClick={addKeyword}>Adicionar</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeKeyword(keyword)}
                  >
                    {keyword} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagem Open Graph
              </label>
              <Input
                value={settings.ogImage}
                onChange={(e) => setSettings(prev => ({ ...prev, ogImage: e.target.value }))}
                placeholder="/og-image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter Handle
              </label>
              <Input
                value={settings.twitterHandle}
                onChange={(e) => setSettings(prev => ({ ...prev, twitterHandle: e.target.value }))}
                placeholder="@solarconnect"
              />
            </div>
          </CardContent>
        </Card>

        {/* Analytics & Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Analytics e Ferramentas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Analytics ID
              </label>
              <Input
                value={settings.googleAnalyticsId}
                onChange={(e) => setSettings(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
                placeholder="G-XXXXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Search Console ID
              </label>
              <Input
                value={settings.googleSearchConsoleId}
                onChange={(e) => setSettings(prev => ({ ...prev, googleSearchConsoleId: e.target.value }))}
                placeholder="google-site-verification=..."
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.sitemapEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, sitemapEnabled: e.target.checked }))}
                />
                <span className="text-sm font-medium text-gray-700">
                  Sitemap automático habilitado
                </span>
              </label>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Sitemap</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateSitemap}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Regenerar
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Último update: {new Date(metrics.lastCrawl).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Robots.txt */}
      <Card>
        <CardHeader>
          <CardTitle>Robots.txt</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={settings.robotsTxt}
            onChange={(e) => setSettings(prev => ({ ...prev, robotsTxt: e.target.value }))}
            rows={8}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={loading}>
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}