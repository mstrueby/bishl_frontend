
jest.mock('../../../lib/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

jest.mock('../../../lib/csrf', () => ({
  withCSRF: (handler: any) => handler,
  generateCSRFToken: jest.fn(),
  validateCSRFToken: jest.fn(),
}));

jest.mock('../../../lib/apiLogger', () => ({
  logApiError: jest.fn(),
}));

import handler from '../../../pages/api/login';
import { logApiError } from '../../../lib/apiLogger';

const mockLogApiError = logApiError as jest.Mock;

global.fetch = jest.fn();

function makeReq(overrides: Record<string, any> = {}) {
  return {
    method: 'POST',
    body: { email: 'user@example.com', password: 's3cr3tP@ssw0rd' },
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

function makeFetchResponse(status: number, body: Record<string, any>, ok = false) {
  return {
    status,
    ok,
    text: jest.fn().mockResolvedValueOnce(JSON.stringify(body)),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('pages/api/login - sensitive data in error responses', () => {
  describe('backend fetch throws (network error)', () => {
    it('returns a generic 500 message without exposing the error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('ECONNREFUSED: connection refused at 10.0.0.1:8080')
      );

      const req = makeReq();
      const res = makeRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      const body = res.json.mock.calls[0][0];
      expect(body).toEqual({ error: 'Internal server error during login' });
    });

    it('does not include the user password in the response body', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      const req = makeReq({ body: { email: 'victim@example.com', password: 'TopSecretPassword!' } });
      const res = makeRes();

      await handler(req, res);

      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain('TopSecretPassword!');
      expect(body).not.toContain('victim@example.com');
    });

    it('does not include the raw network error message in the response body', async () => {
      const internalMessage = 'SQL injection detected at line 42 in /srv/app/db.py';
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(internalMessage));

      const req = makeReq();
      const res = makeRes();

      await handler(req, res);

      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain(internalMessage);
    });

    it('logs only a safe message without including user credentials', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      const req = makeReq({ body: { email: 'user@example.com', password: 'MyPassword123' } });
      const res = makeRes();

      await handler(req, res);

      expect(mockLogApiError).toHaveBeenCalled();
      const logArgs = mockLogApiError.mock.calls.flat().join(' ');
      expect(logArgs).not.toContain('MyPassword123');
      expect(logArgs).not.toContain('user@example.com');
    });
  });

  describe('backend returns invalid JSON', () => {
    it('returns a generic 500 message when the backend sends non-JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: jest.fn().mockResolvedValueOnce('<!DOCTYPE html><html>Internal Error</html>'),
      });

      const req = makeReq();
      const res = makeRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain('<!DOCTYPE html>');
      expect(body).not.toContain('Internal Error');
    });

    it('does not expose raw HTML backend response body in the response', async () => {
      const rawBackendHtml =
        '<html><body>Database error: table "users" does not exist</body></html>';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 500,
        ok: false,
        text: jest.fn().mockResolvedValueOnce(rawBackendHtml),
      });

      const req = makeReq();
      const res = makeRes();

      await handler(req, res);

      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain('table "users" does not exist');
      expect(body).not.toContain('<html>');
    });

    it('logs the parse failure without including the raw response text', async () => {
      const sensitiveRawBody = 'Stack trace: /internal/secret/path:42';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: jest.fn().mockResolvedValueOnce(sensitiveRawBody),
      });

      const req = makeReq();
      const res = makeRes();

      await handler(req, res);

      const logArgs = mockLogApiError.mock.calls.flat().join(' ');
      expect(logArgs).not.toContain(sensitiveRawBody);
    });
  });

  describe('backend returns non-ok HTTP status', () => {
    it('always returns a generic "Authentication failed" message regardless of backend detail', async () => {
      const backendBody = {
        detail: 'Invalid credentials for user user@example.com — attempt #7',
        internal_code: 'AUTH_007',
        stack: 'Error at auth.py:123',
        db_query: 'SELECT * FROM users WHERE email=...',
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(401, backendBody, false)
      );

      const req = makeReq();
      const res = makeRes();

      await handler(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body).toEqual({ error: 'Authentication failed' });
    });

    it('does not forward any backend detail, internal codes, or stack traces', async () => {
      const backendBody = {
        detail: 'Token expired: refresh required by /auth/jwt.py:55',
        internal_code: 'AUTH_007',
        stack: 'Error at auth.py:123',
        db_query: 'SELECT * FROM users WHERE email=...',
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(401, backendBody, false)
      );

      const req = makeReq();
      const res = makeRes();

      await handler(req, res);

      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain('internal_code');
      expect(body).not.toContain('AUTH_007');
      expect(body).not.toContain('auth.py:123');
      expect(body).not.toContain('db_query');
      expect(body).not.toContain('/auth/jwt.py:55');
    });

    it('returns generic "Authentication failed" even when backend has no detail field', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(503, { message: 'Service unavailable' }, false)
      );

      const req = makeReq();
      const res = makeRes();

      await handler(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body).toEqual({ error: 'Authentication failed' });
    });

    it('does not expose the user password in the log output on auth failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        makeFetchResponse(401, { detail: 'Bad credentials' }, false)
      );

      const req = makeReq({ body: { email: 'hacker@example.com', password: 'P@ssw0rdLeak' } });
      const res = makeRes();

      await handler(req, res);

      const logArgs = mockLogApiError.mock.calls.flat().join(' ');
      expect(logArgs).not.toContain('P@ssw0rdLeak');
      expect(logArgs).not.toContain('hacker@example.com');
    });
  });

  describe('missing credentials', () => {
    it('returns a 400 validation error without echoing back the supplied password', async () => {
      const req = makeReq({ body: { email: undefined, password: 'SomePass' } });
      const res = makeRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain('SomePass');
    });
  });

  describe('unsupported HTTP method', () => {
    it('returns 405 without leaking internal details', async () => {
      const req = makeReq({ method: 'DELETE' });
      const res = makeRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain('stack');
    });
  });
});
