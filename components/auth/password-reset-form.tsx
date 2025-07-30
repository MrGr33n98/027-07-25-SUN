'use client';

import { useState, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Sun,
  Clock
} from 'lucide-react';
import { passwordService } from '@/lib/password-service';

const FormSchema = z.object({
  password: z.string().refine((password) => passwordService.validatePasswordStrength(password).isValid, {
    message: 'A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial',
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof FormSchema>;

interface PasswordStrengthMeterProps {
  password?: string;
}

const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
    const result = passwordService.validatePasswordStrength(password);
    
    let label = 'Muito Fraca';
    let color = 'bg-red-500';
    
    if (result.score >= 80) {
      label = 'Muito Forte';
      color = 'bg-green-500';
    } else if (result.score >= 60) {
      label = 'Forte';
      color = 'bg-green-400';
    } else if (result.score >= 40) {
      label = 'Média';
      color = 'bg-yellow-500';
    } else if (result.score >= 20) {
      label = 'Fraca';
      color = 'bg-orange-500';
    }
    
    return { score: result.score, label, color, errors: result.errors };
  }, [password]);

  return (
    <div className="space-y-2" data-testid="password-strength-meter">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Força da senha:</span>
        <span className="text-sm font-medium" data-testid="strength-label">{strength.label}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${strength.score}%` }}
          data-testid="strength-bar"
        />
      </div>
      {strength.errors && strength.errors.length > 0 && (
        <ul className="text-xs text-red-600 space-y-1" data-testid="password-errors">
          {strength.errors.map((error, index) => (
            <li key={index}>• {error}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface PasswordResetFormProps {
  token: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function PasswordResetForm({ token, onSuccess, onError }: PasswordResetFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = form.watch('password');

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, token }),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        if (response.status === 400 && result.message?.includes('expired')) {
          onError('Este link de redefinição expirou. Solicite um novo link.');
        } else if (response.status === 400 && result.message?.includes('invalid')) {
          onError('Link de redefinição inválido. Solicite um novo link.');
        } else {
          onError(result.message || 'Ocorreu um erro inesperado.');
        }
      }
    } catch (error) {
      onError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md" data-testid="password-reset-form">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
            <Sun className="w-8 h-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
        <p className="text-gray-600">
          Digite sua nova senha abaixo
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                {...form.register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres, 1 maiúscula, 1 número, 1 especial"
                className="pl-10 pr-10"
                disabled={isLoading}
                data-testid="password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
                data-testid="toggle-password-visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password && <PasswordStrengthMeter password={password} />}
            {form.formState.errors.password && (
              <p className="text-red-500 text-sm mt-1" data-testid="password-error">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                {...form.register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Digite a senha novamente"
                className="pl-10 pr-10"
                disabled={isLoading}
                data-testid="confirm-password-input"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
                data-testid="toggle-confirm-password-visibility"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1" data-testid="confirm-password-error">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={isLoading}
            data-testid="submit-button"
          >
            {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
          </Button>
        </form>

        {/* Security Information */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-medium text-blue-800">Informações de Segurança:</p>
          </div>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Este link expira em 1 hora</li>
            <li>• Todas as sessões ativas serão encerradas</li>
            <li>• Use uma senha forte e única</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}