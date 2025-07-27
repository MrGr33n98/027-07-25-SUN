'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard,
  Building2,
  Users,
  Package,
  Star,
  MessageSquare,
  BarChart3,
  Settings,
  Shield,
  Flag,
  FileText,
  Globe,
  Database
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Empresas',
    href: '/admin/empresas',
    icon: Building2,
  },
  {
    name: 'Usuários',
    href: '/admin/usuarios',
    icon: Users,
  },
  {
    name: 'Produtos',
    href: '/admin/produtos',
    icon: Package,
  },
  {
    name: 'Avaliações',
    href: '/admin/avaliacoes',
    icon: Star,
  },
  {
    name: 'Mensagens',
    href: '/admin/mensagens',
    icon: MessageSquare,
  },
  {
    name: 'Relatórios',
    href: '/admin/relatorios',
    icon: BarChart3,
  },
  {
    name: 'Moderação',
    href: '/admin/moderacao',
    icon: Shield,
  },
  {
    name: 'Denúncias',
    href: '/admin/denuncias',
    icon: Flag,
  },
  {
    name: 'Conteúdo',
    href: '/admin/conteudo',
    icon: FileText,
  },
  {
    name: 'SEO',
    href: '/admin/seo',
    icon: Globe,
  },
  {
    name: 'Sistema',
    href: '/admin/sistema',
    icon: Database,
  },
  {
    name: 'Configurações',
    href: '/admin/configuracoes',
    icon: Settings,
  },
]

export function AdminSidebar() {
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
                  ? 'bg-red-100 text-red-700'
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