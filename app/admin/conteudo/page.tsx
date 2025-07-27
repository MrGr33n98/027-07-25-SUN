import { AdminContentManagement } from '@/components/admin/content-management'

export default function AdminContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Conteúdo</h1>
        <p className="text-gray-600 mt-2">
          Gerencie páginas, banners e conteúdo da plataforma
        </p>
      </div>
      
      <AdminContentManagement />
    </div>
  )
}