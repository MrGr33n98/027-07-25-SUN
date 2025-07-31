import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { ImageUploadManager } from '@/components/dashboard/image-upload-manager'

export const metadata: Metadata = {
  title: 'Gerenciar Imagens - Dashboard SolarConnect',
  description: 'Gerencie logos, banners e imagens da sua empresa',
}

async function getCompanyData(userId: string) {
  const company = await db.companyProfile.findUnique({
    where: { userId },
  })

  return company
}

export default async function ImageManagementPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'COMPANY') {
    redirect('/')
  }

  const company = await getCompanyData(session.user.id)

  if (!company) {
    redirect('/dashboard/perfil/criar')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Imagens</h1>
        <p className="text-gray-600">
          Faça upload e gerencie as imagens da sua empresa no marketplace
        </p>
      </div>

      <ImageUploadManager company={company} />
    </div>
  )
}