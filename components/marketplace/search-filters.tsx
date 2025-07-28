'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, MapPin, Star, Shield, SlidersHorizontal } from 'lucide-react'
import { SearchFiltersInput } from '@/lib/validations'

interface SearchFiltersProps {
  filters: SearchFiltersInput
  onFiltersChange: (filters: Partial<SearchFiltersInput>) => void
}

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleQueryChange = (query: string) => {
    onFiltersChange({ query })
  }

  const handleLocationChange = (location: string) => {
    onFiltersChange({ location })
  }

  const handleRatingChange = (minRating: number | undefined) => {
    onFiltersChange({ minRating })
  }

  const handleVerifiedChange = (verified: boolean | undefined) => {
    onFiltersChange({ verified })
  }

  const handleSortChange = (sortBy: string) => {
    onFiltersChange({ sortBy: sortBy as any })
  }

  const clearFilters = () => {
    onFiltersChange({
      query: '',
      location: '',
      minRating: undefined,
      verified: undefined,
      categoria: undefined,
      especialidade: undefined,
      sortBy: 'relevance',
    })
  }

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center">
            <SlidersHorizontal className="w-5 h-5 mr-2" />
            Filtros
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden"
          >
            {isExpanded ? 'Ocultar' : 'Mostrar'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className={`space-y-6 ${!isExpanded ? 'hidden md:block' : ''}`}>
        {/* Search */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            <Search className="w-4 h-4 inline mr-1" />
            Buscar
          </label>
          <Input
            type="text"
            placeholder="Nome da empresa, produto..."
            value={filters.query || ''}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            <MapPin className="w-4 h-4 inline mr-1" />
            Localização
          </label>
          <Input
            type="text"
            placeholder="Cidade, estado..."
            value={filters.location || ''}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Rating */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            <Star className="w-4 h-4 inline mr-1" />
            Avaliação Mínima
          </label>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={filters.minRating === rating}
                  onChange={() => handleRatingChange(rating)}
                  className="mr-2"
                />
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {rating}+ estrelas
                  </span>
                </div>
              </label>
            ))}
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === undefined}
                onChange={() => handleRatingChange(undefined)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Todas</span>
            </label>
          </div>
        </div>

        {/* Verified */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">
            <Shield className="w-4 h-4 inline mr-1" />
            Verificação
          </label>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="verified"
                checked={filters.verified === true}
                onChange={() => handleVerifiedChange(true)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Apenas verificadas</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="verified"
                checked={filters.verified === undefined}
                onChange={() => handleVerifiedChange(undefined)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Todas</span>
            </label>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Categoria
          </label>
          <select
            value={filters.categoria || ''}
            onChange={(e) => onFiltersChange({ categoria: e.target.value || undefined })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todas as categorias</option>
            <option value="residencial">Residencial</option>
            <option value="comercial">Comercial</option>
            <option value="industrial">Industrial</option>
            <option value="rural">Rural</option>
            <option value="eletroposto">Eletroposto</option>
          </select>
        </div>

        {/* Specialty */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Especialidade
          </label>
          <select
            value={filters.especialidade || ''}
            onChange={(e) => onFiltersChange({ especialidade: e.target.value || undefined })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todas as especialidades</option>
            <option value="instalacao">Instalação</option>
            <option value="manutencao">Manutenção</option>
            <option value="projeto">Projeto</option>
            <option value="consultoria">Consultoria</option>
            <option value="financiamento">Financiamento</option>
            <option value="monitoramento">Monitoramento</option>
            <option value="homologacao">Homologação</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Ordenar por
          </label>
          <select
            value={filters.sortBy || 'relevance'}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="relevance">Relevância</option>
            <option value="rating">Melhor avaliação</option>
            <option value="newest">Mais recentes</option>
          </select>
        </div>

        {/* Clear Filters */}
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full"
        >
          Limpar Filtros
        </Button>
      </CardContent>
    </Card>
  )
}