/**
 * Rate Limiter — Simple in-memory sliding window rate limiter.
 *
 * Limits requests per client IP per time window.
 * Returns 429 Too Many Requests when the limit is exceeded.
 *
 * Phase D.4.6 — Rate Limiting
 */

import type { Request, Response, NextFunction } from "express";

export interface RateLimiterOptions {
  /** Maximum number of requests allowed in the window. */
  maxRequests: number;
  /** Time window in milliseconds. */
  windowMs: number;
  /** Optional array of paths to exclude from rate limiting. */
  excludePaths?: string[];
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private readonly windows: Map<string, WindowEntry> = new Map();
  private readonly options: RateLimiterOptions;

  constructor(options: Partial<RateLimiterOptions> = {}) {
    this.options = {
      maxRequests: options.maxRequests ?? 100,
      windowMs: options.windowMs ?? 60_000, // 1 minute
      excludePaths: options.excludePaths ?? ["/health", "/ready", "/metrics"],
    };
  }

  /** Get the middleware handler. */
  middleware(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip rate limiting for excluded paths
      if (this.options.excludePaths?.includes(req.path)) {
        next();
        return;
      }

      const key = this.getClientKey(req);
      const now = Date.now();

      let entry = this.windows.get(key);

      // If no entry or window has expired, create a new one
      if (!entry || now >= entry.resetAt) {
        entry = { count: 0, resetAt: now + this.options.windowMs };
        this.windows.set(key, entry);
      }

      entry.count++;

      // Set rate limit headers
      const remaining = Math.max(0, this.options.maxRequests - entry.count);
      res.setHeader("X-RateLimit-Limit", this.options.maxRequests);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

      if (entry.count > this.options.maxRequests) {
        res.status(429).json({
          error: "Too many requests",
          message: `Rate limit exceeded. Max ${this.options.maxRequests} requests per ${this.options.windowMs / 1000}s.`,
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        });
        return;
      }

      next();
    };
  }

  /** Extract a consistent client key from the request. */
  private getClientKey(req: Request): string {
    // Use X-Forwarded-For if available, fall back to IP
    const forwarded = req.headers["x-forwarded-for"] as string | undefined;
    const ip = forwarded?.split(",")[0]?.trim() ?? req.ip ?? req.socket.remoteAddress ?? "unknown";
    return ip;
  }

  /** Clean up expired entries to prevent memory leaks. */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.windows.entries()) {
      if (now >= entry.resetAt) {
        this.windows.delete(key);
      }
    }
  }
}
