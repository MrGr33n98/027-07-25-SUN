'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface ProductsFiltersProps {
  searchParams: {
    categoria?: string
    marca?: string
    preco_min?: string
    preco_max?: string
    potencia_min?: string
    potencia_max?: string
    ordenar?: string
    pagina?: string
    q?: string
  }
}

export function ProductsFilters({ searchParams }: ProductsFiltersProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()
  
  const [expandedSections, setExpandedSections] = useState({
    categoria: true,
    marca: true,
    preco: true,
    potencia: true,
    tensao: false,
    cobertura: false,
    eficiencia: false,
    caracteristicas: false,
    'potencia-carregamento': false
  })

  const [localFilters, setLocalFilters] = useState({
    preco_min: searchParams.preco_min || '',
    preco_max: searchParams.preco_max || '',
    potencia_min: searchParams.potencia_min || '',
    potencia_max: searchParams.potencia_max || ''
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }))
  }

  const updateURL = useCallback((newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(currentSearchParams.toString())
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    
    // Reset to first page when filters change
    params.delete('pagina')
    
    router.push(`/produtos?${params.toString()}`)
  }, [currentSearchParams, router])

  const handleFilterChange = (key: string, value: string | null) => {
    updateURL({ [key]: value })
  }

  const handleMultipleFilters = (filters: Record<string, string | null>) => {
    updateURL(filters)
  }

  const clearAllFilters = () => {
    router.push('/produtos')
  }

  const applyFilters = () => {
    updateURL(localFilters)
  }

  const categories = [
    { id: 'paineis-fotovoltaicos', name: 'Painéis Fotovoltaicos', count: 150 },
    { id: 'inversores-string', name: 'Inversores String', count: 45 },
    { id: 'microinversores', name: 'Microinversores', count: 35 },
    { id: 'inversores-hibridos', name: 'Inversores Híbridos', count: 25 },
    { id: 'baterias-litio', name: 'Baterias de Lítio', count: 30 },
    { id: 'baterias-chumbo', name: 'Baterias Chumbo-Ácido', count: 15 },
    { id: 'estruturas-telhado', name: 'Estruturas para Telhado', count: 40 },
    { id: 'estruturas-solo', name: 'Estruturas para Solo', count: 20 },
    { id: 'cabos-cc', name: 'Cabos CC Fotovoltaicos', count: 50 },
    { id: 'cabos-ca', name: 'Cabos CA', count: 40 },
    { id: 'conectores-mc4', name: 'Conectores MC4', count: 60 },
    { id: 'fusíveis-cc', name: 'Fusíveis CC', count: 35 },
    { id: 'disjuntores-cc', name: 'Disjuntores CC', count: 25 },
    { id: 'string-box', name: 'String Box', count: 30 },
    { id: 'medidores-energia', name: 'Medidores de Energia', count: 20 },
    { id: 'monitoramento', name: 'Sistemas de Monitoramento', count: 40 },
    { id: 'eletropostos', name: 'Eletropostos/Carregadores VE', count: 15 },
    { id: 'kits-residencial', name: 'Kits Residenciais', count: 20 },
    { id: 'kits-comercial', name: 'Kits Comerciais', count: 15 },
    { id: 'kits-industrial', name: 'Kits Industriais', count: 10 }
  ]

  const brands = [
    // Painéis Solares
    { id: 'canadian', name: 'Canadian Solar', count: 45, category: 'paineis' },
    { id: 'jinko', name: 'JinkoSolar', count: 38, category: 'paineis' },
    { id: 'trina', name: 'Trina Solar', count: 42, category: 'paineis' },
    { id: 'ja-solar', name: 'JA Solar', count: 35, category: 'paineis' },
    { id: 'longi', name: 'LONGi Solar', count: 40, category: 'paineis' },
    { id: 'risen', name: 'Risen Energy', count: 30, category: 'paineis' },

    // Inversores
    { id: 'growatt', name: 'Growatt', count: 35, category: 'inversores' },
    { id: 'fronius', name: 'Fronius', count: 28, category: 'inversores' },
    { id: 'sma', name: 'SMA', count: 32, category: 'inversores' },
    { id: 'weg', name: 'WEG', count: 25, category: 'inversores' },
    { id: 'huawei', name: 'Huawei', count: 30, category: 'inversores' },
    { id: 'solis', name: 'Solis', count: 22, category: 'inversores' },
    { id: 'goodwe', name: 'GoodWe', count: 28, category: 'inversores' },
    { id: 'deye', name: 'Deye', count: 25, category: 'inversores' },

    // Baterias
    { id: 'byd', name: 'BYD', count: 20, category: 'baterias' },
    { id: 'pylontech', name: 'Pylontech', count: 18, category: 'baterias' },
    { id: 'freedom', name: 'Freedom', count: 15, category: 'baterias' },
    { id: 'moura', name: 'Moura', count: 12, category: 'baterias' },

    // Eletropostos
    { id: 'weg-ev', name: 'WEG (Carregadores)', count: 8, category: 'eletropostos' },
    { id: 'intelbras', name: 'Intelbras', count: 20, category: 'monitoramento' },
    { id: 'phoenix', name: 'Phoenix Contact', count: 15, category: 'conectores' },
    { id: 'staubli', name: 'Stäubli', count: 12, category: 'conectores' }
  ]

  const characteristics = [
    // Tecnologias de Painéis
    { id: 'monocristalino', name: 'Monocristalino', count: 85, category: 'paineis' },
    { id: 'policristalino', name: 'Policristalino', count: 65, category: 'paineis' },
    { id: 'bifacial', name: 'Bifacial', count: 30, category: 'paineis' },
    { id: 'half-cell', name: 'Half Cell', count: 45, category: 'paineis' },
    { id: 'perc', name: 'PERC', count: 70, category: 'paineis' },
    { id: 'topcon', name: 'TOPCon', count: 25, category: 'paineis' },
    { id: 'hjt', name: 'HJT (Heterojunção)', count: 15, category: 'paineis' },

    // Tipos de Inversores
    { id: 'string', name: 'String', count: 40, category: 'inversores' },
    { id: 'microinversor', name: 'Microinversor', count: 25, category: 'inversores' },
    { id: 'hibrido', name: 'Híbrido', count: 15, category: 'inversores' },
    { id: 'off-grid', name: 'Off-Grid', count: 12, category: 'inversores' },
    { id: 'trifasico', name: 'Trifásico', count: 35, category: 'inversores' },
    { id: 'monofasico', name: 'Monofásico', count: 45, category: 'inversores' },

    // Características de Baterias
    { id: 'litio-ferro', name: 'LiFePO4', count: 25, category: 'baterias' },
    { id: 'litio-ion', name: 'Li-ion', count: 20, category: 'baterias' },
    { id: 'agm', name: 'AGM', count: 15, category: 'baterias' },
    { id: 'gel', name: 'Gel', count: 10, category: 'baterias' },

    // Certificações
    { id: 'inmetro', name: 'INMETRO', count: 200, category: 'certificacao' },
    { id: 'iec', name: 'IEC 61215', count: 180, category: 'certificacao' },
    { id: 'ul', name: 'UL 1703', count: 150, category: 'certificacao' },
    { id: 'ce', name: 'CE', count: 160, category: 'certificacao' },
    { id: 'aneel', name: 'ANEEL', count: 120, category: 'certificacao' },

    // Aplicações
    { id: 'residencial', name: 'Residencial', count: 180, category: 'aplicacao' },
    { id: 'comercial', name: 'Comercial', count: 120, category: 'aplicacao' },
    { id: 'industrial', name: 'Industrial', count: 80, category: 'aplicacao' },
    { id: 'rural', name: 'Rural', count: 60, category: 'aplicacao' },
    { id: 'eletroposto', name: 'Eletroposto', count: 15, category: 'aplicacao' }
  ]

  return (
    <div className="space-y-6">
      {/* Active Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filtros Ativos
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-orange-600 hover:text-orange-700"
              onClick={clearAllFilters}
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {searchParams.categoria && (
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center">
                {categories.find(c => c.id === searchParams.categoria)?.name || searchParams.categoria}
                <X 
                  className="w-3 h-3 ml-2 cursor-pointer" 
                  onClick={() => handleFilterChange('categoria', null)}
                />
              </span>
            )}
            {searchParams.marca && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                {brands.find(b => b.id === searchParams.marca)?.name || searchParams.marca}
                <X 
                  className="w-3 h-3 ml-2 cursor-pointer"
                  onClick={() => handleFilterChange('marca', null)}
                />
              </span>
            )}
            {(searchParams.preco_min || searchParams.preco_max) && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center">
                R$ {searchParams.preco_min || '0'} - {searchParams.preco_max || '∞'}
                <X 
                  className="w-3 h-3 ml-2 cursor-pointer"
                  onClick={() => handleMultipleFilters({ preco_min: null, preco_max: null })}
                />
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <Card>
        <CardContent className="p-4">
          <button
            onClick={() => toggleSection('categoria')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="font-semibold text-gray-900">Categoria</h3>
            {expandedSections.categoria ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.categoria && (
            <div className="space-y-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-3 text-orange-600 focus:ring-orange-500"
                      checked={searchParams.categoria === category.id}
                      onChange={(e) => {
                        handleFilterChange('categoria', e.target.checked ? category.id : null)
                      }}
                    />
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">({category.count})</span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand Filter */}
      <Card>
        <CardContent className="p-4">
          <button
            onClick={() => toggleSection('marca')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="font-semibold text-gray-900">Marca</h3>
            {expandedSections.marca ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.marca && (
            <div className="space-y-2">
              {brands.map((brand) => (
                <label key={brand.id} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-3 text-orange-600 focus:ring-orange-500"
                      checked={searchParams.marca === brand.id}
                      onChange={(e) => {
                        handleFilterChange('marca', e.target.checked ? brand.id : null)
                      }}
                    />
                    <span className="text-sm text-gray-700">{brand.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">({brand.count})</span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Filter */}
      <Card>
        <CardContent className="p-4">
          <button
            onClick={() => toggleSection('preco')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="font-semibold text-gray-900">Preço</h3>
            {expandedSections.preco ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.preco && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Mín (R$)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    className="text-sm"
                    value={localFilters.preco_min}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, preco_min: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Máx (R$)</label>
                  <Input
                    type="number"
                    placeholder="10000"
                    className="text-sm"
                    value={localFilters.preco_max}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, preco_max: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="radio" name="preco" className="mr-3 text-orange-600" />
                  <span className="text-sm text-gray-700">Até R$ 500</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="radio" name="preco" className="mr-3 text-orange-600" />
                  <span className="text-sm text-gray-700">R$ 500 - R$ 1.000</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="radio" name="preco" className="mr-3 text-orange-600" />
                  <span className="text-sm text-gray-700">R$ 1.000 - R$ 3.000</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="radio" name="preco" className="mr-3 text-orange-600" />
                  <span className="text-sm text-gray-700">Acima de R$ 3.000</span>
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Power Filter */}
      <Card>
        <CardContent className="p-4">
          <button
            onClick={() => toggleSection('potencia')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="font-semibold text-gray-900">Potência</h3>
            {expandedSections.potencia ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.potencia && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Mín (W)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    className="text-sm"
                    value={localFilters.potencia_min}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, potencia_min: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Máx (W)</label>
                  <Input
                    type="number"
                    placeholder="1000"
                    className="text-sm"
                    value={localFilters.potencia_max}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, potencia_max: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="radio" name="potencia" className="mr-3 text-orange-600" />
                  <span className="text-sm text-gray-700">Até 300W</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="radio" name="potencia" className="mr-3 text-orange-600" />
                  <span className="text-sm text-gray-700">300W - 450W</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="radio" name="potencia" className="mr-3 text-orange-600" />
                  <span className="text-sm text-gray-700">450W - 600W</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="radio" name="potencia" className="mr-3 text-orange-600" />
                  <span className="text-sm text-gray-700">Acima de 600W</span>
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voltage Filter */}
      <Card>
        <CardContent className="p-4">
          <button
            onClick={() => toggleSection('tensao')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="font-semibold text-gray-900">Tensão (V)</h3>
            {expandedSections.tensao ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.tensao && (
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">12V</span>
                <span className="text-xs text-gray-500 ml-auto">(45)</span>
              </label>
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">24V</span>
                <span className="text-xs text-gray-500 ml-auto">(38)</span>
              </label>
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">48V</span>
                <span className="text-xs text-gray-500 ml-auto">(52)</span>
              </label>
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">220V</span>
                <span className="text-xs text-gray-500 ml-auto">(65)</span>
              </label>
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">380V</span>
                <span className="text-xs text-gray-500 ml-auto">(42)</span>
              </label>
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">1000V CC</span>
                <span className="text-xs text-gray-500 ml-auto">(28)</span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coverage Area Filter */}
      <Card>
        <CardContent className="p-4">
          <button
            onClick={() => toggleSection('cobertura')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="font-semibold text-gray-900">Área de Cobertura</h3>
            {expandedSections.cobertura ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.cobertura && (
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">Região Norte</span>
                <span className="text-xs text-gray-500 ml-auto">(85)</span>
              </label>
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">Região Nordeste</span>
                <span className="text-xs text-gray-500 ml-auto">(120)</span>
              </label>
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">Região Centro-Oeste</span>
                <span className="text-xs text-gray-500 ml-auto">(95)</span>
              </label>
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">Região Sudeste</span>
                <span className="text-xs text-gray-500 ml-auto">(180)</span>
              </label>
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">Região Sul</span>
                <span className="text-xs text-gray-500 ml-auto">(140)</span>
              </label>
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">Nacional</span>
                <span className="text-xs text-gray-500 ml-auto">(65)</span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Efficiency Filter */}
      <Card>
        <CardContent className="p-4">
          <button
            onClick={() => toggleSection('eficiencia')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="font-semibold text-gray-900">Eficiência (%)</h3>
            {expandedSections.eficiencia ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.eficiencia && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Mín (%)</label>
                  <Input
                    type="number"
                    placeholder="15"
                    className="text-sm"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Máx (%)</label>
                  <Input
                    type="number"
                    placeholder="25"
                    className="text-sm"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="radio" name="eficiencia" className="mr-3 text-orange-600" />
                  <span className="text-sm text-gray-700">15% - 18%</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="radio" name="eficiencia" className="mr-3 text-orange-600" />
                  <span className="text-sm text-gray-700">18% - 20%</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="radio" name="eficiencia" className="mr-3 text-orange-600" />
                  <span className="text-sm text-gray-700">20% - 22%</span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input type="radio" name="eficiencia" className="mr-3 text-orange-600" />
                  <span className="text-sm text-gray-700">Acima de 22%</span>
                </label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Characteristics Filter */}
      <Card>
        <CardContent className="p-4">
          <button
            onClick={() => toggleSection('caracteristicas')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="font-semibold text-gray-900">Características Técnicas</h3>
            {expandedSections.caracteristicas ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections.caracteristicas && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {characteristics.map((char) => (
                <label key={char.id} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-3 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">{char.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">({char.count})</span>
                </label>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charging Power Filter (for EV Chargers) */}
      <Card>
        <CardContent className="p-4">
          <button
            onClick={() => toggleSection('potencia-carregamento')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="font-semibold text-gray-900">Potência de Carregamento</h3>
            {expandedSections['potencia-carregamento'] ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {expandedSections['potencia-carregamento'] && (
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">3,7 kW (Nível 1)</span>
                <span className="text-xs text-gray-500 ml-auto">(12)</span>
              </label>
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">7,4 kW (Nível 2)</span>
                <span className="text-xs text-gray-500 ml-auto">(18)</span>
              </label>
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">11 kW (Nível 2)</span>
                <span className="text-xs text-gray-500 ml-auto">(15)</span>
              </label>
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">22 kW (Nível 2)</span>
                <span className="text-xs text-gray-500 ml-auto">(10)</span>
              </label>
              <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input type="checkbox" className="mr-3 text-orange-600" />
                <span className="text-sm text-gray-700">50 kW+ (Nível 3 - DC)</span>
                <span className="text-xs text-gray-500 ml-auto">(8)</span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Apply Filters Button */}
      <Button 
        className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white"
        onClick={applyFilters}
      >
        Aplicar Filtros
      </Button>
    </div>
  )
}