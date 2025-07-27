import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play, Zap, Users, Award } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-orange-50 to-green-50 py-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-orange-500 rounded-full"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-green-500 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-orange-400 rounded-full"></div>
        <div className="absolute bottom-32 right-1/3 w-14 h-14 bg-green-400 rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              O Maior{' '}
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Marketplace
              </span>
              <br />
              de Energia Solar do Brasil
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Conecte-se com as melhores empresas de energia solar, compare produtos, 
              encontre soluções personalizadas e transforme sua energia em economia sustentável.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                asChild
              >
                <Link href="/marketplace">
                  Explorar Marketplace
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-green-500 text-green-600 hover:bg-green-50 px-8 py-4 text-lg font-semibold"
                asChild
              >
                <Link href="/como-funciona">
                  <Play className="mr-2 w-5 h-5" />
                  Como Funciona
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-500 mb-1">500+</div>
                <div className="text-sm text-gray-600">Empresas Certificadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500 mb-1">10k+</div>
                <div className="text-sm text-gray-600">Projetos Realizados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500 mb-1">98%</div>
                <div className="text-sm text-gray-600">Satisfação</div>
              </div>
            </div>
          </div>

          {/* Right Content - Floating Image with Badge */}
          <div className="relative">
            <div className="relative animate-pulse">
              {/* Main Image Placeholder */}
              <div className="w-full h-96 bg-gradient-to-br from-orange-100 to-green-100 rounded-2xl shadow-2xl flex items-center justify-center">
                <div className="text-center">
                  <Zap className="w-24 h-24 text-orange-500 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Painel Solar Inteligente</p>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-lg">
                <div className="text-center">
                  <Award className="w-8 h-8 text-green-500 mx-auto mb-1" />
                  <div className="text-xs font-semibold text-gray-700">Certificado</div>
                  <div className="text-xs text-gray-500">INMETRO</div>
                </div>
              </div>

              {/* Bottom Badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center space-x-3">
                  <Users className="w-8 h-8 text-orange-500" />
                  <div>
                    <div className="text-sm font-semibold text-gray-700">+1000 Clientes</div>
                    <div className="text-xs text-gray-500">Energia Limpa</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}