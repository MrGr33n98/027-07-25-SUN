import { AdminSettingsManagement } from '@/components/admin/settings-management'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-2">
          Configure parâmetros gerais da plataforma
        </p>
      </div>
      
      <AdminSettingsManagement />
    </div>
  )
}