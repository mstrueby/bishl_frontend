
import crypto from 'crypto';

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(sessionToken, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * CSRF middleware for API routes
 */
export function withCSRF(
  handler: (req: any, res: any) => Promise<void>
) {
  return async (req: any, res: any) => {
    // Only check CSRF for state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method || '')) {
      const csrfToken = req.headers['x-csrf-token'];
      const sessionToken = req.cookies?.['csrf-token'];
      
      if (!validateCSRFToken(csrfToken, sessionToken)) {
        return res.status(403).json({ 
          error: 'Invalid CSRF token',
          message: 'CSRF validation failed'
        });
      }
    }
    
    return handler(req, res);
  };
}
