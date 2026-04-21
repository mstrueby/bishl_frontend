
jest.mock('../../../lib/apiLogger', () => ({
  logApiError: jest.fn(),
}));

jest.mock('axios');

import axios from 'axios';
import handler from '../../../pages/api/user';
import { logApiError } from '../../../lib/apiLogger';

const mockLogApiError = logApiError as jest.Mock;
const mockedAxios = axios as jest.Mocked<typeof axios>;

function makeReq(overrides: Record<string, any> = {}) {
  return {
    method: 'GET',
    headers: { authorization: 'Bearer test-token' },
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

function makeAxiosError(status: number, data: Record<string, any>) {
  const err: any = new Error(`Request failed with status code ${status}`);
  err.isAxiosError = true;
  err.response = { status, data };
  return err;
}

beforeEach(() => {
  jest.clearAllMocks();
  (axios.isAxiosError as unknown as jest.Mock) = jest.fn(
    (err: any) => err && err.isAxiosError === true
  );
});

describe('pages/api/user - sensitive data in error responses', () => {
  describe('axios error with backend response', () => {
    it('always returns a generic "Failed to fetch user" message regardless of backend detail', async () => {
      mockedAxios.get = jest.fn().mockRejectedValueOnce(
        makeAxiosError(401, { detail: 'Token expired: user abc123 session invalidated' })
      );

      const req = makeReq();
      const res = makeRes();

      await handler(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body).toEqual({ error: 'Failed to fetch user' });
    });

    it('does not include the access token from the request in the response', async () => {
      const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret';
      mockedAxios.get = jest.fn().mockRejectedValueOnce(
        makeAxiosError(401, { detail: 'Expired token' })
      );

      const req = makeReq({ headers: { authorization: `Bearer ${accessToken}` } });
      const res = makeRes();

      await handler(req, res);

      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain(accessToken);
    });

    it('does not forward backend detail, internal codes, or extra fields', async () => {
      mockedAxios.get = jest.fn().mockRejectedValueOnce(
        makeAxiosError(403, {
          detail: 'jwt.decode error at /srv/auth/validate.py:88',
          internal_trace: 'auth.py:123',
          server_version: '1.2.3-internal',
          host: 'internal-api.private.svc',
          user_record: { id: 'abc123', hash: '$2b$12$secret_hash_value' },
        })
      );

      const req = makeReq();
      const res = makeRes();

      await handler(req, res);

      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain('internal_trace');
      expect(body).not.toContain('jwt.decode error');
      expect(body).not.toContain('user_record');
      expect(body).not.toContain('secret_hash_value');
      expect(body).not.toContain('server_version');
      expect(body).not.toContain('1.2.3-internal');
      expect(body).not.toContain('internal-api.private.svc');
    });

    it('returns generic "Failed to fetch user" even when backend has no detail', async () => {
      mockedAxios.get = jest.fn().mockRejectedValueOnce(makeAxiosError(503, {}));

      const req = makeReq();
      const res = makeRes();

      await handler(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body).toEqual({ error: 'Failed to fetch user' });
    });

    it('does not include the access token in log output', async () => {
      const accessToken = 'super-secret-bearer-token-value';
      mockedAxios.get = jest.fn().mockRejectedValueOnce(
        makeAxiosError(401, { detail: 'Bad token' })
      );

      const req = makeReq({ headers: { authorization: `Bearer ${accessToken}` } });
      const res = makeRes();

      await handler(req, res);

      expect(mockLogApiError).toHaveBeenCalled();
      const logArgs = mockLogApiError.mock.calls.flat().join(' ');
      expect(logArgs).not.toContain(accessToken);
    });

    it('does not expose backend response data in log output', async () => {
      const sensitiveDetail = 'internal db connection string: postgres://admin:pass@db:5432';
      mockedAxios.get = jest.fn().mockRejectedValueOnce(
        makeAxiosError(500, { detail: sensitiveDetail })
      );

      const req = makeReq();
      const res = makeRes();

      await handler(req, res);

      const logArgs = mockLogApiError.mock.calls.flat().join(' ');
      expect(logArgs).not.toContain(sensitiveDetail);
    });
  });

  describe('non-axios / unexpected error', () => {
    beforeEach(() => {
      (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);
    });

    it('returns a generic 500 response when an unexpected error is thrown', async () => {
      mockedAxios.get = jest.fn().mockRejectedValueOnce(new Error('Unexpected crash'));

      const req = makeReq();
      const res = makeRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      const body = res.json.mock.calls[0][0];
      expect(body).toEqual({ error: 'Internal server error' });
    });

    it('does not include internal error message in the generic 500 response', async () => {
      const internalMsg = 'Cannot read property "secret_key" of undefined in config.ts:101';
      mockedAxios.get = jest.fn().mockRejectedValueOnce(new Error(internalMsg));

      const req = makeReq();
      const res = makeRes();

      await handler(req, res);

      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain(internalMsg);
      expect(body).not.toContain('secret_key');
    });

    it('logs the unexpected error without including the access token', async () => {
      const token = 'confidential-access-token-xyz';
      mockedAxios.get = jest.fn().mockRejectedValueOnce(new Error('Some internal failure'));

      const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
      const res = makeRes();

      await handler(req, res);

      expect(mockLogApiError).toHaveBeenCalled();
      const logArgs = mockLogApiError.mock.calls.flat().join(' ');
      expect(logArgs).not.toContain(token);
    });
  });

  describe('missing authorization header', () => {
    it('returns 401 without echoing any request headers in the response', async () => {
      const req = makeReq({ headers: {} });
      const res = makeRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      const body = res.json.mock.calls[0][0];
      expect(body).toEqual({ error: 'No access token provided' });
    });
  });

  describe('unsupported HTTP method', () => {
    it('returns 405 without leaking internal server details', async () => {
      const req = makeReq({ method: 'POST' });
      const res = makeRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      const body = JSON.stringify(res.json.mock.calls[0][0]);
      expect(body).not.toContain('stack');
      expect(body).not.toContain('Error');
    });
  });
});
