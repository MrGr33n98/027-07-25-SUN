'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { SearchFilters } from './search-filters'
import { CompanyGrid } from './company-grid'
import { Pagination } from './pagination'
import { SearchFiltersInput } from '@/lib/validations'

interface MarketplaceContentProps {
  searchParams: {
    q?: string
    location?: string
    minRating?: string
    verified?: string
    sortBy?: string
    page?: string
  }
}

async function fetchCompanies(filters: SearchFiltersInput) {
  const params = new URLSearchParams()
  
  if (filters.query) params.set('q', filters.query)
  if (filters.location) params.set('location', filters.location)
  if (filters.minRating) params.set('minRating', filters.minRating.toString())
  if (filters.verified !== undefined) params.set('verified', filters.verified.toString())
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  params.set('page', filters.page.toString())
  params.set('limit', filters.limit.toString())

  const response = await fetch(`/api/companies?${params.toString()}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch companies')
  }
  
  return response.json()
}

export function MarketplaceContent({ searchParams }: MarketplaceContentProps) {
  const [filters, setFilters] = useState<SearchFiltersInput>({
    query: searchParams.q || '',
    location: searchParams.location || '',
    minRating: searchParams.minRating ? Number(searchParams.minRating) : undefined,
    verified: searchParams.verified === 'true' ? true : undefined,
    sortBy: (searchParams.sortBy as any) || 'relevance',
    page: searchParams.page ? Number(searchParams.page) : 1,
    limit: 12,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['companies', filters],
    queryFn: () => fetchCompanies(filters),
  })

  const handleFiltersChange = (newFilters: Partial<SearchFiltersInput>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erro ao carregar empresas. Tente novamente.</p>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1">
        <SearchFilters 
          filters={filters} 
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            {data && (
              <p className="text-gray-600">
                {data.total} empresas encontradas
                {filters.query && ` para "${filters.query}"`}
              </p>
            )}
          </div>
        </div>

        {/* Companies Grid */}
        <CompanyGrid companies={data?.data || []} isLoading={isLoading} />

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={data.page}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}