/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordResetForm } from '@/components/auth/password-reset-form';

// Mock the password service
jest.mock('@/lib/password-service', () => ({
  passwordService: {
    validatePasswordStrength: jest.fn((password: string) => {
      if (!password) return { isValid: false, errors: [], score: 0 };
      
      const errors = [];
      let score = 0;
      
      if (password.length < 8) errors.push('Password must be at least 8 characters long');
      else score += 20;
      
      if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
      else score += 20;
      
      if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
      else score += 20;
      
      if (!/\d/.test(password)) errors.push('Password must contain at least one number');
      else score += 20;
      
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
      } else score += 20;
      
      return {
        isValid: errors.length === 0,
        errors,
        score: Math.min(score, 100)
      };
    })
  }
}));

// Mock fetch
global.fetch = jest.fn();

describe('PasswordResetForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();
  const mockToken = 'test-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  const renderComponent = () => {
    return render(
      <PasswordResetForm
        token={mockToken}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );
  };

  it('renders the password reset form correctly', () => {
    renderComponent();
    
    expect(screen.getByTestId('password-reset-form')).toBeInTheDocument();
    expect(screen.getByText('Redefinir Senha')).toBeInTheDocument();
    expect(screen.getByText('Digite sua nova senha abaixo')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('shows password strength meter when password is entered', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const passwordInput = screen.getByTestId('password-input');
    await user.type(passwordInput, 'weak');
    
    expect(screen.getByTestId('password-strength-meter')).toBeInTheDocument();
    expect(screen.getByTestId('strength-label')).toBeInTheDocument();
    expect(screen.getByTestId('strength-bar')).toBeInTheDocument();
  });

  it('displays password strength correctly for weak password', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const passwordInput = screen.getByTestId('password-input');
    await user.type(passwordInput, 'weak');
    
    await waitFor(() => {
      expect(screen.getByTestId('strength-label')).toHaveTextContent('Muito Fraca');
      expect(screen.getByTestId('password-errors')).toBeInTheDocument();
    });
  });

  it('displays password strength correctly for strong password', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const passwordInput = screen.getByTestId('password-input');
    await user.type(passwordInput, 'StrongPass123!');
    
    await waitFor(() => {
      expect(screen.getByTestId('strength-label')).toHaveTextContent('Muito Forte');
      expect(screen.queryByTestId('password-errors')).not.toBeInTheDocument();
    });
  });

  it('toggles password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
    const toggleButton = screen.getByTestId('toggle-password-visibility');
    
    expect(passwordInput.type).toBe('password');
    
    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    
    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('submits form successfully with valid data', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Password reset successful' })
    });
    
    renderComponent();
    
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const submitButton = screen.getByTestId('submit-button');
    
    await user.type(passwordInput, 'StrongPass123!');
    await user.type(confirmPasswordInput, 'StrongPass123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'StrongPass123!',
          confirmPassword: 'StrongPass123!',
          token: mockToken
        })
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles API error responses correctly', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Token expired' })
    });
    
    renderComponent();
    
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const submitButton = screen.getByTestId('submit-button');
    
    await user.type(passwordInput, 'StrongPass123!');
    await user.type(confirmPasswordInput, 'StrongPass123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Este link de redefinição expirou. Solicite um novo link.');
    });
  });

  it('displays security information', () => {
    renderComponent();
    
    expect(screen.getByText('Informações de Segurança:')).toBeInTheDocument();
    expect(screen.getByText('• Este link expira em 1 hora')).toBeInTheDocument();
    expect(screen.getByText('• Todas as sessões ativas serão encerradas')).toBeInTheDocument();
    expect(screen.getByText('• Use uma senha forte e única')).toBeInTheDocument();
  });
});