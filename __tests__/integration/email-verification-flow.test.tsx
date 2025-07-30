import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailVerificationPrompt } from '@/components/auth/email-verification-prompt';
import { EmailVerificationResult } from '@/components/auth/email-verification-result';
import { EmailVerificationStatus } from '@/components/auth/email-verification-status';

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Email Verification Flow Integration', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Complete verification flow', () => {
    it('handles complete email verification workflow', async () => {
      const testEmail = 'test@example.com';
      const testToken = 'verification-token-123';

      // Step 1: User sees verification prompt
      const { unmount: unmountPrompt } = render(
        <EmailVerificationPrompt email={testEmail} />
      );

      expect(screen.getByText('Verificar Email')).toBeInTheDocument();
      expect(screen.getByTestId('email-display')).toHaveTextContent(testEmail);

      // Step 2: User clicks resend verification
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Email sent successfully' }),
        headers: new Headers(),
      } as Response);

      const resendButton = screen.getByTestId('resend-button');
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
      });

      unmountPrompt();

      // Step 3: User clicks verification link (EmailVerificationResult component)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          message: 'Email verified successfully',
          user: { id: '1', email: testEmail, emailVerified: true }
        }),
      } as Response);

      const { unmount: unmountResult } = render(
        <EmailVerificationResult token={testToken} />
      );

      await waitFor(() => {
        expect(screen.getByText('Email Verificado!')).toBeInTheDocument();
        expect(screen.getByText(testEmail)).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: testToken }),
      });

      unmountResult();

      // Step 4: Verification status component shows verified state
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          isVerified: true,
          requiresVerification: true,
          user: { id: '1', email: testEmail, emailVerified: true }
        }),
      } as Response);

      render(<EmailVerificationStatus />);

      await waitFor(() => {
        expect(screen.getByTestId('verification-status-verified')).toBeInTheDocument();
        expect(screen.getByText('Email verificado')).toBeInTheDocument();
      });
    });

    it('handles expired token scenario', async () => {
      const testToken = 'expired-token-123';

      // User clicks expired verification link
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          success: false, 
          error: 'Token has expired' 
        }),
      } as Response);

      render(<EmailVerificationResult token={testToken} />);

      await waitFor(() => {
        expect(screen.getByText('Link Expirado')).toBeInTheDocument();
        expect(screen.getByTestId('request-new-link-button')).toBeInTheDocument();
      });

      // User clicks "Request New Link" button
      const newLinkButton = screen.getByTestId('request-new-link-button');
      fireEvent.click(newLinkButton);

      expect(mockPush).toHaveBeenCalledWith('/verify-email');
    });

    it('handles rate limiting during resend attempts', async () => {
      const testEmail = 'test@example.com';

      render(<EmailVerificationPrompt email={testEmail} />);

      // First attempt - rate limited
      const rateLimitHeaders = new Headers();
      rateLimitHeaders.set('X-RateLimit-Limit', '5');
      rateLimitHeaders.set('X-RateLimit-Remaining', '0');
      rateLimitHeaders.set('X-RateLimit-Reset', String(Date.now() + 3600000));

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' }),
        headers: rateLimitHeaders,
      } as Response);

      const resendButton = screen.getByTestId('resend-button');
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(screen.getByTestId('rate-limit-info')).toBeInTheDocument();
        expect(screen.getByText('Limite atingido')).toBeInTheDocument();
      });

      expect(resendButton).toBeDisabled();
    });

    it('handles network errors gracefully', async () => {
      const testEmail = 'test@example.com';

      render(<EmailVerificationPrompt email={testEmail} />);

      // Network error during resend
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const resendButton = screen.getByTestId('resend-button');
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Erro de conexão. Verifique sua internet e tente novamente.')).toBeInTheDocument();
      });
    });
  });

  describe('Status monitoring integration', () => {
    it('automatically detects verification completion', async () => {
      const testEmail = 'test@example.com';
      const onVerificationComplete = jest.fn();

      // Initial status check - not verified
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          isVerified: false,
          requiresVerification: true,
          user: { id: '1', email: testEmail, emailVerified: false }
        }),
      } as Response);

      render(
        <EmailVerificationPrompt 
          email={testEmail} 
          onVerificationComplete={onVerificationComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('email-verification-prompt')).toBeInTheDocument();
      });

      // Simulate periodic check that finds verification completed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          isVerified: true,
          requiresVerification: true,
          user: { id: '1', email: testEmail, emailVerified: true }
        }),
      } as Response);

      // Fast-forward to trigger periodic check
      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(onVerificationComplete).toHaveBeenCalled();
      });
    });

    it('shows verification status in different states', async () => {
      const testCases = [
        {
          status: { isVerified: true, requiresVerification: true, user: { id: '1', email: 'test@example.com', emailVerified: true } },
          expectedTestId: 'verification-status-verified',
          expectedText: 'Email verificado'
        },
        {
          status: { isVerified: false, requiresVerification: true, user: { id: '1', email: 'test@example.com', emailVerified: false } },
          expectedTestId: 'verification-status-required',
          expectedText: 'Verificação de email necessária'
        }
      ];

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => testCase.status,
        } as Response);

        const { unmount } = render(<EmailVerificationStatus />);

        await waitFor(() => {
          expect(screen.getByTestId(testCase.expectedTestId)).toBeInTheDocument();
          expect(screen.getByText(testCase.expectedText)).toBeInTheDocument();
        });

        unmount();
        jest.clearAllMocks();
      }
    });
  });

  describe('Error recovery scenarios', () => {
    it('allows retry after verification failure', async () => {
      const testToken = 'test-token';

      // First attempt fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<EmailVerificationResult token={testToken} />);

      await waitFor(() => {
        expect(screen.getByText('Erro na Verificação')).toBeInTheDocument();
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      });

      // Second attempt succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          message: 'Email verified successfully',
          user: { id: '1', email: 'test@example.com', emailVerified: true }
        }),
      } as Response);

      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Email Verificado!')).toBeInTheDocument();
      });
    });

    it('handles API errors in status component', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      render(<EmailVerificationStatus />);

      await waitFor(() => {
        expect(screen.getByTestId('verification-status-error')).toBeInTheDocument();
        expect(screen.getByText('Erro de conexão')).toBeInTheDocument();
      });

      // Retry should work
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          isVerified: true,
          requiresVerification: true,
          user: { id: '1', email: 'test@example.com', emailVerified: true }
        }),
      } as Response);

      const retryButton = screen.getByTestId('retry-status-button');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('verification-status-verified')).toBeInTheDocument();
      });
    });
  });

  describe('User experience flows', () => {
    it('provides clear navigation paths', async () => {
      const testToken = 'valid-token';

      // Successful verification
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          user: { id: '1', email: 'test@example.com', emailVerified: true }
        }),
      } as Response);

      render(<EmailVerificationResult token={testToken} />);

      await waitFor(() => {
        expect(screen.getByTestId('go-to-dashboard-button')).toBeInTheDocument();
        expect(screen.getByTestId('go-to-login-button')).toBeInTheDocument();
      });

      // Test dashboard navigation
      const dashboardButton = screen.getByTestId('go-to-dashboard-button');
      fireEvent.click(dashboardButton);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');

      // Reset mock
      mockPush.mockClear();

      // Test login navigation
      const loginButton = screen.getByTestId('go-to-login-button');
      fireEvent.click(loginButton);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('shows appropriate security information', () => {
      const testEmail = 'test@example.com';

      render(<EmailVerificationPrompt email={testEmail} />);

      // Check security information is displayed
      expect(screen.getByText('Informações de Segurança:')).toBeInTheDocument();
      expect(screen.getByText('• Máximo de 5 tentativas por hora')).toBeInTheDocument();
      expect(screen.getByText('• Links expiram em 24 horas')).toBeInTheDocument();
      expect(screen.getByText('• Sempre verifique o remetente do email')).toBeInTheDocument();
      expect(screen.getByText('• Não compartilhe links de verificação')).toBeInTheDocument();

      // Check instructions are displayed
      expect(screen.getByText('Instruções:')).toBeInTheDocument();
      expect(screen.getByText('• Verifique sua caixa de entrada e pasta de spam')).toBeInTheDocument();
      expect(screen.getByText('• Clique no link de verificação no email')).toBeInTheDocument();
    });
  });
});