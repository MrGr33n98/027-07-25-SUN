import { redis } from './redis'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
  revalidate?: boolean // Force revalidation
}

export class CacheManager {
  private static instance: CacheManager
  private defaultTTL = 3600 // 1 hour

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Get cached data or execute function and cache result
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL, tags = [], revalidate = false } = options

    // Check if revalidation is forced
    if (revalidate) {
      const data = await fetchFn()
      await this.set(key, data, { ttl, tags })
      return data
    }

    try {
      // Try to get from cache first
      const cached = await redis.get(key)
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      console.warn('Cache get error:', error)
    }

    // If not in cache, fetch and cache
    const data = await fetchFn()
    await this.set(key, data, { ttl, tags })
    return data
  }

  /**
   * Set data in cache
   */
  async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const { ttl = this.defaultTTL, tags = [] } = options

    try {
      // Store the data
      await redis.setex(key, ttl, JSON.stringify(data))

      // Store tags for invalidation
      if (tags.length > 0) {
        for (const tag of tags) {
          await redis.sadd(`tag:${tag}`, key)
          await redis.expire(`tag:${tag}`, ttl + 300) // Tag expires 5 minutes after data
        }
      }

      // Store key metadata
      await redis.setex(
        `meta:${key}`,
        ttl + 300,
        JSON.stringify({
          createdAt: Date.now(),
          ttl,
          tags
        })
      )
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Delete specific key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await redis.del(key)
      await redis.del(`meta:${key}`)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const keys = await redis.smembers(`tag:${tag}`)
      if (keys.length > 0) {
        // Delete all keys with this tag
        await redis.del(...keys)
        
        // Delete metadata for these keys
        const metaKeys = keys.map(key => `meta:${key}`)
        await redis.del(...metaKeys)
        
        // Delete the tag set
        await redis.del(`tag:${tag}`)
      }
    } catch (error) {
      console.error('Cache invalidate by tag error:', error)
    }
  }

  /**
   * Invalidate multiple tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    await Promise.all(tags.map(tag => this.invalidateByTag(tag)))
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await redis.flushdb()
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number
    memoryUsage: string
    hitRate?: number
  }> {
    try {
      const info = await redis.info('memory')
      const keyCount = await redis.dbsize()
      
      const memoryMatch = info.match(/used_memory_human:(.+)/)
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'Unknown'

      return {
        totalKeys: keyCount,
        memoryUsage
      }
    } catch (error) {
      console.error('Cache stats error:', error)
      return {
        totalKeys: 0,
        memoryUsage: 'Unknown'
      }
    }
  }

  /**
   * Warm up cache with common data
   */
  async warmUp(): Promise<void> {
    try {
      // Warm up common queries
      const warmUpTasks = [
        // Products cache
        this.get('products:featured', async () => {
          // Mock featured products - replace with actual DB query
          return []
        }, { ttl: 1800, tags: ['products'] }),

        // Companies cache
        this.get('companies:featured', async () => {
          // Mock featured companies - replace with actual DB query
          return []
        }, { ttl: 3600, tags: ['companies'] }),

        // Categories cache
        this.get('categories:all', async () => {
          // Mock categories - replace with actual DB query
          return []
        }, { ttl: 7200, tags: ['categories'] })
      ]

      await Promise.all(warmUpTasks)
      console.log('Cache warmed up successfully')
    } catch (error) {
      console.error('Cache warm up error:', error)
    }
  }
}

// Utility functions for common cache patterns
export const cache = CacheManager.getInstance()

// Cache decorators for common use cases
export function cached(
  keyPrefix: string,
  options: CacheOptions = {}
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const key = `${keyPrefix}:${JSON.stringify(args)}`
      return cache.get(key, () => method.apply(this, args), options)
    }

    return descriptor
  }
}

// Cache key generators
export const CacheKeys = {
  products: {
    list: (filters: any) => `products:list:${JSON.stringify(filters)}`,
    detail: (id: string) => `products:detail:${id}`,
    featured: () => 'products:featured',
    categories: () => 'products:categories'
  },
  companies: {
    list: (filters: any) => `companies:list:${JSON.stringify(filters)}`,
    detail: (id: string) => `companies:detail:${id}`,
    featured: () => 'companies:featured'
  },
  users: {
    profile: (id: string) => `users:profile:${id}`,
    preferences: (id: string) => `users:preferences:${id}`
  },
  admin: {
    stats: () => 'admin:stats',
    users: (filters: any) => `admin:users:${JSON.stringify(filters)}`,
    notifications: (filters: any) => `admin:notifications:${JSON.stringify(filters)}`
  }
}

// Cache tags for invalidation
export const CacheTags = {
  PRODUCTS: 'products',
  COMPANIES: 'companies',
  USERS: 'users',
  ADMIN: 'admin',
  CATEGORIES: 'categories',
  REVIEWS: 'reviews',
  APPOINTMENTS: 'appointments'
}