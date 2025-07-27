'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Search,
    Building2,
    Package,
    Star,
    MapPin,
    TrendingUp,
    Clock,
    X
} from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
    companies: Array<{
        id: string
        name: string
        slug: string
        description: string
        logo?: string
        rating: number
        verified: boolean
        location?: string
    }>
    products: Array<{
        id: string
        name: string
        price: number
        images: string[]
        category: string
        company: {
            name: string
            slug: string
        }
    }>
    total: number
}

interface SearchSuggestion {
    text: string
    type: 'company' | 'product' | 'category'
}

export function GlobalSearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult | null>(null)
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const searchRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    useEffect(() => {
        // Load recent searches from localStorage
        const saved = localStorage.getItem('recentSearches')
        if (saved) {
            setRecentSearches(JSON.parse(saved))
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const delayedSearch = setTimeout(() => {
            if (query.length >= 2) {
                searchGlobal()
                getSuggestions()
            } else {
                setResults(null)
                setSuggestions([])
            }
        }, 300)

        return () => clearTimeout(delayedSearch)
    }, [query])

    const searchGlobal = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`)
            if (response.ok) {
                const data = await response.json()
                setResults(data)
            }
        } catch (error) {
            console.error('Error searching:', error)
        } finally {
            setLoading(false)
        }
    }

    const getSuggestions = async () => {
        try {
            const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
            if (response.ok) {
                const data = await response.json()
                setSuggestions(data)
            }
        } catch (error) {
            console.error('Error getting suggestions:', error)
        }
    }

    const handleSearch = (searchQuery: string = query) => {
        if (searchQuery.trim()) {
            // Save to recent searches
            const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
            setRecentSearches(updated)
            localStorage.setItem('recentSearches', JSON.stringify(updated))

            // Navigate to search results
            router.push(`/busca?q=${encodeURIComponent(searchQuery)}`)
            setIsOpen(false)
            setQuery('')
        }
    }

    const clearRecentSearches = () => {
        setRecentSearches([])
        localStorage.removeItem('recentSearches')
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    const getSuggestionIcon = (type: string) => {
        switch (type) {
            case 'company':
                return <Building2 className="w-4 h-4" />
            case 'product':
                return <Package className="w-4 h-4" />
            case 'category':
                return <TrendingUp className="w-4 h-4" />
            default:
                return <Search className="w-4 h-4" />
        }
    }

    return (
        <div ref={searchRef} className="relative w-full max-w-2xl">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                    type="text"
                    placeholder="Buscar empresas, produtos ou serviços..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 pr-12 py-3 text-lg border-2 border-gray-200 focus:border-orange-500 rounded-xl"
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Search Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
                    {/* Loading */}
                    {loading && (
                        <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="mt-2 text-sm">Buscando...</p>
                        </div>
                    )}

                    {/* Recent Searches */}
                    {!query && recentSearches.length > 0 && (
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Buscas Recentes
                                </h3>
                                <button
                                    onClick={clearRecentSearches}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                    Limpar
                                </button>
                            </div>
                            <div className="space-y-2">
                                {recentSearches.map((search, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSearch(search)}
                                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                                    >
                                        {search}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Suggestions */}
                    {query && suggestions.length > 0 && (
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Sugestões</h3>
                            <div className="space-y-1">
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSearch(suggestion.text)}
                                        className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                                    >
                                        {getSuggestionIcon(suggestion.type)}
                                        <span className="ml-3">{suggestion.text}</span>
                                        <Badge variant="secondary" className="ml-auto text-xs">
                                            {suggestion.type === 'company' ? 'Empresa' :
                                                suggestion.type === 'product' ? 'Produto' : 'Categoria'}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    {results && results.total > 0 && (
                        <div className="p-4">
                            {/* Companies */}
                            {results.companies.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                        <Building2 className="w-4 h-4 mr-2" />
                                        Empresas ({results.companies.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {results.companies.map((company) => (
                                            <Link
                                                key={company.id}
                                                href={`/empresa/${company.slug}`}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                {company.logo ? (
                                                    <img
                                                        src={company.logo}
                                                        alt={company.name}
                                                        className="w-10 h-10 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                                                        <Building2 className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <h4 className="font-medium text-gray-900 truncate">
                                                            {company.name}
                                                        </h4>
                                                        {company.verified && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Verificada
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {company.description}
                                                    </p>
                                                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                                        <div className="flex items-center">
                                                            <Star className="w-3 h-3 mr-1 fill-current text-yellow-400" />
                                                            {company.rating.toFixed(1)}
                                                        </div>
                                                        {company.location && (
                                                            <div className="flex items-center">
                                                                <MapPin className="w-3 h-3 mr-1" />
                                                                {company.location}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Products */}
                            {results.products.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                        <Package className="w-4 h-4 mr-2" />
                                        Produtos ({results.products.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {results.products.map((product) => (
                                            <Link
                                                key={product.id}
                                                href={`/produto/${product.id}`}
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                <img
                                                    src={product.images[0] || '/placeholder-product.jpg'}
                                                    alt={product.name}
                                                    className="w-10 h-10 rounded-lg object-cover"
                                                />

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 truncate">
                                                        {product.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        {product.company.name}
                                                    </p>
                                                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                                                        <span className="font-medium text-green-600">
                                                            {formatCurrency(product.price)}
                                                        </span>
                                                        <Badge variant="outline" className="text-xs">
                                                            {product.category}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* View All Results */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Button
                                    onClick={() => handleSearch()}
                                    className="w-full"
                                    variant="outline"
                                >
                                    Ver todos os resultados ({results.total})
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* No Results */}
                    {query && results && results.total === 0 && !loading && (
                        <div className="p-8 text-center text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium mb-2">Nenhum resultado encontrado</p>
                            <p className="text-sm">
                                Tente buscar com termos diferentes ou mais gerais
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}