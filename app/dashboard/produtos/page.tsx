import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { ProductsTable } from '@/components/dashboard/products-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Produtos - Dashboard SolarConnect',
  description: 'Gerencie os produtos da sua empresa',
}

async function getCompanyProducts(companyId: string) {
  const products = await db.product.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
  })

  return products
}

async function getCompanyData(userId: string) {
  const company = await db.companyProfile.findUnique({
    where: { userId },
  })

  return company
}

export default async function ProductsPage() {
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

  const products = await getCompanyProducts(company.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">
            Gerencie os produtos da sua empresa no marketplace
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/produtos/novo">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Link>
        </Button>
      </div>

      <ProductsTable products={products} />
    </div>
  )
}