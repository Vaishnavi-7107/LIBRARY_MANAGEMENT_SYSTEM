import { type NextRequest, NextResponse } from "next/server"
import { rateLimiter } from "@/lib/rate-limiter"

export function withRateLimit(handler: (req: NextRequest, ...args: any[]) => Promise<Response>) {
  return async (req: NextRequest, ...args: any[]) => {
    // Get client identifier (IP address or user ID)
    const identifier = req.ip || req.headers.get("x-forwarded-for") || "anonymous"

    const { allowed, resetTime, remaining } = rateLimiter.isAllowed(identifier)

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Please try again later.",
          resetTime,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetTime.toString(),
            "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
          },
        },
      )
    }

    const response = await handler(req, ...args)

    // Add rate limit headers to successful responses
    if (response instanceof Response) {
      response.headers.set("X-RateLimit-Limit", "100")
      response.headers.set("X-RateLimit-Remaining", remaining.toString())
      response.headers.set("X-RateLimit-Reset", resetTime.toString())
    }

    return response
  }
}
