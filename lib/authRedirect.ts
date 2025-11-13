
/**
 * Authentication redirect helper
 * 
 * This module provides a testable way to handle authentication redirects
 * by accepting window.location and localStorage as parameters, making it
 * easy to mock in tests without fighting JSDOM's window.location implementation.
 */

/**
 * Redirects user to login page after clearing authentication tokens
 * 
 * @param location - Window location object (defaults to window.location)
 * @param storage - Storage object (defaults to window.localStorage)
 */
export function redirectToLogin(
  location: Location = typeof window !== 'undefined' ? window.location : ({} as Location),
  storage: Storage = typeof window !== 'undefined' ? window.localStorage : ({} as Storage)
): void {
  // Clear all authentication tokens
  storage.removeItem('access_token');
  storage.removeItem('refresh_token');
  storage.removeItem('csrf_token');

  // Only redirect if not already on the login page
  if (location.pathname && !location.pathname.includes('/login')) {
    location.href = '/login';
  }
}
