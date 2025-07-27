import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'

export const metadata: Metadata = {
  title: 'Dashboard - SolarConnect',
  description: 'Gerencie sua empresa de energia solar',
}

async function getCompanyData(userId: string) {
  const company = await db.companyProfile.findUnique({
    where: { userId },
    include: {
      user: true,
    },
  })

  if (!company) {
    // If user doesn't have a company profile, redirect to create one
    redirect('/dashboard/perfil/criar')
  }

  return company
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'COMPANY') {
    redirect('/')
  }

  const company = await getCompanyData(session.user.id)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bem-vindo, {company.name}!
        </h1>
        <p className="text-gray-600">
          Gerencie sua empresa e acompanhe seu desempenho no marketplace
        </p>
      </div>

      <DashboardOverview company={company} />
    </div>
  )
}