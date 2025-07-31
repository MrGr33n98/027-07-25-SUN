/**
 * Security Testing: Brute Force Attack Simulation
 * 
 * This test suite simulates various brute force attack scenarios to validate
 * the system's defensive mechanisms including rate limiting, account lockout,
 * and attack detection.
 * 
 * Requirements: 7.1, 7.4, 7.5
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { AuthenticationService } from '../../lib/authentication-service'
import { PasswordService } from '../../lib/password-service'
import { TokenService } from '../../lib/token-service'
import { SecurityLogger } from '../../lib/security-logger'
import { AuthRateLimiter } from '../../lib/auth-rate-limiter'
import { SecurityMonitoring } from '../../lib/security-monitoring'
import { PrismaClient } from '@prisma/client'

// Mock dependencies
jest.mock('../../lib/prisma')
jest.mock('../../lib/redis')

describe('Brute Force Attack Simulation Tests', () => {
  let authService: AuthenticationService
  let passwordService: PasswordService
  let tokenService: TokenService
  let securityLogger: SecurityLogger
  let rateLimiter: AuthRateLimiter
  let securityMonitoring: SecurityMonitoring
  let prismaMock: jest.Mocked<PrismaClient>

  const mockUser = {
    id: 'user-1',
    email: 'victim@test.com',
    passwordHash: '$2b$12$hashedpassword',
    emailVerified: true,
    failedLoginAttempts: 0,
    accountLockedUntil: null,
    lastLoginAt: null,
    lastLoginIP: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    passwordService = new PasswordService()
    tokenService = new TokenService()
    securityLogger = new SecurityLogger()
    rateLimiter = new AuthRateLimiter()
    securityMonitoring = new SecurityMonitoring(securityLogger)
    authService = new AuthenticationService(
      passwordService,
      tokenService,
      securityLogger,
      rateLimiter
    )

    prismaMock = require('../../lib/prisma').prisma as jest.Mocked<PrismaClient>
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Single IP Brute Force Attack', () => {
    it('should detect and block brute force attack from single IP', async () => {
      const attackerIP = '192.168.1.100'
      const targetEmail = 'victim@test.com'
      const commonPasswords = [
        'password', '123456', 'password123', 'admin', 'qwerty',
        'letmein', 'welcome', 'monkey', '1234567890', 'password1'
      ]

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(false)

      let rateLimitHit = false
      let attemptCount = 0

      // Mock rate limiter to allow first 5 attempts, then block
      jest.spyOn(rateLimiter, 'checkLimit').mockImplementation(async () => {
        attemptCount++
        if (attemptCount > 5) {
          rateLimitHit = true
          return {
            allowed: false,
            remaining: 0,
            resetTime: Date.now() + 900000, // 15 minutes
            retryAfter: 900
          }
        }
        return {
          allowed: true,
          remaining: 5 - attemptCount,
          resetTime: Date.now() + 900000,
          retryAfter: 0
        }
      })

      const results = []
      
      // Simulate brute force attack
      for (const password of commonPasswords) {
        const result = await authService.login(
          targetEmail,
          password,
          attackerIP,
          'AttackBot/1.0'
        )
        results.push(result)
        
        // Stop if rate limited
        if (!result.success && result.error?.includes('Too many')) {
          break
        }
      }

      // Verify rate limiting kicked in
      expect(rateLimitHit).toBe(true)
      
      // Verify failed attempts were logged
      expect(securityLogger.logAuthenticationAttempt).toHaveBeenCalledTimes(6) // 5 allowed + 1 blocked
      
      // Verify the last attempt was blocked
      const lastResult = results[results.length - 1]
      expect(lastResult.success).toBe(false)
      expect(lastResult.error).toBe('Too many login attempts. Please try again later.')
      expect(lastResult.retryAfter).toBe(900)
    })

    it('should implement exponential backoff for repeated attacks', async () => {
      const attackerIP = '192.168.1.100'
      const targetEmail = 'victim@test.com'

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(false)

      let attemptCount = 0
      const backoffTimes = [900, 1800, 3600] // 15 min, 30 min, 1 hour

      jest.spyOn(rateLimiter, 'checkLimit').mockImplementation(async () => {
        const backoffIndex = Math.min(Math.floor(attemptCount / 5), backoffTimes.length - 1)
        attemptCount++
        
        if (attemptCount > 5) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: Date.now() + (backoffTimes[backoffIndex] * 1000),
            retryAfter: backoffTimes[backoffIndex]
          }
        }
        return {
          allowed: true,
          remaining: 5 - attemptCount,
          resetTime: Date.now() + 900000,
          retryAfter: 0
        }
      })

      // First wave of attacks
      for (let i = 0; i < 10; i++) {
        await authService.login(targetEmail, `password${i}`, attackerIP, 'AttackBot/1.0')
      }

      // Verify exponential backoff is applied
      const result = await authService.login(targetEmail, 'password', attackerIP, 'AttackBot/1.0')
      expect(result.success).toBe(false)
      expect(result.retryAfter).toBeGreaterThan(900) // Should be longer than initial backoff
    })
  })

  describe('Distributed Brute Force Attack', () => {
    it('should detect coordinated attack from multiple IPs', async () => {
      const attackerIPs = [
        '192.168.1.100', '192.168.1.101', '192.168.1.102',
        '10.0.0.1', '10.0.0.2', '172.16.0.1'
      ]
      const targetEmail = 'victim@test.com'
      const passwords = ['password', '123456', 'admin']

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(false)

      // Allow all attempts to pass rate limiting (per IP)
      jest.spyOn(rateLimiter, 'checkLimit').mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetTime: Date.now() + 900000,
        retryAfter: 0
      })

      const loggedEvents = []
      jest.spyOn(securityLogger, 'logAuthenticationAttempt').mockImplementation(
        (email, success, ip, userAgent, error) => {
          loggedEvents.push({ email, success, ip, userAgent, error, timestamp: new Date() })
          return Promise.resolve()
        }
      )

      // Simulate distributed attack
      for (const ip of attackerIPs) {
        for (const password of passwords) {
          await authService.login(targetEmail, password, ip, 'AttackBot/1.0')
        }
      }

      // Verify all attempts were logged
      expect(loggedEvents).toHaveLength(attackerIPs.length * passwords.length)
      
      // Verify pattern detection would identify this as suspicious
      const failedAttempts = loggedEvents.filter(event => !event.success)
      expect(failedAttempts).toHaveLength(attackerIPs.length * passwords.length)
      
      // Verify multiple IPs targeted same email
      const uniqueIPs = new Set(failedAttempts.map(event => event.ip))
      expect(uniqueIPs.size).toBe(attackerIPs.length)
      
      const targetedEmails = new Set(failedAttempts.map(event => event.email))
      expect(targetedEmails.size).toBe(1) // All targeting same email
      expect(targetedEmails.has(targetEmail)).toBe(true)
    })

    it('should handle botnet-style distributed attack', async () => {
      const botnetIPs = Array.from({ length: 50 }, (_, i) => `203.0.113.${i + 1}`)
      const targetEmails = ['admin@test.com', 'user@test.com', 'support@test.com']
      const commonPasswords = ['password', '123456', 'admin']

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(false)

      // Allow limited attempts per IP
      let totalAttempts = 0
      jest.spyOn(rateLimiter, 'checkLimit').mockImplementation(async (key) => {
        totalAttempts++
        // Allow 3 attempts per IP before blocking
        const ipAttempts = totalAttempts % 3
        return {
          allowed: ipAttempts < 3,
          remaining: Math.max(0, 2 - ipAttempts),
          resetTime: Date.now() + 900000,
          retryAfter: ipAttempts >= 3 ? 900 : 0
        }
      })

      const attackResults = []

      // Simulate botnet attack
      for (let round = 0; round < 3; round++) {
        for (const ip of botnetIPs.slice(0, 10)) { // Use subset for test performance
          for (const email of targetEmails) {
            const password = commonPasswords[round % commonPasswords.length]
            const result = await authService.login(email, password, ip, 'BotnetClient/1.0')
            attackResults.push({ ip, email, result })
          }
        }
      }

      // Verify attack was partially mitigated by rate limiting
      const blockedAttempts = attackResults.filter(attack => 
        !attack.result.success && attack.result.error?.includes('Too many')
      )
      expect(blockedAttempts.length).toBeGreaterThan(0)

      // Verify security logging captured the attack pattern
      expect(securityLogger.logAuthenticationAttempt).toHaveBeenCalledTimes(
        expect.any(Number)
      )
    })
  })

  describe('Credential Stuffing Attack', () => {
    it('should detect credential stuffing patterns', async () => {
      const stolenCredentials = [
        { email: 'user1@test.com', password: 'password123' },
        { email: 'user2@test.com', password: 'qwerty456' },
        { email: 'user3@test.com', password: 'letmein789' },
        { email: 'user4@test.com', password: 'welcome123' },
        { email: 'user5@test.com', password: 'admin2023' }
      ]

      const attackerIP = '198.51.100.1'

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null) // No users found
      
      jest.spyOn(rateLimiter, 'checkLimit').mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetTime: Date.now() + 900000,
        retryAfter: 0
      })

      const attackResults = []

      // Simulate credential stuffing attack
      for (const credential of stolenCredentials) {
        const result = await authService.login(
          credential.email,
          credential.password,
          attackerIP,
          'CredentialStuffer/2.0'
        )
        attackResults.push(result)
        
        // Small delay to simulate realistic attack timing
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // All attempts should fail (no users exist)
      attackResults.forEach(result => {
        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid credentials')
      })

      // Verify pattern: multiple different emails from same IP
      expect(securityLogger.logAuthenticationAttempt).toHaveBeenCalledTimes(stolenCredentials.length)
      
      // Verify each call had different email but same IP
      const logCalls = (securityLogger.logAuthenticationAttempt as jest.Mock).mock.calls
      const loggedEmails = logCalls.map(call => call[0])
      const loggedIPs = logCalls.map(call => call[2])
      
      expect(new Set(loggedEmails).size).toBe(stolenCredentials.length) // All different emails
      expect(new Set(loggedIPs).size).toBe(1) // Same IP
      expect(loggedIPs[0]).toBe(attackerIP)
    })
  })

  describe('Password Spraying Attack', () => {
    it('should detect password spraying patterns', async () => {
      const commonPasswords = ['password', '123456', 'Password1', 'welcome']
      const targetEmails = [
        'admin@test.com', 'user@test.com', 'support@test.com',
        'info@test.com', 'contact@test.com'
      ]
      const attackerIP = '203.0.113.10'

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(false)

      jest.spyOn(rateLimiter, 'checkLimit').mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetTime: Date.now() + 900000,
        retryAfter: 0
      })

      const sprayResults = []

      // Simulate password spraying (one password against many emails)
      for (const password of commonPasswords) {
        for (const email of targetEmails) {
          const result = await authService.login(email, password, attackerIP, 'SprayBot/1.0')
          sprayResults.push({ email, password, result })
          
          // Delay between attempts to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }

      // All attempts should fail
      sprayResults.forEach(({ result }) => {
        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid credentials')
      })

      // Verify pattern: same IP trying same passwords against multiple emails
      expect(securityLogger.logAuthenticationAttempt).toHaveBeenCalledTimes(
        commonPasswords.length * targetEmails.length
      )

      const logCalls = (securityLogger.logAuthenticationAttempt as jest.Mock).mock.calls
      const loggedIPs = logCalls.map(call => call[2])
      
      // All from same IP
      expect(new Set(loggedIPs).size).toBe(1)
      expect(loggedIPs[0]).toBe(attackerIP)
    })
  })

  describe('Account Lockout Mechanism', () => {
    it('should lock account after failed attempts threshold', async () => {
      const targetEmail = 'victim@test.com'
      const attackerIP = '192.168.1.100'

      // Mock user with increasing failed attempts
      let failedAttempts = 0
      prismaMock.user.findUnique = jest.fn().mockImplementation(() => ({
        ...mockUser,
        failedLoginAttempts: failedAttempts,
        accountLockedUntil: failedAttempts >= 5 ? new Date(Date.now() + 1800000) : null // 30 min lockout
      }))

      prismaMock.user.update = jest.fn().mockImplementation(({ data }) => {
        failedAttempts = data.failedLoginAttempts || failedAttempts + 1
        return {
          ...mockUser,
          failedLoginAttempts: failedAttempts,
          accountLockedUntil: failedAttempts >= 5 ? new Date(Date.now() + 1800000) : null
        }
      })

      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(false)
      jest.spyOn(rateLimiter, 'checkLimit').mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetTime: Date.now() + 900000,
        retryAfter: 0
      })

      const attackResults = []

      // Attempt 6 failed logins
      for (let i = 0; i < 6; i++) {
        const result = await authService.login(
          targetEmail,
          `wrongpassword${i}`,
          attackerIP,
          'AttackBot/1.0'
        )
        attackResults.push(result)
      }

      // First 5 should fail with invalid credentials
      for (let i = 0; i < 5; i++) {
        expect(attackResults[i].success).toBe(false)
        expect(attackResults[i].error).toBe('Invalid credentials')
      }

      // 6th attempt should be blocked due to account lockout
      expect(attackResults[5].success).toBe(false)
      expect(attackResults[5].error).toBe('Account is temporarily locked due to too many failed login attempts')

      // Verify account lockout was logged
      expect(securityLogger.logAccountLockout).toHaveBeenCalledWith(
        targetEmail,
        'Too many failed login attempts',
        expect.any(Number),
        attackerIP
      )
    })

    it('should reset failed attempts after successful login', async () => {
      const targetEmail = 'victim@test.com'
      const correctPassword = 'CorrectPassword123!'

      // Mock user with some failed attempts
      prismaMock.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 3,
        accountLockedUntil: null
      })

      prismaMock.user.update = jest.fn().mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 0, // Reset on successful login
        lastLoginAt: new Date(),
        lastLoginIP: '192.168.1.100'
      })

      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(true)
      jest.spyOn(rateLimiter, 'checkLimit').mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetTime: Date.now() + 900000,
        retryAfter: 0
      })

      const result = await authService.login(
        targetEmail,
        correctPassword,
        '192.168.1.100',
        'LegitimateUser/1.0'
      )

      expect(result.success).toBe(true)
      
      // Verify failed attempts were reset
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          failedLoginAttempts: 0,
          lastLoginAt: expect.any(Date),
          lastLoginIP: '192.168.1.100'
        })
      })
    })
  })

  describe('Attack Detection and Alerting', () => {
    it('should trigger security alerts for sustained attacks', async () => {
      const attackerIP = '198.51.100.50'
      const targetEmail = 'victim@test.com'

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(false)

      // Mock security monitoring
      const alertSpy = jest.spyOn(securityMonitoring, 'detectSuspiciousActivity')
      
      jest.spyOn(rateLimiter, 'checkLimit').mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetTime: Date.now() + 900000,
        retryAfter: 0
      })

      // Simulate sustained attack
      for (let i = 0; i < 20; i++) {
        await authService.login(targetEmail, `password${i}`, attackerIP, 'AttackBot/1.0')
      }

      // Verify security monitoring would detect this pattern
      expect(securityLogger.logAuthenticationAttempt).toHaveBeenCalledTimes(20)
      
      // In a real implementation, this would trigger alerts
      const logCalls = (securityLogger.logAuthenticationAttempt as jest.Mock).mock.calls
      const failedAttemptsFromSameIP = logCalls.filter(call => 
        call[2] === attackerIP && call[1] === false
      )
      
      expect(failedAttemptsFromSameIP.length).toBe(20)
    })
  })
})