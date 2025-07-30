
'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Clock, AlertTriangle, CheckCircle, Sun } from 'lucide-react';

const FormSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
});

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
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

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setError('');
    setRateLimitInfo(null);

    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        form.reset();
      } else if (response.status === 429) {
        // Rate limit exceeded
        setRateLimitInfo({
          limit: parseInt(response.headers.get('X-RateLimit-Limit') || '3'),
          remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
          resetTime: parseInt(response.headers.get('X-RateLimit-Reset') || '0'),
        });
        setError(result.message || 'Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError(result.message || 'Ocorreu um erro inesperado.');
      }
    } catch (error) {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Email Enviado!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Se existe uma conta com este email, você receberá um link para redefinir sua senha em alguns minutos.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>Não recebeu o email?</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1 text-left">
                <li>• Verifique sua caixa de spam</li>
                <li>• Aguarde até 10 minutos</li>
                <li>• Certifique-se de que digitou o email correto</li>
              </ul>
            </div>
            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => {
                  setSuccess(false);
                  setError('');
                  form.reset();
                }}
                variant="outline"
                className="w-full"
              >
                Tentar Outro Email
              </Button>
              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
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
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{error}</p>
                  {rateLimitInfo && (
                    <div className="mt-2 text-xs">
                      <p>Tentativas restantes: {rateLimitInfo.remaining}</p>
                      <p>Tente novamente em: {formatTimeRemaining(rateLimitInfo.resetTime)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {rateLimitInfo && rateLimitInfo.remaining === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm flex items-start space-x-2">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Limite de tentativas atingido</p>
                  <p className="text-xs mt-1">
                    Aguarde {formatTimeRemaining(rateLimitInfo.resetTime)} antes de tentar novamente
                  </p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={isLoading || (rateLimitInfo?.remaining === 0)}
            >
              {isLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-500 inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao login
            </Link>
          </div>

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
    </div>
  );
}
