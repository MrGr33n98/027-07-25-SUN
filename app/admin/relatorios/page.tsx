import { AdminReportsManagement } from '@/components/admin/reports-management'

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Relatórios da Plataforma</h1>
        <p className="text-gray-600 mt-2">
          Análise completa de métricas e performance da plataforma
        </p>
      </div>
      
      <AdminReportsManagement />
    </div>
  )
}