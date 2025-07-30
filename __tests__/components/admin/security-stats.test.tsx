import { render, screen, waitFor } from '@testing-library/react'
import { SecurityStats } from '@/components/admin/security-stats'

// Mock fetch
global.fetch = jest.fn()

const mockStats = {
  totalEvents: 150,
  successfulEvents: 120,
  failedEvents: 30,
  eventsByType: {
    LOGIN_ATTEMPT: 80,
    REGISTRATION: 20,
    PASSWORD_CHANGE: 15,
    SUSPICIOUS_ACTIVITY: 5
  },
  eventsByHour: [
    { hour: '2024-01-01T10:00:00', count: 25 },
    { hour: '2024-01-01T11:00:00', count: 30 }
  ],
  topIpAddresses: [
    { ipAddress: '192.168.1.1', count: 45 },
    { ipAddress: '10.0.0.1', count: 30 }
  ],
  suspiciousActivity: [
    {
      type: 'brute_force_attempt',
      count: 15,
      description: '15 failed login attempts from IP 192.168.1.100'
    }
  ]
}

describe('SecurityStats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays loading state initially', () => {
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
    
    render(<SecurityStats refreshKey={0} />)
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('displays stats correctly after loading', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })
    
    render(<SecurityStats refreshKey={0} />)
    
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument() // Total events
      expect(screen.getByText('120')).toBeInTheDocument() // Successful events
      expect(screen.getByText('30')).toBeInTheDocument() // Failed events
      expect(screen.getByText('1')).toBeInTheDocument() // Suspicious activity count
    })
  })

  it('calculates success rate correctly', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })
    
    render(<SecurityStats refreshKey={0} />)
    
    await waitFor(() => {
      expect(screen.getByText('Taxa de sucesso: 80.0%')).toBeInTheDocument()
    })
  })

  it('displays events by type', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })
    
    render(<SecurityStats refreshKey={0} />)
    
    await waitFor(() => {
      expect(screen.getByText('LOGIN ATTEMPT')).toBeInTheDocument()
      expect(screen.getByText('REGISTRATION')).toBeInTheDocument()
      expect(screen.getByText('PASSWORD CHANGE')).toBeInTheDocument()
      expect(screen.getByText('SUSPICIOUS ACTIVITY')).toBeInTheDocument()
    })
  })

  it('displays top IP addresses', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })
    
    render(<SecurityStats refreshKey={0} />)
    
    await waitFor(() => {
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument()
      expect(screen.getByText('10.0.0.1')).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument()
    })
  })

  it('displays suspicious activity when present', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    })
    
    render(<SecurityStats refreshKey={0} />)
    
    await waitFor(() => {
      expect(screen.getByText('Atividade Suspeita Detectada')).toBeInTheDocument()
      expect(screen.getByText('brute force attempt')).toBeInTheDocument()
      expect(screen.getByText('15 ocorrências')).toBeInTheDocument()
      expect(screen.getByText('15 failed login attempts from IP 192.168.1.100')).toBeInTheDocument()
    })
  })

  it('handles error state', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    
    render(<SecurityStats refreshKey={0} />)
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('handles API error response', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500
    })
    
    render(<SecurityStats refreshKey={0} />)
    
    await waitFor(() => {
      expect(screen.getByText('Falha ao carregar estatísticas de segurança')).toBeInTheDocument()
    })
  })

  it('refetches data when refreshKey changes', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockStats
    })
    
    const { rerender } = render(<SecurityStats refreshKey={0} />)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1)
    })
    
    rerender(<SecurityStats refreshKey={1} />)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  it('handles zero success rate correctly', async () => {
    const zeroSuccessStats = {
      ...mockStats,
      totalEvents: 10,
      successfulEvents: 0,
      failedEvents: 10
    }
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => zeroSuccessStats
    })
    
    render(<SecurityStats refreshKey={0} />)
    
    await waitFor(() => {
      expect(screen.getByText('Taxa de sucesso: 0.0%')).toBeInTheDocument()
    })
  })

  it('handles empty stats correctly', async () => {
    const emptyStats = {
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      eventsByType: {},
      eventsByHour: [],
      topIpAddresses: [],
      suspiciousActivity: []
    }
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => emptyStats
    })
    
    render(<SecurityStats refreshKey={0} />)
    
    await waitFor(() => {
      expect(screen.getByText('Taxa de sucesso: 0%')).toBeInTheDocument()
      expect(screen.queryByText('Atividade Suspeita Detectada')).not.toBeInTheDocument()
    })
  })
})