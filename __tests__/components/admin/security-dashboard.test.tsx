import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SecurityDashboard } from '@/components/admin/security-dashboard'

// Mock the child components
jest.mock('@/components/admin/security-events-list', () => ({
  SecurityEventsList: ({ filters, refreshKey, onRefresh }: any) => (
    <div data-testid="security-events-list">
      <div>Filters: {JSON.stringify(filters)}</div>
      <div>Refresh Key: {refreshKey}</div>
      <button onClick={onRefresh}>Refresh Events</button>
    </div>
  )
}))

jest.mock('@/components/admin/security-stats', () => ({
  SecurityStats: ({ refreshKey }: any) => (
    <div data-testid="security-stats">
      <div>Stats Refresh Key: {refreshKey}</div>
    </div>
  )
}))

jest.mock('@/components/admin/account-lockout-management', () => ({
  AccountLockoutManagement: ({ refreshKey, onRefresh }: any) => (
    <div data-testid="account-lockout-management">
      <div>Lockout Refresh Key: {refreshKey}</div>
      <button onClick={onRefresh}>Refresh Lockouts</button>
    </div>
  )
}))

jest.mock('@/components/admin/security-filters', () => ({
  SecurityFilters: ({ filters, onFiltersChange }: any) => (
    <div data-testid="security-filters">
      <div>Current Filters: {JSON.stringify(filters)}</div>
      <button 
        onClick={() => onFiltersChange({ ...filters, email: 'test@example.com' })}
      >
        Apply Test Filter
      </button>
    </div>
  )
}))

describe('SecurityDashboard', () => {
  it('renders the security dashboard with all tabs', () => {
    render(<SecurityDashboard />)
    
    expect(screen.getByText('Painel de Segurança')).toBeInTheDocument()
    expect(screen.getByText('Monitore eventos de segurança e gerencie contas bloqueadas')).toBeInTheDocument()
    
    // Check tabs
    expect(screen.getByText('Visão Geral')).toBeInTheDocument()
    expect(screen.getByText('Eventos de Segurança')).toBeInTheDocument()
    expect(screen.getByText('Contas Bloqueadas')).toBeInTheDocument()
  })

  it('displays security stats by default', () => {
    render(<SecurityDashboard />)
    
    expect(screen.getByTestId('security-stats')).toBeInTheDocument()
  })

  it('switches to events tab and shows filters', () => {
    render(<SecurityDashboard />)
    
    fireEvent.click(screen.getByText('Eventos de Segurança'))
    
    expect(screen.getByTestId('security-filters')).toBeInTheDocument()
    expect(screen.getByTestId('security-events-list')).toBeInTheDocument()
    expect(screen.getByText('Filtros de Eventos')).toBeInTheDocument()
  })

  it('switches to lockouts tab', () => {
    render(<SecurityDashboard />)
    
    fireEvent.click(screen.getByText('Contas Bloqueadas'))
    
    expect(screen.getByTestId('account-lockout-management')).toBeInTheDocument()
  })

  it('handles filter changes correctly', async () => {
    render(<SecurityDashboard />)
    
    // Switch to events tab
    fireEvent.click(screen.getByText('Eventos de Segurança'))
    
    // Apply a test filter
    fireEvent.click(screen.getByText('Apply Test Filter'))
    
    await waitFor(() => {
      expect(screen.getByText('Current Filters: {"limit":50,"offset":0,"email":"test@example.com"}')).toBeInTheDocument()
    })
  })

  it('handles refresh correctly', () => {
    render(<SecurityDashboard />)
    
    // Check initial refresh key
    expect(screen.getByText('Stats Refresh Key: 0')).toBeInTheDocument()
    
    // Switch to events tab and trigger refresh
    fireEvent.click(screen.getByText('Eventos de Segurança'))
    fireEvent.click(screen.getByText('Refresh Events'))
    
    // Refresh key should increment
    expect(screen.getByText('Stats Refresh Key: 1')).toBeInTheDocument()
  })

  it('passes correct initial filters to components', () => {
    render(<SecurityDashboard />)
    
    fireEvent.click(screen.getByText('Eventos de Segurança'))
    
    expect(screen.getByText('Filters: {"limit":50,"offset":0}')).toBeInTheDocument()
  })

  it('maintains refresh key consistency across components', () => {
    render(<SecurityDashboard />)
    
    // Check stats
    expect(screen.getByText('Stats Refresh Key: 0')).toBeInTheDocument()
    
    // Switch to lockouts
    fireEvent.click(screen.getByText('Contas Bloqueadas'))
    expect(screen.getByText('Lockout Refresh Key: 0')).toBeInTheDocument()
    
    // Trigger refresh from lockouts
    fireEvent.click(screen.getByText('Refresh Lockouts'))
    
    // Both should have updated refresh key
    fireEvent.click(screen.getByText('Visão Geral'))
    expect(screen.getByText('Stats Refresh Key: 1')).toBeInTheDocument()
  })
})