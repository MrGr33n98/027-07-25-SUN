import { NextRequest } from 'next/server'
import { 
  SlidingWindowRateLimiter, 
  authRateLimiters, 
  withAuthRateLimit,
  getEmailFromRequest,
  UserAwareRateLimiter,
  suspiciousActivityLimiter,
  cleanupExpiredRateLimits
} from '../../lib/auth-rate-limiter'
import { redis } from '../../lib/redis'

// Mock Redis
jest.mock('../../lib/redis', () => ({
  redis: {
    pipeline: jest.fn(),
    zremrangebyscore: jest.fn(),
    zcard: jest.fn(),
    zadd: jest.fn(),
    expire: jest.fn(),
    zrem: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    exec: jest.fn(),
  }
}))

const mockRedis = redis as jest.Mocked<typeof redis>

// Helper function to create mock NextRequest
function createMockRequest(
  url: string = 'http://localhost:3000/api/test',
  headers: Record<string, string> = {},
  method: string = 'POST'
): NextRequest {
  const request = new NextRequest(url, {
    method,
    headers: new Headers(headers)
  })
  return request
}

describe('SlidingWindowRateLimiter', () => {
  let rateLimiter: SlidingWindowRateLimiter

  beforeEach(() => {
    jest.clearAllMocks()
    rateLimiter = new SlidingWindowRateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
      keyPrefix: 'test'
    })
  })

  describe('checkLimit', () => {
    it('should allow requests within limit', async () => {
      const mockPipeline = {
        zremrangebyscore: jest.fn().mockReturnThis(),
        zcard: jest.fn().mockReturnThis(),
        zadd: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 1], // zremrangebyscore result
          [null, 2], // zcard result (current count)
          [null, 1], // zadd result
          [null, 1]  // expire result
        ])
      }

      mockRedis.pipeline.mockReturnValue(mockPipeline as any)

      const req = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.1'
      })

      const result = await rateLimiter.checkLimit(req)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(2) // 5 - 2 - 1 = 2
      expect(mockPipeline.zremrangebyscore).toHaveBeenCalled()
      expect(mockPipeline.zcard).toHaveBeenCalled()
      expect(mockPipeline.zadd).toHaveBeenCalled()
      expect(mockPipeline.expire).toHaveBeenCalled()
    })

    it('should reject requests exceeding limit', async () => {
      const mockPipeline = {
        zremrangebyscore: jest.fn().mockReturnThis(),
        zcard: jest.fn().mockReturnThis(),
        zadd: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 1], // zremrangebyscore result
          [null, 5], // zcard result (current count at limit)
          [null, 1], // zadd result
          [null, 1]  // expire result
        ])
      }

      mockRedis.pipeline.mockReturnValue(mockPipeline as any)
      mockRedis.zrem.mockResolvedValue(1)

      const req = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.1'
      })

      const result = await rateLimiter.checkLimit(req)

      expect(result.success).toBe(false)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(0)
      expect(result.message).toContain('Rate limit exceeded')
      expect(mockRedis.zrem).toHaveBeenCalled()
    })

    it('should handle Redis errors gracefully', async () => {
      mockRedis.pipeline.mockImplementation(() => {
        throw new Error('Redis connection failed')
      })

      const req = createMockRequest()
      const result = await rateLimiter.checkLimit(req)

      expect(result.success).toBe(true) // Should allow request on error
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(5)
    })

    it('should work without Redis configured', async () => {
      // Temporarily set redis to null
      const originalRedis = (require('../../lib/redis') as any).redis
      ;(require('../../lib/redis') as any).redis = null

      const req = createMockRequest()
      const result = await rateLimiter.checkLimit(req)

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(5)

      // Restore redis
      ;(require('../../lib/redis') as any).redis = originalRedis
    })

    it('should extract IP from different headers', async () => {
      const mockPipeline = {
        zremrangebyscore: jest.fn().mockReturnThis(),
        zcard: jest.fn().mockReturnThis(),
        zadd: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 1], [null, 1], [null, 1], [null, 1]
        ])
      }

      mockRedis.pipeline.mockReturnValue(mockPipeline as any)

      // Test x-forwarded-for
      let req = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1'
      })
      await rateLimiter.checkLimit(req)
      expect(mockPipeline.zadd).toHaveBeenCalledWith(
        'test:192.168.1.1',
        expect.any(Number),
        expect.any(String)
      )

      // Test cf-connecting-ip (Cloudflare)
      req = createMockRequest('http://localhost:3000/api/test', {
        'cf-connecting-ip': '203.0.113.1'
      })
      await rateLimiter.checkLimit(req)
      expect(mockPipeline.zadd).toHaveBeenCalledWith(
        'test:203.0.113.1',
        expect.any(Number),
        expect.any(String)
      )

      // Test x-real-ip
      req = createMockRequest('http://localhost:3000/api/test', {
        'x-real-ip': '198.51.100.1'
      })
      await rateLimiter.checkLimit(req)
      expect(mockPipeline.zadd).toHaveBeenCalledWith(
        'test:198.51.100.1',
        expect.any(Number),
        expect.any(String)
      )
    })
  })

  describe('getRemainingRequests', () => {
    it('should return correct remaining count', async () => {
      mockRedis.zremrangebyscore.mockResolvedValue(1)
      mockRedis.zcard.mockResolvedValue(3)

      const req = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.1'
      })

      const remaining = await rateLimiter.getRemainingRequests(req)

      expect(remaining).toBe(2) // 5 - 3 = 2
      expect(mockRedis.zremrangebyscore).toHaveBeenCalled()
      expect(mockRedis.zcard).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      mockRedis.zremrangebyscore.mockRejectedValue(new Error('Redis error'))

      const req = createMockRequest()
      const remaining = await rateLimiter.getRemainingRequests(req)

      expect(remaining).toBe(5) // Should return max on error
    })
  })

  describe('resetLimit', () => {
    it('should reset limit for identifier', async () => {
      mockRedis.del.mockResolvedValue(1)

      const result = await rateLimiter.resetLimit('192.168.1.1')

      expect(result).toBe(true)
      expect(mockRedis.del).toHaveBeenCalledWith('test:192.168.1.1')
    })

    it('should handle reset errors', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'))

      const result = await rateLimiter.resetLimit('192.168.1.1')

      expect(result).toBe(false)
    })
  })
})

