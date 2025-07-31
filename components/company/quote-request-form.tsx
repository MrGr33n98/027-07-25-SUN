'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MessageSquare, 
  Send, 
  Loader2,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Calculator
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const quoteRequestSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 caracteres'),
  location: z.string().min(2, 'Localização é obrigatória'),
  projectType: z.string().min(1, 'Selecione o tipo de projeto'),
  budget: z.string().optional(),
  message: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres')
})

type QuoteRequestData = z.infer<typeof quoteRequestSchema>

interface QuoteRequestFormProps {
  companyId: string
  companyName: string
}

export function QuoteRequestForm({ companyId, companyName }: QuoteRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<QuoteRequestData>({
    resolver: zodResolver(quoteRequestSchema)
  })

  const projectType = watch('projectType')

  const onSubmit = async (data: QuoteRequestData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          companyId,
          source: 'company_profile'
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
        reset()
        // Reset success state after 5 seconds
        setTimeout(() => setIsSuccess(false), 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Erro ao enviar solicitação')
      }
    } catch (error) {
      console.error('Error submitting quote request:', error)
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3 text-green-800">
            <CheckCircle className="w-8 h-8" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Solicitação Enviada!</h3>
              <p className="text-sm">
                Sua solicitação de orçamento foi enviada para {companyName}. 
                Você receberá um retorno em breve.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Solicitar Orçamento
        </CardTitle>
        <p className="text-sm text-gray-600">
          Preencha o formulário abaixo para receber uma proposta personalizada de {companyName}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome Completo *</Label>
              <div className="relative">
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Seu nome completo"
                  className="pl-10"
                />
                <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              </div>
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="seu@email.com"
                  className="pl-10"
                />
                <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <div className="relative">
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="(11) 99999-9999"
                  className="pl-10"
                />
                <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="location">Localização *</Label>
              <div className="relative">
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Cidade, Estado"
                  className="pl-10"
                />
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              </div>
              {errors.location && (
                <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
              )}
            </div>
          </div>

          {/* Project Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectType">Tipo de Projeto *</Label>
              <Select onValueChange={(value) => setValue('projectType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Residencial">Residencial</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                  <SelectItem value="Rural">Rural</SelectItem>
                  <SelectItem value="Público">Público</SelectItem>
                </SelectContent>
              </Select>
              {errors.projectType && (
                <p className="text-sm text-red-600 mt-1">{errors.projectType.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="budget">Orçamento Aproximado (opcional)</Label>
              <Select onValueChange={(value) => setValue('budget', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Faixa de investimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Até R$ 10.000">Até R$ 10.000</SelectItem>
                  <SelectItem value="R$ 10.000 - R$ 25.000">R$ 10.000 - R$ 25.000</SelectItem>
                  <SelectItem value="R$ 25.000 - R$ 50.000">R$ 25.000 - R$ 50.000</SelectItem>
                  <SelectItem value="R$ 50.000 - R$ 100.000">R$ 50.000 - R$ 100.000</SelectItem>
                  <SelectItem value="Acima de R$ 100.000">Acima de R$ 100.000</SelectItem>
                  <SelectItem value="A definir">A definir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder="Descreva seu projeto, necessidades específicas, prazo esperado ou qualquer informação adicional que ajude a empresa a preparar uma proposta mais precisa..."
              rows={4}
            />
            {errors.message && (
              <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando Solicitação...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Solicitação de Orçamento
              </>
            )}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            Ao enviar esta solicitação, você concorda em ser contatado por {companyName} 
            através dos meios de comunicação fornecidos.
          </div>
        </form>
      </CardContent>
    </Card>
  )
}