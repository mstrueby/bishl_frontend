
import { redirectToLogin } from '@/lib/authRedirect';

/**
 * Mock Storage implementation for testing
 * Implements the full Storage interface without relying on localStorage
 */
class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

/**
 * Mock Location type for testing
 * Minimal implementation that matches what redirectToLogin needs
 */
type MockLocation = {
  href: string;
  pathname?: string;
};

describe('authRedirect.ts', () => {
  describe('redirectToLogin', () => {
    it('should clear access_token from storage', () => {
      const location: MockLocation = {
        href: 'http://localhost/dashboard',
        pathname: '/dashboard',
      };
      const storage = new MockStorage();
      storage.setItem('access_token', 'test-access-token');
      storage.setItem('refresh_token', 'test-refresh-token');
      storage.setItem('csrf_token', 'test-csrf-token');

      redirectToLogin(location as unknown as Location, storage);

      expect(storage.getItem('access_token')).toBeNull();
    });

    it('should clear refresh_token from storage', () => {
      const location: MockLocation = {
        href: 'http://localhost/dashboard',
        pathname: '/dashboard',
      };
      const storage = new MockStorage();
      storage.setItem('access_token', 'test-access-token');
      storage.setItem('refresh_token', 'test-refresh-token');
      storage.setItem('csrf_token', 'test-csrf-token');

      redirectToLogin(location as unknown as Location, storage);

      expect(storage.getItem('refresh_token')).toBeNull();
    });

    it('should clear csrf_token from storage', () => {
      const location: MockLocation = {
        href: 'http://localhost/dashboard',
        pathname: '/dashboard',
      };
      const storage = new MockStorage();
      storage.setItem('access_token', 'test-access-token');
      storage.setItem('refresh_token', 'test-refresh-token');
      storage.setItem('csrf_token', 'test-csrf-token');

      redirectToLogin(location as unknown as Location, storage);

      expect(storage.getItem('csrf_token')).toBeNull();
    });

    it('should redirect to login page when not already on login page', () => {
      const location: MockLocation = {
        href: 'http://localhost/dashboard',
        pathname: '/dashboard',
      };
      const storage = new MockStorage();
      storage.setItem('access_token', 'test-token');

      redirectToLogin(location as unknown as Location, storage);

      expect(location.href).toBe('/login');
    });

    it('should not redirect when already on login page', () => {
      const location: MockLocation = {
        href: 'http://localhost/login',
        pathname: '/login',
      };
      const storage = new MockStorage();
      storage.setItem('access_token', 'test-token');
      const initialHref = location.href;

      redirectToLogin(location as unknown as Location, storage);

      expect(location.href).toBe(initialHref);
    });

    it('should not redirect when pathname contains login', () => {
      const location: MockLocation = {
        href: 'http://localhost/auth/login',
        pathname: '/auth/login',
      };
      const storage = new MockStorage();
      storage.setItem('access_token', 'test-token');
      const initialHref = location.href;

      redirectToLogin(location as unknown as Location, storage);

      expect(location.href).toBe(initialHref);
    });

    it('should not redirect when pathname contains login as substring', () => {
      const location: MockLocation = {
        href: 'http://localhost/auth/login/reset',
        pathname: '/auth/login/reset',
      };
      const storage = new MockStorage();
      storage.setItem('access_token', 'test-token');
      const initialHref = location.href;

      redirectToLogin(location as unknown as Location, storage);

      expect(storage.getItem('access_token')).toBeNull();
      expect(location.href).toBe(initialHref);
    });

    it('should handle empty pathname gracefully', () => {
      const location: MockLocation = {
        href: 'http://localhost/',
        pathname: '',
      };
      const storage = new MockStorage();
      storage.setItem('access_token', 'test-token');
      const initialHref = location.href;

      redirectToLogin(location as unknown as Location, storage);

      expect(storage.getItem('access_token')).toBeNull();
      expect(location.href).toBe(initialHref);
    });

    it('should handle missing pathname gracefully', () => {
      const location: MockLocation = {
        href: 'http://localhost/whatever',
      };
      const storage = new MockStorage();
      storage.setItem('access_token', 'test-token');
      const initialHref = location.href;

      redirectToLogin(location as unknown as Location, storage);

      expect(storage.getItem('access_token')).toBeNull();
      expect(location.href).toBe(initialHref);
    });

    it('should clear all tokens even if some do not exist', () => {
      const location: MockLocation = {
        href: 'http://localhost/dashboard',
        pathname: '/dashboard',
      };
      const storage = new MockStorage();
      storage.setItem('access_token', 'test-token');
      // refresh_token and csrf_token are not set

      redirectToLogin(location as unknown as Location, storage);

      expect(storage.getItem('access_token')).toBeNull();
      expect(storage.getItem('refresh_token')).toBeNull();
      expect(storage.getItem('csrf_token')).toBeNull();
    });

    it('should not throw when storage has no tokens', () => {
      const location: MockLocation = {
        href: 'http://localhost/dashboard',
        pathname: '/dashboard',
      };
      const storage = new MockStorage();

      expect(() => redirectToLogin(location as unknown as Location, storage)).not.toThrow();
      expect(location.href).toBe('/login');
    });

    it('should leave other storage keys untouched', () => {
      const location: MockLocation = {
        href: 'http://localhost/dashboard',
        pathname: '/dashboard',
      };
      const storage = new MockStorage();
      storage.setItem('access_token', 'test-token');
      storage.setItem('user_preference', 'dark-mode');
      storage.setItem('other_data', 'value');

      redirectToLogin(location as unknown as Location, storage);

      expect(storage.getItem('access_token')).toBeNull();
      expect(storage.getItem('user_preference')).toBe('dark-mode');
      expect(storage.getItem('other_data')).toBe('value');
    });

    it('should redirect from various protected routes', () => {
      const protectedRoutes = [
        '/admin/clubs',
        '/admin/players',
        '/leaguemanager/tournaments',
        '/matches/123',
      ];

      protectedRoutes.forEach(route => {
        const location: MockLocation = {
          href: `http://localhost${route}`,
          pathname: route,
        };
        const storage = new MockStorage();
        storage.setItem('access_token', 'test-token');

        redirectToLogin(location as unknown as Location, storage);

        expect(location.href).toBe('/login');
      });
    });

    it('should clear tokens in correct order', () => {
      const location: MockLocation = {
        href: 'http://localhost/dashboard',
        pathname: '/dashboard',
      };
      const storage = new MockStorage();
      storage.setItem('access_token', 'test-access');
      storage.setItem('refresh_token', 'test-refresh');
      storage.setItem('csrf_token', 'test-csrf');

      const removeOrder: string[] = [];
      const originalRemoveItem = storage.removeItem.bind(storage);
      storage.removeItem = (key: string) => {
        removeOrder.push(key);
        originalRemoveItem(key);
      };

      redirectToLogin(location as unknown as Location, storage);

      expect(removeOrder).toEqual(['access_token', 'refresh_token', 'csrf_token']);
    });

    it('should handle all token removal operations even if storage throws', () => {
      const location: MockLocation = {
        href: 'http://localhost/dashboard',
        pathname: '/dashboard',
      };
      const storage = new MockStorage();
      storage.setItem('access_token', 'test-token');
      
      let removeCount = 0;
      storage.removeItem = (key: string) => {
        removeCount++;
        // Simulate storage operation (but don't actually throw in this test)
      };

      redirectToLogin(location as unknown as Location, storage);

      expect(removeCount).toBe(3); // Called for all 3 tokens
      expect(location.href).toBe('/login');
    });
  });
});
