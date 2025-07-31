'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard,
  Building2,
  Package,
  Image as ImageIcon,
  Star,
  BarChart3,
  Settings,
  Users,
  MessageSquare,
  FileText
} from 'lucide-react'

const navigation = [
  {
    name: 'Visão Geral',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Perfil da Empresa',
    href: '/dashboard/perfil',
    icon: Building2,
  },
  {
    name: 'Produtos',
    href: '/dashboard/produtos',
    icon: Package,
  },
  {
    name: 'Projetos',
    href: '/dashboard/projetos',
    icon: ImageIcon,
  },
  {
    name: 'Avaliações',
    href: '/dashboard/avaliacoes',
    icon: Star,
  },
  {
    name: 'Leads',
    href: '/dashboard/leads',
    icon: Users,
  },
  {
    name: 'Orçamentos',
    href: '/dashboard/orcamentos',
    icon: FileText,
  },
  {
    name: 'Mensagens',
    href: '/dashboard/mensagens',
    icon: MessageSquare,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Relatórios',
    href: '/dashboard/relatorios',
    icon: BarChart3,
  },
  {
    name: 'Configurações',
    href: '/dashboard/configuracoes',
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}