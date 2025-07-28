import { z } from 'zod'
import { ProductCategory, ProjectType } from '@/types'

export const companyRegistrationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  description: z.string().min(50, 'Descrição deve ter pelo menos 50 caracteres'),
  location: z.string().min(5, 'Localização é obrigatória'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  specialties: z.array(z.string()).min(1, 'Selecione pelo menos uma especialidade'),
  yearsExperience: z.number().min(0, 'Anos de experiência deve ser positivo'),
  teamSize: z.string().min(1, 'Tamanho da equipe é obrigatório'),
  serviceAreas: z.array(z.string()).min(1, 'Selecione pelo menos uma área de atendimento'),
})

export const productSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres'),
  price: z.number().min(0, 'Preço deve ser positivo'),
  originalPrice: z.number().min(0, 'Preço original deve ser positivo').optional(),
  power: z.number().min(0, 'Potência deve ser positiva').optional(),
  efficiency: z.number().min(0).max(100, 'Eficiência deve estar entre 0 e 100').optional(),
  warranty: z.number().min(0, 'Garantia deve ser positiva').optional(),
  category: z.nativeEnum(ProductCategory),
  brand: z.string().optional(),
  model: z.string().optional(),
  inStock: z.boolean().default(true),
  images: z.array(z.string()).min(1, 'Adicione pelo menos uma imagem'),
  specifications: z.record(z.string()).optional(),
})

export const reviewSchema = z.object({
  rating: z.number().min(1, 'Avaliação mínima é 1').max(5, 'Avaliação máxima é 5'),
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  comment: z.string().min(20, 'Comentário deve ter pelo menos 20 caracteres'),
  customerName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  customerLocation: z.string().min(2, 'Localização é obrigatória'),
  projectType: z.string().min(1, 'Tipo de projeto é obrigatório'),
  installationDate: z.date().optional(),
})

export const projectSchema = z.object({
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  description: z.string().min(50, 'Descrição deve ter pelo menos 50 caracteres'),
  location: z.string().min(5, 'Localização é obrigatória'),
  power: z.number().min(0, 'Potência deve ser positiva'),
  completionDate: z.date(),
  projectType: z.nativeEnum(ProjectType),
  images: z.array(z.string()).min(1, 'Adicione pelo menos uma imagem'),
})

export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  category: z.nativeEnum(ProductCategory).optional(),
  categoria: z.string().optional(), // Para filtro de categoria de empresa
  especialidade: z.string().optional(), // Para filtro de especialidade
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minRating: z.number().min(1).max(5).optional(),
  verified: z.boolean().optional(),
  inStock: z.boolean().optional(),
  sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'rating', 'newest']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12),
})

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  message: z.string().min(20, 'Mensagem deve ter pelo menos 20 caracteres'),
  projectType: z.string().min(1, 'Tipo de projeto é obrigatório'),
  budget: z.string().optional(),
  location: z.string().min(5, 'Localização é obrigatória'),
})

export type CompanyRegistrationInput = z.infer<typeof companyRegistrationSchema>
export type ProductInput = z.infer<typeof productSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>
export type ContactFormInput = z.infer<typeof contactFormSchema>