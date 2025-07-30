import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AccountLockoutManagement } from '@/components/admin/account-lockout-management'
import { toast } from 'sonner'

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

// Mock fetch
global.fetch = jest.fn()

const mockLockedAccounts = [
  {
    id: '1',
    email: 'user1@example.com',
    name: 'User One',
    failedLoginAttempts: 5,
    accountLockedUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
    lastLoginAt: '2024-01-01T10:00:00Z',
    lastLoginIP: '192.168.1.1'
  },
  {
    id: '2',
    email: 'user2@example.com',
    name: 'User Two',
    failedLoginAttempts: 3,
    accountLockedUntil: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago (expired)
    lastLoginAt: '2024-01-01T09:00:00Z',
    lastLoginIP: '10.0.0.1'
  }
]

describe('AccountLockoutManagement', () => {
  const mockOnRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays loading state initially', () => {
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
    
    render(<AccountLockoutManagement refreshKey={0} onRefresh={mockOnRefresh} />)
    
    expect(screen.getByText('Carregando contas bloqueadas...')).toBeInTheDocument()
  })

  it('displays locked accounts correctly', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accounts: mockLockedAccounts })
    })
    
    render(<AccountLockoutManagement refreshKey={0} onRefresh={mockOnRefresh} />)
    
    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument()
      expect(screen.getByText('user1@example.com')).toBeInTheDocument()
      expect(screen.getByText('User Two')).toBeInTheDocument()
      expect(screen.getByText('5 tentativas')).toBeInTheDocument()
      expect(screen.getByText('3 tentativas')).toBeInTheDocument()
    })
  })

  it('displays summary statistics correctly', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accounts: mockLockedAccounts })
    })
    
    render(<AccountLockoutManagement refreshKey={0} onRefresh={mockOnRefresh} />)
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // Total blocked
      expect(screen.getByText('1')).toBeInTheDocument() // Active lockouts
      expect(screen.getByText('1')).toBeInTheDocument() // Expired lockouts
    })
  })

  it('handles unlock account successfully', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accounts: mockLockedAccounts })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Account unlocked' })
      })
    
    render(<AccountLockoutManagement refreshKey={0} onRefresh={mockOnRefresh} />)
    
    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument()
    })
    
    const unlockButtons = screen.getAllByText('Desbloquear')
    fireEvent.click(unlockButtons[0])
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/security/unlock-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: '1' }),
      })
      expect(toast.success).toHaveBeenCalledWith('Conta user1@example.com desbloqueada com sucesso')
      expect(mockOnRefresh).toHaveBeenCalled()
    })
  })

  it('handles unlock account error', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accounts: mockLockedAccounts })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Unlock failed' })
      })
    
    render(<AccountLockoutManagement refreshKey={0} onRefresh={mockOnRefresh} />)
    
    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument()
    })
    
    const unlockButtons = screen.getAllByText('Desbloquear')
    fireEvent.click(unlockButtons[0])
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unlock failed')
    })
  })

  it('shows loading state on unlock button during request', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accounts: mockLockedAccounts })
      })
      .mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<AccountLockoutManagement refreshKey={0} onRefresh={mockOnRefresh} />)
    
    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument()
    })
    
    const unlockButtons = screen.getAllByText('Desbloquear')
    fireEvent.click(unlockButtons[0])
    
    // Button should be disabled and show loading
    expect(unlockButtons[0]).toBeDisabled()
  })

  it('displays empty state when no locked accounts', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accounts: [] })
    })
    
    render(<AccountLockoutManagement refreshKey={0} onRefresh={mockOnRefresh} />)
    
    await waitFor(() => {
      expect(screen.getByText('Nenhuma conta bloqueada')).toBeInTheDocument()
      expect(screen.getByText('Todas as contas estão desbloqueadas no momento')).toBeInTheDocument()
    })
  })

  it('handles API error', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    
    render(<AccountLockoutManagement refreshKey={0} onRefresh={mockOnRefresh} />)
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('refetches data when refreshKey changes', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ accounts: mockLockedAccounts })
    })
    
    const { rerender } = render(<AccountLockoutManagement refreshKey={0} onRefresh={mockOnRefresh} />)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1)
    })
    
    rerender(<AccountLockoutManagement refreshKey={1} onRefresh={mockOnRefresh} />)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  it('handles refresh button click', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ accounts: mockLockedAccounts })
    })
    
    render(<AccountLockoutManagement refreshKey={0} onRefresh={mockOnRefresh} />)
    
    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument()
    })
    
    const refreshButton = screen.getByText('Atualizar')
    fireEvent.click(refreshButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  it('displays time remaining correctly for active lockouts', async () => {
    const futureTime = new Date(Date.now() + 25 * 60 * 1000).toISOString() // 25 minutes from now
    const accountsWithFutureLockout = [{
      ...mockLockedAccounts[0],
      accountLockedUntil: futureTime
    }]
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accounts: accountsWithFutureLockout })
    })
    
    render(<AccountLockoutManagement refreshKey={0} onRefresh={mockOnRefresh} />)
    
    await waitFor(() => {
      // Should show time remaining (approximately 25 minutes)
      expect(screen.getByText(/25m/)).toBeInTheDocument()
    })
  })

  it('displays expired status for past lockouts', async () => {
    const pastTime = new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
    const accountsWithPastLockout = [{
      ...mockLockedAccounts[0],
      accountLockedUntil: pastTime
    }]
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accounts: accountsWithPastLockout })
    })
    
    render(<AccountLockoutManagement refreshKey={0} onRefresh={mockOnRefresh} />)
    
    await waitFor(() => {
      expect(screen.getByText('Expirado')).toBeInTheDocument()
    })
  })
})