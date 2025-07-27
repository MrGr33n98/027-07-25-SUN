import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Login - SolarConnect',
  description: 'Faça login na sua conta SolarConnect',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 flex items-center justify-center py-12">
        <LoginForm />
      </main>
      <Footer />
    </div>
  )
}