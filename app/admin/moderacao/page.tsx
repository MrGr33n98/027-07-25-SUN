import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ModerationManagement } from '@/components/admin/moderation-management'

export const metadata: Metadata = {
  title: 'Moderação - Admin',
  description: 'Modere conteúdo da plataforma',
}

export default async function AdminModerationPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Moderação de Conteúdo</h1>
        <p className="text-gray-600">
          Revise e modere produtos, projetos e avaliações pendentes
        </p>
      </div>

      <ModerationManagement />
    </div>
  )
}