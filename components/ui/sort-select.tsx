'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUpDown } from 'lucide-react'

interface SortOption {
  value: string
  label: string
  description?: string
}

interface SortSelectProps {
  options: SortOption[]
  defaultValue?: string
  onSortChange?: (value: string) => void
  className?: string
  placeholder?: string
}

export function SortSelect({
  options,
  defaultValue = 'relevancia',
  onSortChange,
  className,
  placeholder = 'Ordenar por'
}: SortSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('ordenar') || defaultValue

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value !== defaultValue) {
      params.set('ordenar', value)
    } else {
      params.delete('ordenar')
    }
    
    // Reset to first page when sorting changes
    params.delete('pagina')
    
    const newUrl = `${window.location.pathname}?${params.toString()}`
    router.push(newUrl)
    
    onSortChange?.(value)
  }

  return (
    <div className={className}>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-48">
          <ArrowUpDown className="w-4 h-4 mr-2" />
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div>
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-gray-500">{option.description}</div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Predefined sort options for different contexts
export const COMPANY_SORT_OPTIONS: SortOption[] = [
  {
    value: 'relevancia',
    label: 'Relevância',
    description: 'Mais relevantes primeiro'
  },
  {
    value: 'avaliacao',
    label: 'Melhor Avaliação',
    description: 'Maior nota primeiro'
  },
  {
    value: 'mais_avaliacoes',
    label: 'Mais Avaliações',
    description: 'Mais avaliadas primeiro'
  },
  {
    value: 'verificadas',
    label: 'Verificadas',
    description: 'Empresas verificadas primeiro'
  },
  {
    value: 'nome_az',
    label: 'Nome A-Z',
    description: 'Ordem alfabética'
  },
  {
    value: 'nome_za',
    label: 'Nome Z-A',
    description: 'Ordem alfabética reversa'
  },
  {
    value: 'mais_recentes',
    label: 'Mais Recentes',
    description: 'Cadastradas recentemente'
  }
]

export const PRODUCT_SORT_OPTIONS: SortOption[] = [
  {
    value: 'relevancia',
    label: 'Relevância',
    description: 'Mais relevantes primeiro'
  },
  {
    value: 'menor_preco',
    label: 'Menor Preço',
    description: 'Preço crescente'
  },
  {
    value: 'maior_preco',
    label: 'Maior Preço',
    description: 'Preço decrescente'
  },
  {
    value: 'maior_potencia',
    label: 'Maior Potência',
    description: 'Potência decrescente'
  },
  {
    value: 'maior_eficiencia',
    label: 'Maior Eficiência',
    description: 'Eficiência decrescente'
  },
  {
    value: 'nome_az',
    label: 'Nome A-Z',
    description: 'Ordem alfabética'
  },
  {
    value: 'nome_za',
    label: 'Nome Z-A',
    description: 'Ordem alfabética reversa'
  },
  {
    value: 'mais_recentes',
    label: 'Mais Recentes',
    description: 'Adicionados recentemente'
  },
  {
    value: 'em_estoque',
    label: 'Em Estoque',
    description: 'Disponíveis primeiro'
  }
]

export const MARKETPLACE_SORT_OPTIONS: SortOption[] = [
  {
    value: 'relevancia',
    label: 'Relevância',
    description: 'Mais relevantes primeiro'
  },
  {
    value: 'avaliacao',
    label: 'Melhor Avaliação',
    description: 'Maior nota primeiro'
  },
  {
    value: 'menor_preco',
    label: 'Menor Preço',
    description: 'Preço crescente'
  },
  {
    value: 'maior_preco',
    label: 'Maior Preço',
    description: 'Preço decrescente'
  },
  {
    value: 'verificadas',
    label: 'Verificadas',
    description: 'Empresas verificadas primeiro'
  },
  {
    value: 'mais_recentes',
    label: 'Mais Recentes',
    description: 'Adicionados recentemente'
  }
]

// Specialized sort components
export function CompanySort(props: Omit<SortSelectProps, 'options'>) {
  return <SortSelect {...props} options={COMPANY_SORT_OPTIONS} />
}

export function ProductSort(props: Omit<SortSelectProps, 'options'>) {
  return <SortSelect {...props} options={PRODUCT_SORT_OPTIONS} />
}

export function MarketplaceSort(props: Omit<SortSelectProps, 'options'>) {
  return <SortSelect {...props} options={MARKETPLACE_SORT_OPTIONS} />
}