
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignupForm } from '@/components/auth/signup-form';
import { passwordService } from '@/lib/password-service';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the passwordService
jest.mock('@/lib/password-service', () => ({
  passwordService: {
    validatePasswordStrength: jest.fn(),
  },
}));

describe('SignupForm', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('renders the signup form', () => {
    render(<SignupForm />);
    expect(screen.getByPlaceholderText('Seu nome completo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mínimo 8 caracteres, 1 maiúscula, 1 número, 1 especial')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite a senha novamente')).toBeInTheDocument();
  });

  it('shows an error message if passwords do not match', async () => {
    render(<SignupForm />);
    fireEvent.input(screen.getByPlaceholderText('Mínimo 8 caracteres, 1 maiúscula, 1 número, 1 especial'), { target: { value: 'password123' } });
    fireEvent.input(screen.getByPlaceholderText('Digite a senha novamente'), { target: { value: 'password456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Conta' }));

    await waitFor(() => {
      expect(screen.getByText('Senhas não coincidem')).toBeInTheDocument();
    });
  });

  it('shows password strength meter', () => {
    (passwordService.validatePasswordStrength as jest.Mock).mockReturnValue({ score: 40, label: 'Média' });
    render(<SignupForm />);
    fireEvent.input(screen.getByPlaceholderText('Mínimo 8 caracteres, 1 maiúscula, 1 número, 1 especial'), { target: { value: 'Password123' } });
    expect(screen.getByText('Média')).toBeInTheDocument();
  });
});
