'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  type: 'company' | 'product'
  itemId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  showText?: boolean
}

export function FavoriteButton({
  type,
  itemId,
  className,
  size = 'md',
  variant = 'ghost',
  showText = false
}: FavoriteButtonProps) {
  const { data: session } = useSession()
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    if (session?.user) {
      checkFavoriteStatus()
    }
  }, [session, itemId])

  const checkFavoriteStatus = async () => {
    try {
      const endpoint = type === 'company' ? 'companies' : 'products'
      const response = await fetch(`/api/favorites/${endpoint}`)
      
      if (response.ok) {
        const data = await response.json()
        const favorites = data.data || []
        
        const isFav = favorites.some((fav: any) => {
          const id = type === 'company' ? fav.company.id : fav.product.id
          return id === itemId
        })
        
        setIsFavorited(isFav)
      }
    } catch (error) {
      console.error('Error checking favorite status:', error)
    }
  }

  const toggleFavorite = async () => {
    if (!session?.user) {
      addToast({
        type: 'error',
        title: 'Login necessário',
        message: 'Você precisa estar logado para favoritar itens'
      })
      return
    }

    try {
      setLoading(true)
      const endpoint = type === 'company' ? 'companies' : 'products'
      const body = type === 'company' ? { companyId: itemId } : { productId: itemId }
      
      const response = await fetch(`/api/favorites/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        setIsFavorited(data.favorited)
        
        addToast({
          type: 'success',
          title: data.favorited ? 'Adicionado aos favoritos!' : 'Removido dos favoritos',
          message: data.favorited 
            ? `${type === 'company' ? 'Empresa' : 'Produto'} adicionado à sua lista de favoritos`
            : `${type === 'company' ? 'Empresa' : 'Produto'} removido da sua lista de favoritos`
        })
      } else {
        throw new Error('Failed to toggle favorite')
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível atualizar os favoritos. Tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4'
      case 'lg': return 'w-6 h-6'
      default: return 'w-5 h-5'
    }
  }

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'sm'
      case 'lg': return 'lg'
      default: return 'default'
    }
  }

  return (
    <Button
      variant={variant}
      size={getButtonSize()}
      onClick={toggleFavorite}
      disabled={loading}
      className={cn(
        'transition-colors',
        isFavorited && 'text-red-500 hover:text-red-600',
        className
      )}
    >
      <Heart 
        className={cn(
          getIconSize(),
          'transition-all',
          isFavorited && 'fill-current',
          showText && 'mr-2'
        )} 
      />
      {showText && (
        <span>
          {loading ? 'Carregando...' : isFavorited ? 'Favoritado' : 'Favoritar'}
        </span>
      )}
    </Button>
  )
}