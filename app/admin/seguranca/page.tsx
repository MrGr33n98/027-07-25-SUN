import { Metadata } from 'next'
import { SecurityDashboard } from '@/components/admin/security-dashboard'

export const metadata: Metadata = {
  title: 'Painel de Segurança - Admin',
  description: 'Painel administrativo de segurança e eventos de autenticação',
}

export default function SecurityPage() {
  return <SecurityDashboard />
}