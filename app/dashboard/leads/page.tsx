import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { LeadsList } from '@/components/dashboard/leads-list'

export const metadata: Metadata = {
  title: 'Leads - Dashboard',
  description: 'Gerencie os leads da sua empresa',
}

export default async function LeadsPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-600">
          Gerencie as solicitações de orçamento e contatos
        </p>
      </div>

      <LeadsList />
    </div>
  )
}