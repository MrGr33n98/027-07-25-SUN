'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Send } from 'lucide-react'
import { Company } from '@/types'

interface QuoteModalProps {
  isOpen: boolean
  onClose: () => void
  company: Company
}

export function QuoteModal({ isOpen, onClose, company }: QuoteModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: '',
    budget: '',
    location: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          companyId: company.id,
          source: 'Company Profile',
        }),
      })

      if (response.ok) {
        onClose()
        alert('Solicitação enviada com sucesso! A empresa entrará em contato em breve.')
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          projectType: '',
          budget: '',
          location: '',
          message: '',
        })
      } else {
        throw new Error('Erro ao enviar solicitação')
      }
    } catch (error) {
      console.error('Error submitting quote:', error)
      alert('Erro ao enviar solicitação. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Solicitar Orçamento - {company.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo *
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Seu nome completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail *
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localização *
                </label>
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="Cidade, Estado"
                />
              </div>
            </div>

            {/* Project Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de projeto *
                </label>
                <select
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="residencial">Residencial</option>
                  <option value="comercial">Comercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="rural">Rural</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orçamento estimado
                </label>
                <select
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Selecione a faixa</option>
                  <option value="ate-20k">Até R$ 20.000</option>
                  <option value="20k-50k">R$ 20.000 - R$ 50.000</option>
                  <option value="50k-100k">R$ 50.000 - R$ 100.000</option>
                  <option value="100k-mais">Acima de R$ 100.000</option>
                </select>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem adicional
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                placeholder="Descreva seu projeto, necessidades específicas, prazo desejado, etc."
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isSubmitting ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Solicitação
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}