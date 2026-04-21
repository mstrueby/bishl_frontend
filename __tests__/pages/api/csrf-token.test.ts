
jest.mock('../../../lib/csrf', () => ({
  generateCSRFToken: jest.fn(),
  validateCSRFToken: jest.fn(),
  withCSRF: (handler: any) => handler,
}));

jest.mock('cookies-next', () => ({
  setCookie: jest.fn(),
}));

jest.mock('../../../lib/apiLogger', () => ({
  logApiError: jest.fn(),
}));

import handler from '../../../pages/api/csrf-token';
import { generateCSRFToken } from '../../../lib/csrf';
import { setCookie } from 'cookies-next';
import { logApiError } from '../../../lib/apiLogger';

const mockGenerateCSRFToken = generateCSRFToken as jest.Mock;
const mockSetCookie = setCookie as jest.Mock;
const mockLogApiError = logApiError as jest.Mock;

function makeReq(overrides: Record<string, any> = {}) {
  return {
    method: 'GET',
    headers: {},
    cookies: {},
    ...overrides,
  };
}

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('pages/api/csrf-token - sensitive data in error responses', () => {
  describe('GET request (happy path)', () => {
    it('returns a csrf token in the response body', () => {
      const fakeToken = 'a'.repeat(64);
      mockGenerateCSRFToken.mockReturnValueOnce(fakeToken);

      const req = makeReq();
      const res = makeRes();

      handler(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body).toHaveProperty('csrfToken', fakeToken);
    });

    it('response body contains only the csrfToken field', () => {
      mockGenerateCSRFToken.mockReturnValueOnce('b'.repeat(64));

      const req = makeReq();
      const res = makeRes();

      handler(req, res);

      const body = res.json.mock.calls[0][0];
      const keys = Object.keys(body);
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe('csrfToken');
    });

    it('does not expose internal environment or implementation details in the response', () => {
      const fakeToken = 'deadbeef'.repeat(8);
      mockGenerateCSRFToken.mockReturnValueOnce(fakeToken);

      const req = makeReq();
      const res = makeRes();

      handler(req, res);

      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain('process.env');
      expect(body).not.toContain('NODE_ENV');
      expect(body).not.toContain('secret');
    });
  });

  describe('unsupported HTTP methods', () => {
    const nonGetMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    it.each(nonGetMethods)(
      'returns 405 for %s without leaking internal details',
      (method) => {
        const req = makeReq({ method });
        const res = makeRes();

        handler(req, res);

        expect(res.status).toHaveBeenCalledWith(405);
        const body = res.json.mock.calls[0][0];
        expect(body).toHaveProperty('message', 'Method not allowed');
        const bodyStr = JSON.stringify(body);
        expect(bodyStr).not.toContain('stack');
        expect(bodyStr).not.toContain('Error');
        expect(bodyStr).not.toContain('__dirname');
      }
    );

    it('does not echo back the HTTP method in the 405 response body', () => {
      const req = makeReq({ method: 'POST' });
      const res = makeRes();

      handler(req, res);

      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain('POST');
    });
  });

  describe('token generation failure', () => {
    it('returns a safe generic 500 response when generateCSRFToken throws', () => {
      mockGenerateCSRFToken.mockImplementationOnce(() => {
        throw new Error('crypto.randomBytes failed: entropy pool exhausted at /internal/path');
      });

      const req = makeReq();
      const res = makeRes();

      handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      const body = res.json.mock.calls[0][0];
      expect(body).toEqual({ error: 'Internal server error' });
    });

    it('does not expose the internal error message in the response when generateCSRFToken throws', () => {
      const internalError = 'crypto.randomBytes failed: entropy pool exhausted at /internal/path';
      mockGenerateCSRFToken.mockImplementationOnce(() => {
        throw new Error(internalError);
      });

      const req = makeReq();
      const res = makeRes();

      handler(req, res);

      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain(internalError);
      expect(body).not.toContain('/internal/path');
    });

    it('does not expose the internal error message in log output when generateCSRFToken throws', () => {
      const internalError = 'entropy source exhausted: /srv/crypto/rng.ts:77';
      mockGenerateCSRFToken.mockImplementationOnce(() => {
        throw new Error(internalError);
      });

      const req = makeReq();
      const res = makeRes();

      handler(req, res);

      expect(mockLogApiError).toHaveBeenCalled();
      const logArgs = mockLogApiError.mock.calls.flat().join(' ');
      expect(logArgs).not.toContain(internalError);
      expect(logArgs).not.toContain('/srv/crypto/rng.ts');
    });

    it('returns a safe generic 500 response when setCookie throws', () => {
      const fakeToken = 'c'.repeat(64);
      mockGenerateCSRFToken.mockReturnValueOnce(fakeToken);
      mockSetCookie.mockImplementationOnce(() => {
        throw new Error('cookie jar internal error: /srv/session/store.ts:44');
      });

      const req = makeReq();
      const res = makeRes();

      handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      const body = res.json.mock.calls[0][0];
      expect(body).toEqual({ error: 'Internal server error' });
    });

    it('does not expose the internal error message in the response when setCookie throws', () => {
      const fakeToken = 'c'.repeat(64);
      mockGenerateCSRFToken.mockReturnValueOnce(fakeToken);
      mockSetCookie.mockImplementationOnce(() => {
        throw new Error('cookie jar internal error: /srv/session/store.ts:44');
      });

      const req = makeReq();
      const res = makeRes();

      handler(req, res);

      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain('/srv/session/store.ts');
      expect(body).not.toContain('cookie jar internal error');
    });

    it('does not expose the internal error message in log output when setCookie throws', () => {
      const fakeToken = 'd'.repeat(64);
      mockGenerateCSRFToken.mockReturnValueOnce(fakeToken);
      const cookieError = 'session store failure at /srv/session/store.ts:99';
      mockSetCookie.mockImplementationOnce(() => {
        throw new Error(cookieError);
      });

      const req = makeReq();
      const res = makeRes();

      handler(req, res);

      expect(mockLogApiError).toHaveBeenCalled();
      const logArgs = mockLogApiError.mock.calls.flat().join(' ');
      expect(logArgs).not.toContain(cookieError);
      expect(logArgs).not.toContain('/srv/session/store.ts');
    });
  });
});
