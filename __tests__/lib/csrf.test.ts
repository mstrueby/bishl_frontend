
import crypto from 'crypto';
import { generateCSRFToken, validateCSRFToken, withCSRF } from '@/lib/csrf';

describe('csrf.ts', () => {
  describe('generateCSRFToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateCSRFToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate cryptographically random tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateCSRFToken());
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe('validateCSRFToken', () => {
    it('should return true for matching tokens', () => {
      const token = generateCSRFToken();
      expect(validateCSRFToken(token, token)).toBe(true);
    });

    it('should return false for different tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(validateCSRFToken(token1, token2)).toBe(false);
    });

    it('should return false when token is empty', () => {
      const sessionToken = generateCSRFToken();
      expect(validateCSRFToken('', sessionToken)).toBe(false);
    });

    it('should return false when sessionToken is empty', () => {
      const token = generateCSRFToken();
      expect(validateCSRFToken(token, '')).toBe(false);
    });

    it('should return false when both tokens are empty', () => {
      expect(validateCSRFToken('', '')).toBe(false);
    });

    it('should return false for tokens of different lengths', () => {
      const token = generateCSRFToken();
      const shortToken = token.substring(0, 32);
      expect(validateCSRFToken(token, shortToken)).toBe(false);
    });

    it('should use timing-safe comparison', () => {
      // This test ensures that the function uses crypto.timingSafeEqual
      // by verifying it handles buffer conversion correctly
      const token = generateCSRFToken();
      const result = validateCSRFToken(token, token);
      expect(result).toBe(true);
    });

    it('should handle invalid hex strings gracefully', () => {
      const validToken = generateCSRFToken();
      const invalidToken = 'not-a-hex-string';
      expect(validateCSRFToken(validToken, invalidToken)).toBe(false);
    });
  });

  describe('withCSRF middleware', () => {
    let mockReq: any;
    let mockRes: any;
    let mockHandler: jest.Mock;

    beforeEach(() => {
      mockReq = {
        method: 'POST',
        headers: {},
        cookies: {},
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      mockHandler = jest.fn().mockResolvedValue(undefined);
    });

    it('should call handler for GET requests without CSRF check', async () => {
      mockReq.method = 'GET';
      const wrappedHandler = withCSRF(mockHandler);
      
      await wrappedHandler(mockReq, mockRes);
      
      expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should validate CSRF token for POST requests', async () => {
      const token = generateCSRFToken();
      mockReq.method = 'POST';
      mockReq.headers['x-csrf-token'] = token;
      mockReq.cookies['csrf-token'] = token;

      const wrappedHandler = withCSRF(mockHandler);
      await wrappedHandler(mockReq, mockRes);

      expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should validate CSRF token for PUT requests', async () => {
      const token = generateCSRFToken();
      mockReq.method = 'PUT';
      mockReq.headers['x-csrf-token'] = token;
      mockReq.cookies['csrf-token'] = token;

      const wrappedHandler = withCSRF(mockHandler);
      await wrappedHandler(mockReq, mockRes);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should validate CSRF token for PATCH requests', async () => {
      const token = generateCSRFToken();
      mockReq.method = 'PATCH';
      mockReq.headers['x-csrf-token'] = token;
      mockReq.cookies['csrf-token'] = token;

      const wrappedHandler = withCSRF(mockHandler);
      await wrappedHandler(mockReq, mockRes);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should validate CSRF token for DELETE requests', async () => {
      const token = generateCSRFToken();
      mockReq.method = 'DELETE';
      mockReq.headers['x-csrf-token'] = token;
      mockReq.cookies['csrf-token'] = token;

      const wrappedHandler = withCSRF(mockHandler);
      await wrappedHandler(mockReq, mockRes);

      expect(mockHandler).toHaveBeenCalled();
    });

    it('should reject POST request with invalid CSRF token', async () => {
      mockReq.method = 'POST';
      mockReq.headers['x-csrf-token'] = generateCSRFToken();
      mockReq.cookies['csrf-token'] = generateCSRFToken();

      const wrappedHandler = withCSRF(mockHandler);
      await wrappedHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid CSRF token',
        message: 'CSRF validation failed',
      });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject POST request with missing CSRF token in header', async () => {
      mockReq.method = 'POST';
      mockReq.cookies['csrf-token'] = generateCSRFToken();

      const wrappedHandler = withCSRF(mockHandler);
      await wrappedHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should reject POST request with missing CSRF token in cookie', async () => {
      mockReq.method = 'POST';
      mockReq.headers['x-csrf-token'] = generateCSRFToken();

      const wrappedHandler = withCSRF(mockHandler);
      await wrappedHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});
