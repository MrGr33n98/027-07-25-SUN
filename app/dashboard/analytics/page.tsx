import { AnalyticsOverview } from '@/components/dashboard/analytics-overview'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Acompanhe o desempenho da sua empresa na plataforma
        </p>
      </div>
      
      <AnalyticsOverview />
    </div>
  )
}