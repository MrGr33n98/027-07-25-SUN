import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { UsersManagement } from '@/components/admin/users-management'

export const metadata: Metadata = {
    title: 'Gerenciar Usuários - Admin',
    description: 'Gerencie todos os usuários da plataforma',
}

export default async function AdminUsersPage() {
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
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
                <p className="text-gray-600">
                    Visualize e gerencie todos os usuários da plataforma
                </p>
            </div>

            <UsersManagement />
        </div>
    )
}