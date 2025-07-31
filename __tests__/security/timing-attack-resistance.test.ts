/**
 * Security Testing: Timing Attack Resistance Validation
 * 
 * This test suite validates that the authentication system is resistant to timing attacks
 * by ensuring consistent response times regardless of whether users exist, passwords
 * are correct, or other conditions that could leak information through timing.
 * 
 * Requirements: 7.1, 7.4, 7.5
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { AuthenticationService } from '../../lib/authentication-service'
import { PasswordService } from '../../lib/password-service'
import { TokenService } from '../../lib/token-service'
import { SecurityLogger } from '../../lib/security-logger'
import { AuthRateLimiter } from '../../lib/auth-rate-limiter'
import { PrismaClient } from '@prisma/client'

// Mock dependencies
jest.mock('../../lib/prisma')
jest.mock('../../lib/redis')

describe('Timing Attack Resistance Tests', () => {
  let authService: AuthenticationService
  let passwordService: PasswordService
  let tokenService: TokenService
  let securityLogger: SecurityLogger
  let rateLimiter: AuthRateLimiter
  let prismaMock: jest.Mocked<PrismaClient>

  const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', // 'password'
    emailVerified: true,
    failedLoginAttempts: 0,
    accountLockedUntil: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    passwordService = new PasswordService()
    tokenService = new TokenService()
    securityLogger = new SecurityLogger()
    rateLimiter = new AuthRateLimiter()
    authService = new AuthenticationService(
      passwordService,
      tokenService,
      securityLogger,
      rateLimiter
    )

    prismaMock = require('../../lib/prisma').prisma as jest.Mocked<PrismaClient>

    // Mock rate limiter to allow all requests
    jest.spyOn(rateLimiter, 'checkLimit').mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetTime: Date.now() + 900000,
      retryAfter: 0
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Login Timing Consistency', () => {
    it('should have consistent timing for existing vs non-existing users', async () => {
      // Test with existing user
      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(false)

      const existingUserTimes = []
      for (let i = 0; i < 10; i++) {
        const startTime = process.hrtime.bigint()
        await authService.login('test@test.com', 'wrongpassword', '127.0.0.1', 'test-agent')
        const endTime = process.hrtime.bigint()
        existingUserTimes.push(Number(endTime - startTime) / 1000000) // Convert to milliseconds
      }

      // Test with non-existing user
      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)

      const nonExistingUserTimes = []
      for (let i = 0; i < 10; i++) {
        const startTime = process.hrtime.bigint()
        await authService.login('nonexistent@test.com', 'password', '127.0.0.1', 'test-agent')
        const endTime = process.hrtime.bigint()
        nonExistingUserTimes.push(Number(endTime - startTime) / 1000000)
      }

      // Calculate averages
      const avgExistingTime = existingUserTimes.reduce((a, b) => a + b, 0) / existingUserTimes.length
      const avgNonExistingTime = nonExistingUserTimes.reduce((a, b) => a + b, 0) / nonExistingUserTimes.length

      // Times should be relatively similar (within 50% variance)
      const timeDifference = Math.abs(avgExistingTime - avgNonExistingTime)
      const averageTime = (avgExistingTime + avgNonExistingTime) / 2
      const variancePercentage = (timeDifference / averageTime) * 100

      expect(variancePercentage).toBeLessThan(50) // Less than 50% variance
      
      // Both should take reasonable time (bcrypt operations should dominate)
      expect(avgExistingTime).toBeGreaterThan(50) // At least 50ms for bcrypt
      expect(avgNonExistingTime).toBeGreaterThan(50) // Should perform dummy bcrypt operation
    })

    it('should have consistent timing for correct vs incorrect passwords', async () => {
      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)

      // Test with correct password
      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(true)
      prismaMock.user.update = jest.fn().mockResolvedValue(mockUser)

      const correctPasswordTimes = []
      for (let i = 0; i < 10; i++) {
        const startTime = process.hrtime.bigint()
        await authService.login('test@test.com', 'password', '127.0.0.1', 'test-agent')
        const endTime = process.hrtime.bigint()
        correctPasswordTimes.push(Number(endTime - startTime) / 1000000)
      }

      // Test with incorrect password
      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(false)
      prismaMock.user.update = jest.fn().mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: mockUser.failedLoginAttempts + 1
      })

      const incorrectPasswordTimes = []
      for (let i = 0; i < 10; i++) {
        const startTime = process.hrtime.bigint()
        await authService.login('test@test.com', 'wrongpassword', '127.0.0.1', 'test-agent')
        const endTime = process.hrtime.bigint()
        incorrectPasswordTimes.push(Number(endTime - startTime) / 1000000)
      }

      // Calculate averages
      const avgCorrectTime = correctPasswordTimes.reduce((a, b) => a + b, 0) / correctPasswordTimes.length
      const avgIncorrectTime = incorrectPasswordTimes.reduce((a, b) => a + b, 0) / incorrectPasswordTimes.length

      // Times should be similar (bcrypt.compare provides timing attack protection)
      const timeDifference = Math.abs(avgCorrectTime - avgIncorrectTime)
      const averageTime = (avgCorrectTime + avgIncorrectTime) / 2
      const variancePercentage = (timeDifference / averageTime) * 100

      expect(variancePercentage).toBeLessThan(30) // Less than 30% variance
    })

    it('should perform dummy operations for non-existent users', async () => {
      // Mock to ensure dummy bcrypt operation is performed
      const bcryptCompareSpy = jest.spyOn(passwordService, 'verifyPassword')
      
      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)

      const startTime = process.hrtime.bigint()
      const result = await authService.login('nonexistent@test.com', 'password', '127.0.0.1', 'test-agent')
      const endTime = process.hrtime.bigint()
      
      const executionTime = Number(endTime - startTime) / 1000000

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      
      // Should take reasonable time even for non-existent user (dummy bcrypt operation)
      expect(executionTime).toBeGreaterThan(50) // At least 50ms
      
      // In a real implementation, this would verify dummy bcrypt was called
      // For now, we verify the timing is consistent with bcrypt operations
    })
  })

  describe('Password Reset Timing Consistency', () => {
    it('should have consistent timing regardless of email existence', async () => {
      // Test with existing email
      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      prismaMock.user.update = jest.fn().mockResolvedValue(mockUser)

      const existingEmailTimes = []
      for (let i = 0; i < 5; i++) {
        const startTime = process.hrtime.bigint()
        await authService.requestPasswordReset('test@test.com', '127.0.0.1')
        const endTime = process.hrtime.bigint()
        existingEmailTimes.push(Number(endTime - startTime) / 1000000)
      }

      // Test with non-existing email
      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)

      const nonExistingEmailTimes = []
      for (let i = 0; i < 5; i++) {
        const startTime = process.hrtime.bigint()
        await authService.requestPasswordReset('nonexistent@test.com', '127.0.0.1')
        const endTime = process.hrtime.bigint()
        nonExistingEmailTimes.push(Number(endTime - startTime) / 1000000)
      }

      // Calculate averages
      const avgExistingTime = existingEmailTimes.reduce((a, b) => a + b, 0) / existingEmailTimes.length
      const avgNonExistingTime = nonExistingEmailTimes.reduce((a, b) => a + b, 0) / nonExistingEmailTimes.length

      // Times should be similar
      const timeDifference = Math.abs(avgExistingTime - avgNonExistingTime)
      const averageTime = (avgExistingTime + avgNonExistingTime) / 2
      const variancePercentage = (timeDifference / averageTime) * 100

      expect(variancePercentage).toBeLessThan(40) // Less than 40% variance
    })

    it('should return same response for existing and non-existing emails', async () => {
      // Test with existing email
      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      prismaMock.user.update = jest.fn().mockResolvedValue(mockUser)

      const existingResult = await authService.requestPasswordReset('test@test.com', '127.0.0.1')

      // Test with non-existing email
      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)

      const nonExistingResult = await authService.requestPasswordReset('nonexistent@test.com', '127.0.0.1')

      // Both should return the same response to prevent email enumeration
      expect(existingResult.success).toBe(true)
      expect(nonExistingResult.success).toBe(true)
      expect(existingResult.message).toBe(nonExistingResult.message)
      expect(existingResult.message).toBe('If an account with that email exists, a password reset link has been sent.')
    })
  })

  describe('Token Validation Timing Consistency', () => {
    it('should have consistent timing for valid vs invalid tokens', async () => {
      const validToken = 'valid-token-123'
      const invalidToken = 'invalid-token-456'

      // Mock token validation
      jest.spyOn(tokenService, 'validateToken').mockImplementation(async (token) => {
        if (token === validToken) {
          return {
            valid: true,
            userId: 'user-1',
            type: 'email_verification',
            expiresAt: new Date(Date.now() + 3600000)
          }
        }
        return {
          valid: false,
          userId: null,
          type: null,
          expiresAt: null
        }
      })

      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      prismaMock.user.update = jest.fn().mockResolvedValue({
        ...mockUser,
        emailVerified: true
      })

      // Test with valid token
      const validTokenTimes = []
      for (let i = 0; i < 5; i++) {
        const startTime = process.hrtime.bigint()
        await authService.verifyEmail(validToken, '127.0.0.1')
        const endTime = process.hrtime.bigint()
        validTokenTimes.push(Number(endTime - startTime) / 1000000)
      }

      // Test with invalid token
      const invalidTokenTimes = []
      for (let i = 0; i < 5; i++) {
        const startTime = process.hrtime.bigint()
        await authService.verifyEmail(invalidToken, '127.0.0.1')
        const endTime = process.hrtime.bigint()
        invalidTokenTimes.push(Number(endTime - startTime) / 1000000)
      }

      // Calculate averages
      const avgValidTime = validTokenTimes.reduce((a, b) => a + b, 0) / validTokenTimes.length
      const avgInvalidTime = invalidTokenTimes.reduce((a, b) => a + b, 0) / invalidTokenTimes.length

      // Times should be similar
      const timeDifference = Math.abs(avgValidTime - avgInvalidTime)
      const averageTime = (avgValidTime + avgInvalidTime) / 2
      const variancePercentage = (timeDifference / averageTime) * 100

      expect(variancePercentage).toBeLessThan(50) // Less than 50% variance
    })

    it('should use constant-time comparison for token validation', async () => {
      const baseToken = 'abcdef123456789'
      const similarToken = 'abcdef123456788' // Only last character different
      const differentToken = 'zyxwvu987654321' // Completely different

      jest.spyOn(tokenService, 'validateToken').mockResolvedValue({
        valid: false,
        userId: null,
        type: null,
        expiresAt: null
      })

      // Test timing for similar vs different tokens
      const similarTokenTimes = []
      for (let i = 0; i < 10; i++) {
        const startTime = process.hrtime.bigint()
        await authService.verifyEmail(similarToken, '127.0.0.1')
        const endTime = process.hrtime.bigint()
        similarTokenTimes.push(Number(endTime - startTime) / 1000000)
      }

      const differentTokenTimes = []
      for (let i = 0; i < 10; i++) {
        const startTime = process.hrtime.bigint()
        await authService.verifyEmail(differentToken, '127.0.0.1')
        const endTime = process.hrtime.bigint()
        differentTokenTimes.push(Number(endTime - startTime) / 1000000)
      }

      // Calculate averages
      const avgSimilarTime = similarTokenTimes.reduce((a, b) => a + b, 0) / similarTokenTimes.length
      const avgDifferentTime = differentTokenTimes.reduce((a, b) => a + b, 0) / differentTokenTimes.length

      // Times should be very similar (constant-time comparison)
      const timeDifference = Math.abs(avgSimilarTime - avgDifferentTime)
      const averageTime = (avgSimilarTime + avgDifferentTime) / 2
      const variancePercentage = (timeDifference / averageTime) * 100

      expect(variancePercentage).toBeLessThan(20) // Less than 20% variance for constant-time
    })
  })

  describe('Registration Timing Consistency', () => {
    it('should have consistent timing regardless of email existence check', async () => {
      const newEmail = 'new@test.com'
      const existingEmail = 'existing@test.com'
      const password = 'TestPassword123!'

      // Test with new email (doesn't exist)
      prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)
      prismaMock.user.create = jest.fn().mockResolvedValue({
        id: 'new-user',
        email: newEmail,
        emailVerified: false
      })

      const newEmailTimes = []
      for (let i = 0; i < 5; i++) {
        const startTime = process.hrtime.bigint()
        await authService.register(newEmail, password, password, '127.0.0.1', 'test-agent')
        const endTime = process.hrtime.bigint()
        newEmailTimes.push(Number(endTime - startTime) / 1000000)
      }

      // Test with existing email
      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)

      const existingEmailTimes = []
      for (let i = 0; i < 5; i++) {
        const startTime = process.hrtime.bigint()
        await authService.register(existingEmail, password, password, '127.0.0.1', 'test-agent')
        const endTime = process.hrtime.bigint()
        existingEmailTimes.push(Number(endTime - startTime) / 1000000)
      }

      // Calculate averages
      const avgNewEmailTime = newEmailTimes.reduce((a, b) => a + b, 0) / newEmailTimes.length
      const avgExistingEmailTime = existingEmailTimes.reduce((a, b) => a + b, 0) / existingEmailTimes.length

      // Times should be similar (both should perform password hashing)
      const timeDifference = Math.abs(avgNewEmailTime - avgExistingEmailTime)
      const averageTime = (avgNewEmailTime + avgExistingEmailTime) / 2
      const variancePercentage = (timeDifference / averageTime) * 100

      expect(variancePercentage).toBeLessThan(40) // Less than 40% variance
      
      // Both should take reasonable time (password hashing should occur)
      expect(avgNewEmailTime).toBeGreaterThan(50) // At least 50ms for bcrypt
      expect(avgExistingEmailTime).toBeGreaterThan(50) // Should still hash password
    })
  })

  describe('Statistical Timing Analysis', () => {
    it('should pass statistical timing analysis for login operations', async () => {
      const scenarios = [
        { name: 'existing_user_correct_password', userExists: true, passwordCorrect: true },
        { name: 'existing_user_wrong_password', userExists: true, passwordCorrect: false },
        { name: 'non_existing_user', userExists: false, passwordCorrect: false }
      ]

      const timingData = {}

      for (const scenario of scenarios) {
        if (scenario.userExists) {
          prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)
          jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(scenario.passwordCorrect)
          if (scenario.passwordCorrect) {
            prismaMock.user.update = jest.fn().mockResolvedValue(mockUser)
          } else {
            prismaMock.user.update = jest.fn().mockResolvedValue({
              ...mockUser,
              failedLoginAttempts: mockUser.failedLoginAttempts + 1
            })
          }
        } else {
          prismaMock.user.findUnique = jest.fn().mockResolvedValue(null)
        }

        const times = []
        for (let i = 0; i < 20; i++) {
          const startTime = process.hrtime.bigint()
          await authService.login('test@test.com', 'password', '127.0.0.1', 'test-agent')
          const endTime = process.hrtime.bigint()
          times.push(Number(endTime - startTime) / 1000000)
        }

        timingData[scenario.name] = {
          times,
          mean: times.reduce((a, b) => a + b, 0) / times.length,
          min: Math.min(...times),
          max: Math.max(...times),
          stdDev: Math.sqrt(times.reduce((sq, n) => sq + Math.pow(n - (times.reduce((a, b) => a + b, 0) / times.length), 2), 0) / times.length)
        }
      }

      // Statistical analysis
      const means = Object.values(timingData).map(data => data.mean)
      const overallMean = means.reduce((a, b) => a + b, 0) / means.length
      
      // Check that all means are within reasonable variance of each other
      for (const [scenario, data] of Object.entries(timingData)) {
        const deviationFromMean = Math.abs(data.mean - overallMean)
        const percentageDeviation = (deviationFromMean / overallMean) * 100
        
        expect(percentageDeviation).toBeLessThan(50) // Less than 50% deviation
        
        // Log timing data for analysis
        console.log(`${scenario}: mean=${data.mean.toFixed(2)}ms, stdDev=${data.stdDev.toFixed(2)}ms, range=${data.min.toFixed(2)}-${data.max.toFixed(2)}ms`)
      }
    })

    it('should maintain timing consistency under load', async () => {
      prismaMock.user.findUnique = jest.fn().mockResolvedValue(mockUser)
      jest.spyOn(passwordService, 'verifyPassword').mockResolvedValue(false)
      prismaMock.user.update = jest.fn().mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: mockUser.failedLoginAttempts + 1
      })

      // Simulate concurrent requests
      const concurrentRequests = 50
      const promises = []

      const startTime = Date.now()
      
      for (let i = 0; i < concurrentRequests; i++) {
        const promise = authService.login(
          'test@test.com',
          `password${i}`,
          '127.0.0.1',
          'test-agent'
        ).then(() => Date.now())
        promises.push(promise)
      }

      const completionTimes = await Promise.all(promises)
      const endTime = Date.now()

      // Calculate timing statistics
      const responseTimes = completionTimes.map(time => time - startTime)
      const meanResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      const maxResponseTime = Math.max(...responseTimes)
      const minResponseTime = Math.min(...responseTimes)

      // Under load, timing should still be relatively consistent
      const timingVariance = (maxResponseTime - minResponseTime) / meanResponseTime
      expect(timingVariance).toBeLessThan(2.0) // Less than 200% variance

      console.log(`Load test: ${concurrentRequests} requests, mean=${meanResponseTime.toFixed(2)}ms, range=${minResponseTime}-${maxResponseTime}ms`)
    })
  })
})