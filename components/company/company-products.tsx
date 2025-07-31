import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, ShoppingCart } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number | null
  power?: number | null
  efficiency?: number | null
  warranty?: number | null
  category: string
  brand?: string | null
  images: string[]
  status: string
}

interface CompanyProductsProps {
  products: Product[]
  companySlug: string
}

export function CompanyProducts({ products, companySlug }: CompanyProductsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'PAINEL_SOLAR': 'Painel Solar',
      'INVERSOR': 'Inversor',
      'BATERIA': 'Bateria',
      'ESTRUTURA': 'Estrutura',
      'CABO': 'Cabo',
      'ACESSORIO': 'Acessório',
      'KIT_COMPLETO': 'Kit Completo'
    }
    return labels[category] || category
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <div className="aspect-square bg-gray-100 relative">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ShoppingCart className="w-12 h-12" />
              </div>
            )}
            
            <div className="absolute top-2 left-2">
              <Badge variant="secondary">
                {getCategoryLabel(product.category)}
              </Badge>
            </div>

            {product.originalPrice && product.originalPrice > product.price && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-red-500">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </Badge>
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2 line-clamp-2">
              {product.name}
            </h3>

            {product.brand && (
              <p className="text-xs text-muted-foreground mb-2">
                {product.brand}
              </p>
            )}

            {/* Product specs */}
            <div className="space-y-1 mb-3 text-xs">
              {product.power && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Potência:</span>
                  <span className="font-medium">{product.power}W</span>
                </div>
              )}
              
              {product.efficiency && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Eficiência:</span>
                  <span className="font-medium">{product.efficiency.toFixed(1)}%</span>
                </div>
              )}
              
              {product.warranty && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Garantia:</span>
                  <span className="font-medium">{product.warranty} anos</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold text-lg">
                  {formatPrice(product.price)}
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="text-xs text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </div>
                )}
              </div>
            </div>

            <Button size="sm" className="w-full">
              <Eye className="w-3 h-3 mr-2" />
              Ver Detalhes
            </Button>
          </CardContent>
        </Card>
      ))}
      
      {products.length === 0 && (
        <div className="col-span-full text-center py-8">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum produto disponível</p>
        </div>
      )}
    </div>
  )
}