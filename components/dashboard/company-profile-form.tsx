'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Loader2,
  Save,
  Image
} from 'lucide-react'
import { CompanyProfile, User } from '@prisma/client'
import { useUploadThing } from '@/hooks/use-uploadthing'

const companyProfileSchema = z.object({
  name: z.string().min(2, {
    message: "Nome deve ter pelo menos 2 caracteres.",
  }),
  description: z.string().min(20, {
    message: "Descrição deve ter pelo menos 20 caracteres.",
  }),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  location: z.string().optional(),
  specialties: z.string().optional(),
  yearsExperience: z.coerce.number().min(0, "Anos de experiência deve ser maior que 0").optional(),
  teamSize: z.string().optional(),
  serviceAreas: z.string().optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
})

type CompanyProfileFormData = z.infer<typeof companyProfileSchema>

interface CompanyProfileFormProps {
  company: CompanyProfile & {
    user: User
  }
}

export function CompanyProfileForm({ company }: CompanyProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  // Upload hooks
  const { startUpload: uploadLogo } = useUploadThing("companyLogo")
  const { startUpload: uploadBanner } = useUploadThing("companyBanner")

  const form = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: company.name,
      description: company.description,
      phone: company.phone || '',
      email: company.email || '',
      website: company.website || '',
      whatsapp: company.whatsapp || '',
      instagram: company.instagram || '',
      linkedin: company.linkedin || '',
      city: company.city || '',
      state: company.state || '',
      location: company.location || '',
      specialties: company.specialties.join(', '),
      yearsExperience: company.yearsExperience,
      teamSize: company.teamSize || '',
      serviceAreas: company.serviceAreas.join(', '),
      logo: company.logo || '',
      banner: company.banner || '',
    },
  })

  // Upload handlers
  const handleLogoUpload = async (files: File[]) => {
    if (!files.length) return []
    
    const result = await uploadLogo(files)
    return result?.map(file => file.url) || []
  }

  const handleBannerUpload = async (files: File[]) => {
    if (!files.length) return []
    
    const result = await uploadBanner(files)
    return result?.map(file => file.url) || []
  }

  async function onSubmit(data: CompanyProfileFormData) {
    setIsLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/dashboard/company-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          specialties: data.specialties?.split(',').map(s => s.trim()).filter(Boolean) || [],
          serviceAreas: data.serviceAreas?.split(',').map(s => s.trim()).filter(Boolean) || [],
        }),
      })

      if (response.ok) {
        setMessage('Perfil atualizado com sucesso!')
        router.refresh()
      } else {
        const error = await response.json()
        setMessage(error.message || 'Erro ao atualizar perfil')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('Erro ao atualizar perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {message && (
          <div className={`p-4 rounded-md ${
            message.includes('sucesso') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Informações Básicas
            </CardTitle>
            <CardDescription>
              Gerencie as informações principais da sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da sua empresa" {...field} />
                  </FormControl>
                  <FormDescription>
                    Este é o nome que aparecerá no marketplace
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Empresa *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva sua empresa, serviços e diferenciais..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Uma boa descrição ajuda clientes a conhecer seus serviços
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="yearsExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anos de Experiência</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho da Equipe</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Selecione</option>
                        <option value="1-5">1-5 funcionários</option>
                        <option value="6-10">6-10 funcionários</option>
                        <option value="11-20">11-20 funcionários</option>
                        <option value="21-50">21-50 funcionários</option>
                        <option value="50+">Mais de 50 funcionários</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specialties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidades</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="residencial, comercial, industrial, rural..."
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Separe as especialidades por vírgula (ex: residencial, comercial, industrial)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Image className="w-5 h-5 mr-2" />
              Imagens da Empresa
            </CardTitle>
            <CardDescription>
              Adicione logo e banner para sua empresa se destacar no marketplace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo da Empresa</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value || ''}
                      onChange={field.onChange}
                      onUpload={handleLogoUpload}
                      aspectRatio="square"
                      maxSize={4 * 1024 * 1024}
                      placeholder="Upload do logo da empresa"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Recomendado: 400x400px, PNG ou JPG, máximo 4MB
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Banner Upload */}
            <FormField
              control={form.control}
              name="banner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner da Empresa</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value || ''}
                      onChange={field.onChange}
                      onUpload={handleBannerUpload}
                      aspectRatio="video"
                      maxSize={8 * 1024 * 1024}
                      placeholder="Upload do banner da empresa"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Recomendado: 1200x630px, PNG ou JPG, máximo 8MB
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Localização
            </CardTitle>
            <CardDescription>
              Informe onde sua empresa está localizada e atende
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Sua cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Selecione</option>
                        {states.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serviceAreas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Áreas de Atendimento</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="São Paulo, Grande São Paulo, Interior..."
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Liste as regiões onde sua empresa atende, separadas por vírgula
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              Informações de Contato
            </CardTitle>
            <CardDescription>
              Como os clientes podem entrar em contato com você
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="contato@empresa.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input 
                        placeholder="https://www.empresa.com"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input placeholder="@empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input placeholder="linkedin.com/company/empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}