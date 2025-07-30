import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailVerificationStatus, EmailVerificationBadge } from '@/components/auth/email-verification-status';

// Mock fetch
global.fetch = jest.fn();

describe('EmailVerificationStatus', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows loading state initially', () => {
    // Mock pending fetch
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<EmailVerificationStatus />);
    
    expect(screen.getByTestId('verification-status-loading')).toBeInTheDocument();
    expect(screen.getByText('Verificando status do email...')).toBeInTheDocument();
  });

  it('shows verified status for verified email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        isVerified: true,
        requiresVerification: true,
        user: { id: '1', email: 'test@example.com', emailVerified: true }
      }),
    } as Response);

    const onVerificationComplete = jest.fn();
    render(<EmailVerificationStatus onVerificationComplete={onVerificationComplete} />);

    await waitFor(() => {
      expect(screen.getByTestId('verification-status-verified')).toBeInTheDocument();
      expect(screen.getByText('Email verificado')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    expect(onVerificationComplete).toHaveBeenCalled();
  });

  it('shows verification required status for unverified email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        isVerified: false,
        requiresVerification: true,
        user: { id: '1', email: 'test@example.com', emailVerified: false }
      }),
    } as Response);

    const onVerificationRequired = jest.fn();
    render(<EmailVerificationStatus onVerificationRequired={onVerificationRequired} />);

    await waitFor(() => {
      expect(screen.getByTestId('verification-status-required')).toBeInTheDocument();
      expect(screen.getByText('Verificação de email necessária')).toBeInTheDocument();
      expect(screen.getByText('Email: test@example.com')).toBeInTheDocument();
    });

    expect(onVerificationRequired).toHaveBeenCalled();
  });

  it('shows error state when API call fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<EmailVerificationStatus />);

    await waitFor(() => {
      expect(screen.getByTestId('verification-status-error')).toBeInTheDocument();
      expect(screen.getByText('Erro de conexão')).toBeInTheDocument();
    });
  });

  it('handles resend verification email', async () => {
    // Initial status check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        isVerified: false,
        requiresVerification: true,
        user: { id: '1', email: 'test@example.com', emailVerified: false }
      }),
    } as Response);

    render(<EmailVerificationStatus />);

    await waitFor(() => {
      expect(screen.getByTestId('resend-verification-button')).toBeInTheDocument();
    });

    // Mock resend verification API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Email sent' }),
    } as Response);

    // Mock status check after resend
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        isVerified: false,
        requiresVerification: true,
        user: { id: '1', email: 'test@example.com', emailVerified: false }
      }),
    } as Response);

    const resendButton = screen.getByTestId('resend-verification-button');
    fireEvent.click(resendButton);

    expect(resendButton).toHaveTextContent('Enviando...');
    expect(resendButton).toBeDisabled();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
    });
  });

  it('handles resend verification error', async () => {
    // Initial status check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        isVerified: false,
        requiresVerification: true,
        user: { id: '1', email: 'test@example.com', emailVerified: false }
      }),
    } as Response);

    render(<EmailVerificationStatus />);

    await waitFor(() => {
      expect(screen.getByTestId('resend-verification-button')).toBeInTheDocument();
    });

    // Mock resend verification API call failure
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Rate limit exceeded' }),
    } as Response);

    const resendButton = screen.getByTestId('resend-verification-button');
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByTestId('verification-status-error')).toBeInTheDocument();
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
    });
  });

  it('handles refresh status button', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<EmailVerificationStatus />);

    await waitFor(() => {
      expect(screen.getByTestId('retry-status-button')).toBeInTheDocument();
    });

    // Mock successful retry
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

  it('shows dismiss button when showDismiss is true', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        isVerified: true,
        requiresVerification: true,
        user: { id: '1', email: 'test@example.com', emailVerified: true }
      }),
    } as Response);

    const onDismiss = jest.fn();
    render(<EmailVerificationStatus showDismiss={true} onDismiss={onDismiss} />);

    await waitFor(() => {
      expect(screen.getByTestId('dismiss-button')).toBeInTheDocument();
    });

    const dismissButton = screen.getByTestId('dismiss-button');
    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalled();
  });

  it('handles userId prop for admin checking', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        isVerified: false,
        requiresVerification: true,
        user: { id: '2', email: 'user@example.com', emailVerified: false }
      }),
    } as Response);

    render(<EmailVerificationStatus userId="2" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/verification-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: '2' }),
      });
    });
  });

  it('periodically checks verification status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ 
        isVerified: false,
        requiresVerification: true,
        user: { id: '1', email: 'test@example.com', emailVerified: false }
      }),
    } as Response);

    render(<EmailVerificationStatus />);

    // Initial call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // Fast-forward 30 seconds to trigger periodic check
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('does not render when verification is not required', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        isVerified: false,
        requiresVerification: false,
        user: { id: '1', email: 'test@example.com', emailVerified: false }
      }),
    } as Response);

    const { container } = render(<EmailVerificationStatus />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});

describe('EmailVerificationBadge', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows badge for unverified email that requires verification', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        isVerified: false,
        requiresVerification: true,
        user: { id: '1', email: 'test@example.com', emailVerified: false }
      }),
    } as Response);

    const onVerificationRequired = jest.fn();
    render(<EmailVerificationBadge onVerificationRequired={onVerificationRequired} />);

    await waitFor(() => {
      expect(screen.getByTestId('verification-badge')).toBeInTheDocument();
      expect(screen.getByText('Email não verificado')).toBeInTheDocument();
    });

    expect(onVerificationRequired).toHaveBeenCalled();
  });

  it('does not show badge for verified email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        isVerified: true,
        requiresVerification: true,
        user: { id: '1', email: 'test@example.com', emailVerified: true }
      }),
    } as Response);

    const { container } = render(<EmailVerificationBadge />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('does not show badge when verification is not required', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        isVerified: false,
        requiresVerification: false,
        user: { id: '1', email: 'test@example.com', emailVerified: false }
      }),
    } as Response);

    const { container } = render(<EmailVerificationBadge />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('applies custom className', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        isVerified: false,
        requiresVerification: true,
        user: { id: '1', email: 'test@example.com', emailVerified: false }
      }),
    } as Response);

    render(<EmailVerificationBadge className="custom-badge-class" />);

    await waitFor(() => {
      const badge = screen.getByTestId('verification-badge');
      expect(badge).toHaveClass('custom-badge-class');
    });
  });

  it('silently handles API errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(<EmailVerificationBadge />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});