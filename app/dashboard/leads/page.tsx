import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LeadsList } from '@/components/dashboard/leads-list'

export const metadata: Metadata = {
  title: 'Leads - Dashboard',
  description: 'Gerencie seus leads e solicitações de orçamento'
}

export default async function LeadsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'COMPANY') {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-600 mt-2">
          Gerencie todas as solicitações de orçamento recebidas
        </p>
      </div>

      <LeadsList />
    </div>
  )
}