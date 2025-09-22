// Rate limiting implementation for API security
interface RateLimitInfo {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits = new Map<string, RateLimitInfo>()
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs = 15 * 60 * 1000, maxRequests = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isAllowed(identifier: string): { allowed: boolean; resetTime: number; remaining: number } {
    const now = Date.now()
    const limit = this.limits.get(identifier)

    if (!limit || now > limit.resetTime) {
      // New window or expired window
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return {
        allowed: true,
        resetTime: now + this.windowMs,
        remaining: this.maxRequests - 1,
      }
    }

    if (limit.count >= this.maxRequests) {
      return {
        allowed: false,
        resetTime: limit.resetTime,
        remaining: 0,
      }
    }

    limit.count++
    return {
      allowed: true,
      resetTime: limit.resetTime,
      remaining: this.maxRequests - limit.count,
    }
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, limit] of this.limits.entries()) {
      if (now > limit.resetTime) {
        this.limits.delete(key)
      }
    }
  }
}

export const rateLimiter = new RateLimiter()

// Auto-cleanup every 10 minutes
setInterval(() => rateLimiter.cleanup(), 10 * 60 * 1000)
