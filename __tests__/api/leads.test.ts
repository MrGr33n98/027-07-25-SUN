import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/leads/route'
import { db } from '@/lib/db'

// Mock the database
jest.mock('@/lib/db')
const mockDb = db as jest.Mocked<typeof db>

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

// Mock email functions
jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  createNewLeadEmailTemplate: jest.fn().mockReturnValue('<html>Mock email</html>'),
  createLeadConfirmationEmailTemplate: jest.fn().mockReturnValue('<html>Mock confirmation</html>')
}))

import { getServerSession } from 'next-auth'
const mockGetServerSession = getServerSession as jest.Mock

describe('/api/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST - Create Lead', () => {
    const validLeadData = {
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      location: 'São Paulo, SP',
      projectType: 'Residencial',
      budget: 'R$ 25.000 - R$ 50.000',
      message: 'Gostaria de instalar painéis solares',
      companyId: 'comp-123'
    }

    it('should create lead with valid data', async () => {
      // Mock company exists
      mockDb.companyProfile.findUnique.mockResolvedValue({
        id: 'comp-123',
        name: 'Solar Tech',
        userId: 'user-123',
        user: {
          email: 'company@example.com',
          name: 'Solar Tech'
        }
      } as any)

      // Mock lead creation
      mockDb.lead.create.mockResolvedValue({
        id: 'lead-123',
        ...validLeadData,
        status: 'NEW',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      // Mock notification creation
      mockDb.notification.create.mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost:3001/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toBe('Solicitação enviada com sucesso')
      expect(mockDb.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: validLeadData.name,
          email: validLeadData.email,
          phone: validLeadData.phone,
          location: validLeadData.location,
          projectType: validLeadData.projectType,
          budget: validLeadData.budget,
          message: validLeadData.message,
          companyId: validLeadData.companyId,
          status: 'NEW',
          source: 'website'
        })
      })
    })

    it('should return 404 when company not found', async () => {
      mockDb.companyProfile.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3001/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.message).toBe('Empresa não encontrada')
    })

    it('should validate required fields', async () => {
      const invalidData = {
        name: 'J', // Too short
        email: 'invalid-email',
        phone: '123', // Too short
        location: '',
        projectType: '',
        message: 'short', // Too short
        companyId: 'comp-123'
      }

      const request = new NextRequest('http://localhost:3001/api/leads', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe('Dados inválidos')
      expect(data.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'phone' }),
          expect.objectContaining({ field: 'message' })
        ])
      )
    })
  })

  describe('GET - List Leads', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'COMPANY' }
      })
    })

    it('should list leads for authenticated company', async () => {
      mockDb.companyProfile.findUnique.mockResolvedValue({
        id: 'comp-123',
        userId: 'user-123'
      } as any)

      const mockLeads = [
        {
          id: 'lead-1',
          name: 'João Silva',
          email: 'joao@example.com',
          status: 'NEW',
          createdAt: new Date(),
          quotes: []
        }
      ]

      mockDb.lead.findMany.mockResolvedValue(mockLeads as any)
      mockDb.lead.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3001/api/leads?status=all&page=1&limit=10')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockLeads)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      })
    })

    it('should filter leads by status', async () => {
      mockDb.companyProfile.findUnique.mockResolvedValue({
        id: 'comp-123',
        userId: 'user-123'
      } as any)

      mockDb.lead.findMany.mockResolvedValue([])
      mockDb.lead.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3001/api/leads?status=NEW')

      await GET(request)

      expect(mockDb.lead.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 'comp-123',
          status: 'NEW'
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
        include: {
          quotes: {
            select: {
              id: true,
              status: true,
              totalValue: true,
              createdAt: true
            }
          }
        }
      })
    })

    it('should return 403 for non-company users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'CUSTOMER' }
      })

      const request = new NextRequest('http://localhost:3001/api/leads')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.message).toBe('Acesso negado')
    })

    it('should return 403 for unauthenticated users', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3001/api/leads')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.message).toBe('Acesso negado')
    })
  })
})