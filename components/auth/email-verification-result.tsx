'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Sun, 
  Loader2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface EmailVerificationResultProps {
  token: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type VerificationState = 'loading' | 'success' | 'error' | 'expired' | 'invalid';

interface VerificationResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
}

export function EmailVerificationResult({ 
  token, 
  onSuccess, 
  onError 
}: EmailVerificationResultProps) {
  const [state, setState] = useState<VerificationState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const router = useRouter();

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      });

      const result: VerificationResult = await response.json();

      if (response.ok && result.success) {
        setState('success');
        setUser(result.user);
        onSuccess?.();
      } else {
        const errorMessage = result.error || 'Erro desconhecido';
        setError(errorMessage);
        
        if (errorMessage.toLowerCase().includes('expired') || errorMessage.toLowerCase().includes('expirado')) {
          setState('expired');
        } else if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('inválido')) {
          setState('invalid');
        } else {
          setState('error');
        }
        
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      setError(errorMessage);
      setState('error');
      onError?.(errorMessage);
    }
  };

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setState('invalid');
      setError('Token de verificação não fornecido');
    }
  }, [token]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setState('loading');
    setError(null);
    
    await verifyEmail(token);
    setIsRetrying(false);
  };

  const handleResendVerification = () => {
    router.push('/verify-email');
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Verificando Email</CardTitle>
              <p className="text-gray-600">
                Aguarde enquanto verificamos seu email...
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            </CardContent>
          </>
        );

      case 'success':
        return (
          <>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-green-700">Email Verificado!</CardTitle>
              <p className="text-gray-600">
                Seu email foi verificado com sucesso. Agora você tem acesso completo à plataforma.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="success-info">
                    <p className="text-sm font-medium text-green-800">Conta verificada:</p>
                    <p className="text-sm text-green-700">{user.email}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Button
                    onClick={handleGoToDashboard}
                    className="w-full bg-green-500 hover:bg-green-600"
                    data-testid="go-to-dashboard-button"
                  >
                    Ir para o Dashboard
                  </Button>
                  <Button
                    onClick={handleGoToLogin}
                    variant="outline"
                    className="w-full"
                    data-testid="go-to-login-button"
                  >
                    Fazer Login
                  </Button>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-800 mb-2">Próximos passos:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Complete seu perfil na área do usuário</li>
                    <li>• Explore o marketplace de empresas solares</li>
                    <li>• Configure suas preferências de notificação</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </>
        );

      case 'expired':
        return (
          <>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-yellow-700">Link Expirado</CardTitle>
              <p className="text-gray-600">
                Este link de verificação expirou. Links de verificação são válidos por apenas 24 horas por segurança.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg" data-testid="expired-info">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-800">Link expirado</p>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Por motivos de segurança, links de verificação expiram em 24 horas.
                  </p>
                </div>

                <Button
                  onClick={handleResendVerification}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  data-testid="request-new-link-button"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Solicitar Novo Link
                </Button>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-800 mb-2">Informações de Segurança:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Links expiram em 24 horas por segurança</li>
                    <li>• Cada link pode ser usado apenas uma vez</li>
                    <li>• Você pode solicitar um novo link a qualquer momento</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </>
        );

      case 'invalid':
        return (
          <>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-red-700">Link Inválido</CardTitle>
              <p className="text-gray-600">
                Este link de verificação é inválido ou já foi usado.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="invalid-info">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-medium text-red-800">Link inválido</p>
                  </div>
                  <p className="text-sm text-red-700">
                    {error || 'Este link pode ter sido usado anteriormente ou estar corrompido.'}
                  </p>
                </div>

                <Button
                  onClick={handleResendVerification}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  data-testid="request-new-link-button"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Solicitar Novo Link
                </Button>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-800 mb-2">Possíveis causas:</p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Link já foi usado anteriormente</li>
                    <li>• Link foi copiado incorretamente</li>
                    <li>• Link foi corrompido durante o envio</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </>
        );

      case 'error':
      default:
        return (
          <>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-red-700">Erro na Verificação</CardTitle>
              <p className="text-gray-600">
                Ocorreu um erro ao verificar seu email. Tente novamente.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="error-info">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-medium text-red-800">Erro</p>
                  </div>
                  <p className="text-sm text-red-700">
                    {error || 'Ocorreu um erro inesperado durante a verificação.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    data-testid="retry-button"
                  >
                    {isRetrying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Tentando novamente...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Tentar Novamente
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleResendVerification}
                    variant="outline"
                    className="w-full"
                    data-testid="request-new-link-button"
                  >
                    Solicitar Novo Link
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        );
    }
  };

  return (
    <Card className="w-full max-w-md" data-testid="email-verification-result">
      {renderContent()}
    </Card>
  );
}