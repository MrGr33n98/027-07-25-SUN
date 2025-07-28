import { Metadata } from 'next'
import { SignupForm } from '@/components/auth/signup-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Cadastro - Solar Connect',
  description: 'Crie sua conta na Solar Connect e conecte-se com as melhores empresas de energia solar do Brasil.',
  openGraph: {
    title: 'Cadastro - Solar Connect',
    description: 'Crie sua conta na Solar Connect e conecte-se com as melhores empresas de energia solar do Brasil.',
    type: 'website',
  }
}

export default function CadastroPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-green-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">SC</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">Solar Connect</span>
              </div>
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Crie sua conta
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Junte-se à maior plataforma de energia solar do Brasil. 
              Conecte-se com empresas especializadas e encontre as melhores soluções para seu projeto.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Benefits Section */}
            <div className="space-y-6">
              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                <CardHeader>
                  <CardTitle className="text-orange-800 flex items-center">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-sm">👤</span>
                    </div>
                    Para Consumidores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Orçamentos Gratuitos</h4>
                      <p className="text-sm text-gray-600">Receba múltiplas propostas de empresas qualificadas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Empresas Verificadas</h4>
                      <p className="text-sm text-gray-600">Todas as empresas são certificadas e avaliadas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Suporte Especializado</h4>
                      <p className="text-sm text-gray-600">Acompanhamento durante todo o processo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-sm">🏢</span>
                    </div>
                    Para Empresas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Leads Qualificados</h4>
                      <p className="text-sm text-gray-600">Receba clientes interessados em energia solar</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Vitrine Digital</h4>
                      <p className="text-sm text-gray-600">Showcase seus produtos e projetos</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Ferramentas de Gestão</h4>
                      <p className="text-sm text-gray-600">Dashboard completo para gerenciar negócios</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Indicators */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">
                  Empresas que confiam na Solar Connect
                </h3>
                <div className="grid grid-cols-3 gap-4 items-center opacity-60">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-500">LOGO</span>
                    </div>
                    <p className="text-xs text-gray-500">Canadian Solar</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-500">LOGO</span>
                    </div>
                    <p className="text-xs text-gray-500">Growatt</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-500">LOGO</span>
                    </div>
                    <p className="text-xs text-gray-500">WEG</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Signup Form */}
            <div>
              <Card className="shadow-xl border-0">
                <CardContent className="p-8">
                  <SignupForm />
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Já tem uma conta?{' '}
                      <Link 
                        href="/login" 
                        className="text-orange-600 hover:text-orange-700 font-semibold"
                      >
                        Faça login
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white text-xs">🔒</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Seus dados estão seguros</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Utilizamos criptografia de ponta e seguimos as melhores práticas de segurança. 
                      Seus dados pessoais são protegidos conforme a LGPD.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}