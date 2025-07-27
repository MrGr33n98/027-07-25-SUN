import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { CompaniesManagement } from '@/components/admin/companies-management'

export const metadata: Metadata = {
  title: 'Gerenciar Empresas - Admin',
  description: 'Gerencie todas as empresas da plataforma',
}

export default async function AdminCompaniesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Empresas</h1>
        <p className="text-gray-600">
          Visualize, modere e gerencie todas as empresas da plataforma
        </p>
      </div>

      <CompaniesManagement />
    </div>
  )
}