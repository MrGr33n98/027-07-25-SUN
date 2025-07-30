import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import ForgotPasswordPage from '@/app/forgot-password/page';
import ResetPasswordPage from '@/app/reset-password/page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock password service
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
    }),
    validateTokenFormat: jest.fn((token: string) => {
      return token && token.length >= 32 && /^[a-f0-9]+$/i.test(token);
    })
  }
}));

// Mock fetch
global.fetch = jest.fn();

describe('Password Reset Flow Integration', () => {
  const mockPush = jest.fn();
  const mockSearchParams = {
    get: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Forgot Password Flow', () => {
    it('completes forgot password flow successfully', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Reset email sent' })
      });

      render(<ForgotPasswordPage />);

      // Fill in email
      const emailInput = screen.getByPlaceholderText('seu@email.com');
      await user.type(emailInput, 'test@example.com');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /enviar link de redefinição/i });
      await user.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' })
        });
      });

      // Verify success state
      await waitFor(() => {
        expect(screen.getByText('Email Enviado!')).toBeInTheDocument();
        expect(screen.getByText(/se existe uma conta com este email/i)).toBeInTheDocument();
      });
    });

    it('handles rate limiting correctly', async () => {
      const user = userEvent.setup();
      const mockHeaders = new Map([
        ['X-RateLimit-Limit', '3'],
        ['X-RateLimit-Remaining', '0'],
        ['X-RateLimit-Reset', String(Date.now() + 3600000)]
      ]);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: {
          get: (key: string) => mockHeaders.get(key) || null
        },
        json: async () => ({ message: 'Too many requests' })
      });

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText('seu@email.com');
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /enviar link de redefinição/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Too many requests')).toBeInTheDocument();
        expect(screen.getByText('Limite de tentativas atingido')).toBeInTheDocument();
      });
    });

    it('shows validation errors for invalid email', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText('seu@email.com');
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /enviar link de redefinição/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Por favor, insira um email válido.')).toBeInTheDocument();
      });
    });
  });

  describe('Reset Password Flow', () => {
    it('completes password reset flow successfully', async () => {
      const user = userEvent.setup();
      const validToken = 'a'.repeat(64); // 64 character hex token
      
      mockSearchParams.get.mockReturnValue(validToken);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Password reset successful' })
      });

      render(<ResetPasswordPage />);

      // Wait for token validation
      await waitFor(() => {
        expect(screen.getByText('Redefinir Senha')).toBeInTheDocument();
      });

      // Fill in passwords
      const passwordInput = screen.getByPlaceholderText(/mínimo 8 caracteres/i);
      const confirmPasswordInput = screen.getByPlaceholderText('Digite a senha novamente');
      
      await user.type(passwordInput, 'StrongPass123!');
      await user.type(confirmPasswordInput, 'StrongPass123!');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /redefinir senha/i });
      await user.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: 'StrongPass123!',
            confirmPassword: 'StrongPass123!',
            token: validToken
          })
        });
      });

      // Verify success state
      await waitFor(() => {
        expect(screen.getByText('Senha Redefinida!')).toBeInTheDocument();
        expect(screen.getByText(/sua senha foi redefinida com sucesso/i)).toBeInTheDocument();
      });
    });

    it('shows invalid token message for missing token', async () => {
      mockSearchParams.get.mockReturnValue(null);
      
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Link Inválido')).toBeInTheDocument();
        expect(screen.getByText(/este link de redefinição de senha é inválido/i)).toBeInTheDocument();
      });
    });

    it('shows invalid token message for malformed token', async () => {
      mockSearchParams.get.mockReturnValue('invalid-token');
      
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Link Inválido')).toBeInTheDocument();
      });
    });

    it('shows password strength validation', async () => {
      const user = userEvent.setup();
      const validToken = 'a'.repeat(64);
      mockSearchParams.get.mockReturnValue(validToken);

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Redefinir Senha')).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/mínimo 8 caracteres/i);
      await user.type(passwordInput, 'weak');

      await waitFor(() => {
        expect(screen.getByText('Muito Fraca')).toBeInTheDocument();
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('shows password mismatch error', async () => {
      const user = userEvent.setup();
      const validToken = 'a'.repeat(64);
      mockSearchParams.get.mockReturnValue(validToken);

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Redefinir Senha')).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/mínimo 8 caracteres/i);
      const confirmPasswordInput = screen.getByPlaceholderText('Digite a senha novamente');
      const submitButton = screen.getByRole('button', { name: /redefinir senha/i });

      await user.type(passwordInput, 'StrongPass123!');
      await user.type(confirmPasswordInput, 'DifferentPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument();
      });
    });

    it('handles expired token error', async () => {
      const user = userEvent.setup();
      const validToken = 'a'.repeat(64);
      mockSearchParams.get.mockReturnValue(validToken);
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Token expired' })
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Redefinir Senha')).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/mínimo 8 caracteres/i);
      const confirmPasswordInput = screen.getByPlaceholderText('Digite a senha novamente');
      const submitButton = screen.getByRole('button', { name: /redefinir senha/i });

      await user.type(passwordInput, 'StrongPass123!');
      await user.type(confirmPasswordInput, 'StrongPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Este link de redefinição expirou. Solicite um novo link.')).toBeInTheDocument();
      });
    });
  });

  describe('User Experience Features', () => {
    it('shows loading states during form submission', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByPlaceholderText('seu@email.com');
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /enviar link de redefinição/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Enviando...')).toBeInTheDocument();
        expect(emailInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      const validToken = 'a'.repeat(64);
      mockSearchParams.get.mockReturnValue(validToken);

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Redefinir Senha')).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/mínimo 8 caracteres/i) as HTMLInputElement;
      const toggleButton = screen.getAllByRole('button').find(btn => 
        btn.getAttribute('data-testid') === 'toggle-password-visibility'
      );

      expect(passwordInput.type).toBe('password');
      
      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput.type).toBe('text');
      }
    });

    it('displays security information', () => {
      render(<ForgotPasswordPage />);

      expect(screen.getByText('Informações de Segurança:')).toBeInTheDocument();
      expect(screen.getByText('• O link expira em 1 hora por segurança')).toBeInTheDocument();
      expect(screen.getByText('• Máximo de 3 tentativas por hora')).toBeInTheDocument();
    });
  });
});