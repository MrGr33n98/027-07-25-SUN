'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  User, 
  Mail, 
  Lock, 
  Building2, 
  Phone, 
  MapPin,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { passwordService } from '@/lib/password-service'

const signupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().refine((password) => passwordService.validatePasswordStrength(password).isValid, {
    message: passwordService.validatePasswordStrength('').errors.join(', '),
  }),
  confirmPassword: z.string(),
  userType: z.enum(['USER', 'COMPANY'], {
    required_error: 'Selecione o tipo de conta',
  }),
  // Campos específicos para empresas
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Você deve aceitar os termos de uso',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.userType === 'COMPANY') {
    return data.companyName && data.cnpj && data.phone && data.city && data.state
  }
  return true
}, {
  message: "Todos os campos da empresa são obrigatórios",
  path: ["companyName"],
})

type SignupFormData = z.infer<typeof signupSchema>

const PasswordStrengthMeter = ({ password }: { password?: string }) => {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '' };
    const result = passwordService.validatePasswordStrength(password);
    let label = 'Muito Fraca';
    if (result.score >= 80) {
      label = 'Muito Forte';
    } else if (result.score >= 60) {
      label = 'Forte';
    } else if (result.score >= 40) {
      label = 'Média';
    } else if (result.score >= 20) {
      label = 'Fraca';
    }
    return { score: result.score, label };
  }, [password]);

  const getBarColor = () => {
    if (strength.score >= 80) return 'bg-green-500';
    if (strength.score >= 60) return 'bg-yellow-500';
    if (strength.score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full">
      <div className="h-2 bg-gray-200 rounded-full">
        <div
          className={`h-full rounded-full ${getBarColor()}`}
          style={{ width: `${strength.score}%` }}
        ></div>
      </div>
      <p className="text-sm text-right text-gray-500 mt-1">{strength.label}</p>
    </div>
  );
};

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      userType: 'USER',
    },
  })

  const userType = watch('userType')
  const password = watch('password')

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        // Redirect to login with success message
        router.push('/login?message=Conta criada com sucesso! Faça login para continuar.')
      } else {
        throw new Error(result.error || 'Erro ao criar conta')
      }
    } catch (error) {
      console.error('Signup error:', error)
      alert(error instanceof Error ? error.message : 'Erro ao criar conta')
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
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Escolha o tipo de conta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* User Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <label className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
              userType === 'USER' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                value="USER"
                {...register('userType')}
                className="sr-only"
              />
              <User className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="font-medium">Consumidor</div>
              <div className="text-sm text-gray-500">Busco energia solar</div>
            </label>

            <label className={`cursor-pointer border-2 rounded-lg p-4 text-center transition-all ${
              userType === 'COMPANY' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                value="COMPANY"
                {...register('userType')}
                className="sr-only"
              />
              <Building2 className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="font-medium">Empresa</div>
              <div className="text-sm text-gray-500">Vendo energia solar</div>
            </label>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome {userType === 'COMPANY' ? 'do Responsável' : 'Completo'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  {...register('name')}
                  placeholder="Seu nome completo"
                  className="pl-10"
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres, 1 maiúscula, 1 número, 1 especial"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthMeter password={password} />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Digite a senha novamente"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Company-specific fields */}
          {userType === 'COMPANY' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-900">Informações da Empresa</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    {...register('companyName')}
                    placeholder="Nome da sua empresa"
                    className="pl-10"
                  />
                </div>
                {errors.companyName && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ
                </label>
                <Input
                  {...register('cnpj')}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
                {errors.cnpj && (
                  <p className="text-red-500 text-sm mt-1">{errors.cnpj.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    {...register('phone')}
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      {...register('city')}
                      placeholder="Sua cidade"
                      className="pl-10"
                    />
                  </div>
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    {...register('state')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Selecione</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2">
            <input
              {...register('acceptTerms')}
              type="checkbox"
              className="mt-1 text-orange-600 focus:ring-orange-500"
            />
            <label className="text-sm text-gray-600">
              Eu aceito os{' '}
              <Link href="/termos" className="text-orange-600 hover:underline">
                Termos de Uso
              </Link>{' '}
              e{' '}
              <Link href="/privacidade" className="text-orange-600 hover:underline">
                Política de Privacidade
              </Link>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-red-500 text-sm">{errors.acceptTerms.message}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar Conta'
            )}
          </Button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-orange-600 hover:underline font-medium">
                Fazer login
              </Link>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
