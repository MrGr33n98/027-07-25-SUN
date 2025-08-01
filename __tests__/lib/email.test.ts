import { createEmailTemplate, createNewLeadEmailTemplate, createQuoteEmailTemplate } from '@/lib/email'

describe('Email Templates', () => {
  describe('createEmailTemplate', () => {
    it('should create basic email template with title and content', () => {
      const result = createEmailTemplate({
        title: 'Test Email',
        content: 'This is test content'
      })

      expect(result).toContain('Test Email')
      expect(result).toContain('This is test content')
      expect(result).toContain('SolarConnect')
      expect(result).toContain('<!DOCTYPE html>')
    })

    it('should include CTA button when provided', () => {
      const result = createEmailTemplate({
        title: 'Test Email',
        content: 'Test content',
        ctaText: 'Click Here',
        ctaUrl: 'https://example.com'
      })

      expect(result).toContain('Click Here')
      expect(result).toContain('https://example.com')
      expect(result).toContain('class="cta-button"')
    })

    it('should not include CTA section when not provided', () => {
      const result = createEmailTemplate({
        title: 'Test Email',
        content: 'Test content'
      })

      expect(result).not.toContain('class="cta-button"')
    })
  })

  describe('createNewLeadEmailTemplate', () => {
    const mockLeadData = {
      companyName: 'Solar Tech',
      leadName: 'João Silva',
      leadEmail: 'joao@example.com',
      leadPhone: '(11) 99999-9999',
      projectType: 'Residencial',
      location: 'São Paulo, SP',
      budget: 'R$ 25.000 - R$ 50.000',
      message: 'Gostaria de instalar painéis solares em minha casa',
      dashboardUrl: 'https://example.com/dashboard'
    }

    it('should create new lead email with all provided data', () => {
      const result = createNewLeadEmailTemplate(mockLeadData)

      expect(result).toContain('Solar Tech')
      expect(result).toContain('João Silva')
      expect(result).toContain('joao@example.com')
      expect(result).toContain('(11) 99999-9999')
      expect(result).toContain('Residencial')
      expect(result).toContain('São Paulo, SP')
      expect(result).toContain('R$ 25.000 - R$ 50.000')
      expect(result).toContain('Gostaria de instalar painéis solares')
      expect(result).toContain('Ver no Dashboard')
    })

    it('should handle missing budget gracefully', () => {
      const { budget, ...dataWithoutBudget } = mockLeadData

      const result = createNewLeadEmailTemplate(dataWithoutBudget as any)
      
      expect(result).toContain('João Silva')
      expect(result).not.toContain('Orçamento:')
    })
  })

  describe('createQuoteEmailTemplate', () => {
    const mockQuoteData = {
      customerName: 'Maria Santos',
      companyName: 'EcoSolar',
      quoteTitle: 'Sistema Solar 5kWp',
      totalValue: 25000,
      validUntil: '2024-02-15',
      items: [
        {
          description: 'Painel Solar 330W',
          quantity: 15,
          unitPrice: 800,
          totalPrice: 12000
        },
        {
          description: 'Inversor 5kW',
          quantity: 1,
          unitPrice: 5000,
          totalPrice: 5000
        }
      ],
      quoteUrl: 'https://example.com/quote/123'
    }

    it('should create quote email with all items and totals', () => {
      const result = createQuoteEmailTemplate(mockQuoteData)

      expect(result).toContain('Maria Santos')
      expect(result).toContain('EcoSolar')
      expect(result).toContain('Sistema Solar 5kWp')
      expect(result).toMatch(/R\$\s*25\.000,00/)
      expect(result).toContain('Painel Solar 330W')
      expect(result).toContain('Inversor 5kW')
      expect(result).toContain('Visualizar Orçamento Completo')
    })

    it('should format currency correctly', () => {
      const result = createQuoteEmailTemplate(mockQuoteData)

      expect(result).toMatch(/R\$\s*800,00/) // Unit price
      expect(result).toMatch(/R\$\s*12\.000,00/) // Item total
      expect(result).toMatch(/R\$\s*25\.000,00/) // Grand total
    })

    it('should include terms when provided', () => {
      const dataWithTerms = {
        ...mockQuoteData,
        terms: 'Pagamento em 10x sem juros. Prazo de entrega: 30 dias.'
      }

      const result = createQuoteEmailTemplate(dataWithTerms)
      
      expect(result).toContain('Termos e Condições')
      expect(result).toContain('Pagamento em 10x sem juros')
    })

    it('should include company logo when provided', () => {
      const dataWithLogo = {
        ...mockQuoteData,
        companyLogo: 'https://example.com/logo.png'
      }

      const result = createQuoteEmailTemplate(dataWithLogo)
      
      expect(result).toContain('https://example.com/logo.png')
      expect(result).toContain('alt="EcoSolar"')
    })
  })
})