import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { UserSettings } from '@/components/dashboard/user-settings'

export const metadata: Metadata = {
  title: 'Configurações - Dashboard',
  description: 'Gerencie suas configurações de conta e segurança',
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">
          Gerencie suas configurações de conta, segurança e preferências
        </p>
      </div>

      <UserSettings />
    </div>
  )
}