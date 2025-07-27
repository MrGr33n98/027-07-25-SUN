import { CompanyCard } from './company-card'
import { Company } from '@/types'

interface CompanyGridProps {
  companies: Company[]
  isLoading: boolean
}

export function CompanyGrid({ companies, isLoading }: CompanyGridProps) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded mt-3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma empresa encontrada
        </h3>
        <p className="text-gray-600">
          Tente ajustar os filtros ou buscar por outros termos.
        </p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  )
}