/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordForm, RateLimitMessage } from '@/components/auth/forgot-password-form';

// Mock fetch
global.fetch = jest.fn();

describe('ForgotPasswordForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  const renderComponent = () => {
    return render(
      <ForgotPasswordForm
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );
  };

  it('renders the forgot password form correctly', () => {
    renderComponent();

    expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
    expect(screen.getByText('Esqueceu sua senha?')).toBeInTheDocument();
    expect(screen.getByText('Digite seu email para receber um link de redefinição')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderComponent();

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toHaveTextContent('Por favor, insira um email válido.');
    });
  });

  it('submits form successfully with valid email', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Reset email sent' })
    });

    renderComponent();

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles rate limit error correctly', async () => {
    const user = userEvent.setup();
    const mockHeaders = new Map([
      ['X-RateLimit-Limit', '3'],
      ['X-RateLimit-Remaining', '0'],
      ['X-RateLimit-Reset', String(Date.now() + 3600000)] // 1 hour from now
    ]);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: {
        get: (key: string) => mockHeaders.get(key) || null
      },
      json: async () => ({ message: 'Too many requests' })
    });

    renderComponent();

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        'Too many requests',
        {
          limit: 3,
          remaining: 0,
          resetTime: expect.any(Number)
        }
      );
    });
  });

  it('handles general API error correctly', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'User not found' })
    });

    renderComponent();

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('User not found');
    });
  });

  it('handles network error correctly', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    renderComponent();

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Erro de conexão. Verifique sua internet e tente novamente.');
    });
  });

  it('disables form inputs and button while loading', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => { })); // Never resolves

    renderComponent();

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Enviando...');
    });
  });

  it('resets form after successful submission', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Reset email sent' })
    });

    renderComponent();

    const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    expect(emailInput.value).toBe('test@example.com');

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(emailInput.value).toBe('');
    });
  });

  it('displays security information', () => {
    renderComponent();

    expect(screen.getByText('Informações de Segurança:')).toBeInTheDocument();
    expect(screen.getByText('• O link expira em 1 hora por segurança')).toBeInTheDocument();
    expect(screen.getByText('• Máximo de 3 tentativas por hora')).toBeInTheDocument();
    expect(screen.getByText('• Verifique sempre o remetente do email')).toBeInTheDocument();
  });
});

describe('RateLimitMessage', () => {
  it('displays rate limit exceeded message when remaining is 0', () => {
    const rateLimitInfo = {
      limit: 3,
      remaining: 0,
      resetTime: Date.now() + 3600000 // 1 hour from now
    };

    render(<RateLimitMessage rateLimitInfo={rateLimitInfo} />);

    expect(screen.getByTestId('rate-limit-message')).toBeInTheDocument();
    expect(screen.getByText('Limite de tentativas atingido')).toBeInTheDocument();
    expect(screen.getByText(/Aguarde.*antes de tentar novamente/)).toBeInTheDocument();
  });

  it('displays remaining attempts when not at limit', () => {
    const rateLimitInfo = {
      limit: 3,
      remaining: 2,
      resetTime: Date.now() + 3600000
    };

    render(<RateLimitMessage rateLimitInfo={rateLimitInfo} />);

    expect(screen.getByTestId('rate-limit-info')).toBeInTheDocument();
    expect(screen.getByText('Tentativas restantes: 2 de 3')).toBeInTheDocument();
  });

  it('formats time remaining correctly for minutes', () => {
    const rateLimitInfo = {
      limit: 3,
      remaining: 0,
      resetTime: Date.now() + 30 * 60 * 1000 // 30 minutes from now
    };

    render(<RateLimitMessage rateLimitInfo={rateLimitInfo} />);

    expect(screen.getByText(/Aguarde 30 minutos antes de tentar novamente/)).toBeInTheDocument();
  });

  it('formats time remaining correctly for hours', () => {
    const rateLimitInfo = {
      limit: 3,
      remaining: 0,
      resetTime: Date.now() + 2 * 60 * 60 * 1000 // 2 hours from now
    };

    render(<RateLimitMessage rateLimitInfo={rateLimitInfo} />);

    expect(screen.getByText(/Aguarde 2 horas antes de tentar novamente/)).toBeInTheDocument();
  });

  it('formats time remaining correctly for less than 1 minute', () => {
    const rateLimitInfo = {
      limit: 3,
      remaining: 0,
      resetTime: Date.now() + 30 * 1000 // 30 seconds from now
    };

    render(<RateLimitMessage rateLimitInfo={rateLimitInfo} />);

    expect(screen.getByText(/Aguarde menos de 1 minuto antes de tentar novamente/)).toBeInTheDocument();
  });
});