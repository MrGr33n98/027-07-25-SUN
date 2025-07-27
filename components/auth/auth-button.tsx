'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User, LogOut, LayoutDashboard, Shield } from 'lucide-react'
import { useState } from 'react'

export function AuthButton() {
  const { data: session, status } = useSession()
  const [showMenu, setShowMenu] = useState(false)

  if (status === 'loading') {
    return (
      <Button variant="outline" disabled>
        Carregando...
      </Button>
    )
  }

  if (!session) {
    return (
      <Button
        variant="outline"
        className="border-orange-500 text-orange-500 hover:bg-orange-50"
        asChild
      >
        <Link href="/login">
          <User className="w-4 h-4 mr-2" />
          Entrar
        </Link>
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2"
      >
        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
          <User className="w-3 h-3 text-orange-600" />
        </div>
        <span className="hidden md:inline">
          {session.user.name?.split(' ')[0] || 'Usuário'}
        </span>
      </Button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          {session.user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 font-medium"
              onClick={() => setShowMenu(false)}
            >
              <Shield className="w-4 h-4 mr-2" />
              Painel Admin
            </Link>
          )}

          {session.user.role === 'COMPANY' && (
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setShowMenu(false)}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          )}

          <Link
            href="/perfil"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setShowMenu(false)}
          >
            <User className="w-4 h-4 mr-2" />
            Meu Perfil
          </Link>

          <Link
            href="/test-auth"
            className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 text-xs"
            onClick={() => setShowMenu(false)}
          >
            Debug Auth
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
  )
}