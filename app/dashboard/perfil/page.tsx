import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { CompanyProfileForm } from '@/components/dashboard/company-profile-form'

export const metadata: Metadata = {
  title: 'Perfil da Empresa - Dashboard',
  description: 'Gerencie as informações do seu perfil empresarial',
}

async function getCompanyProfile(userId: string) {
  const company = await db.companyProfile.findUnique({
    where: { userId },
    include: {
      user: true,
    },
  })

  return company
}

export default async function CompanyProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'COMPANY') {
    redirect('/')
  }

  const company = await getCompanyProfile(session.user.id)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Perfil da Empresa</h1>
        <p className="text-gray-600">
          Mantenha as informações da sua empresa sempre atualizadas
        </p>
      </div>

      <CompanyProfileForm company={company} userId={session.user.id} />
    </div>
  )
}