describe('authRateLimiters', () => {
  it('should have correct configuration for login limiter', () => {
    const loginLimiter = authRateLimiters.login
    expect(loginLimiter['config'].windowMs).toBe(15 * 60 * 1000) // 15 minutes
    expect(loginLimiter['config'].maxRequests).toBe(5)
    expect(loginLimiter['config'].keyPrefix).toBe('auth:login')
  })

  it('should have correct configuration for registration limiter', () => {
    const regLimiter = authRateLimiters.registration
    expect(regLimiter['config'].windowMs).toBe(60 * 60 * 1000) // 1 hour
    expect(regLimiter['config'].maxRequests).toBe(3)
    expect(regLimiter['config'].keyPrefix).toBe('auth:register')
  })

  it('should have correct configuration for password reset limiter', () => {
    const resetLimiter = authRateLimiters.passwordReset
    expect(resetLimiter['config'].windowMs).toBe(60 * 60 * 1000) // 1 hour
    expect(resetLimiter['config'].maxRequests).toBe(3)
    expect(resetLimiter['config'].keyPrefix).toBe('auth:password_reset')
  })
})

describe('withAuthRateLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return null when rate limit is not exceeded', async () => {
    const mockPipeline = {
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 1], [null, 1], [null, 1], [null, 1]
      ])
    }

    mockRedis.pipeline.mockReturnValue(mockPipeline as any)

    const req = createMockRequest()
    const result = await withAuthRateLimit(req, 'login')

    expect(result).toBeNull()
  })

  it('should return 429 response when rate limit is exceeded', async () => {
    const mockPipeline = {
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 1], [null, 5], [null, 1], [null, 1]
      ])
    }

    mockRedis.pipeline.mockReturnValue(mockPipeline as any)
    mockRedis.zrem.mockResolvedValue(1)

    const req = createMockRequest()
    const result = await withAuthRateLimit(req, 'login')

    expect(result).not.toBeNull()
    expect(result!.status).toBe(429)
    
    const responseBody = JSON.parse(await result!.text())
    expect(responseBody.error).toBe('Rate limit exceeded')
    expect(responseBody.limit).toBe(5)
    expect(responseBody.remaining).toBe(0)
  })
})

describe('getEmailFromRequest', () => {
  it('should extract email from JSON body', async () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' })
    })

    const email = await getEmailFromRequest(req)
    expect(email).toBe('test@example.com')
  })

  it('should extract email from form data', async () => {
    const formData = new URLSearchParams()
    formData.append('email', 'test@example.com')
    formData.append('password', 'password')

    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })

    const email = await getEmailFromRequest(req)
    expect(email).toBe('test@example.com')
  })

  it('should return null for invalid content type', async () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'plain text'
    })

    const email = await getEmailFromRequest(req)
    expect(email).toBeNull()
  })

  it('should handle errors gracefully', async () => {
    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'invalid json'
    })

    const email = await getEmailFromRequest(req)
    expect(email).toBeNull()
  })
})

