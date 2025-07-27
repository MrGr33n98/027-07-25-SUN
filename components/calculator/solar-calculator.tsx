'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, 
  Zap, 
  DollarSign, 
  Calendar, 
  Leaf,
  Sun,
  Home,
  TrendingUp,
  Info
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface CalculationResult {
  systemSize: number // kWp
  panelCount: number
  monthlyGeneration: number // kWh
  yearlyGeneration: number // kWh
  systemCost: number
  monthlySavings: number
  yearlySavings: number
  paybackPeriod: number // years
  co2Reduction: number // kg/year
  roofArea: number // m²
}

export function SolarCalculator() {
  const [formData, setFormData] = useState({
    monthlyBill: '',
    energyRate: '0.75', // R$/kWh
    location: '',
    roofType: 'ceramic', // ceramic, metal, concrete
    roofOrientation: 'south', // north, south, east, west
    shading: 'none', // none, partial, heavy
    panelType: 'monocrystalline', // monocrystalline, polycrystalline
    panelPower: '550', // Watts
    systemEfficiency: '85' // %
  })
  
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [calculating, setCalculating] = useState(false)
  const { addToast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const calculateSystem = async () => {
    if (!formData.monthlyBill || !formData.location) {
      addToast({
        type: 'error',
        title: 'Campos obrigatórios',
        message: 'Preencha a conta mensal e a localização'
      })
      return
    }

    setCalculating(true)

    try {
      // Simulate calculation delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      const monthlyBill = parseFloat(formData.monthlyBill)
      const energyRate = parseFloat(formData.energyRate)
      const panelPower = parseFloat(formData.panelPower)
      const systemEfficiency = parseFloat(formData.systemEfficiency) / 100

      // Calculate monthly consumption
      const monthlyConsumption = monthlyBill / energyRate // kWh

      // Solar irradiation by location (simplified)
      const solarIrradiation = getSolarIrradiation(formData.location)
      
      // Orientation factor
      const orientationFactor = getOrientationFactor(formData.roofOrientation)
      
      // Shading factor
      const shadingFactor = getShadingFactor(formData.shading)
      
      // Calculate system size needed
      const dailyGeneration = monthlyConsumption / 30 // kWh/day
      const peakSunHours = solarIrradiation * orientationFactor * shadingFactor
      const systemSize = dailyGeneration / peakSunHours // kWp
      
      // Calculate panel count
      const panelCount = Math.ceil((systemSize * 1000) / panelPower)
      
      // Recalculate actual system size based on panel count
      const actualSystemSize = (panelCount * panelPower) / 1000 // kWp
      
      // Calculate generation
      const monthlyGeneration = actualSystemSize * peakSunHours * 30 * systemEfficiency
      const yearlyGeneration = monthlyGeneration * 12
      
      // Calculate costs and savings
      const systemCostPerKw = 4500 // R$/kWp (average)
      const systemCost = actualSystemSize * systemCostPerKw
      
      const monthlySavings = Math.min(monthlyGeneration * energyRate, monthlyBill * 0.9) // Max 90% savings
      const yearlySavings = monthlySavings * 12
      
      const paybackPeriod = systemCost / yearlySavings
      
      // Environmental impact
      const co2Reduction = yearlyGeneration * 0.0817 // kg CO2/kWh (Brazil grid factor)
      
      // Roof area needed (approximately 6m² per kWp)
      const roofArea = actualSystemSize * 6

      const calculationResult: CalculationResult = {
        systemSize: actualSystemSize,
        panelCount,
        monthlyGeneration,
        yearlyGeneration,
        systemCost,
        monthlySavings,
        yearlySavings,
        paybackPeriod,
        co2Reduction,
        roofArea
      }

      setResult(calculationResult)
      
      addToast({
        type: 'success',
        title: 'Cálculo concluído!',
        message: 'Sua simulação foi calculada com sucesso'
      })

    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro no cálculo',
        message: 'Não foi possível calcular o sistema. Tente novamente.'
      })
    } finally {
      setCalculating(false)
    }
  }

  const getSolarIrradiation = (location: string): number => {
    // Simplified solar irradiation by region (kWh/m²/day)
    const irradiationMap: Record<string, number> = {
      'nordeste': 5.5,
      'sudeste': 4.8,
      'centro-oeste': 5.2,
      'sul': 4.2,
      'norte': 4.9
    }
    
    const region = location.toLowerCase()
    for (const [key, value] of Object.entries(irradiationMap)) {
      if (region.includes(key)) return value
    }
    
    return 4.8 // Default
  }

  const getOrientationFactor = (orientation: string): number => {
    const factors: Record<string, number> = {
      'north': 1.0,
      'south': 0.85,
      'east': 0.9,
      'west': 0.9
    }
    return factors[orientation] || 1.0
  }

  const getShadingFactor = (shading: string): number => {
    const factors: Record<string, number> = {
      'none': 1.0,
      'partial': 0.85,
      'heavy': 0.7
    }
    return factors[shading] || 1.0
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number, decimals: number = 0) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-6 h-6 mr-2" />
            Calculadora Solar
          </CardTitle>
          <p className="text-gray-600">
            Descubra o tamanho ideal do sistema solar para sua casa ou empresa
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthlyBill">Conta de luz mensal (R$) *</Label>
              <Input
                id="monthlyBill"
                type="number"
                placeholder="Ex: 350"
                value={formData.monthlyBill}
                onChange={(e) => handleInputChange('monthlyBill', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="energyRate">Tarifa de energia (R$/kWh)</Label>
              <Input
                id="energyRate"
                type="number"
                step="0.01"
                value={formData.energyRate}
                onChange={(e) => handleInputChange('energyRate', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Localização *</Label>
            <Input
              id="location"
              placeholder="Ex: São Paulo, SP"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Advanced Options */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Configurações Avançadas</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roofType">Tipo de telhado</Label>
                <select
                  id="roofType"
                  value={formData.roofType}
                  onChange={(e) => handleInputChange('roofType', e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="ceramic">Cerâmico</option>
                  <option value="metal">Metálico</option>
                  <option value="concrete">Laje</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="roofOrientation">Orientação do telhado</Label>
                <select
                  id="roofOrientation"
                  value={formData.roofOrientation}
                  onChange={(e) => handleInputChange('roofOrientation', e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="north">Norte (ideal)</option>
                  <option value="south">Sul</option>
                  <option value="east">Leste</option>
                  <option value="west">Oeste</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="shading">Sombreamento</Label>
                <select
                  id="shading"
                  value={formData.shading}
                  onChange={(e) => handleInputChange('shading', e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="none">Sem sombra</option>
                  <option value="partial">Sombra parcial</option>
                  <option value="heavy">Muita sombra</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="panelPower">Potência do painel (W)</Label>
                <Input
                  id="panelPower"
                  type="number"
                  value={formData.panelPower}
                  onChange={(e) => handleInputChange('panelPower', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={calculateSystem}
            disabled={calculating}
            className="w-full"
            size="lg"
          >
            {calculating ? (
              'Calculando...'
            ) : (
              <>
                <Calculator className="w-5 h-5 mr-2" />
                Calcular Sistema Solar
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* System Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Sun className="w-5 h-5 mr-2" />
                Sistema Recomendado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(result.systemSize, 2)} kWp
                </div>
                <div className="text-sm text-gray-600">Potência do sistema</div>
              </div>
              
              <div>
                <div className="text-xl font-semibold">
                  {result.panelCount} painéis
                </div>
                <div className="text-sm text-gray-600">
                  {formData.panelPower}W cada
                </div>
              </div>
              
              <div>
                <div className="text-lg font-medium">
                  {formatNumber(result.roofArea)} m²
                </div>
                <div className="text-sm text-gray-600">Área necessária</div>
              </div>
            </CardContent>
          </Card>

          {/* Energy Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Zap className="w-5 h-5 mr-2" />
                Geração de Energia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(result.monthlyGeneration)} kWh
                </div>
                <div className="text-sm text-gray-600">Por mês</div>
              </div>
              
              <div>
                <div className="text-xl font-semibold">
                  {formatNumber(result.yearlyGeneration)} kWh
                </div>
                <div className="text-sm text-gray-600">Por ano</div>
              </div>
              
              <Badge variant="outline" className="w-full justify-center">
                <Leaf className="w-4 h-4 mr-1" />
                {formatNumber(result.co2Reduction)} kg CO₂ evitados/ano
              </Badge>
            </CardContent>
          </Card>

          {/* Financial Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <DollarSign className="w-5 h-5 mr-2" />
                Análise Financeira
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(result.systemCost)}
                </div>
                <div className="text-sm text-gray-600">Investimento inicial</div>
              </div>
              
              <div>
                <div className="text-xl font-semibold text-green-600">
                  {formatCurrency(result.monthlySavings)}
                </div>
                <div className="text-sm text-gray-600">Economia mensal</div>
              </div>
              
              <div>
                <div className="text-lg font-medium">
                  {formatNumber(result.paybackPeriod, 1)} anos
                </div>
                <div className="text-sm text-gray-600">Retorno do investimento</div>
              </div>
            </CardContent>
          </Card>

          {/* 25-Year Projection */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Projeção de 25 Anos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(result.yearlySavings * 25)}
                  </div>
                  <div className="text-sm text-gray-600">Economia total</div>
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatNumber(result.yearlyGeneration * 25 / 1000)} MWh
                  </div>
                  <div className="text-sm text-gray-600">Energia gerada</div>
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-purple-600">
                    {formatNumber((result.yearlySavings * 25 - result.systemCost) / result.systemCost * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">ROI total</div>
                </div>
                
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatNumber(result.co2Reduction * 25 / 1000, 1)}t
                  </div>
                  <div className="text-sm text-gray-600">CO₂ evitado</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Disclaimer */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>Importante:</strong> Esta é uma simulação aproximada. Os valores reais podem variar 
              conforme condições específicas do local, equipamentos escolhidos e instalação. 
              Recomendamos uma avaliação técnica detalhada com uma empresa especializada.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}