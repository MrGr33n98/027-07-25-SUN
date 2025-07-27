'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trash2, 
  Calculator, 
  Send, 
  Save,
  FileText
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface QuoteItem {
  description: string
  quantity: number
  unitPrice: number
  category?: string
}

interface QuoteFormData {
  title: string
  description?: string
  items: QuoteItem[]
  validUntil: string
  terms?: string
  notes?: string
}

interface QuoteFormProps {
  leadId?: string
  userId?: string
  onSuccess?: (quote: any) => void
  initialData?: Partial<QuoteFormData>
}

export function QuoteForm({ leadId, userId, onSuccess, initialData }: QuoteFormProps) {
  const [submitting, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const { addToast } = useToast()

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm<QuoteFormData>({
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      items: initialData?.items || [
        { description: '', quantity: 1, unitPrice: 0, category: '' }
      ],
      validUntil: initialData?.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      terms: initialData?.terms || 'Condições de pagamento: À vista ou parcelado\nPrazo de entrega: 30 dias úteis\nGarantia: Conforme especificação do fabricante',
      notes: initialData?.notes || ''
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const watchedItems = watch('items')

  const calculateTotal = () => {
    return watchedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice)
    }, 0)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const addItem = () => {
    append({ description: '', quantity: 1, unitPrice: 0, category: '' })
  }

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const saveQuote = async (data: QuoteFormData, status: 'DRAFT' | 'SENT' = 'DRAFT') => {
    try {
      if (status === 'DRAFT') {
        setSaving(true)
      } else {
        setSending(true)
      }

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          leadId,
          userId,
          status
        }),
      })

      if (response.ok) {
        const quote = await response.json()
        
        addToast({
          type: 'success',
          title: status === 'DRAFT' ? 'Cotação salva!' : 'Cotação enviada!',
          message: status === 'DRAFT' 
            ? 'Sua cotação foi salva como rascunho'
            : 'Sua cotação foi enviada para o cliente'
        })
        
        onSuccess?.(quote)
        reset()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao salvar cotação')
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: error instanceof Error ? error.message : 'Não foi possível salvar a cotação'
      })
    } finally {
      setSaving(false)
      setSending(false)
    }
  }

  const onSubmit = (data: QuoteFormData) => {
    saveQuote(data, 'SENT')
  }

  const onSaveDraft = (data: QuoteFormData) => {
    saveQuote(data, 'DRAFT')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-6 h-6 mr-2" />
          Nova Cotação
        </CardTitle>
        <p className="text-gray-600">
          Crie uma cotação detalhada para seu cliente
        </p>
      </CardHeader>
      
      <CardContent>
        <form className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Título da cotação *</Label>
              <Input
                id="title"
                placeholder="Ex: Sistema Solar Residencial 5kWp"
                {...register('title', { required: 'Título é obrigatório' })}
                className="mt-1"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="validUntil">Válida até *</Label>
              <Input
                id="validUntil"
                type="date"
                {...register('validUntil', { required: 'Data de validade é obrigatória' })}
                className="mt-1"
              />
              {errors.validUntil && (
                <p className="text-red-600 text-sm mt-1">{errors.validUntil.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva os detalhes do projeto..."
              rows={3}
              {...register('description')}
              className="mt-1"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-medium">Itens da Cotação</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="grid md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-5">
                      <Label htmlFor={`items.${index}.description`}>Descrição *</Label>
                      <Input
                        placeholder="Ex: Painel Solar 550W Monocristalino"
                        {...register(`items.${index}.description`, { 
                          required: 'Descrição é obrigatória' 
                        })}
                        className="mt-1"
                      />
                      {errors.items?.[index]?.description && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.items[index]?.description?.message}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor={`items.${index}.quantity`}>Qtd *</Label>
                      <Input
                        type="number"
                        min="1"
                        {...register(`items.${index}.quantity`, { 
                          required: 'Quantidade é obrigatória',
                          min: { value: 1, message: 'Mínimo 1' }
                        })}
                        className="mt-1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor={`items.${index}.unitPrice`}>Preço Unit. *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`items.${index}.unitPrice`, { 
                          required: 'Preço é obrigatório',
                          min: { value: 0, message: 'Preço deve ser positivo' }
                        })}
                        className="mt-1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Total</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm font-medium">
                        {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.unitPrice || 0))}
                      </div>
                    </div>

                    <div className="md:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={fields.length === 1}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Label htmlFor={`items.${index}.category`}>Categoria</Label>
                    <select
                      {...register(`items.${index}.category`)}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Selecione uma categoria</option>
                      <option value="paineis">Painéis Solares</option>
                      <option value="inversores">Inversores</option>
                      <option value="estruturas">Estruturas</option>
                      <option value="cabos">Cabos e Conectores</option>
                      <option value="instalacao">Instalação</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>
                </Card>
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2 text-gray-600" />
                  <span className="text-lg font-medium">Total da Cotação:</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculateTotal())}
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Notes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="terms">Termos e Condições</Label>
              <Textarea
                id="terms"
                placeholder="Condições de pagamento, prazo de entrega, garantias..."
                rows={4}
                {...register('terms')}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais..."
                rows={4}
                {...register('notes')}
                className="mt-1"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit(onSaveDraft)}
              disabled={submitting || sending}
            >
              {submitting ? (
                'Salvando...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Rascunho
                </>
              )}
            </Button>
            
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={submitting || sending}
              className="bg-green-600 hover:bg-green-700"
            >
              {sending ? (
                'Enviando...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Cotação
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}