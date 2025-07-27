import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ProjectsList } from '@/components/dashboard/projects-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Projetos - Dashboard',
  description: 'Gerencie os projetos da sua empresa',
}

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'COMPANY') {
    redirect('/')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
          <p className="text-gray-600">
            Showcase dos seus projetos realizados
          </p>
        </div>
        
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/dashboard/projetos/novo">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Projeto
          </Link>
        </Button>
      </div>

      <ProjectsList />
    </div>
  )
}