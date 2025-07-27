import { AdminSEOManagement } from '@/components/admin/seo-management'

export default function AdminSEOPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestão de SEO</h1>
        <p className="text-gray-600 mt-2">
          Configure meta tags, sitemaps e otimizações de SEO
        </p>
      </div>
      
      <AdminSEOManagement />
    </div>
  )
}