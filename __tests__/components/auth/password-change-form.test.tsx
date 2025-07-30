import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordChangeForm } from '@/components/auth/password-change-form'

// Mock the password service
jest.mock('@/lib/password-service', () => ({
  passwordService: {
    validatePasswordStrength: jest.fn().mockImplementation((password) => {
      if (!password) return { isValid: false, errors: [], score: 0 }
      
      const errors = []
      let score = 0
      
      if (password.length < 8) errors.push('Password must be at least 8 characters long')
      else score += 20
      
      if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter')
      else score += 15
      
      if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter')
      else score += 15
      
      if (!/\d/.test(password)) errors.push('Password must contain at least one number')
      else score += 15
      
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character')
      } else {
        score += 15
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        score: Math.min(score, 100)
      }
    })
  }
}))

// Mock the toast hook
jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    addToast: jest.fn()
  })
}))

// Mock fetch
global.fetch = jest.fn()

describe('PasswordChangeForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all form fields correctly', () => {
    render(<PasswordChangeForm />)
    
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument()
  })

  it('shows password visibility toggle buttons', () => {
    render(<PasswordChangeForm />)
    
    const toggleButtons = screen.getAllByRole('button', { name: '' })
    // Should have 3 toggle buttons (one for each password field)
    expect(toggleButtons).toHaveLength(4) // 3 toggles + 1 submit button
  })

  it('toggles password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup()
    render(<PasswordChangeForm />)
    
    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const toggleButtons = screen.getAllByRole('button', { name: '' })
    
    // Initially password should be hidden
    expect(currentPasswordInput).toHaveAttribute('type', 'password')
    
    // Click the first toggle button (current password)
    await user.click(toggleButtons[0])
    
    // Password should now be visible
    expect(currentPasswordInput).toHaveAttribute('type', 'text')
  })

  it('displays password strength meter for new password', async () => {
    const user = userEvent.setup()
    render(<PasswordChangeForm />)
    
    const newPasswordInput = screen.getByLabelText(/new password/i)
    
    // Type a weak password
    await user.type(newPasswordInput, 'weak')
    
    // Should show password strength meter
    expect(screen.getByText(/password strength/i)).toBeInTheDocument()
  })

  it('displays password requirements when typing new password', async () => {
    const user = userEvent.setup()
    render(<PasswordChangeForm />)
    
    const newPasswordInput = screen.getByLabelText(/new password/i)
    
    // Type a password
    await user.type(newPasswordInput, 'Test123!')
    
    // Should show password requirements
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument()
    expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument()
    expect(screen.getByText(/one number/i)).toBeInTheDocument()
    expect(screen.getByText(/one special character/i)).toBeInTheDocument()
  })

  it('shows validation error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<PasswordChangeForm />)
    
    const newPasswordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /change password/i })
    
    // Fill in passwords that don't match
    await user.type(newPasswordInput, 'ValidPassword123!')
    await user.type(confirmPasswordInput, 'DifferentPassword123!')
    
    // Try to submit
    await user.click(submitButton)
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/new passwords don't match/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for weak password', async () => {
    const user = userEvent.setup()
    render(<PasswordChangeForm />)
    
    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const newPasswordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /change password/i })
    
    // Fill in weak password
    await user.type(currentPasswordInput, 'currentpass')
    await user.type(newPasswordInput, 'weak')
    await user.type(confirmPasswordInput, 'weak')
    
    // Try to submit
    await user.click(submitButton)
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/password does not meet security requirements/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Password changed successfully' })
    } as Response)
    
    render(<PasswordChangeForm />)
    
    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const newPasswordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /change password/i })
    
    // Fill in valid data
    await user.type(currentPasswordInput, 'currentPassword123!')
    await user.type(newPasswordInput, 'NewValidPassword123!')
    await user.type(confirmPasswordInput, 'NewValidPassword123!')
    
    // Submit form
    await user.click(submitButton)
    
    // Should show loading state
    expect(screen.getByText(/changing password/i)).toBeInTheDocument()
    
    // Should call API
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/password-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: 'currentPassword123!',
          newPassword: 'NewValidPassword123!',
          confirmPassword: 'NewValidPassword123!'
        })
      })
    })
  })

  it('handles API error response', async () => {
    const user = userEvent.setup()
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Current password is incorrect' })
    } as Response)
    
    render(<PasswordChangeForm />)
    
    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const newPasswordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /change password/i })
    
    // Fill in valid data
    await user.type(currentPasswordInput, 'wrongPassword')
    await user.type(newPasswordInput, 'NewValidPassword123!')
    await user.type(confirmPasswordInput, 'NewValidPassword123!')
    
    // Submit form
    await user.click(submitButton)
    
    // Should handle error (toast will be shown but we can't easily test it in this setup)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  it('handles network error', async () => {
    const user = userEvent.setup()
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    
    render(<PasswordChangeForm />)
    
    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const newPasswordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /change password/i })
    
    // Fill in valid data
    await user.type(currentPasswordInput, 'currentPassword123!')
    await user.type(newPasswordInput, 'NewValidPassword123!')
    await user.type(confirmPasswordInput, 'NewValidPassword123!')
    
    // Submit form
    await user.click(submitButton)
    
    // Should handle network error
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })
  })

  it('disables form during submission', async () => {
    const user = userEvent.setup()
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    
    // Mock a slow response
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Success' })
        } as Response), 100)
      )
    )
    
    render(<PasswordChangeForm />)
    
    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const newPasswordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /change password/i })
    
    // Fill in valid data
    await user.type(currentPasswordInput, 'currentPassword123!')
    await user.type(newPasswordInput, 'NewValidPassword123!')
    await user.type(confirmPasswordInput, 'NewValidPassword123!')
    
    // Submit form
    await user.click(submitButton)
    
    // Form should be disabled during submission
    expect(currentPasswordInput).toBeDisabled()
    expect(newPasswordInput).toBeDisabled()
    expect(confirmPasswordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('resets form after successful submission', async () => {
    const user = userEvent.setup()
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Password changed successfully' })
    } as Response)
    
    render(<PasswordChangeForm />)
    
    const currentPasswordInput = screen.getByLabelText(/current password/i)
    const newPasswordInput = screen.getByLabelText(/new password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)
    const submitButton = screen.getByRole('button', { name: /change password/i })
    
    // Fill in valid data
    await user.type(currentPasswordInput, 'currentPassword123!')
    await user.type(newPasswordInput, 'NewValidPassword123!')
    await user.type(confirmPasswordInput, 'NewValidPassword123!')
    
    // Submit form
    await user.click(submitButton)
    
    // Wait for form to reset
    await waitFor(() => {
      expect(currentPasswordInput).toHaveValue('')
      expect(newPasswordInput).toHaveValue('')
      expect(confirmPasswordInput).toHaveValue('')
    })
  })

  it('displays security notice', () => {
    render(<PasswordChangeForm />)
    
    expect(screen.getByText(/security notice/i)).toBeInTheDocument()
    expect(screen.getByText(/after changing your password/i)).toBeInTheDocument()
  })
})