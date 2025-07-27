import { AdminSystemManagement } from '@/components/admin/system-management'

export default function AdminSystemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sistema</h1>
        <p className="text-gray-600 mt-2">
          Monitoramento, logs e configurações do sistema
        </p>
      </div>
      
      <AdminSystemManagement />
    </div>
  )
}