'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Sun, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Shield
} from 'lucide-react'
import { useState } from 'react'

export function AdminHeader() {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
            SolarConnect
          </span>
          <span className="text-sm text-gray-500 ml-2">Admin</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Quick Actions */}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Ver Site</Link>
          </Button>
          
          <Button variant="ghost" size="sm" asChild>
            <Link href="/test-auth">Debug Auth</Link>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              5
            </span>
          </Button>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-sm font-medium">
                {session?.user?.name || 'Admin'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </Button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                <Link
                  href="/admin/perfil"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="w-4 h-4 mr-2" />
                  Meu Perfil
                </Link>
                <Link
                  href="/admin/configuracoes"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </Link>
                <hr className="my-1" />
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}