describe('UserAwareRateLimiter', () => {
  it('should use custom limits for specific users', async () => {
    const userLimiter = new UserAwareRateLimiter(
      {
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test'
      },
      { 'user123': 10 }
    )

    const mockPipeline = {
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 1], [null, 3], [null, 1], [null, 1]
      ])
    }

    mockRedis.pipeline.mockReturnValue(mockPipeline as any)

    const req = createMockRequest('http://localhost:3000/api/test', {
      'x-user-id': 'user123'
    })

    const result = await userLimiter.checkLimit(req)

    expect(result.success).toBe(true)
    expect(result.limit).toBe(10) // Custom limit for user123
    expect(mockPipeline.zadd).toHaveBeenCalledWith(
      'test:user:user123:user123',
      expect.any(Number),
      expect.any(String)
    )
  })

  it('should use default limits for users without custom limits', async () => {
    const userLimiter = new UserAwareRateLimiter(
      {
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test'
      },
      { 'user123': 10 }
    )

    const mockPipeline = {
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 1], [null, 2], [null, 1], [null, 1]
      ])
    }

    mockRedis.pipeline.mockReturnValue(mockPipeline as any)

    const req = createMockRequest('http://localhost:3000/api/test', {
      'x-user-id': 'user456' // User without custom limits
    })

    const result = await userLimiter.checkLimit(req)

    expect(result.success).toBe(true)
    expect(result.limit).toBe(5) // Default limit
  })
})

describe('suspiciousActivityLimiter', () => {
  it('should have correct configuration', () => {
    expect(suspiciousActivityLimiter['config'].windowMs).toBe(5 * 60 * 1000) // 5 minutes
    expect(suspiciousActivityLimiter['config'].maxRequests).toBe(20)
    expect(suspiciousActivityLimiter['config'].keyPrefix).toBe('security:suspicious')
  })
})

describe('cleanupExpiredRateLimits', () => {
  it('should clean up expired entries for all patterns', async () => {
    const mockKeys = [
      'auth:login:192.168.1.1',
      'auth:register:192.168.1.2',
      'security:suspicious:192.168.1.3'
    ]

    mockRedis.keys.mockResolvedValue(mockKeys)
    mockRedis.zremrangebyscore.mockResolvedValue(1)

    await cleanupExpiredRateLimits()

    expect(mockRedis.keys).toHaveBeenCalledTimes(7) // 7 patterns
    expect(mockRedis.zremrangebyscore).toHaveBeenCalledTimes(mockKeys.length * 7) // Each key for each pattern
  })

  it('should handle cleanup errors gracefully', async () => {
    mockRedis.keys.mockRejectedValue(new Error('Redis error'))

    // Should not throw
    await expect(cleanupExpiredRateLimits()).resolves.toBeUndefined()
  })
})

describe('Rate Limiter Integration', () => {
  let testRateLimiter: SlidingWindowRateLimiter

  beforeEach(() => {
    testRateLimiter = new SlidingWindowRateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
      keyPrefix: 'test'
    })
  })

  it('should handle concurrent requests correctly', async () => {
    const mockPipeline = {
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn()
    }

    mockRedis.pipeline.mockReturnValue(mockPipeline as any)
    mockRedis.zrem.mockResolvedValue(1)

    // Simulate concurrent requests - first 5 succeed, rest fail
    const requests = Array.from({ length: 10 }, (_, i) => {
      if (i < 5) {
        // First 5 requests succeed
        mockPipeline.exec.mockResolvedValueOnce([
          [null, 1], [null, i], [null, 1], [null, 1]
        ])
      } else {
        // Remaining requests exceed limit
        mockPipeline.exec.mockResolvedValueOnce([
          [null, 1], [null, 5], [null, 1], [null, 1]
        ])
      }
      
      const req = createMockRequest('http://localhost:3000/api/test', {
        'x-forwarded-for': '192.168.1.1'
      })
      
      return testRateLimiter.checkLimit(req)
    })

    const results = await Promise.all(requests)

    // First 5 should succeed, rest should fail
    results.slice(0, 5).forEach((result, index) => {
      expect(result.success).toBe(true)
    })
    
    results.slice(5).forEach((result, index) => {
      expect(result.success).toBe(false)
    })
  })

  it('should properly handle timing attacks', async () => {
    const mockPipeline = {
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 1], [null, 1], [null, 1], [null, 1]
      ])
    }

    mockRedis.pipeline.mockReturnValue(mockPipeline as any)

    const req = createMockRequest()
    
    // Measure response times
    const times: number[] = []
    for (let i = 0; i < 5; i++) {
      const start = Date.now()
      await testRateLimiter.checkLimit(req)
      const end = Date.now()
      times.push(end - start)
    }

    // Response times should be relatively consistent (within reasonable bounds)
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    const maxDeviation = Math.max(...times.map(t => Math.abs(t - avgTime)))
    
    // Allow for some variance but not excessive timing differences
    expect(maxDeviation).toBeLessThan(100) // 100ms max deviation
  })
})