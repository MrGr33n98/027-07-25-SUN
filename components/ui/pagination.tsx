'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange?: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  showItemsPerPage?: boolean
  showInfo?: boolean
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  showInfo = true,
  className
}: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateURL = (page: number, perPage?: number) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (page > 1) {
      params.set('pagina', page.toString())
    } else {
      params.delete('pagina')
    }
    
    if (perPage && perPage !== 20) {
      params.set('por_pagina', perPage.toString())
    } else if (perPage) {
      params.delete('por_pagina')
    }
    
    const newUrl = `${window.location.pathname}?${params.toString()}`
    router.push(newUrl)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange?.(page)
      updateURL(page)
    }
  }

  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value)
    onItemsPerPageChange?.(newItemsPerPage)
    updateURL(1, newItemsPerPage) // Reset to first page
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2 // Number of pages to show on each side of current page
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', className)}>
      {/* Items per page selector */}
      {showItemsPerPage && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Mostrar:</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-700">por página</span>
        </div>
      )}

      {/* Page info */}
      {showInfo && (
        <div className="text-sm text-gray-700">
          Mostrando {startItem} a {endItem} de {totalItems} resultados
        </div>
      )}

      {/* Pagination controls */}
      <div className="flex items-center space-x-1">
        {/* First page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="hidden sm:flex"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Anterior</span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page as number)}
                  className={cn(
                    'min-w-[40px]',
                    currentPage === page && 'bg-orange-500 hover:bg-orange-600'
                  )}
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Next page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <span className="hidden sm:inline mr-1">Próximo</span>
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="hidden sm:flex"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// Simplified pagination for mobile
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className
}: Pick<PaginationProps, 'currentPage' | 'totalPages' | 'onPageChange' | 'className'>) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateURL = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (page > 1) {
      params.set('pagina', page.toString())
    } else {
      params.delete('pagina')
    }
    
    const newUrl = `${window.location.pathname}?${params.toString()}`
    router.push(newUrl)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange?.(page)
      updateURL(page)
    }
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <Button
        variant="outline"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Anterior
      </Button>

      <span className="text-sm text-gray-700">
        Página {currentPage} de {totalPages}
      </span>

      <Button
        variant="outline"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Próximo
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  )
}