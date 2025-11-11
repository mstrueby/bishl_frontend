
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  maxRequests?: number; // Max requests per window
}

/**
 * Simple in-memory rate limiter
 * For production, use Redis or similar
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute default
  const maxRequests = options.maxRequests || 100; // 100 requests default

  return async (req: any, res: any, next: () => void) => {
    // Use IP address as identifier
    const identifier = req.headers['x-forwarded-for'] || 
                      req.connection?.remoteAddress || 
                      'unknown';

    const now = Date.now();
    const record = store[identifier];

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      Object.keys(store).forEach(key => {
        if (store[key].resetTime < now) {
          delete store[key];
        }
      });
    }

    if (!record || record.resetTime < now) {
      // Create new record
      store[identifier] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    // Increment counter
    record.count++;
    return next();
  };
}

/**
 * Apply rate limit to API handler
 */
export function withRateLimit(
  handler: (req: any, res: any) => Promise<void>,
  options?: RateLimitOptions
) {
  const limiter = rateLimit(options);
  
  return async (req: any, res: any) => {
    return new Promise((resolve, reject) => {
      limiter(req, res, async () => {
        try {
          await handler(req, res);
          resolve(undefined);
        } catch (error) {
          reject(error);
        }
      });
    });
  };
}
