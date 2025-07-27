import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { ProductsList } from '@/components/dashboard/products-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Produtos - Dashboard',
    description: 'Gerencie os produtos da sua empresa',
}

async function getCompanyProducts(userId: string) {
    const company = await db.companyProfile.findUnique({
        where: { userId },
    })

    if (!company) {
        return []
    }

    // TODO: Implement products when we add the Product model
    // For now, return mock data
    return []
}

export default async function ProductsPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect('/login')
    }

    if (session.user.role !== 'COMPANY') {
        redirect('/')
    }

    const products = await getCompanyProducts(session.user.id)

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
                    <p className="text-gray-600">
                        Gerencie o catálogo de produtos da sua empresa
                    </p>
                </div>

                <Button asChild className="bg-orange-500 hover:bg-orange-600">
                    <Link href="/dashboard/produtos/novo">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Produto
                    </Link>
                </Button>
            </div>

            <ProductsList products={products} />
        </div>
    )
}