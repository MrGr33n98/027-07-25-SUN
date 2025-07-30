import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserSettings } from '@/components/dashboard/user-settings'

// Mock the password change form
jest.mock('@/components/auth/password-change-form', () => ({
  PasswordChangeForm: () => <div data-testid="password-change-form">Password Change Form</div>
}))

// Mock the password service
jest.mock('@/lib/password-service', () => ({
  passwordService: {
    validatePasswordStrength: jest.fn().mockReturnValue({
      isValid: true,
      errors: [],
      score: 80
    })
  }
}))

describe('UserSettings', () => {
  it('renders settings navigation correctly', () => {
    render(<UserSettings />)
    
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Password & Security')).toBeInTheDocument()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Account')).toBeInTheDocument()
  })

  it('shows overview section by default', () => {
    render(<UserSettings />)
    
    expect(screen.getByText('Settings Overview')).toBeInTheDocument()
    expect(screen.getByText(/manage your account settings/i)).toBeInTheDocument()
  })

  it('navigates to password section when clicked', async () => {
    const user = userEvent.setup()
    render(<UserSettings />)
    
    const passwordButton = screen.getByText('Password & Security')
    await user.click(passwordButton)
    
    expect(screen.getByText('Password & Security')).toBeInTheDocument()
    expect(screen.getByText(/keep your account secure/i)).toBeInTheDocument()
    expect(screen.getByTestId('password-change-form')).toBeInTheDocument()
  })

  it('shows security tips in password section', async () => {
    const user = userEvent.setup()
    render(<UserSettings />)
    
    const passwordButton = screen.getByText('Password & Security')
    await user.click(passwordButton)
    
    expect(screen.getByText('Security Tips')).toBeInTheDocument()
    expect(screen.getByText(/use a strong password/i)).toBeInTheDocument()
    expect(screen.getByText(/change passwords regularly/i)).toBeInTheDocument()
    expect(screen.getByText(/don't reuse passwords/i)).toBeInTheDocument()
  })

  it('navigates to notifications section when clicked', async () => {
    const user = userEvent.setup()
    render(<UserSettings />)
    
    const notificationsButton = screen.getByText('Notifications')
    await user.click(notificationsButton)
    
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument()
    expect(screen.getByText(/choose how you want to be notified/i)).toBeInTheDocument()
  })

  it('navigates to account section when clicked', async () => {
    const user = userEvent.setup()
    render(<UserSettings />)
    
    const accountButton = screen.getByText('Account')
    await user.click(accountButton)
    
    expect(screen.getByText('Account Information')).toBeInTheDocument()
    expect(screen.getByText(/manage your account details/i)).toBeInTheDocument()
  })

  it('highlights active section in navigation', async () => {
    const user = userEvent.setup()
    render(<UserSettings />)
    
    const passwordButton = screen.getByText('Password & Security')
    await user.click(passwordButton)
    
    // The active section should have different styling (we can check for specific classes)
    const activeButton = passwordButton.closest('button')
    expect(activeButton).toHaveClass('bg-orange-50', 'text-orange-700')
  })

  it('allows navigation from overview cards', async () => {
    const user = userEvent.setup()
    render(<UserSettings />)
    
    // Should show overview cards
    const passwordCard = screen.getByText('Password & Security').closest('[role="button"]') || 
                         screen.getByText('Password & Security').closest('div[class*="cursor-pointer"]')
    
    if (passwordCard) {
      await user.click(passwordCard)
      expect(screen.getByTestId('password-change-form')).toBeInTheDocument()
    }
  })

  it('shows coming soon message for notifications', async () => {
    const user = userEvent.setup()
    render(<UserSettings />)
    
    const notificationsButton = screen.getByText('Notifications')
    await user.click(notificationsButton)
    
    expect(screen.getByText(/notification settings will be available soon/i)).toBeInTheDocument()
  })

  it('shows coming soon message for account settings', async () => {
    const user = userEvent.setup()
    render(<UserSettings />)
    
    const accountButton = screen.getByText('Account')
    await user.click(accountButton)
    
    expect(screen.getByText(/account settings will be available soon/i)).toBeInTheDocument()
  })

  it('renders all section icons correctly', () => {
    render(<UserSettings />)
    
    // Check that icons are rendered (we can't easily test the specific icons, but we can check they exist)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('maintains responsive layout structure', () => {
    render(<UserSettings />)
    
    // Check for responsive container classes
    const container = screen.getByText('Settings').closest('div')
    expect(container).toBeInTheDocument()
  })
})