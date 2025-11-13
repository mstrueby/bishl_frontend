
import { redirectToLogin } from '@/lib/authRedirect';

describe('authRedirect.ts', () => {
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
      mockLocation.pathname = '/admin/dashboard';
      const storage = createMockStorage(mockStorage);
      
      redirectToLogin(mockLocation as Location, storage);

      expect(mockLocation.href).toBe('/login');
    });

    it('should not redirect when already on login page', () => {
      mockLocation.pathname = '/login';
      const storage = createMockStorage(mockStorage);
      
      redirectToLogin(mockLocation as Location, storage);

      expect(mockLocation.href).toBe('');
    });

    it('should not redirect when pathname contains login', () => {
      mockLocation.pathname = '/admin/login-settings';
      const storage = createMockStorage(mockStorage);
      
      redirectToLogin(mockLocation as Location, storage);

      expect(mockLocation.href).toBe('');
    });

    it('should handle empty pathname gracefully', () => {
      mockLocation.pathname = '';
      const storage = createMockStorage(mockStorage);
      
      expect(() => {
        redirectToLogin(mockLocation as Location, storage);
      }).not.toThrow();
    });

    it('should clear all tokens even if some do not exist', () => {
      const storage = createMockStorage({ access_token: 'test-token' });
      redirectToLogin(mockLocation as Location, storage);

      expect(storage.getItem('access_token')).toBeNull();
      expect(storage.getItem('refresh_token')).toBeNull();
      expect(storage.getItem('csrf_token')).toBeNull();
    });

    it('should work with default parameters in browser environment', () => {
      // This test verifies the function can be called without parameters
      // in a browser environment (though JSDOM is our test environment)
      expect(() => {
        redirectToLogin();
      }).not.toThrow();
    });

    it('should redirect from various protected routes', () => {
      const routes = [
        '/admin/dashboard',
        '/admin/clubs',
        '/matches/123',
        '/profile',
        '/admin/posts/add',
      ];

      routes.forEach((route) => {
        const loc = { pathname: route, href: '' };
        const storage = createMockStorage(mockStorage);
        
        redirectToLogin(loc as Location, storage);
        
        expect(loc.href).toBe('/login');
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
