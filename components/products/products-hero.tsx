'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search,
  Zap,
  Shield,
  Award,
  TrendingUp,
  Battery,
  Sun,
  Settings
} from 'lucide-react'

export function ProductsHero() {
  const [searchTerm, setSearchTerm] = useState('')

  const categories = [
    {
      name: 'Painéis Solares',
      icon: Sun,
      count: '150+ produtos',
      color: 'from-orange-500 to-yellow-500'
    },
    {
      name: 'Inversores',
      icon: Zap,
      count: '80+ produtos',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Baterias',
      icon: Battery,
      count: '45+ produtos',
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Acessórios',
      icon: Settings,
      count: '200+ produtos',
      color: 'from-purple-500 to-pink-500'
    }
  ]

  const features = [
    {
      icon: Shield,
      title: 'Produtos Certificados',
      description: 'Todos os produtos possuem certificação INMETRO'
    },
    {
      icon: Award,
      title: 'Melhores Marcas',
      description: 'Trabalhamos apenas com marcas reconhecidas'
    },
    {
      icon: TrendingUp,
      title: 'Melhor Custo-Benefício',
      description: 'Compare preços e encontre as melhores ofertas'
    }
  ]

  return (
    <>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-orange-600 via-orange-500 to-green-500 py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
        
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Produtos de
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Energia Solar
            </span>
          </h1>
          
          <p className="text-xl text-white text-opacity-90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Encontre os melhores equipamentos fotovoltaicos do mercado. 
            Painéis solares, inversores, baterias e kits completos das principais marcas.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar produtos... (ex: painel 450W, inversor 5kW)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg bg-white bg-opacity-95 backdrop-blur-sm border-0 rounded-xl shadow-lg focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
              <Button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white px-6"
              >
                Buscar
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-white">
              <div className="text-2xl font-bold mb-1">500+</div>
              <div className="text-sm opacity-90">Produtos</div>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-white">
              <div className="text-2xl font-bold mb-1">50+</div>
              <div className="text-sm opacity-90">Marcas</div>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-white">
              <div className="text-2xl font-bold mb-1">100%</div>
              <div className="text-sm opacity-90">Certificados</div>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-white">
              <div className="text-2xl font-bold mb-1">24h</div>
              <div className="text-sm opacity-90">Entrega</div>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white bg-opacity-10 rounded-full blur-lg"></div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Categorias de Produtos</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore nossa ampla gama de produtos organizados por categoria para encontrar 
              exatamente o que você precisa para seu projeto de energia solar.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {categories.map((category, index) => {
              const Icon = category.icon
              return (
                <div key={index} className="group cursor-pointer">
                  <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-orange-200">
                    <div className={`w-16 h-16 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-gray-600 text-sm">{category.count}</p>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}