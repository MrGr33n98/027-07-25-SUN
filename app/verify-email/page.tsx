
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { EmailVerificationPrompt } from '@/components/auth/email-verification-prompt';
import { EmailVerificationResult } from '@/components/auth/email-verification-result';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const handleVerificationComplete = () => {
    // Redirect to dashboard or login page after successful verification
    router.push('/dashboard');
  };

  const handleVerificationError = (error: string) => {
    console.error('Email verification error:', error);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      {token ? (
        // If token is present, show verification result component
        <EmailVerificationResult
          token={token}
          onSuccess={handleVerificationComplete}
          onError={handleVerificationError}
        />
      ) : email ? (
        // If email is present, show verification prompt
        <EmailVerificationPrompt
          email={email}
          onVerificationComplete={handleVerificationComplete}
        />
      ) : (
        // If neither token nor email, show generic verification prompt
        <div className="w-full max-w-md">
          <EmailVerificationPrompt
            email="seu@email.com"
            showTitle={true}
          />
        </div>
      )}
    </div>
  );
}
