import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { QuotesList } from '@/components/dashboard/quotes-list'

export const metadata: Metadata = {
  title: 'Orçamentos - Dashboard',
  description: 'Gerencie seus orçamentos e propostas'
}

export default async function QuotesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'COMPANY') {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-600 mt-2">
            Crie e gerencie suas propostas comerciais
          </p>
        </div>
      </div>

      <QuotesList />
    </div>
  )
}