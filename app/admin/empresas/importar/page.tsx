import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { CompanyImportManager } from '@/components/admin/company-import-manager'

export const metadata: Metadata = {
  title: 'Importar Empresas - Admin SolarConnect',
  description: 'Importar empresas em massa via arquivo CSV',
}

export default async function CompanyImportPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Importar Empresas</h1>
        <p className="text-gray-600">
          Importe empresas em massa através de arquivo CSV
        </p>
      </div>

      <CompanyImportManager />
    </div>
  )
}