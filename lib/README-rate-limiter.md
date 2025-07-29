# Authentication Rate Limiter

This document describes the Redis-based sliding window rate limiter implementation for the secure authentication system.

## Overview

The rate limiter provides protection against brute force attacks and abuse by implementing different rate limiting tiers for various authentication operations. It uses Redis for distributed rate limiting with a sliding window algorithm.

## Features

- **Redis-based sliding window rate limiting**: More accurate than fixed window approaches
- **Multiple rate limit tiers**: Different limits for different operations
- **IP and email-based limiting**: Flexible identifier strategies
- **Graceful degradation**: Works without Redis (allows all requests with warnings)
- **Comprehensive error handling**: Never blocks legitimate users due to errors
- **User-aware limiting**: Support for different limits per user tier
- **Cleanup mechanisms**: Automatic cleanup of expired entries

## Rate Limit Tiers

### Authentication Operations

| Operation | Window | Max Requests | Identifier |
|-----------|--------|--------------|------------|
| Login | 15 minutes | 5 | IP Address |
| Registration | 1 hour | 3 | IP Address |
| Password Reset | 1 hour | 3 | Email Address |
| Email Verification | 1 hour | 5 | Email Address |
| Password Change | 1 hour | 10 | User ID |
| General Auth API | 15 minutes | 50 | IP Address |

### Security Features

- **Suspicious Activity Detection**: 20 requests per 5 minutes before flagging
- **Timing Attack Protection**: Consistent response times
- **Rate Limit Headers**: Standard HTTP rate limit headers in responses

## Usage

### Basic Usage with Middleware

```typescript
import { RateLimitMiddleware } from '@/lib/middleware/rate-limit-middleware'

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await RateLimitMiddleware.login(req)
  if (rateLimitResponse) return rateLimitResponse

  // Your authentication logic here
  return NextResponse.json({ success: true })
}
```

### Using Higher-Order Function

```typescript
import { withRateLimit } from '@/lib/middleware/rate-limit-middleware'

export const POST = withRateLimit('login', async (req: NextRequest) => {
  // Your authentication logic here
  return NextResponse.json({ success: true })
})
```

### Manual Rate Limiting

```typescript
import { authRateLimiters } from '@/lib/auth-rate-limiter'

export async function POST(req: NextRequest) {
  const result = await authRateLimiters.login.checkLimit(req)
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: result.retryAfter },
      { status: 429 }
    )
  }

  // Your logic here
}
```

## Configuration

### Environment Variables

```env
REDIS_URL=your_redis_url
REDIS_TOKEN=your_redis_token
```

### Custom Rate Limiters

```typescript
import { SlidingWindowRateLimiter } from '@/lib/auth-rate-limiter'

const customLimiter = new SlidingWindowRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10,
  keyPrefix: 'custom',
  identifier: (req) => req.headers.get('x-user-id') || 'anonymous'
})
```

## Response Format

### Success Response
When rate limit is not exceeded, the middleware returns `null` and allows the request to proceed.

### Rate Limited Response (429)
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 5 requests per 900 seconds.",
  "limit": 5,
  "remaining": 0,
  "resetTime": 1640995200000,
  "retryAfter": 900
}
```

### Headers
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200000
Retry-After: 900
```

## Architecture

### Sliding Window Algorithm

The implementation uses Redis sorted sets to maintain a sliding window of requests:

1. **Remove expired entries**: Clean up requests older than the window
2. **Count current requests**: Get the number of requests in the current window
3. **Add new request**: Add the current request with timestamp
4. **Check limit**: Compare count against the maximum allowed
5. **Set expiration**: Ensure the key expires to prevent memory leaks

### Key Structure

```
{keyPrefix}:{identifier} -> Redis Sorted Set
```

Examples:
- `auth:login:192.168.1.1`
- `auth:password_reset:user@example.com`
- `auth:password_change:user123`

## Error Handling

The rate limiter is designed to fail open - if Redis is unavailable or errors occur, it allows requests to proceed rather than blocking legitimate users. All errors are logged for monitoring.

### Graceful Degradation

1. **Redis unavailable**: Allows all requests, logs warning
2. **Redis errors**: Allows request, logs error
3. **Pipeline failures**: Allows request, logs error
4. **Parsing errors**: Allows request, logs error

## Monitoring and Maintenance

### Cleanup

```typescript
import { cleanupExpiredRateLimits } from '@/lib/auth-rate-limiter'

// Run periodically (e.g., via cron job)
await cleanupExpiredRateLimits()
```

### Monitoring

The rate limiter logs important events:
- Rate limit exceeded events
- Redis connection errors
- Suspicious activity detection
- Cleanup operations

### Metrics

Track these metrics for monitoring:
- Rate limit hit rate by endpoint
- Redis connection health
- Response times
- Error rates

## Security Considerations

### IP Address Extraction

The rate limiter extracts IP addresses from multiple headers to work with different hosting providers:

1. `cf-connecting-ip` (Cloudflare)
2. `x-forwarded-for` (Most proxies)
3. `x-real-ip` (Nginx)
4. `req.ip` (Direct connection)

### Timing Attack Protection

All rate limit checks have consistent execution paths to prevent timing-based attacks that could reveal information about rate limit status.

### Memory Management

- Automatic cleanup of expired entries
- TTL on all Redis keys
- Bounded memory usage through sliding windows

## Testing

The implementation includes comprehensive tests covering:

- Basic rate limiting functionality
- Error handling scenarios
- Concurrent request handling
- Different identifier strategies
- Middleware integration
- Timing attack resistance

Run tests with:
```bash
npm test -- __tests__/lib/auth-rate-limiter.test.ts
npm test -- __tests__/lib/middleware/rate-limit-middleware.test.ts
```

## Performance

### Benchmarks

- Rate limit check: < 50ms
- Redis pipeline operations: < 10ms
- Memory usage: O(requests in window)
- Cleanup operation: O(expired entries)

### Optimization

- Uses Redis pipelines for atomic operations
- Efficient sorted set operations
- Minimal memory footprint
- Automatic cleanup prevents memory leaks

## Troubleshooting

### Common Issues

1. **Redis connection errors**: Check REDIS_URL and REDIS_TOKEN
2. **High memory usage**: Ensure cleanup is running regularly
3. **False positives**: Check IP extraction logic for your hosting provider
4. **Performance issues**: Monitor Redis latency and connection pool

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=rate-limiter
```

This will log all rate limit operations for debugging purposes.