import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailVerificationPrompt } from '@/components/auth/email-verification-prompt';

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('EmailVerificationPrompt', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const defaultProps = {
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders with email display', () => {
    render(<EmailVerificationPrompt {...defaultProps} />);
    
    expect(screen.getByTestId('email-verification-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('email-display')).toHaveTextContent('test@example.com');
    expect(screen.getByText('Verificar Email')).toBeInTheDocument();
    expect(screen.getByTestId('resend-button')).toBeInTheDocument();
  });

  it('renders without title when showTitle is false', () => {
    render(<EmailVerificationPrompt {...defaultProps} showTitle={false} />);
    
    expect(screen.queryByText('Verificar Email')).not.toBeInTheDocument();
    expect(screen.getByTestId('email-display')).toHaveTextContent('test@example.com');
  });

  it('handles successful resend verification', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Email sent successfully' }),
      headers: new Headers(),
    } as Response);

    render(<EmailVerificationPrompt {...defaultProps} />);
    
    const resendButton = screen.getByTestId('resend-button');
    fireEvent.click(resendButton);

    expect(resendButton).toHaveTextContent('Enviando...');
    expect(resendButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
      expect(screen.getByText('Email de verificação enviado com sucesso! Verifique sua caixa de entrada.')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
  });

  it('handles rate limit error', async () => {
    const rateLimitHeaders = new Headers();
    rateLimitHeaders.set('X-RateLimit-Limit', '5');
    rateLimitHeaders.set('X-RateLimit-Remaining', '0');
    rateLimitHeaders.set('X-RateLimit-Reset', String(Date.now() + 3600000)); // 1 hour from now

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Rate limit exceeded' }),
      headers: rateLimitHeaders,
    } as Response);

    render(<EmailVerificationPrompt {...defaultProps} />);
    
    const resendButton = screen.getByTestId('resend-button');
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByTestId('rate-limit-info')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    expect(resendButton).toBeDisabled();
  });

  it('handles generic error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid email address' }),
      headers: new Headers(),
    } as Response);

    render(<EmailVerificationPrompt {...defaultProps} />);
    
    const resendButton = screen.getByTestId('resend-button');
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  it('handles network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<EmailVerificationPrompt {...defaultProps} />);
    
    const resendButton = screen.getByTestId('resend-button');
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Erro de conexão. Verifique sua internet e tente novamente.')).toBeInTheDocument();
    });
  });

  it('shows last sent timestamp after successful resend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Email sent successfully' }),
      headers: new Headers(),
    } as Response);

    render(<EmailVerificationPrompt {...defaultProps} />);
    
    const resendButton = screen.getByTestId('resend-button');
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });

    expect(screen.getByTestId('last-sent-info')).toBeInTheDocument();
    expect(screen.getByTestId('last-sent-info')).toHaveTextContent('Último email enviado agora mesmo');
  });

  it('calls onVerificationComplete when verification status changes', async () => {
    const onVerificationComplete = jest.fn();
    
    // Mock verification status check
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ isVerified: true }),
      headers: new Headers(),
    } as Response);

    render(
      <EmailVerificationPrompt 
        {...defaultProps} 
        onVerificationComplete={onVerificationComplete}
      />
    );

    // Fast-forward time to trigger the verification check
    jest.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(onVerificationComplete).toHaveBeenCalled();
    });
  });

  it('displays security information', () => {
    render(<EmailVerificationPrompt {...defaultProps} />);
    
    expect(screen.getByText('Informações de Segurança:')).toBeInTheDocument();
    expect(screen.getByText('• Máximo de 5 tentativas por hora')).toBeInTheDocument();
    expect(screen.getByText('• Links expiram em 24 horas')).toBeInTheDocument();
    expect(screen.getByText('• Sempre verifique o remetente do email')).toBeInTheDocument();
    expect(screen.getByText('• Não compartilhe links de verificação')).toBeInTheDocument();
  });

  it('displays instructions', () => {
    render(<EmailVerificationPrompt {...defaultProps} />);
    
    expect(screen.getByText('Instruções:')).toBeInTheDocument();
    expect(screen.getByText('• Verifique sua caixa de entrada e pasta de spam')).toBeInTheDocument();
    expect(screen.getByText('• Clique no link de verificação no email')).toBeInTheDocument();
    expect(screen.getByText('• O link expira em 24 horas por segurança')).toBeInTheDocument();
    expect(screen.getByText('• Você pode solicitar um novo email se necessário')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<EmailVerificationPrompt {...defaultProps} className="custom-class" />);
    
    const component = screen.getByTestId('email-verification-prompt');
    expect(component).toHaveClass('custom-class');
  });

  it('shows rate limit remaining attempts', async () => {
    const rateLimitHeaders = new Headers();
    rateLimitHeaders.set('X-RateLimit-Limit', '5');
    rateLimitHeaders.set('X-RateLimit-Remaining', '2');
    rateLimitHeaders.set('X-RateLimit-Reset', String(Date.now() + 3600000));

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Rate limit exceeded' }),
      headers: rateLimitHeaders,
    } as Response);

    render(<EmailVerificationPrompt {...defaultProps} />);
    
    const resendButton = screen.getByTestId('resend-button');
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByTestId('rate-limit-info')).toBeInTheDocument();
      expect(screen.getByText('Tentativas restantes: 2 de 5')).toBeInTheDocument();
    });

    expect(resendButton).not.toBeDisabled();
  });
});