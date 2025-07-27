import { AdminReviewsManagement } from '@/components/admin/reviews-management'

export default function AdminReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Avaliações</h1>
        <p className="text-gray-600 mt-2">
          Modere e gerencie todas as avaliações da plataforma
        </p>
      </div>
      
      <AdminReviewsManagement />
    </div>
  )
}