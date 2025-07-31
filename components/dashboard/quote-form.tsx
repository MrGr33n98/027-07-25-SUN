"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Trash2, 
  Save, 
  Send,
  Calculator,
  FileText,
  Loader2
} from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const quoteItemSchema = z.object({
  description: z.string().min(2, 'Descrição é obrigatória'),
  quantity: z.number().int().positive('Quantidade deve ser positiva'),
  unitPrice: z.number().positive('Preço deve ser positivo'),
  category: z.string().optional()
})

const quoteFormSchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  description: z.string().optional(),
  validUntil: z.string().min(1, 'Data de validade é obrigatória'),
  leadId: z.string().optional(),
  userId: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, 'Pelo menos um item é obrigatório')
})

type QuoteFormData = z.infer<typeof quoteFormSchema>

interface QuoteFormProps {
  leadId?: string
  leadName?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function QuoteForm({ leadId, leadName, onSuccess, onCancel }: QuoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      leadId: leadId || '',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      items: [
        { description: '', quantity: 1, unitPrice: 0, category: '' }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchedItems = watch('items')
  
  // Calculate totals
  const totalValue = watchedItems.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice)
  }, 0)

  const onSubmit = async (data: QuoteFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          totalValue,
          validUntil: new Date(data.validUntil).toISOString()
        }),
      })

      if (response.ok) {
        onSuccess?.()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Erro ao criar orçamento')
      }
    } catch (error) {
      console.error('Error creating quote:', error)
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Novo Orçamento
          {leadName && <span className="text-sm font-normal text-gray-500">para {leadName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título do Orçamento *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Ex: Instalação Sistema Solar 10kWp"
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="validUntil">Válido até *</Label>
              <Input
                id="validUntil"
                type="date"
                {...register('validUntil')}
              />
              {errors.validUntil && (
                <p className="text-sm text-red-600 mt-1">{errors.validUntil.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descrição detalhada do orçamento..."
              rows={3}
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-semibold">Itens do Orçamento</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0, category: '' })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="grid md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-4">
                      <Label htmlFor={`items.${index}.description`}>Descrição *</Label>
                      <Input
                        {...register(`items.${index}.description`)}
                        placeholder="Descrição do item"
                      />
                      {errors.items?.[index]?.description && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.items[index]?.description?.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor={`items.${index}.quantity`}>Qtd *</Label>
                      <Input
                        type="number"
                        min="1"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        placeholder="1"
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.items[index]?.quantity?.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor={`items.${index}.unitPrice`}>Preço Unit. *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                      {errors.items?.[index]?.unitPrice && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.items[index]?.unitPrice?.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label>Total</Label>
                      <div className="h-10 flex items-center px-3 bg-gray-50 border rounded-md">
                        R$ {((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0)).toFixed(2)}
                      </div>
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <Label htmlFor={`items.${index}.category`}>Categoria (opcional)</Label>
                    <Select onValueChange={(value) => setValue(`items.${index}.category`, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Painéis Solares">Painéis Solares</SelectItem>
                        <SelectItem value="Inversores">Inversores</SelectItem>
                        <SelectItem value="Estruturas">Estruturas</SelectItem>
                        <SelectItem value="Cabos">Cabos</SelectItem>
                        <SelectItem value="Instalação">Instalação</SelectItem>
                        <SelectItem value="Mão de Obra">Mão de Obra</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              ))}
            </div>

            {errors.items && (
              <p className="text-sm text-red-600 mt-1">{errors.items.message}</p>
            )}
          </div>

          {/* Total Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  <span className="font-semibold">Valor Total do Orçamento:</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  R$ {totalValue.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="terms">Termos e Condições (opcional)</Label>
              <Textarea
                id="terms"
                {...register('terms')}
                placeholder="Condições de pagamento, prazo de entrega, garantias..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="notes">Observações Internas (opcional)</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Notas internas sobre este orçamento..."
                rows={4}
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Rascunho
                </>
              )}
            </Button>

            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}