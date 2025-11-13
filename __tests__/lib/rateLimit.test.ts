
/**
 * Unit tests for lib/rateLimit.ts
 * Tests rate limiting logic and middleware
 */

import { rateLimit, withRateLimit } from '../../lib/rateLimit';

describe('lib/rateLimit', () => {
  let mockReq: any;
  let mockRes: any;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let nextMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));
    nextMock = jest.fn();
    
    mockReq = {
      headers: {},
      connection: {}
    };
    
    mockRes = {
      status: statusMock,
      json: jsonMock
    };
  });

  describe('rateLimit middleware', () => {
    it('should allow request within rate limit', async () => {
      mockReq.headers['x-forwarded-for'] = '192.168.1.1';
      
      const limiter = rateLimit({ windowMs: 60000, maxRequests: 5 });
      
      await limiter(mockReq, mockRes, nextMock);
      
      expect(nextMock).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should block request when rate limit exceeded', async () => {
      mockReq.headers['x-forwarded-for'] = '192.168.1.2';
      
      const limiter = rateLimit({ windowMs: 60000, maxRequests: 3 });
      
      // Make 3 requests (at the limit)
      await limiter(mockReq, mockRes, nextMock);
      await limiter(mockReq, mockRes, nextMock);
      await limiter(mockReq, mockRes, nextMock);
      
      expect(nextMock).toHaveBeenCalledTimes(3);
      
      // 4th request should be blocked
      await limiter(mockReq, mockRes, nextMock);
      
      expect(statusMock).toHaveBeenCalledWith(429);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: expect.any(Number)
      });
      expect(nextMock).toHaveBeenCalledTimes(3); // Still only 3 calls to next
    });

    it('should use default limits if options not provided', async () => {
      mockReq.headers['x-forwarded-for'] = '192.168.1.3';
      
      const limiter = rateLimit();
      
      // Default is 100 requests per minute
      for (let i = 0; i < 100; i++) {
        await limiter(mockReq, mockRes, nextMock);
      }
      
      expect(nextMock).toHaveBeenCalledTimes(100);
      
      // 101st request should be blocked
      await limiter(mockReq, mockRes, nextMock);
      
      expect(statusMock).toHaveBeenCalledWith(429);
    });

    it('should use IP from x-forwarded-for header', async () => {
      mockReq.headers['x-forwarded-for'] = '10.0.0.1';
      
      const limiter = rateLimit({ windowMs: 60000, maxRequests: 2 });
      
      await limiter(mockReq, mockRes, nextMock);
      await limiter(mockReq, mockRes, nextMock);
      
      expect(nextMock).toHaveBeenCalledTimes(2);
      
      // 3rd request from same IP should be blocked
      await limiter(mockReq, mockRes, nextMock);
      expect(statusMock).toHaveBeenCalledWith(429);
    });

    it('should use IP from connection.remoteAddress if x-forwarded-for missing', async () => {
      mockReq.connection.remoteAddress = '172.16.0.1';
      
      const limiter = rateLimit({ windowMs: 60000, maxRequests: 2 });
      
      await limiter(mockReq, mockRes, nextMock);
      await limiter(mockReq, mockRes, nextMock);
      
      expect(nextMock).toHaveBeenCalledTimes(2);
      
      await limiter(mockReq, mockRes, nextMock);
      expect(statusMock).toHaveBeenCalledWith(429);
    });

    it('should use "unknown" if no IP can be determined', async () => {
      const limiter = rateLimit({ windowMs: 60000, maxRequests: 2 });
      
      await limiter(mockReq, mockRes, nextMock);
      await limiter(mockReq, mockRes, nextMock);
      
      expect(nextMock).toHaveBeenCalledTimes(2);
      
      await limiter(mockReq, mockRes, nextMock);
      expect(statusMock).toHaveBeenCalledWith(429);
    });

    it('should reset counter after window expires', async () => {
      jest.useFakeTimers();
      
      mockReq.headers['x-forwarded-for'] = '192.168.1.4';
      
      const limiter = rateLimit({ windowMs: 1000, maxRequests: 2 });
      
      // Make 2 requests
      await limiter(mockReq, mockRes, nextMock);
      await limiter(mockReq, mockRes, nextMock);
      
      expect(nextMock).toHaveBeenCalledTimes(2);
      
      // 3rd request should be blocked
      await limiter(mockReq, mockRes, nextMock);
      expect(statusMock).toHaveBeenCalledWith(429);
      
      // Fast-forward time past the window
      jest.advanceTimersByTime(1001);
      
      // Should allow new requests now
      await limiter(mockReq, mockRes, nextMock);
      expect(nextMock).toHaveBeenCalledTimes(3);
      
      jest.useRealTimers();
    });

    it('should track different IPs separately', async () => {
      const limiter = rateLimit({ windowMs: 60000, maxRequests: 2 });
      
      // IP 1
      mockReq.headers['x-forwarded-for'] = '192.168.1.5';
      await limiter(mockReq, mockRes, nextMock);
      await limiter(mockReq, mockRes, nextMock);
      
      // IP 2
      mockReq.headers['x-forwarded-for'] = '192.168.1.6';
      await limiter(mockReq, mockRes, nextMock);
      await limiter(mockReq, mockRes, nextMock);
      
      expect(nextMock).toHaveBeenCalledTimes(4);
      
      // IP 1 should be blocked
      mockReq.headers['x-forwarded-for'] = '192.168.1.5';
      await limiter(mockReq, mockRes, nextMock);
      expect(statusMock).toHaveBeenCalledWith(429);
      
      // IP 2 should also be blocked
      mockReq.headers['x-forwarded-for'] = '192.168.1.6';
      await limiter(mockReq, mockRes, nextMock);
      expect(statusMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('withRateLimit wrapper', () => {
    it('should apply rate limiting to handler', async () => {
      mockReq.headers['x-forwarded-for'] = '192.168.1.7';
      
      const handler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = withRateLimit(handler, { windowMs: 60000, maxRequests: 2 });
      
      await wrappedHandler(mockReq, mockRes);
      await wrappedHandler(mockReq, mockRes);
      
      expect(handler).toHaveBeenCalledTimes(2);
      
      // 3rd request should be blocked
      await wrappedHandler(mockReq, mockRes);
      
      expect(handler).toHaveBeenCalledTimes(2); // Still only 2 calls
      expect(statusMock).toHaveBeenCalledWith(429);
    });

    it('should call handler if within rate limit', async () => {
      mockReq.headers['x-forwarded-for'] = '192.168.1.8';
      
      const handler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = withRateLimit(handler, { windowMs: 60000, maxRequests: 5 });
      
      await wrappedHandler(mockReq, mockRes);
      
      expect(handler).toHaveBeenCalledWith(mockReq, mockRes);
    });

    it('should handle handler errors', async () => {
      mockReq.headers['x-forwarded-for'] = '192.168.1.9';
      
      const error = new Error('Handler error');
      const handler = jest.fn().mockRejectedValue(error);
      const wrappedHandler = withRateLimit(handler, { windowMs: 60000, maxRequests: 5 });
      
      await expect(wrappedHandler(mockReq, mockRes)).rejects.toThrow('Handler error');
    });

    it('should use default options if none provided', async () => {
      mockReq.headers['x-forwarded-for'] = '192.168.1.10';
      
      const handler = jest.fn().mockResolvedValue(undefined);
      const wrappedHandler = withRateLimit(handler);
      
      // Default is 100 requests
      for (let i = 0; i < 100; i++) {
        await wrappedHandler(mockReq, mockRes);
      }
      
      expect(handler).toHaveBeenCalledTimes(100);
      
      // 101st should be blocked
      await wrappedHandler(mockReq, mockRes);
      expect(statusMock).toHaveBeenCalledWith(429);
    });
  });

  describe('retryAfter calculation', () => {
    it('should return correct retryAfter value in seconds', async () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);
      
      mockReq.headers['x-forwarded-for'] = '192.168.1.11';
      
      const limiter = rateLimit({ windowMs: 5000, maxRequests: 1 });
      
      await limiter(mockReq, mockRes, nextMock);
      
      // Advance 2 seconds
      jest.advanceTimersByTime(2000);
      
      // This should be blocked
      await limiter(mockReq, mockRes, nextMock);
      
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: 3 // 5 seconds window - 2 seconds elapsed = 3 seconds remaining
      });
      
      jest.useRealTimers();
    });
  });
});
