import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailVerificationResult } from '@/components/auth/email-verification-result';

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('EmailVerificationResult', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const defaultProps = {
    token: 'valid-token-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    // Mock pending fetch
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<EmailVerificationResult {...defaultProps} />);
    
    expect(screen.getByTestId('email-verification-result')).toBeInTheDocument();
    expect(screen.getByText('Verificando Email')).toBeInTheDocument();
    expect(screen.getByText('Aguarde enquanto verificamos seu email...')).toBeInTheDocument();
  });

  it('shows success state after successful verification', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      emailVerified: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        message: 'Email verified successfully',
        user: mockUser 
      }),
    } as Response);

    const onSuccess = jest.fn();
    render(<EmailVerificationResult {...defaultProps} onSuccess={onSuccess} />);

    await waitFor(() => {
      expect(screen.getByText('Email Verificado!')).toBeInTheDocument();
      expect(screen.getByText('Seu email foi verificado com sucesso. Agora você tem acesso completo à plataforma.')).toBeInTheDocument();
      expect(screen.getByTestId('success-info')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'valid-token-123' }),
    });
  });

  it('shows expired state for expired token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ 
        success: false, 
        error: 'Token expired' 
      }),
    } as Response);

    const onError = jest.fn();
    render(<EmailVerificationResult {...defaultProps} onError={onError} />);

    await waitFor(() => {
      expect(screen.getByText('Link Expirado')).toBeInTheDocument();
      expect(screen.getByText('Este link de verificação expirou. Links de verificação são válidos por apenas 24 horas por segurança.')).toBeInTheDocument();
      expect(screen.getByTestId('expired-info')).toBeInTheDocument();
    });

    expect(onError).toHaveBeenCalledWith('Token expired');
  });

  it('shows invalid state for invalid token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ 
        success: false, 
        error: 'Invalid token' 
      }),
    } as Response);

    const onError = jest.fn();
    render(<EmailVerificationResult {...defaultProps} onError={onError} />);

    await waitFor(() => {
      expect(screen.getByText('Link Inválido')).toBeInTheDocument();
      expect(screen.getByText('Este link de verificação é inválido ou já foi usado.')).toBeInTheDocument();
      expect(screen.getByTestId('invalid-info')).toBeInTheDocument();
    });

    expect(onError).toHaveBeenCalledWith('Invalid token');
  });

  it('shows error state for network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const onError = jest.fn();
    render(<EmailVerificationResult {...defaultProps} onError={onError} />);

    await waitFor(() => {
      expect(screen.getByText('Erro na Verificação')).toBeInTheDocument();
      expect(screen.getByText('Ocorreu um erro ao verificar seu email. Tente novamente.')).toBeInTheDocument();
      expect(screen.getByTestId('error-info')).toBeInTheDocument();
    });

    expect(onError).toHaveBeenCalledWith('Erro de conexão. Verifique sua internet e tente novamente.');
  });

  it('handles retry functionality', async () => {
    // First call fails
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<EmailVerificationResult {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Erro na Verificação')).toBeInTheDocument();
    });

    // Second call succeeds
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

    expect(retryButton).toHaveTextContent('Tentando novamente...');
    expect(retryButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Email Verificado!')).toBeInTheDocument();
    });
  });

  it('navigates to dashboard on success button click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        user: { id: '1', email: 'test@example.com', emailVerified: true }
      }),
    } as Response);

    render(<EmailVerificationResult {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('go-to-dashboard-button')).toBeInTheDocument();
    });

    const dashboardButton = screen.getByTestId('go-to-dashboard-button');
    fireEvent.click(dashboardButton);

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to login on login button click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        user: { id: '1', email: 'test@example.com', emailVerified: true }
      }),
    } as Response);

    render(<EmailVerificationResult {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('go-to-login-button')).toBeInTheDocument();
    });

    const loginButton = screen.getByTestId('go-to-login-button');
    fireEvent.click(loginButton);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('navigates to verify-email on request new link button click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ 
        success: false, 
        error: 'Token expired' 
      }),
    } as Response);

    render(<EmailVerificationResult {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('request-new-link-button')).toBeInTheDocument();
    });

    const newLinkButton = screen.getByTestId('request-new-link-button');
    fireEvent.click(newLinkButton);

    expect(mockPush).toHaveBeenCalledWith('/verify-email');
  });

  it('handles missing token', () => {
    render(<EmailVerificationResult token="" />);

    expect(screen.getByText('Link Inválido')).toBeInTheDocument();
    expect(screen.getByText('Token de verificação não fornecido')).toBeInTheDocument();
  });

  it('shows appropriate error messages for different error types', async () => {
    const testCases = [
      {
        error: 'Token has expired',
        expectedState: 'expired',
        expectedTitle: 'Link Expirado'
      },
      {
        error: 'Invalid verification token',
        expectedState: 'invalid',
        expectedTitle: 'Link Inválido'
      },
      {
        error: 'Some other error',
        expectedState: 'error',
        expectedTitle: 'Erro na Verificação'
      }
    ];

    for (const testCase of testCases) {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          success: false, 
          error: testCase.error 
        }),
      } as Response);

      const { unmount } = render(<EmailVerificationResult token="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(testCase.expectedTitle)).toBeInTheDocument();
      });

      unmount();
      jest.clearAllMocks();
    }
  });

  it('displays security information in different states', async () => {
    // Test expired state security info
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ 
        success: false, 
        error: 'Token expired' 
      }),
    } as Response);

    render(<EmailVerificationResult {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Informações de Segurança:')).toBeInTheDocument();
      expect(screen.getByText('• Links expiram em 24 horas por segurança')).toBeInTheDocument();
      expect(screen.getByText('• Cada link pode ser usado apenas uma vez')).toBeInTheDocument();
    });
  });
});