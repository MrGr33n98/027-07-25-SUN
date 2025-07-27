'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, Sun } from 'lucide-react'
import { AuthButton } from '@/components/auth/auth-button'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { GlobalSearch } from '@/components/search/global-search'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
              SolarConnect
            </span>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <GlobalSearch />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/marketplace" 
              className="text-gray-700 hover:text-orange-500 font-medium transition-colors"
            >
              Marketplace
            </Link>
            <Link 
              href="/empresas" 
              className="text-gray-700 hover:text-orange-500 font-medium transition-colors"
            >
              Empresas
            </Link>
            <Link 
              href="/produtos" 
              className="text-gray-700 hover:text-orange-500 font-medium transition-colors"
            >
              Produtos
            </Link>
            <Link 
              href="/calculadora" 
              className="text-gray-700 hover:text-orange-500 font-medium transition-colors"
            >
              Calculadora
            </Link>
            <Link 
              href="/favoritos" 
              className="text-gray-700 hover:text-orange-500 font-medium transition-colors"
            >
              Favoritos
            </Link>
            <NotificationBell />
            <AuthButton />
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white"
              asChild
            >
              <Link href="/cadastro">
                Cadastrar Empresa
              </Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <GlobalSearch />
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/marketplace" 
                className="text-gray-700 hover:text-orange-500 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Marketplace
              </Link>
              <Link 
                href="/empresas" 
                className="text-gray-700 hover:text-orange-500 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Empresas
              </Link>
              <Link 
                href="/produtos" 
                className="text-gray-700 hover:text-orange-500 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Produtos
              </Link>
              <div className="flex flex-col space-y-2 pt-4">
                <AuthButton />
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  asChild
                >
                  <Link href="/cadastro">
                    Cadastrar Empresa
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}