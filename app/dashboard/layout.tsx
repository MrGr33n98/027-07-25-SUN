import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader />
            <div className="flex">
                <DashboardSidebar />
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}