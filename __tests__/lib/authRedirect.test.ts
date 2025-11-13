import { redirectToLogin } from '@/lib/authRedirect';

// Suppress jsdom navigation warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Not implemented: navigation')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

describe('authRedirect.ts', () => {
  let originalLocation: Location;
  let mockLocationHref: string;

  beforeEach(() => {
    // Save original location
    originalLocation = window.location;

    // Clear localStorage
    localStorage.clear();

    // Mock window.location with href setter to avoid jsdom navigation error
    mockLocationHref = 'http://localhost/some-page';
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      pathname: '/some-page',
      get href() {
        return mockLocationHref;
      },
      set href(url: string) {
        mockLocationHref = url;
      },
    } as Location;
  });

  // Restore original location after each test
  afterEach(() => {
    delete (window as any).location;
    window.location = originalLocation;
  });

  describe('redirectToLogin', () => {
    let mockLocation: Partial<Location>;
    let mockStorage: { [key: string]: string };

    beforeEach(() => {
      mockLocation = {
        pathname: '/admin/dashboard',
        href: '',
      };

      mockStorage = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        csrf_token: 'test-csrf-token',
      };
    });

    const createMockStorage = (storage: { [key: string]: string }): Storage => ({
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach((key) => delete storage[key]);
      },
      key: (index: number) => Object.keys(storage)[index] || null,
      length: Object.keys(storage).length,
    });

    it('should clear access_token from storage', () => {
      const storage = createMockStorage(mockStorage);
      redirectToLogin(mockLocation as Location, storage);

      expect(storage.getItem('access_token')).toBeNull();
    });

    it('should clear refresh_token from storage', () => {
      const storage = createMockStorage(mockStorage);
      redirectToLogin(mockLocation as Location, storage);

      expect(storage.getItem('refresh_token')).toBeNull();
    });

    it('should clear csrf_token from storage', () => {
      const storage = createMockStorage(mockStorage);
      redirectToLogin(mockLocation as Location, storage);

      expect(storage.getItem('csrf_token')).toBeNull();
    });

    it('should redirect to login page when not already on login page', () => {
      window.location.pathname = '/dashboard';
      mockLocationHref = 'http://localhost/dashboard';

      redirectToLogin();

      expect(mockLocationHref).toBe('/login');
    });

    it('should not redirect when already on login page', () => {
      window.location.pathname = '/login';
      mockLocationHref = 'http://localhost/login';
      const initialHref = mockLocationHref;

      redirectToLogin();

      expect(mockLocationHref).toBe(initialHref);
    });

    it('should not redirect when pathname contains login', () => {
      window.location.pathname = '/admin/login';
      mockLocationHref = 'http://localhost/admin/login';
      const initialHref = mockLocationHref;

      redirectToLogin();

      expect(mockLocationHref).toBe(initialHref);
    });

    it('should handle empty pathname gracefully', () => {
      window.location.pathname = '';
      mockLocationHref = 'http://localhost/';

      // Should not throw error
      expect(() => redirectToLogin()).not.toThrow();
    });

    it('should clear all tokens even if some do not exist', () => {
      const storage = createMockStorage({ access_token: 'test-token' });
      redirectToLogin(mockLocation as Location, storage);

      expect(storage.getItem('access_token')).toBeNull();
      expect(storage.getItem('refresh_token')).toBeNull();
      expect(storage.getItem('csrf_token')).toBeNull();
    });

    it('should work with default parameters in browser environment', () => {
      // Simulate being on a protected page
      window.location.pathname = '/admin/dashboard';
      mockLocationHref = 'http://localhost/admin/dashboard';

      // Call with no arguments (should use window.location and localStorage)
      redirectToLogin();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('csrf_token')).toBeNull();
      expect(mockLocationHref).toBe('/login');
    });

    it('should redirect from various protected routes', () => {
      const protectedRoutes = [
        '/admin/clubs',
        '/admin/players',
        '/leaguemanager/tournaments',
        '/matches/123',
      ];

      protectedRoutes.forEach(route => {
        window.location.pathname = route;
        mockLocationHref = `http://localhost${route}`;
        redirectToLogin();
        expect(mockLocationHref).toBe('/login');
      });
    });

    it('should clear tokens in correct order', () => {
      const removeOrder: string[] = [];
      const storage = createMockStorage(mockStorage);

      const originalRemoveItem = storage.removeItem;
      storage.removeItem = (key: string) => {
        removeOrder.push(key);
        originalRemoveItem.call(storage, key);
      };

      redirectToLogin(mockLocation as Location, storage);

      expect(removeOrder).toEqual(['access_token', 'refresh_token', 'csrf_token']);
    });
  });
});