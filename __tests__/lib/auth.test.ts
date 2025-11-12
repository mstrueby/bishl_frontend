
import { hasRole, hasAnyRole, extractUserRoles } from '@/lib/auth';
import type { UserValues } from '@/types/UserValues';

describe('lib/auth.ts - Authentication Utilities', () => {
  // Mock user data for testing
  const mockAdminUser: UserValues = {
    id: 1,
    username: 'admin_user',
    email: 'admin@bishl.de',
    firstName: 'Admin',
    lastName: 'User',
    roles: ['admin', 'referee'],
    isStaff: true,
    isSuperuser: false,
  };

  const mockRefereeUser: UserValues = {
    id: 2,
    username: 'referee_user',
    email: 'referee@bishl.de',
    firstName: 'Referee',
    lastName: 'User',
    roles: ['referee'],
    isStaff: false,
    isSuperuser: false,
  };

  const mockClubAdminUser: UserValues = {
    id: 3,
    username: 'club_admin',
    email: 'clubadmin@bishl.de',
    firstName: 'Club',
    lastName: 'Admin',
    roles: ['clubadmin'],
    isStaff: false,
    isSuperuser: false,
  };

  const mockUserWithoutRoles: UserValues = {
    id: 4,
    username: 'regular_user',
    email: 'user@bishl.de',
    firstName: 'Regular',
    lastName: 'User',
    roles: [],
    isStaff: false,
    isSuperuser: false,
  };

  describe('hasRole()', () => {
    it('should return true when user has a single role', () => {
      expect(hasRole(mockAdminUser, 'admin')).toBe(true);
      expect(hasRole(mockRefereeUser, 'referee')).toBe(true);
      expect(hasRole(mockClubAdminUser, 'clubadmin')).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      expect(hasRole(mockRefereeUser, 'admin')).toBe(false);
      expect(hasRole(mockClubAdminUser, 'referee')).toBe(false);
      expect(hasRole(mockUserWithoutRoles, 'admin')).toBe(false);
    });

    it('should return true when user has ALL specified roles (multiple roles)', () => {
      expect(hasRole(mockAdminUser, 'admin', 'referee')).toBe(true);
    });

    it('should return false when user is missing one of the specified roles', () => {
      expect(hasRole(mockAdminUser, 'admin', 'clubadmin')).toBe(false);
      expect(hasRole(mockRefereeUser, 'referee', 'admin')).toBe(false);
    });

    it('should return false when user has no roles', () => {
      expect(hasRole(mockUserWithoutRoles, 'admin')).toBe(false);
      expect(hasRole(mockUserWithoutRoles, 'referee')).toBe(false);
    });

    it('should handle empty roles array on user object', () => {
      const userWithEmptyRoles = { ...mockAdminUser, roles: [] };
      expect(hasRole(userWithEmptyRoles, 'admin')).toBe(false);
    });
  });

  describe('hasAnyRole()', () => {
    it('should return true when user has at least one of the specified roles', () => {
      expect(hasAnyRole(mockAdminUser, 'admin', 'clubadmin')).toBe(true);
      expect(hasAnyRole(mockAdminUser, 'referee', 'superadmin')).toBe(true);
      expect(hasAnyRole(mockRefereeUser, 'referee', 'admin')).toBe(true);
    });

    it('should return false when user has none of the specified roles', () => {
      expect(hasAnyRole(mockRefereeUser, 'admin', 'clubadmin')).toBe(false);
      expect(hasAnyRole(mockClubAdminUser, 'admin', 'referee')).toBe(false);
    });

    it('should return false when user has no roles', () => {
      expect(hasAnyRole(mockUserWithoutRoles, 'admin', 'referee')).toBe(false);
    });

    it('should return true when checking a single role that user has', () => {
      expect(hasAnyRole(mockRefereeUser, 'referee')).toBe(true);
    });
  });

  describe('extractUserRoles()', () => {
    it('should extract roles from user object', () => {
      const roles = extractUserRoles(mockAdminUser);
      expect(roles).toEqual(['admin', 'referee']);
    });

    it('should return empty array for user without roles', () => {
      const roles = extractUserRoles(mockUserWithoutRoles);
      expect(roles).toEqual([]);
    });

    it('should handle user with single role', () => {
      const roles = extractUserRoles(mockRefereeUser);
      expect(roles).toEqual(['referee']);
    });

    it('should return a new array reference (not modify original)', () => {
      const roles = extractUserRoles(mockAdminUser);
      roles.push('newrole');
      expect(mockAdminUser.roles).toEqual(['admin', 'referee']);
      expect(mockAdminUser.roles).not.toContain('newrole');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user gracefully', () => {
      // TypeScript will catch this at compile time, but testing runtime behavior
      expect(hasRole(null as any, 'admin')).toBe(false);
      expect(hasAnyRole(undefined as any, 'admin')).toBe(false);
    });

    it('should handle user with undefined roles property', () => {
      const userWithoutRolesProp = { ...mockAdminUser, roles: undefined as any };
      expect(hasRole(userWithoutRolesProp, 'admin')).toBe(false);
      expect(hasAnyRole(userWithoutRolesProp, 'admin')).toBe(false);
    });

    it('should be case-sensitive for role names', () => {
      expect(hasRole(mockAdminUser, 'Admin')).toBe(false);
      expect(hasRole(mockAdminUser, 'ADMIN')).toBe(false);
      expect(hasRole(mockAdminUser, 'admin')).toBe(true);
    });
  });
});
