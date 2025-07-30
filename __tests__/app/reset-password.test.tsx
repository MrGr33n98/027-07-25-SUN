
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPasswordPage from '@/app/reset-password/page';
import { useSearchParams } from 'next/navigation';

// Mock the useToast hook
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

// Mock the useSearchParams hook
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ message: 'Password reset successful' }),
    ok: true,
  })
) as jest.Mock;

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams({ token: 'test-token' }));
  });

  it('renders the reset password form', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('shows a success message after submitting the form', async () => {
    const { toast } = require('@/components/ui/use-toast');
    render(<ResetPasswordPage />);
    fireEvent.input(screen.getByLabelText('New Password'), { target: { value: 'newpassword123' } });
    fireEvent.input(screen.getByLabelText('Confirm New Password'), { target: { value: 'newpassword123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
            title: 'Password Reset Successful',
            description: 'You can now log in with your new password.',
        });
    });
  });
});
