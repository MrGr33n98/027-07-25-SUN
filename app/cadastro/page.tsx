import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SignupForm } from '@/components/auth/signup-form'

export const metadata: Metadata = {
  title: 'Cadastro - SolarConnect | Crie sua conta gratuita',
  description: 'Cadastre-se gratuitamente na SolarConnect. Para empresas: aumente suas vendas. Para consumidores: encontre as melhores soluções em energia solar.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Criar Conta
              </h1>
              <p className="text-gray-600">
                Junte-se à maior plataforma de energia solar do Brasil
              </p>
            </div>
            
            <SignupForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}