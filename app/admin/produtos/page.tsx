import { AdminProductsManagement } from '@/components/admin/products-management'

export default function AdminProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Produtos</h1>
        <p className="text-gray-600 mt-2">
          Gerencie todos os produtos da plataforma
        </p>
      </div>
      
      <AdminProductsManagement />
    </div>
  )
}