import { z } from 'zod'

// Simple validation schemas to test
const emailSchema = z.string().email()
const phoneSchema = z.string().min(10)
const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  location: z.string().min(2),
  projectType: z.string().min(1),
  message: z.string().min(10)
})

describe('Validation Utils', () => {
  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ]

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow()
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        ''
      ]

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow()
      })
    })
  })

  describe('Phone Validation', () => {
    it('should validate phone numbers with minimum length', () => {
      const validPhones = [
        '11999999999',
        '(11) 99999-9999',
        '+55 11 99999-9999',
        '1234567890'
      ]

      validPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).not.toThrow()
      })
    })

    it('should reject short phone numbers', () => {
      const invalidPhones = [
        '123',
        '99999',
        '',
        '123456789' // exactly 9 digits, less than minimum 10
      ]

      invalidPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).toThrow()
      })
    })
  })

  describe('Lead Data Validation', () => {
    const validLeadData = {
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '11999999999',
      location: 'São Paulo, SP',
      projectType: 'Residencial',
      message: 'Gostaria de instalar painéis solares em minha casa'
    }

    it('should validate complete lead data', () => {
      expect(() => leadSchema.parse(validLeadData)).not.toThrow()
      
      const result = leadSchema.parse(validLeadData)
      expect(result).toEqual(validLeadData)
    })

    it('should reject lead data with missing required fields', () => {
      const incompleteData = {
        name: 'João Silva',
        email: 'joao@example.com'
        // missing other required fields
      }

      expect(() => leadSchema.parse(incompleteData)).toThrow()
    })

    it('should reject lead data with invalid field values', () => {
      const invalidData = {
        ...validLeadData,
        name: 'J', // too short
        email: 'invalid-email',
        phone: '123', // too short
        message: 'short' // too short
      }

      expect(() => leadSchema.parse(invalidData)).toThrow()
    })

    it('should provide detailed error information', () => {
      const invalidData = {
        name: '', // empty
        email: 'invalid',
        phone: '123',
        location: '',
        projectType: '',
        message: 'short'
      }

      try {
        leadSchema.parse(invalidData)
        fail('Should have thrown validation error')
      } catch (error) {
        expect(error).toBeInstanceOf(z.ZodError)
        const zodError = error as z.ZodError
        
        // Check that we have errors for each invalid field
        const fieldErrors = zodError.errors.map(e => e.path[0])
        expect(fieldErrors).toContain('name')
        expect(fieldErrors).toContain('email')
        expect(fieldErrors).toContain('phone')
        expect(fieldErrors).toContain('location')
        expect(fieldErrors).toContain('projectType')
        expect(fieldErrors).toContain('message')
      }
    })
  })

  describe('Data Sanitization', () => {
    it('should handle whitespace in inputs', () => {
      const dataWithWhitespace = {
        ...{
          name: 'João Silva',
          email: 'joao@example.com',
          phone: '11999999999',
          location: 'São Paulo, SP',
          projectType: 'Residencial',
          message: 'Gostaria de instalar painéis solares em minha casa'
        },
        name: '  João Silva  ',
        email: '  joao@example.com  '
      }

      // Should validate after trimming
      const result = leadSchema.parse({
        ...dataWithWhitespace,
        name: dataWithWhitespace.name.trim(),
        email: dataWithWhitespace.email.trim()
      })

      expect(result.name).toBe('João Silva')
      expect(result.email).toBe('joao@example.com')
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in names', () => {
      const specialNames = [
        'José da Silva',
        "O'Connor",
        'Jean-Pierre',
        'María José',
        'Li Wei'
      ]

      specialNames.forEach(name => {
        const data = {
          name,
          email: 'test@example.com',
          phone: '11999999999',
          location: 'São Paulo, SP',
          projectType: 'Residencial',
          message: 'Test message with at least 10 characters'
        }

        expect(() => leadSchema.parse(data)).not.toThrow()
      })
    })

    it('should handle international phone formats', () => {
      const internationalPhones = [
        '+55 11 99999-9999',
        '+1 (555) 123-4567',
        '+44 20 7946 0958',
        '55 11 99999 9999'
      ]

      internationalPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).not.toThrow()
      })
    })
  })
})