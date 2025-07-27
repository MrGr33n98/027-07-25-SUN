'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings, 
  Mail, 
  Shield, 
  DollarSign,
  Save,
  RefreshCw,
  Upload,
  Globe,
  Bell
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface PlatformSettings {
  general: {
    siteName: string
    siteUrl: string
    supportEmail: string
    maintenanceMode: boolean
    registrationEnabled: boolean
    emailVerificationRequired: boolean
  }
  email: {
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    fromEmail: string
    fromName: string
  }
  payments: {
    stripePublicKey: string
    stripeSecretKey: string
    paypalClientId: string
    mercadoPagoAccessToken: string
    commissionRate: number
    minimumPayout: number
  }
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
    requireStrongPassword: boolean
    twoFactorEnabled: boolean
    ipWhitelist: string[]
  }
  notifications: {
    emailNotifications: boolean
    pushNotifications: boolean
    smsNotifications: boolean
    webhookUrl: string
  }
  limits: {
    maxProductsPerCompany: number
    maxImagesPerProduct: number
    maxFileSize: number
    rateLimit: number
  }
}

export function AdminSettingsManagement() {
  const [settings, setSettings] = useState<PlatformSettings>({
    general: {
      siteName: 'SolarConnect',
      siteUrl: 'https://solarconnect.com.br',
      supportEmail: 'suporte@solarconnect.com.br',
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: true
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@solarconnect.com.br',
      fromName: 'SolarConnect'
    },
    payments: {
      stripePublicKey: '',
      stripeSecretKey: '',
      paypalClientId: '',
      mercadoPagoAccessToken: '',
      commissionRate: 5.0,
      minimumPayout: 100
    },
    security: {
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireStrongPassword: true,
      twoFactorEnabled: false,
      ipWhitelist: []
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      webhookUrl: ''
    },
    limits: {
      maxProductsPerCompany: 100,
      maxImagesPerProduct: 10,
      maxFileSize: 5,
      rateLimit: 1000
    }
  })

  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const { addToast } = useToast()

  const saveSettings = async () => {
    try {
      setLoading(true)
      // Mock save - would be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      addToast({
        type: 'success',
        title: 'Configurações salvas',
        message: 'As configurações foram atualizadas com sucesso'
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

  const testEmailSettings = async () => {
    try {
      setLoading(true)
      // Mock test - would be replaced with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      addToast({
        type: 'success',
        title: 'Email de teste enviado',
        message: 'Verifique sua caixa de entrada'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro no teste',
        message: 'Não foi possível enviar o email de teste'
      })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'payments', label: 'Pagamentos', icon: DollarSign },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 border-b">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Site
                </label>
                <Input
                  value={settings.general.siteName}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, siteName: e.target.value }
                  }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL do Site
                </label>
                <Input
                  value={settings.general.siteUrl}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, siteUrl: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de Suporte
              </label>
              <Input
                type="email"
                value={settings.general.supportEmail}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  general: { ...prev.general, supportEmail: e.target.value }
                }))}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.general.maintenanceMode}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, maintenanceMode: e.target.checked }
                  }))}
                />
                <span className="text-sm font-medium text-gray-700">
                  Modo de Manutenção
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.general.registrationEnabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, registrationEnabled: e.target.checked }
                  }))}
                />
                <span className="text-sm font-medium text-gray-700">
                  Permitir Novos Cadastros
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.general.emailVerificationRequired}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    general: { ...prev.general, emailVerificationRequired: e.target.checked }
                  }))}
                />
                <span className="text-sm font-medium text-gray-700">
                  Verificação de Email Obrigatória
                </span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Settings */}
      {activeTab === 'email' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Configurações de Email</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={testEmailSettings}
              disabled={loading}
            >
              <Mail className="w-4 h-4 mr-2" />
              Testar Email
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Servidor SMTP
                </label>
                <Input
                  value={settings.email.smtpHost}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtpHost: e.target.value }
                  }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porta SMTP
                </label>
                <Input
                  type="number"
                  value={settings.email.smtpPort}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtpPort: Number(e.target.value) }
                  }))}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuário SMTP
                </label>
                <Input
                  value={settings.email.smtpUser}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtpUser: e.target.value }
                  }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha SMTP
                </label>
                <Input
                  type="password"
                  value={settings.email.smtpPassword}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, smtpPassword: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Remetente
                </label>
                <Input
                  type="email"
                  value={settings.email.fromEmail}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, fromEmail: e.target.value }
                  }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Remetente
                </label>
                <Input
                  value={settings.email.fromName}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, fromName: e.target.value }
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Settings */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Stripe</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chave Pública
                  </label>
                  <Input
                    value={settings.payments.stripePublicKey}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      payments: { ...prev.payments, stripePublicKey: e.target.value }
                    }))}
                    placeholder="pk_..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chave Secreta
                  </label>
                  <Input
                    type="password"
                    value={settings.payments.stripeSecretKey}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      payments: { ...prev.payments, stripeSecretKey: e.target.value }
                    }))}
                    placeholder="sk_..."
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Mercado Pago</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token
                </label>
                <Input
                  type="password"
                  value={settings.payments.mercadoPagoAccessToken}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    payments: { ...prev.payments, mercadoPagoAccessToken: e.target.value }
                  }))}
                  placeholder="APP_USR-..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taxa de Comissão (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={settings.payments.commissionRate}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    payments: { ...prev.payments, commissionRate: Number(e.target.value) }
                  }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saque Mínimo (R$)
                </label>
                <Input
                  type="number"
                  value={settings.payments.minimumPayout}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    payments: { ...prev.payments, minimumPayout: Number(e.target.value) }
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Segurança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout de Sessão (horas)
                </label>
                <Input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, sessionTimeout: Number(e.target.value) }
                  }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo de Tentativas de Login
                </label>
                <Input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, maxLoginAttempts: Number(e.target.value) }
                  }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comprimento Mínimo da Senha
              </label>
              <Input
                type="number"
                value={settings.security.passwordMinLength}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  security: { ...prev.security, passwordMinLength: Number(e.target.value) }
                }))}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.security.requireStrongPassword}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, requireStrongPassword: e.target.checked }
                  }))}
                />
                <span className="text-sm font-medium text-gray-700">
                  Exigir Senha Forte
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorEnabled}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    security: { ...prev.security, twoFactorEnabled: e.target.checked }
                  }))}
                />
                <span className="text-sm font-medium text-gray-700">
                  Autenticação de Dois Fatores
                </span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, emailNotifications: e.target.checked }
                  }))}
                />
                <span className="text-sm font-medium text-gray-700">
                  Notificações por Email
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.notifications.pushNotifications}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, pushNotifications: e.target.checked }
                  }))}
                />
                <span className="text-sm font-medium text-gray-700">
                  Notificações Push
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.notifications.smsNotifications}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, smsNotifications: e.target.checked }
                  }))}
                />
                <span className="text-sm font-medium text-gray-700">
                  Notificações por SMS
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <Input
                value={settings.notifications.webhookUrl}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, webhookUrl: e.target.value }
                }))}
                placeholder="https://api.exemplo.com/webhook"
              />
            </div>
          </CardContent>
        </Card>
      )}

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