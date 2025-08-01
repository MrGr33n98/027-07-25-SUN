import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuoteRequestForm } from '@/components/company/quote-request-form'

// Mock fetch
global.fetch = jest.fn()

const mockProps = {
  companyId: 'comp-123',
  companyName: 'Solar Tech'
}

describe('QuoteRequestForm', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear()
  })

  it('renders form with all required fields', () => {
    render(<QuoteRequestForm {...mockProps} />)

    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/localização/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tipo de projeto/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mensagem/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar solicitação/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup()
    render(<QuoteRequestForm {...mockProps} />)

    const submitButton = screen.getByRole('button', { name: /enviar solicitação/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/nome deve ter pelo menos 2 caracteres/i)).toBeInTheDocument()
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
      expect(screen.getByText(/telefone deve ter pelo menos 10 caracteres/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<QuoteRequestForm {...mockProps} />)

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')

    const submitButton = screen.getByRole('button', { name: /enviar solicitação/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success' })
    })

    render(<QuoteRequestForm {...mockProps} />)

    // Fill out form
    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva')
    await user.type(screen.getByLabelText(/email/i), 'joao@example.com')
    await user.type(screen.getByLabelText(/telefone/i), '11999999999')
    await user.type(screen.getByLabelText(/localização/i), 'São Paulo, SP')
    
    // Select project type
    const projectTypeCombobox = screen.getAllByRole('combobox')[0]
    await user.click(projectTypeCombobox)
    await user.click(screen.getByText('Residencial'))
    
    await user.type(screen.getByLabelText(/mensagem/i), 'Gostaria de instalar painéis solares em minha casa')

    // Submit form
    await user.click(screen.getByRole('button', { name: /enviar solicitação/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'João Silva',
          email: 'joao@example.com',
          phone: '11999999999',
          location: 'São Paulo, SP',
          projectType: 'Residencial',
          message: 'Gostaria de instalar painéis solares em minha casa',
          companyId: 'comp-123',
          source: 'company_profile'
        }),
      })
    })
  })

  it('shows success message after successful submission', async () => {
    const user = userEvent.setup()
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success' })
    })

    render(<QuoteRequestForm {...mockProps} />)

    // Fill and submit form (abbreviated)
    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva')
    await user.type(screen.getByLabelText(/email/i), 'joao@example.com')
    await user.type(screen.getByLabelText(/telefone/i), '11999999999')
    await user.type(screen.getByLabelText(/localização/i), 'São Paulo, SP')
    const projectTypeCombobox = screen.getAllByRole('combobox')[0]
    await user.click(projectTypeCombobox)
    await user.click(screen.getByText('Residencial'))
    await user.type(screen.getByLabelText(/mensagem/i), 'Test message')
    
    await user.click(screen.getByRole('button', { name: /enviar solicitação/i }))

    await waitFor(() => {
      expect(screen.getByText(/solicitação enviada!/i)).toBeInTheDocument()
      expect(screen.getByText(/sua solicitação de orçamento foi enviada/i)).toBeInTheDocument()
    })
  })

  it('shows error message on submission failure', async () => {
    const user = userEvent.setup()
    
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Server error' })
    })

    render(<QuoteRequestForm {...mockProps} />)

    // Fill and submit form (abbreviated)
    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva')
    await user.type(screen.getByLabelText(/email/i), 'joao@example.com')
    await user.type(screen.getByLabelText(/telefone/i), '11999999999')
    await user.type(screen.getByLabelText(/localização/i), 'São Paulo, SP')
    const projectTypeCombobox = screen.getAllByRole('combobox')[0]
    await user.click(projectTypeCombobox)
    await user.click(screen.getByText('Residencial'))
    await user.type(screen.getByLabelText(/mensagem/i), 'Test message')
    
    await user.click(screen.getByRole('button', { name: /enviar solicitação/i }))

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    })
  })

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup()
    
    // Mock a slow response
    ;(fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ message: 'Success' })
      }), 100))
    )

    render(<QuoteRequestForm {...mockProps} />)

    // Fill form quickly
    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva')
    await user.type(screen.getByLabelText(/email/i), 'joao@example.com')
    await user.type(screen.getByLabelText(/telefone/i), '11999999999')
    await user.type(screen.getByLabelText(/localização/i), 'São Paulo, SP')
    const projectTypeCombobox = screen.getAllByRole('combobox')[0]
    await user.click(projectTypeCombobox)
    await user.click(screen.getByText('Residencial'))
    await user.type(screen.getByLabelText(/mensagem/i), 'Test message')

    const submitButton = screen.getByRole('button', { name: /enviar solicitação/i })
    await user.click(submitButton)

    // Button should show loading state
    expect(screen.getByText(/enviando solicitação/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })
})