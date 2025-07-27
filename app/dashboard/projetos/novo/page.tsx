import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { ProjectForm } from '@/components/dashboard/project-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Novo Projeto - Dashboard',
  description: 'Adicione um novo projeto ao seu portfólio',
}

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'COMPANY') {
    redirect('/')
  }

  return (
    <div>
      <div className="flex items-center mb-8">
        <Button variant="ghost" asChild className="mr-4">
          <Link href="/dashboard/projetos">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Projeto</h1>
          <p className="text-gray-600">
            Adicione um novo projeto ao seu portfólio
          </p>
        </div>
      </div>

      <ProjectForm />
    </div>
  )
}