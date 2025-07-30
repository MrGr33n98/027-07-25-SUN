
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordPage from '@/app/forgot-password/page';

// Mock the useToast hook
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ message: 'Password reset email sent' }),
    ok: true,
  })
) as jest.Mock;

describe('ForgotPasswordPage', () => {
  it('renders the forgot password form', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
  });

  it('shows a success message after submitting the form', async () => {
    const { toast } = require('@/components/ui/use-toast');
    render(<ForgotPasswordPage />);
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
            title: 'Password Reset Email Sent',
            description: 'Password reset email sent',
        });
    });
  });
});
