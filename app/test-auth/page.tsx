'use client'

import { useSession } from 'next-auth/react'

export default function TestAuthPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Carregando...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Autenticação</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Status da Sessão:</h2>
        <p><strong>Status:</strong> {status}</p>
        
        {session ? (
          <div className="mt-4">
            <p><strong>ID:</strong> {session.user?.id}</p>
            <p><strong>Nome:</strong> {session.user?.name}</p>
            <p><strong>Email:</strong> {session.user?.email}</p>
            <p><strong>Role:</strong> {session.user?.role}</p>
            
            <div className="mt-4">
              <h3 className="font-semibold">Objeto completo da sessão:</h3>
              <pre className="bg-white p-2 rounded text-xs overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-red-600">Nenhuma sessão ativa</p>
        )}
      </div>
      
      <div className="mt-6">
        <h2 className="font-semibold mb-2">Links de Teste:</h2>
        <div className="space-y-2">
          <a href="/login" className="block text-blue-600 hover:underline">
            → Fazer Login
          </a>
          <a href="/admin" className="block text-blue-600 hover:underline">
            → Acessar Admin (requer role ADMIN)
          </a>
          <a href="/dashboard" className="block text-blue-600 hover:underline">
            → Acessar Dashboard (requer role COMPANY)
          </a>
        </div>
      </div>
    </div>
  )
}