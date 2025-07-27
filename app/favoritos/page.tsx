import { Metadata } from 'next'
import { FavoritesPage } from '@/components/favorites/favorites-page'

export const metadata: Metadata = {
  title: 'Meus Favoritos | SolarConnect',
  description: 'Gerencie suas empresas e produtos favoritos no SolarConnect',
}

export default function Favorites() {
  return <FavoritesPage />
}