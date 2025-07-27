import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AdminOverview } from '@/components/admin/admin-overview'

export const metadata: Metadata = {
  title: 'Admin Dashboard - SolarConnect',
  description: 'Painel administrativo do SolarConnect',
}

export default async function AdminPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard Administrativo
        </h1>
        <p className="text-gray-600">
          Visão geral da plataforma SolarConnect
        </p>
      </div>

      <AdminOverview />
    </div>
  )
}