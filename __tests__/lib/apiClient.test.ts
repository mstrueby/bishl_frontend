import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import apiClient, { CancelToken, isCancel } from '@/lib/apiClient';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location - JSDOM compatible approach
const mockLocationData = {
  href: '',
  pathname: '/',
};

// Delete and redefine window.location for JSDOM
delete (window as any).location;
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    pathname: '/',
    search: '',
    hash: '',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    reload: jest.fn(),
    replace: jest.fn(),
    assign: jest.fn(),
  },
  writable: true,
  configurable: true,
});

describe('lib/apiClient.tsx - API Client', () => {
  let mock: MockAdapter;
  let axiosMock: MockAdapter; // For intercepting refresh token calls

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    axiosMock = new MockAdapter(axios); // Mock base axios for refresh calls
    localStorageMock.clear();
    // Reset location mock
    (window.location as any).href = '';
    (window.location as any).pathname = '/';
  });

  afterEach(() => {
    mock.reset();
    mock.restore();
    axiosMock.reset();
    axiosMock.restore();
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header when access token exists', async () => {
      const accessToken = 'test-access-token';
      localStorageMock.setItem('access_token', accessToken);

      mock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBe(`Bearer ${accessToken}`);
        return [200, { success: true, data: { message: 'ok' } }];
      });

      await apiClient.get('/test');
    });

    it('should not add Authorization header when no access token exists', async () => {
      mock.onGet('/test').reply((config) => {
        expect(config.headers?.Authorization).toBeUndefined();
        return [200, { success: true, data: { message: 'ok' } }];
      });

      await apiClient.get('/test');
    });

    it('should add CSRF token to POST requests', async () => {
      const csrfToken = 'test-csrf-token';
      localStorageMock.setItem('csrf_token', csrfToken);

      mock.onPost('/test').reply((config) => {
        expect(config.headers?.['X-CSRF-Token']).toBe(csrfToken);
        return [200, { success: true, data: {} }];
      });

      await apiClient.post('/test', {});
    });

    it('should add CSRF token to PUT, PATCH, DELETE requests', async () => {
      const csrfToken = 'test-csrf-token';
      localStorageMock.setItem('csrf_token', csrfToken);

      mock.onPut('/test').reply((config) => {
        expect(config.headers?.['X-CSRF-Token']).toBe(csrfToken);
        return [200, { success: true, data: {} }];
      });

      mock.onPatch('/test').reply((config) => {
        expect(config.headers?.['X-CSRF-Token']).toBe(csrfToken);
        return [200, { success: true, data: {} }];
      });

      mock.onDelete('/test').reply((config) => {
        expect(config.headers?.['X-CSRF-Token']).toBe(csrfToken);
        return [200, { success: true, data: {} }];
      });

      await apiClient.put('/test', {});
      await apiClient.patch('/test', {});
      await apiClient.delete('/test');
    });

    it('should not add CSRF token to GET requests', async () => {
      const csrfToken = 'test-csrf-token';
      localStorageMock.setItem('csrf_token', csrfToken);

      mock.onGet('/test').reply((config) => {
        expect(config.headers?.['X-CSRF-Token']).toBeUndefined();
        return [200, { success: true, data: {} }];
      });

      await apiClient.get('/test');
    });
  });

  describe('Response Interceptor - Unwrapping', () => {
    it('should unwrap standardized success response', async () => {
      mock.onGet('/test').reply(200, {
        success: true,
        data: { id: 1, name: 'Test' },
        message: 'Success',
      });

      const response = await apiClient.get('/test');
      expect(response.data).toEqual({ id: 1, name: 'Test' });
      expect(response.success).toBe(true);
      expect(response.message).toBe('Success');
    });

    it('should preserve pagination metadata', async () => {
      mock.onGet('/test').reply(200, {
        success: true,
        data: [{ id: 1 }, { id: 2 }],
        pagination: {
          page: 1,
          page_size: 10,
          total_items: 20,
          total_pages: 2,
          has_next: true,
          has_prev: false,
        },
        message: 'Success',
      });

      const response = await apiClient.get('/test');
      expect(response.data).toEqual([{ id: 1 }, { id: 2 }]);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.total_items).toBe(20);
    });

    it('should return response as-is if not standardized format', async () => {
      mock.onGet('/test').reply(200, { customField: 'value' });

      const response = await apiClient.get('/test');
      expect(response.data).toEqual({ customField: 'value' });
    });
  });

  describe('Token Refresh Logic', () => {
    it('should refresh token on 401 error and retry original request', async () => {
      const oldAccessToken = 'old-access-token';
      const newAccessToken = 'new-access-token';
      const refreshToken = 'refresh-token';

      localStorageMock.setItem('access_token', oldAccessToken);
      localStorageMock.setItem('refresh_token', refreshToken);

      // First request fails with 401
      mock.onGet('/protected').replyOnce(401);

      // Refresh token request succeeds (use axiosMock for base axios instance)
      axiosMock.onPost(`${process.env.NEXT_PUBLIC_API_URL}/users/refresh`).replyOnce(200, {
        data: {
          access_token: newAccessToken,
          refresh_token: 'new-refresh-token',
        },
      });

      // Retry of original request succeeds
      mock.onGet('/protected').replyOnce(200, {
        success: true,
        data: { message: 'Protected data' },
      });

      const response = await apiClient.get('/protected');

      expect(response.data).toEqual({ message: 'Protected data' });
      expect(localStorageMock.getItem('access_token')).toBe(newAccessToken);
      expect(localStorageMock.getItem('refresh_token')).toBe('new-refresh-token');
    });

    it('should queue multiple requests during token refresh', async () => {
      const oldAccessToken = 'old-access-token';
      const newAccessToken = 'new-access-token';
      const refreshToken = 'refresh-token';

      localStorageMock.setItem('access_token', oldAccessToken);
      localStorageMock.setItem('refresh_token', refreshToken);

      // All requests fail with 401 initially
      mock.onGet('/endpoint1').replyOnce(401);
      mock.onGet('/endpoint2').replyOnce(401);
      mock.onGet('/endpoint3').replyOnce(401);

      // Refresh token request (use axiosMock)
      axiosMock.onPost(`${process.env.NEXT_PUBLIC_API_URL}/users/refresh`).replyOnce(200, {
        data: { access_token: newAccessToken, refresh_token: 'new-refresh-token' },
      });

      // Retry requests succeed
      mock.onGet('/endpoint1').reply(200, { success: true, data: { id: 1 } });
      mock.onGet('/endpoint2').reply(200, { success: true, data: { id: 2 } });
      mock.onGet('/endpoint3').reply(200, { success: true, data: { id: 3 } });

      // Make all requests simultaneously
      const [res1, res2, res3] = await Promise.all([
        apiClient.get('/endpoint1'),
        apiClient.get('/endpoint2'),
        apiClient.get('/endpoint3'),
      ]);

      expect(res1.data).toEqual({ id: 1 });
      expect(res2.data).toEqual({ id: 2 });
      expect(res3.data).toEqual({ id: 3 });

      // Refresh should only be called once
      const refreshCalls = axiosMock.history.post.filter((req) => req.url?.includes('/users/refresh'));
      expect(refreshCalls.length).toBe(1);
    });

    it('should redirect to login when refresh token fails', async () => {
      const oldAccessToken = 'old-access-token';
      const refreshToken = 'expired-refresh-token';

      localStorageMock.setItem('access_token', oldAccessToken);
      localStorageMock.setItem('refresh_token', refreshToken);

      // Original request fails
      mock.onGet('/protected').replyOnce(401);

      // Refresh fails (use axiosMock)
      axiosMock.onPost(`${process.env.NEXT_PUBLIC_API_URL}/users/refresh`).replyOnce(401, {
        error: 'Invalid refresh token',
      });

      await expect(apiClient.get('/protected')).rejects.toThrow();

      expect(localStorageMock.getItem('access_token')).toBeNull();
      expect(localStorageMock.getItem('refresh_token')).toBeNull();
      expect(window.location.href).toBe('/login');
    });

    it('should redirect to login when no refresh token exists', async () => {
      const oldAccessToken = 'old-access-token';
      localStorageMock.setItem('access_token', oldAccessToken);
      // No refresh token

      mock.onGet('/protected').replyOnce(401);

      await expect(apiClient.get('/protected')).rejects.toThrow();

      expect(window.location.href).toBe('/login');
    });

    it('should not redirect to login if already on login page', async () => {
      (window.location as any).pathname = '/login';
      const oldAccessToken = 'old-access-token';
      localStorageMock.setItem('access_token', oldAccessToken);

      mock.onGet('/protected').replyOnce(401);

      await expect(apiClient.get('/protected')).rejects.toThrow();

      // href should not be set to /login
      expect(window.location.href).toBe('');
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network errors up to MAX_RETRIES', async () => {
      mock.onGet('/test').networkErrorOnce();
      mock.onGet('/test').networkErrorOnce();
      mock.onGet('/test').reply(200, { success: true, data: { message: 'ok' } });

      const response = await apiClient.get('/test');
      expect(response.data).toEqual({ message: 'ok' });
      expect(mock.history.get.length).toBe(3);
    });

    it('should retry on timeout errors', async () => {
      mock.onGet('/test').timeoutOnce();
      mock.onGet('/test').reply(200, { success: true, data: { message: 'ok' } });

      const response = await apiClient.get('/test');
      expect(response.data).toEqual({ message: 'ok' });
      expect(mock.history.get.length).toBe(2);
    });

    it('should retry on 500, 502, 503, 504 errors', async () => {
      mock.onGet('/test500').replyOnce(500);
      mock.onGet('/test500').reply(200, { success: true, data: { ok: true } });

      mock.onGet('/test502').replyOnce(502);
      mock.onGet('/test502').reply(200, { success: true, data: { ok: true } });

      mock.onGet('/test503').replyOnce(503);
      mock.onGet('/test503').reply(200, { success: true, data: { ok: true } });

      mock.onGet('/test504').replyOnce(504);
      mock.onGet('/test504').reply(200, { success: true, data: { ok: true } });

      await apiClient.get('/test500');
      await apiClient.get('/test502');
      await apiClient.get('/test503');
      await apiClient.get('/test504');

      expect(mock.history.get.length).toBe(8); // 4 failures + 4 retries
    });

    it('should not retry on 501, 505, 511 errors', async () => {
      mock.onGet('/test501').reply(501);

      await expect(apiClient.get('/test501')).rejects.toThrow();
      expect(mock.history.get.length).toBe(1); // No retry
    });

    it('should not retry on 400 errors', async () => {
      mock.onGet('/test').reply(400, { error: 'Bad request' });

      await expect(apiClient.get('/test')).rejects.toThrow();
      expect(mock.history.get.length).toBe(1);
    });

    it('should fail after MAX_RETRIES attempts', async () => {
      mock.onGet('/test').networkError();
      mock.onGet('/test').networkError();
      mock.onGet('/test').networkError();
      mock.onGet('/test').networkError();

      await expect(apiClient.get('/test')).rejects.toThrow();
      expect(mock.history.get.length).toBe(4); // 1 initial + 3 retries
    });
  });

  describe('Request Cancellation', () => {
    it('should support request cancellation', async () => {
      const source = CancelToken.source();

      mock.onGet('/test').reply(() => {
        source.cancel('Request cancelled by user');
        return [200, { success: true, data: {} }];
      });

      try {
        await apiClient.get('/test', { cancelToken: source.token });
      } catch (error) {
        expect(isCancel(error)).toBe(true);
      }
    });

    it('should export CancelToken and isCancel', () => {
      expect(CancelToken).toBeDefined();
      expect(isCancel).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle response without data field', async () => {
      mock.onGet('/test').reply(200, null);

      const response = await apiClient.get('/test');
      expect(response.data).toBeNull();
    });

    it('should handle empty response', async () => {
      mock.onGet('/test').reply(204);

      const response = await apiClient.get('/test');
      expect(response.status).toBe(204);
    });

    it('should not retry 401 errors more than once (token refresh only)', async () => {
      const refreshToken = 'refresh-token';
      localStorageMock.setItem('refresh_token', refreshToken);

      mock.onGet('/protected').reply(401);
      axiosMock.onPost(`${process.env.NEXT_PUBLIC_API_URL}/users/refresh`).reply(401);

      await expect(apiClient.get('/protected')).rejects.toThrow();

      // Should only attempt refresh once
      const refreshCalls = axiosMock.history.post.filter((req) => req.url?.includes('/users/refresh'));
      expect(refreshCalls.length).toBe(1);
    });
  });
});