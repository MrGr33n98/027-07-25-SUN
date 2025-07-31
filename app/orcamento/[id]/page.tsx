import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Phone, 
  Mail, 
  CheckCircle,
  AlertCircle,
  Building2
} from 'lucide-react'

interface QuotePageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: QuotePageProps): Promise<Metadata> {
  const quote = await getQuote(params.id)
  
  if (!quote) {
    return {
      title: 'Orçamento não encontrado - SolarConnect',
      description: 'O orçamento solicitado não foi encontrado.',
    }
  }

  return {
    title: `${quote.title} - ${quote.company.name}`,
    description: `Orçamento de energia solar no valor de ${formatCurrency(Number(quote.totalValue))}`,
  }
}

async function getQuote(id: string) {
  const quote = await db.quote.findUnique({
    where: { id },
    include: {
      items: true,
      company: {
        select: {
          name: true,
          logo: true,
          phone: true,
          email: true,
          website: true,
          city: true,
          state: true,
          rating: true,
          reviewCount: true
        }
      }
    }
  })

  return quote
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

export default async function QuotePage({ params }: QuotePageProps) {
  const quote = await getQuote(params.id)

  if (!quote) {
    notFound()
  }

  const isExpired = new Date(quote.validUntil) < new Date()
  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    VIEWED: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-orange-100 text-orange-800',
  }

  const statusLabels = {
    DRAFT: 'Rascunho',
    SENT: 'Enviado',
    VIEWED: 'Visualizado',
    ACCEPTED: 'Aceito',
    REJECTED: 'Rejeitado',
    EXPIRED: 'Expirado',
  }

  // Marcar como visualizado se foi sent
  if (quote.status === 'SENT') {
    await db.quote.update({
      where: { id: params.id },
      data: { status: 'VIEWED' }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {quote.company.logo && (
                <img
                  src={quote.company.logo}
                  alt={quote.company.name}
                  className="w-16 h-16 object-contain bg-gray-100 rounded-lg p-2"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{quote.title}</h1>
                <p className="text-gray-600">
                  Orçamento de <strong>{quote.company.name}</strong>
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <Badge className={`mb-2 ${statusColors[quote.status as keyof typeof statusColors]}`}>
                {statusLabels[quote.status as keyof typeof statusLabels]}
              </Badge>
              {isExpired && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Orçamento Expirado</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Detalhes do Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Válido até:</strong> {formatDate(quote.validUntil.toISOString())}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Valor Total:</strong> {formatCurrency(Number(quote.totalValue))}
                    </span>
                  </div>
                </div>

                {quote.description && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-gray-700 whitespace-pre-line">{quote.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>Itens do Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Item</th>
                        <th className="text-center py-3 px-2">Qtd</th>
                        <th className="text-right py-3 px-2">Preço Unit.</th>
                        <th className="text-right py-3 px-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.items.map((item, index) => (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="py-3 px-2">
                            <div>
                              <div className="font-medium">{item.description}</div>
                              {item.category && (
                                <div className="text-sm text-gray-500">{item.category}</div>
                              )}
                            </div>
                          </td>
                          <td className="text-center py-3 px-2">{item.quantity}</td>
                          <td className="text-right py-3 px-2">{formatCurrency(Number(item.unitPrice))}</td>
                          <td className="text-right py-3 px-2 font-semibold">
                            {formatCurrency(Number(item.totalPrice))}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-orange-500 bg-orange-50">
                        <td colSpan={3} className="py-4 px-2 text-right font-bold">
                          TOTAL GERAL:
                        </td>
                        <td className="py-4 px-2 text-right font-bold text-lg text-orange-600">
                          {formatCurrency(Number(quote.totalValue))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Terms */}
            {quote.terms && (
              <Card>
                <CardHeader>
                  <CardTitle>Termos e Condições</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-line">{quote.terms}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {quote.company.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quote.company.city && quote.company.state && (
                  <div className="text-sm text-gray-600">
                    📍 {quote.company.city}, {quote.company.state}
                  </div>
                )}

                {quote.company.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="font-semibold ml-1">{quote.company.rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-sm ml-1">
                        ({quote.company.reviewCount} avaliações)
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t">
                  {quote.company.phone && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      asChild
                    >
                      <a href={`tel:${quote.company.phone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Ligar Agora
                      </a>
                    </Button>
                  )}

                  {quote.company.email && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      asChild
                    >
                      <a href={`mailto:${quote.company.email}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar Email
                      </a>
                    </Button>
                  )}

                  {quote.company.website && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      asChild
                    >
                      <a href={quote.company.website} target="_blank" rel="noopener noreferrer">
                        <Building2 className="w-4 h-4 mr-2" />
                        Visitar Site
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {!isExpired && quote.status !== 'ACCEPTED' && quote.status !== 'REJECTED' && (
              <Card>
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aceitar Orçamento
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    Negociar Valores
                  </Button>
                  
                  <div className="text-xs text-gray-500 text-center">
                    Ao aceitar, você concorda com os termos apresentados
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Validity Warning */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-orange-800">Validade do Orçamento</p>
                    <p className="text-orange-700">
                      Este orçamento é válido até <strong>{formatDate(quote.validUntil.toISOString())}</strong>.
                      Entre em contato com a empresa para mais informações.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}