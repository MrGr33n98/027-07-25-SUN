import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { MessagesList } from '@/components/dashboard/messages-list'

export const metadata: Metadata = {
  title: 'Mensagens - Dashboard',
  description: 'Gerencie as mensagens da sua empresa',
}

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'COMPANY') {
    redirect('/')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
        <p className="text-gray-600">
          Converse com seus clientes e prospects
        </p>
      </div>

      <MessagesList />
    </div>
  )
}