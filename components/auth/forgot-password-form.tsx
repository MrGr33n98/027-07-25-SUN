'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, AlertTriangle, Clock, Sun } from 'lucide-react';

const FormSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
});

type FormData = z.infer<typeof FormSchema>;

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

interface ForgotPasswordFormProps {
  onSuccess: () => void;
  onError: (error: string, rateLimitInfo?: RateLimitInfo) => void;
}

export function ForgotPasswordForm({ onSuccess, onError }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
    },
  });

  const formatTimeRemaining = (resetTime: number): string => {
    const now = Date.now();
    const remaining = Math.max(0, resetTime - now);
    const minutes = Math.ceil(remaining / (1000 * 60));
    
    if (minutes <= 1) return 'menos de 1 minuto';
    if (minutes < 60) return `${minutes} minutos`;
    
    const hours = Math.ceil(minutes / 60);
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  };

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess();
        form.reset();
      } else if (response.status === 429) {
        // Rate limit exceeded
        const rateLimitInfo: RateLimitInfo = {
          limit: parseInt(response.headers.get('X-RateLimit-Limit') || '3'),
          remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
          resetTime: parseInt(response.headers.get('X-RateLimit-Reset') || '0'),
        };
        onError(result.message || 'Muitas tentativas. Tente novamente mais tarde.', rateLimitInfo);
      } else {
        onError(result.message || 'Ocorreu um erro inesperado.');
      }
    } catch (error) {
      onError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md" data-testid="forgot-password-form">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
            <Sun className="w-8 h-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Esqueceu sua senha?</CardTitle>
        <p className="text-gray-600">
          Digite seu email para receber um link de redefinição
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                {...form.register('email')}
                type="email"
                placeholder="seu@email.com"
                className="pl-10"
                disabled={isLoading}
                data-testid="email-input"
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm mt-1" data-testid="email-error">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={isLoading}
            data-testid="submit-button"
          >
            {isLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
          </Button>
        </form>

        {/* Security Information */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm font-medium text-blue-800 mb-2">Informações de Segurança:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• O link expira em 1 hora por segurança</li>
            <li>• Máximo de 3 tentativas por hora</li>
            <li>• Verifique sempre o remetente do email</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

interface RateLimitMessageProps {
  rateLimitInfo: RateLimitInfo;
}

export function RateLimitMessage({ rateLimitInfo }: RateLimitMessageProps) {
  const formatTimeRemaining = (resetTime: number): string => {
    const now = Date.now();
    const remaining = Math.max(0, resetTime - now);
    const minutes = Math.ceil(remaining / (1000 * 60));
    
    if (minutes <= 1) return 'menos de 1 minuto';
    if (minutes < 60) return `${minutes} minutos`;
    
    const hours = Math.ceil(minutes / 60);
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  };

  if (rateLimitInfo.remaining === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm flex items-start space-x-2" data-testid="rate-limit-message">
        <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">Limite de tentativas atingido</p>
          <p className="text-xs mt-1">
            Aguarde {formatTimeRemaining(rateLimitInfo.resetTime)} antes de tentar novamente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm" data-testid="rate-limit-info">
      <p>Tentativas restantes: {rateLimitInfo.remaining} de {rateLimitInfo.limit}</p>
    </div>
  );
}