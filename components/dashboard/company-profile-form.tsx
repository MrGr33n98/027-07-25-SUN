'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Instagram, 
  Linkedin,
  Save,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react'
import { CompanyProfile, User } from '@prisma/client'
import { generateSlug } from '@/lib/utils'
import { ImageUpload } from '@/components/ui/image-upload'

interface CompanyProfileFormProps {
  company: (CompanyProfile & { user: User }) | null
  userId: string
}

export function CompanyProfileForm({ company, userId }: CompanyProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: company?.name || '',
    slug: company?.slug || '',
    description: company?.description || '',
    logo: company?.logo || '',
    banner: company?.banner || '',
    location: company?.location || '',
    city: company?.city || '',
    state: company?.state || '',
    phone: company?.phone || '',
    email: company?.email || '',
    website: company?.website || '',
    whatsapp: company?.whatsapp || '',
    instagram: company?.instagram || '',
    linkedin: company?.linkedin || '',
    specialties: company?.specialties || [],
    certifications: company?.certifications || [],
    yearsExperience: company?.yearsExperience || 0,
    teamSize: company?.teamSize || '',
    serviceAreas: company?.serviceAreas || [],
  })

  const [newSpecialty, setNewSpecialty] = useState('')
  const [newCertification, setNewCertification] = useState('')
  const [newServiceArea, setNewServiceArea] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'yearsExperience' ? parseInt(value) || 0 : value
    }))

    // Auto-generate slug from name
    if (name === 'name') {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }))
    }
  }

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }))
      setNewSpecialty('')
    }
  }

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }))
  }

  const addCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }))
      setNewCertification('')
    }
  }

  const removeCertification = (certification: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c !== certification)
    }))
  }

  const addServiceArea = () => {
    if (newServiceArea.trim() && !formData.serviceAreas.includes(newServiceArea.trim())) {
      setFormData(prev => ({
        ...prev,
        serviceAreas: [...prev.serviceAreas, newServiceArea.trim()]
      }))
      setNewServiceArea('')
    }
  }

  const removeServiceArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter(a => a !== area)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/company/profile', {
        method: company ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId,
        }),
      })

      if (response.ok) {
        router.refresh()
        // TODO: Show success toast
        alert('Perfil atualizado com sucesso!')
      } else {
        throw new Error('Erro ao salvar perfil')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Erro ao salvar perfil. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Empresa *
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nome da sua empresa"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Personalizada *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  solarconnect.com/empresa/
                </span>
                <Input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="sua-empresa"
                  className="rounded-l-none"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição da Empresa *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              placeholder="Descreva sua empresa, serviços e diferenciais..."
              required
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo da Empresa
            </label>
            <ImageUpload
              endpoint="companyLogo"
              value={formData.logo}
              onChange={(url) => setFormData(prev => ({ ...prev, logo: url as string }))}
            />
          </div>

          {/* Banner Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner da Empresa
            </label>
            <ImageUpload
              endpoint="companyBanner"
              value={formData.banner}
              onChange={(url) => setFormData(prev => ({ ...prev, banner: url as string }))}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Localização Completa
              </label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Endereço completo"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade *
              </label>
              <Input
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="São Paulo"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado *
              </label>
              <Input
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="SP"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone Principal
              </label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              <Input
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail Comercial
              </label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contato@empresa.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <Input
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.empresa.com"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram
              </label>
              <Input
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="@empresa"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn
              </label>
              <Input
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="linkedin.com/company/empresa"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anos de Experiência
              </label>
              <Input
                name="yearsExperience"
                type="number"
                value={formData.yearsExperience}
                onChange={handleChange}
                placeholder="10"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tamanho da Equipe
              </label>
              <select
                name="teamSize"
                value={formData.teamSize}
                onChange={(e) => setFormData(prev => ({ ...prev, teamSize: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Selecione</option>
                <option value="1-5 funcionários">1-5 funcionários</option>
                <option value="6-10 funcionários">6-10 funcionários</option>
                <option value="11-20 funcionários">11-20 funcionários</option>
                <option value="21-50 funcionários">21-50 funcionários</option>
                <option value="50+ funcionários">50+ funcionários</option>
              </select>
            </div>
          </div>

          {/* Specialties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Especialidades
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.specialties.map((specialty, index) => (
                <span
                  key={index}
                  className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full flex items-center"
                >
                  {specialty}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(specialty)}
                    className="ml-2 text-orange-600 hover:text-orange-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="Ex: Residencial, Comercial, Industrial"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
              />
              <Button type="button" onClick={addSpecialty} variant="outline">
                Adicionar
              </Button>
            </div>
          </div>

          {/* Certifications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificações
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.certifications.map((cert, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full flex items-center"
                >
                  {cert}
                  <button
                    type="button"
                    onClick={() => removeCertification(cert)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="Ex: INMETRO, ISO 9001, ABNT NBR 16274"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
              />
              <Button type="button" onClick={addCertification} variant="outline">
                Adicionar
              </Button>
            </div>
          </div>

          {/* Service Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Áreas de Atendimento
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.serviceAreas.map((area, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full flex items-center"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => removeServiceArea(area)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newServiceArea}
                onChange={(e) => setNewServiceArea(e.target.value)}
                placeholder="Ex: São Paulo, Grande São Paulo, Interior SP"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceArea())}
              />
              <Button type="button" onClick={addServiceArea} variant="outline">
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {isLoading ? (
            'Salvando...'
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Perfil
            </>
          )}
        </Button>
      </div>
    </form>
  )
}