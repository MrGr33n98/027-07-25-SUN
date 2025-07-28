import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = process.env.REDIS_URL 
  ? new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    })
  : null

// Cache utilities
export class CacheService {
  private static instance: CacheService
  private redis: Redis | null

  private constructor() {
    this.redis = redis
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      console.warn('Redis not configured, skipping cache get')
      return null
    }

    try {
      const data = await this.redis.get(key)
      return data as T
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    if (!this.redis) {
      console.warn('Redis not configured, skipping cache set')
      return false
    }

    try {
      await this.redis.setex(key, ttl, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Redis set error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.redis) {
      console.warn('Redis not configured, skipping cache delete')
      return false
    }

    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      console.error('Redis delete error:', error)
      return false
    }
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    if (!this.redis) {
      console.warn('Redis not configured, skipping cache invalidation')
      return false
    }

    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Redis pattern invalidation error:', error)
      return false
    }
  }

  // Specific cache methods for the application
  async getCompanies(filters: string): Promise<any[] | null> {
    return this.get(`companies:${filters}`)
  }

  async setCompanies(filters: string, data: any[], ttl: number = 300): Promise<boolean> {
    return this.set(`companies:${filters}`, data, ttl)
  }

  async getProducts(filters: string): Promise<any[] | null> {
    return this.get(`products:${filters}`)
  }

  async setProducts(filters: string, data: any[], ttl: number = 600): Promise<boolean> {
    return this.set(`products:${filters}`, data, ttl)
  }

  async getCompanyProfile(slug: string): Promise<any | null> {
    return this.get(`company:${slug}`)
  }

  async setCompanyProfile(slug: string, data: any, ttl: number = 3600): Promise<boolean> {
    return this.set(`company:${slug}`, data, ttl)
  }

  async invalidateCompanyCache(companyId: string): Promise<boolean> {
    return this.invalidatePattern(`company:*${companyId}*`)
  }

  async invalidateProductsCache(): Promise<boolean> {
    return this.invalidatePattern('products:*')
  }

  async invalidateCompaniesCache(): Promise<boolean> {
    return this.invalidatePattern('companies:*')
  }
}

export const cache = CacheService.getInstance()