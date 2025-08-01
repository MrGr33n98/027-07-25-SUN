export interface Company {
  id: string
  name: string
  slug: string
  description: string
  logo?: string
  banner?: string
  rating: number
  reviewCount: number
  location: string
  city: string
  state: string
  verified: boolean
  phone?: string
  email?: string
  website?: string
  whatsapp?: string
  instagram?: string
  linkedin?: string
  specialties: string[]
  certifications: string[]
  yearsExperience: number
  projectsCompleted: number
  teamSize: string
  serviceAreas: string[]
  createdAt: Date
  updatedAt: Date
  
  products?: Product[]
  reviews?: Review[]
  projects?: Project[]
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  power?: number // Watts
  efficiency?: number // Percentage
  warranty?: number // Years
  inStock: boolean
  images: string[]
  category: ProductCategory
  brand?: string
  model?: string
  specifications: Record<string, string>
  
  company: Company
  companyId: string
  createdAt: Date
  updatedAt: Date
}

export interface Review {
  id: string
  rating: number
  title: string
  comment: string
  customerName: string
  customerLocation: string
  projectType: string
  installationDate?: Date
  verified: boolean
  helpful: number
  
  company: Company
  companyId: string
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  title: string
  description: string
  images: string[]
  location: string
  power: number // kWp
  completionDate: Date
  projectType: ProjectType
  
  company: Company
  companyId: string
  createdAt: Date
  updatedAt: Date
}

export enum ProductCategory {
  PAINEL_SOLAR = 'painel_solar',
  INVERSOR = 'inversor',
  BATERIA = 'bateria',
  ESTRUTURA = 'estrutura',
  CABO = 'cabo',
  ACESSORIO = 'acessorio',
  KIT_COMPLETO = 'kit_completo',
}

export enum ProjectType {
  RESIDENCIAL = 'residencial',
  COMERCIAL = 'comercial',
  INDUSTRIAL = 'industrial',
  RURAL = 'rural',
  PUBLICO = 'publico',
}

export interface SearchFilters {
  query?: string
  location?: string
  category?: ProductCategory
  minPrice?: number
  maxPrice?: number
  minRating?: number
  verified?: boolean
  inStock?: boolean
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest'
  page?: number
  limit?: number
}

export interface SearchResults<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface User {
  id: string
  name: string
  email: string
  image?: string
  role: UserRole
  status: UserStatus
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  CUSTOMER = 'customer',
  COMPANY = 'company',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export interface CompanyProfile extends Company {
  userId: string
  user: User
}