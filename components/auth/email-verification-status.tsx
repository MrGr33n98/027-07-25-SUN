'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertTriangle, 
  Mail, 
  Clock,
  RefreshCw,
  X
} from 'lucide-react';

interface VerificationStatus {
  isVerified: boolean;
  requiresVerification: boolean;
  user?: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
}

interface EmailVerificationStatusProps {
  userId?: string;
  onVerificationRequired?: () => void;
  onVerificationComplete?: () => void;
  showDismiss?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function EmailVerificationStatus({
  userId,
  onVerificationRequired,
  onVerificationComplete,
  showDismiss = false,
  onDismiss,
  className = ""
}: EmailVerificationStatusProps) {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkVerificationStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const url = userId 
        ? '/api/auth/verification-status'
        : '/api/auth/verification-status';
      
      const options = userId 
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          }
        : { method: 'GET' };

      const response = await fetch(url, options);
      const result = await response.json();

      if (response.ok) {
        setStatus(result);
        
        // Notify parent components about verification status
        if (result.isVerified && onVerificationComplete) {
          onVerificationComplete();
        } else if (!result.isVerified && result.requiresVerification && onVerificationRequired) {
          onVerificationRequired();
        }
      } else {
        setError(result.error || 'Erro ao verificar status');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!status?.user?.email) return;

    setIsResending(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: status.user.email }),
      });

      const result = await response.json();

      if (response.ok) {
        // Show success feedback (could be enhanced with toast)
        setTimeout(() => {
          checkVerificationStatus(); // Refresh status
        }, 1000);
      } else {
        setError(result.error || 'Erro ao reenviar email');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    checkVerificationStatus();
    
    // Set up periodic status checking
    const interval = setInterval(checkVerificationStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [userId]);

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-lg ${className}`} data-testid="verification-status-loading">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">Verificando status do email...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg ${className}`} data-testid="verification-status-error">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
        <Button
          onClick={checkVerificationStatus}
          size="sm"
          variant="outline"
          className="text-xs"
          data-testid="retry-status-button"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  // If email is verified, show success status
  if (status.isVerified) {
    return (
      <div className={`flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg ${className}`} data-testid="verification-status-verified">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <div>
            <span className="text-sm font-medium text-green-800">Email verificado</span>
            {status.user?.email && (
              <p className="text-xs text-green-600">{status.user.email}</p>
            )}
          </div>
        </div>
        {showDismiss && onDismiss && (
          <Button
            onClick={onDismiss}
            size="sm"
            variant="ghost"
            className="text-green-600 hover:text-green-800 p-1"
            data-testid="dismiss-button"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  // If email verification is required but not verified
  if (status.requiresVerification && !status.isVerified) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`} data-testid="verification-status-required">
        <div className="flex items-start space-x-3">
          <Mail className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-yellow-800">Verificação de email necessária</h4>
              {showDismiss && onDismiss && (
                <Button
                  onClick={onDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-yellow-600 hover:text-yellow-800 p-1"
                  data-testid="dismiss-button"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Verifique seu email para acessar todos os recursos da plataforma.
            </p>
            {status.user?.email && (
              <p className="text-xs text-yellow-600 mb-3">
                Email: {status.user.email}
              </p>
            )}
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleResendVerification}
                disabled={isResending}
                size="sm"
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                data-testid="resend-verification-button"
              >
                {isResending ? (
                  <>
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reenviar email
                  </>
                )}
              </Button>
              <Button
                onClick={checkVerificationStatus}
                size="sm"
                variant="outline"
                className="text-xs"
                data-testid="refresh-status-button"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If verification is not required, don't show anything
  return null;
}

// Compact version for use in headers or small spaces
export function EmailVerificationBadge({
  userId,
  onVerificationRequired,
  className = ""
}: {
  userId?: string;
  onVerificationRequired?: () => void;
  className?: string;
}) {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const url = userId 
          ? '/api/auth/verification-status'
          : '/api/auth/verification-status';
        
        const options = userId 
          ? {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId })
            }
          : { method: 'GET' };

        const response = await fetch(url, options);
        const result = await response.json();

        if (response.ok) {
          setStatus(result);
          
          if (!result.isVerified && result.requiresVerification && onVerificationRequired) {
            onVerificationRequired();
          }
        }
      } catch (error) {
        // Silently fail for badge
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [userId, onVerificationRequired]);

  if (isLoading || !status || status.isVerified) {
    return null;
  }

  if (status.requiresVerification && !status.isVerified) {
    return (
      <div className={`inline-flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs ${className}`} data-testid="verification-badge">
        <Clock className="w-3 h-3" />
        <span>Email não verificado</span>
      </div>
    );
  }

  return null;
}