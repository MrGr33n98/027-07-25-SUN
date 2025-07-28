'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Star,
  Zap,
  Package
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import Link from 'next/link'
import Image from 'next/image'

interface SearchResult {
  id: string
  type: 'company' | 'product'
  title: string
  subtitle?: string
  description: string
  image?: string
  rating?: number
  location?: string
  price?: number
  category?: string
  url: string
}

interface SearchSuggestion {
  id: string
  text: string
  type: 'recent' | 'trending' | 'category'
  count?: number
}

interface RealTimeSearchProps {
  placeholder?: string
  className?: string
  showSuggestions?: boolean
  showResults?: boolean
  maxResults?: number
  onSearch?: (query: string) => void
  onSelect?: (result: SearchResult) => void
}

export function RealTimeSearch({
  placeholder = 'Buscar empresas, produtos...',
  className,
  showSuggestions = true,
  showResults = true,
  maxResults = 8,
  onSearch,
  onSelect
}: RealTimeSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const debouncedQuery = useDebounce(query, 300)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('solarconnect_recent_searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading recent searches:', error)
      }
    }
  }, [])

  // Save recent search
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    const updated = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 10) // Keep only last 10 searches
    
    setRecentSearches(updated)
    localStorage.setItem('solarconnect_recent_searches', JSON.stringify(updated))
  }, [recentSearches])

  // Fetch search results
  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=${maxResults}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [maxResults])

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    try {
      const response = await fetch('/api/search/suggestions')
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Suggestions error:', error)
    }
  }, [])

  // Effect for debounced search
  useEffect(() => {
    if (debouncedQuery) {
      fetchResults(debouncedQuery)
      onSearch?.(debouncedQuery)
    } else {
      setResults([])
    }
  }, [debouncedQuery, fetchResults, onSearch])

  // Load suggestions when opening search
  useEffect(() => {
    if (isOpen && !query && showSuggestions) {
      fetchSuggestions()
    }
  }, [isOpen, query, showSuggestions, fetchSuggestions])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      saveRecentSearch(query.trim())
      setIsOpen(false)
      router.push(`/marketplace?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    saveRecentSearch(suggestion.text)
    setIsOpen(false)
    router.push(`/marketplace?q=${encodeURIComponent(suggestion.text)}`)
  }

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query)
    setIsOpen(false)
    onSelect?.(result)
    router.push(result.url)
  }

  const clearQuery = () => {
    setQuery('')
    setResults([])
    inputRef.current?.focus()
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('solarconnect_recent_searches')
  }

  // Combine suggestions with recent searches
  const combinedSuggestions = [
    ...recentSearches.slice(0, 5).map(search => ({
      id: `recent_${search}`,
      text: search,
      type: 'recent' as const
    })),
    ...suggestions
  ]

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-10 h-12 text-base"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Search Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-xl border-0 max-h-96 overflow-hidden">
          <CardContent className="p-0">
            {/* Loading State */}
            {loading && (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Buscando...
              </div>
            )}

            {/* Search Results */}
            {!loading && query && results.length > 0 && showResults && (
              <div className="max-h-80 overflow-y-auto">
                <div className="p-3 border-b bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Resultados para "{query}"
                  </h4>
                </div>
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-left transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      {result.image ? (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={result.image}
                            alt={result.title}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          {result.type === 'company' ? (
                            <MapPin className="w-5 h-5 text-gray-400" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="font-semibold text-gray-900 truncate">
                            {result.title}
                          </h5>
                          {result.type === 'company' && result.rating && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-xs text-gray-600">
                                {result.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {result.subtitle && (
                          <p className="text-sm text-gray-600 mb-1">{result.subtitle}</p>
                        )}
                        
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {result.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            {result.location && (
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {result.location}
                              </span>
                            )}
                            {result.category && (
                              <span className="bg-gray-100 px-2 py-1 rounded">
                                {result.category}
                              </span>
                            )}
                          </div>
                          
                          {result.price && (
                            <span className="text-sm font-semibold text-green-600">
                              R$ {result.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && query && results.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhum resultado encontrado para "{query}"</p>
                <p className="text-xs mt-1">Tente usar termos diferentes</p>
              </div>
            )}

            {/* Suggestions */}
            {!loading && !query && showSuggestions && combinedSuggestions.length > 0 && (
              <div className="max-h-80 overflow-y-auto">
                {recentSearches.length > 0 && (
                  <>
                    <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Buscas recentes
                      </h4>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Limpar
                      </button>
                    </div>
                    {recentSearches.slice(0, 5).map((search) => (
                      <button
                        key={`recent_${search}`}
                        onClick={() => handleSuggestionClick({
                          id: `recent_${search}`,
                          text: search,
                          type: 'recent'
                        })}
                        className="w-full p-3 hover:bg-gray-50 border-b border-gray-100 text-left transition-colors flex items-center space-x-3"
                      >
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{search}</span>
                      </button>
                    ))}
                  </>
                )}

                {suggestions.length > 0 && (
                  <>
                    <div className="p-3 border-b bg-gray-50">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Sugestões populares
                      </h4>
                    </div>
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-left transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          {suggestion.type === 'trending' ? (
                            <TrendingUp className="w-4 h-4 text-orange-500" />
                          ) : (
                            <Search className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm text-gray-700">{suggestion.text}</span>
                        </div>
                        {suggestion.count && (
                          <span className="text-xs text-gray-500">
                            {suggestion.count} resultados
                          </span>
                        )}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-3 border-t bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Pressione Enter para buscar</span>
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/marketplace" 
                    className="hover:text-gray-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Ver tudo
                  </Link>
                  <Link 
                    href="/produtos" 
                    className="hover:text-gray-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Produtos
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Specialized search components
export function CompanySearch(props: Omit<RealTimeSearchProps, 'placeholder'>) {
  return (
    <RealTimeSearch
      {...props}
      placeholder="Buscar empresas de energia solar..."
    />
  )
}

export function ProductSearch(props: Omit<RealTimeSearchProps, 'placeholder'>) {
  return (
    <RealTimeSearch
      {...props}
      placeholder="Buscar produtos solares..."
    />
  )
}