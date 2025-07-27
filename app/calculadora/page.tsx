import { Metadata } from 'next'
import { SolarCalculator } from '@/components/calculator/solar-calculator'

export const metadata: Metadata = {
  title: 'Calculadora Solar | SolarConnect',
  description: 'Calcule o tamanho ideal do sistema solar para sua casa ou empresa. Descubra economia, retorno do investimento e impacto ambiental.',
  keywords: ['calculadora solar', 'dimensionamento solar', 'economia energia solar', 'retorno investimento solar'],
}

export default function CalculatorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SolarCalculator />
    </div>
  )
}