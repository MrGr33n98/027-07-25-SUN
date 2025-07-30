'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Clock, Sun, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

interface EmailVerificationPromptProps {
  email: string;
  onVerificationComplete?: () => void;
  showTitle?: boolean;
  className?: string;
}

export function EmailVerificationPrompt({ 
  email, 
  onVerificationComplete,
  showTitle = true,
  className = ""
}: EmailVerificationPromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formatTimeRemaining = (resetTime: number): string => {
    const now = Date.now();
    const remaining = Math.max(0, resetTime - now);
    const minutes = Math.ceil(remaining / (1000 * 60));
    
    if (minutes <= 1) return 'menos de 1 minuto';
    if (minutes < 60) return `${minutes} minutos`;
    
    const hours = Math.ceil(minutes / 60);
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  };

  const formatLastSent = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'agora mesmo';
    if (minutes === 1) return 'há 1 minuto';
    if (minutes < 60) return `há ${minutes} minutos`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'há 1 hora';
    return `há ${hours} horas`;
  };

  async function handleResendVerification() {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Email de verificação enviado com sucesso! Verifique sua caixa de entrada.');
        setLastSentAt(Date.now());
        setRateLimitInfo(null);
      } else if (response.status === 429) {
        // Rate limit exceeded
        const rateLimitInfo: RateLimitInfo = {
          limit: parseInt(response.headers.get('X-RateLimit-Limit') || '5'),
          remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
          resetTime: parseInt(response.headers.get('X-RateLimit-Reset') || '0'),
        };
        setRateLimitInfo(rateLimitInfo);
        setError(result.error || 'Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError(result.error || 'Ocorreu um erro inesperado.');
      }
    } catch (error) {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  // Check verification status periodically
  useEffect(() => {
    if (!onVerificationComplete) return;

    const checkVerificationStatus = async () => {
      try {
        const response = await fetch('/api/auth/verification-status');
        if (response.ok) {
          const result = await response.json();
          if (result.isVerified) {
            onVerificationComplete();
          }
        }
      } catch (error) {
        // Silently fail - this is just a convenience check
      }
    };

    const interval = setInterval(checkVerificationStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [onVerificationComplete]);

  return (
    <Card className={`w-full max-w-md ${className}`} data-testid="email-verification-prompt">
      {showTitle && (
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
              <Sun className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Verificar Email</CardTitle>
          <p className="text-gray-600">
            Confirme seu endereço de email para continuar
          </p>
        </CardHeader>
      )}

      <CardContent className={showTitle ? "" : "pt-6"}>
        <div className="space-y-4">
          {/* Email Display */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Mail className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Email enviado para:</p>
              <p className="text-sm text-gray-600" data-testid="email-display">{email}</p>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="success-message">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Email enviado!</p>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg" data-testid="error-message">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Erro</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Rate Limit Info */}
          {rateLimitInfo && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg" data-testid="rate-limit-info">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">
                  {rateLimitInfo.remaining === 0 ? 'Limite atingido' : 'Limite de tentativas'}
                </p>
              </div>
              {rateLimitInfo.remaining === 0 ? (
                <p className="text-sm text-yellow-700">
                  Aguarde {formatTimeRemaining(rateLimitInfo.resetTime)} antes de tentar novamente
                </p>
              ) : (
                <p className="text-sm text-yellow-700">
                  Tentativas restantes: {rateLimitInfo.remaining} de {rateLimitInfo.limit}
                </p>
              )}
            </div>
          )}

          {/* Last Sent Info */}
          {lastSentAt && (
            <p className="text-xs text-gray-500 text-center" data-testid="last-sent-info">
              Último email enviado {formatLastSent(lastSentAt)}
            </p>
          )}

          {/* Resend Button */}
          <Button
            onClick={handleResendVerification}
            disabled={isLoading || (rateLimitInfo?.remaining === 0)}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300"
            data-testid="resend-button"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Enviando...' : 'Reenviar Email de Verificação'}
          </Button>

          {/* Instructions */}
          <div className="space-y-3 text-sm text-gray-600">
            <p className="font-medium">Instruções:</p>
            <ul className="space-y-1 text-xs">
              <li>• Verifique sua caixa de entrada e pasta de spam</li>
              <li>• Clique no link de verificação no email</li>
              <li>• O link expira em 24 horas por segurança</li>
              <li>• Você pode solicitar um novo email se necessário</li>
            </ul>
          </div>

          {/* Security Information */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-medium text-blue-800 mb-2">Informações de Segurança:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Máximo de 5 tentativas por hora</li>
              <li>• Links expiram em 24 horas</li>
              <li>• Sempre verifique o remetente do email</li>
              <li>• Não compartilhe links de verificação</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}