import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Package, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Eye,
  Plus,
  Star,
  Clock,
  CheckCircle
} from "lucide-react"
import Link from "next/link"

interface DashboardOverviewProps {
  company: {
    id: string
    name: string
    email: string
    phone?: string | null
    description?: string | null
    website?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    cnpj?: string | null
    certifications?: string[] | null
    userId: string
    status: string
    createdAt: Date
    updatedAt: Date
  }
}

async function getDashboardStats(companyId: string) {
  // Buscar estatísticas da empresa
  const [productsCount, leadsCount, messagesCount, reviewsCount] = await Promise.all([
    db.product.count({ where: { companyId } }),
    db.lead.count({ where: { companyId } }),
    // Contar mensagens recebidas pela empresa através do relacionamento User
    db.message.count({
      where: {
        receiver: {
          company: {
            id: companyId
          }
        }
      }
    }),
    db.review.count({ where: { companyId } })
  ])

  // Buscar produtos recentes
  const recentProducts = await db.product.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true
    }
  })

  // Buscar leads recentes
  const recentLeads = await db.lead.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: 3
  })

  return {
    productsCount,
    leadsCount,
    messagesCount,
    reviewsCount,
    recentProducts,
    recentLeads
  }
}

export async function DashboardOverview({ company }: DashboardOverviewProps) {
  const stats = await getDashboardStats(company.id)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default">Aprovado</Badge>
      case 'PENDING':
        return <Badge variant="outline">Pendente</Badge>
      case 'REJECTED':
        return <Badge variant="secondary">Rejeitado</Badge>
      case 'FLAGGED':
        return <Badge variant="destructive">Sinalizado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getLeadStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <Badge variant="default">Novo</Badge>
      case 'CONTACTED':
        return <Badge variant="outline">Contatado</Badge>
      case 'PROPOSAL_SENT':
        return <Badge variant="secondary">Proposta Enviada</Badge>
      case 'NEGOTIATING':
        return <Badge>Negociando</Badge>
      case 'CLOSED':
        return <Badge>Fechado</Badge>
      case 'LOST':
        return <Badge variant="destructive">Perdido</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Produtos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsCount}</div>
            <p className="text-xs text-muted-foreground">
              Produtos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Leads Recebidos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leadsCount}</div>
            <p className="text-xs text-muted-foreground">
              Potenciais clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mensagens
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messagesCount}</div>
            <p className="text-xs text-muted-foreground">
              Mensagens recebidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avaliações
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewsCount}</div>
            <p className="text-xs text-muted-foreground">
              Reviews da empresa
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Produtos Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Recentes</CardTitle>
            <CardDescription>
              Últimos produtos adicionados ao seu catálogo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentProducts.length > 0 ? (
                stats.recentProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(product.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {getStatusBadge(product.status)}
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum produto cadastrado
                  </p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/dashboard/produtos/novo">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Produto
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leads Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Leads Recentes</CardTitle>
            <CardDescription>
              Últimas solicitações de orçamento recebidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentLeads.length > 0 ? (
                stats.recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {lead.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lead.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {getLeadStatusBadge(lead.status)}
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum lead recebido
                  </p>
                  <Button asChild size="sm" className="mt-2">
                    <Link href="/dashboard/leads">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Leads
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/produtos/novo">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/perfil">
                <Eye className="mr-2 h-4 w-4" />
                Ver Perfil
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/leads">
                <Users className="mr-2 h-4 w-4" />
                Gerenciar Leads
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/dashboard/mensagens">
                <MessageSquare className="mr-2 h-4 w-4" />
                Ver Mensagens
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}