
import { hasRole, hasAnyRole, UserRole, hasPermission, Permission, getUserPermissions } from '@/lib/auth';
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

  const mockClubManagerUser: UserValues = {
    id: 3,
    username: 'club_manager',
    email: 'clubmanager@bishl.de',
    firstName: 'Club',
    lastName: 'Manager',
    roles: ['club_manager'],
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
    it('should return true when user has the specified role', () => {
      expect(hasRole(mockAdminUser, UserRole.ADMIN)).toBe(true);
      expect(hasRole(mockRefereeUser, UserRole.REFEREE)).toBe(true);
      expect(hasRole(mockClubManagerUser, UserRole.CLUB_MANAGER)).toBe(true);
    });

    it('should return false when user does not have the role', () => {
      expect(hasRole(mockRefereeUser, UserRole.ADMIN)).toBe(false);
      expect(hasRole(mockClubManagerUser, UserRole.REFEREE)).toBe(false);
      expect(hasRole(mockUserWithoutRoles, UserRole.ADMIN)).toBe(false);
    });

    it('should return false when user has no roles', () => {
      expect(hasRole(mockUserWithoutRoles, UserRole.ADMIN)).toBe(false);
      expect(hasRole(mockUserWithoutRoles, UserRole.REFEREE)).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(hasRole(null, UserRole.ADMIN)).toBe(false);
    });

    it('should handle user with multiple roles', () => {
      expect(hasRole(mockAdminUser, UserRole.ADMIN)).toBe(true);
      expect(hasRole(mockAdminUser, UserRole.REFEREE)).toBe(true);
    });
  });

  describe('hasAnyRole()', () => {
    it('should return true when user has at least one of the specified roles', () => {
      expect(hasAnyRole(mockAdminUser, [UserRole.ADMIN, UserRole.CLUB_MANAGER])).toBe(true);
      expect(hasAnyRole(mockAdminUser, [UserRole.REFEREE, UserRole.LEAGUE_MANAGER])).toBe(true);
      expect(hasAnyRole(mockRefereeUser, [UserRole.REFEREE, UserRole.ADMIN])).toBe(true);
    });

    it('should return false when user has none of the specified roles', () => {
      expect(hasAnyRole(mockRefereeUser, [UserRole.ADMIN, UserRole.CLUB_MANAGER])).toBe(false);
      expect(hasAnyRole(mockClubManagerUser, [UserRole.ADMIN, UserRole.REFEREE])).toBe(false);
    });

    it('should return false when user has no roles', () => {
      expect(hasAnyRole(mockUserWithoutRoles, [UserRole.ADMIN, UserRole.REFEREE])).toBe(false);
    });

    it('should return true when checking a single role that user has', () => {
      expect(hasAnyRole(mockRefereeUser, [UserRole.REFEREE])).toBe(true);
    });

    it('should return false when user is null', () => {
      expect(hasAnyRole(null, [UserRole.ADMIN])).toBe(false);
    });
  });

  describe('hasPermission()', () => {
    it('should return true when user has the permission through their role', () => {
      expect(hasPermission(mockAdminUser, Permission.MANAGE_TOURNAMENTS)).toBe(true);
      expect(hasPermission(mockRefereeUser, Permission.VIEW_TOURNAMENTS)).toBe(true);
      expect(hasPermission(mockClubManagerUser, Permission.MANAGE_OWN_CLUB)).toBe(true);
    });

    it('should return false when user does not have the permission', () => {
      expect(hasPermission(mockRefereeUser, Permission.MANAGE_TOURNAMENTS)).toBe(false);
      expect(hasPermission(mockClubManagerUser, Permission.MANAGE_REFEREES)).toBe(false);
    });

    it('should return false when user has no roles', () => {
      expect(hasPermission(mockUserWithoutRoles, Permission.VIEW_TOURNAMENTS)).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(hasPermission(null, Permission.VIEW_TOURNAMENTS)).toBe(false);
    });
  });

  describe('getUserPermissions()', () => {
    it('should return all permissions for admin user', () => {
      const permissions = getUserPermissions(mockAdminUser);
      expect(permissions).toContain(Permission.MANAGE_TOURNAMENTS);
      expect(permissions).toContain(Permission.MANAGE_CLUBS);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return limited permissions for referee', () => {
      const permissions = getUserPermissions(mockRefereeUser);
      expect(permissions).toContain(Permission.VIEW_TOURNAMENTS);
      expect(permissions).not.toContain(Permission.MANAGE_TOURNAMENTS);
    });

    it('should return empty array for user without roles', () => {
      const permissions = getUserPermissions(mockUserWithoutRoles);
      expect(permissions).toEqual([]);
    });

    it('should return empty array for null user', () => {
      const permissions = getUserPermissions(null);
      expect(permissions).toEqual([]);
    });

    it('should combine permissions from multiple roles', () => {
      const permissions = getUserPermissions(mockAdminUser);
      // Admin user has both admin and referee roles
      expect(permissions).toContain(Permission.MANAGE_TOURNAMENTS); // from admin
      expect(permissions).toContain(Permission.VIEW_REFEREE_ASSIGNMENTS); // from both roles
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with undefined roles property', () => {
      const userWithoutRolesProp = { ...mockAdminUser, roles: undefined as any };
      expect(hasRole(userWithoutRolesProp, UserRole.ADMIN)).toBe(false);
      expect(hasAnyRole(userWithoutRolesProp, [UserRole.ADMIN])).toBe(false);
    });

    it('should be case-sensitive for role names', () => {
      // TypeScript enums are already case-sensitive
      const userWithWrongCase = { ...mockAdminUser, roles: ['Admin', 'ADMIN'] };
      expect(hasRole(userWithWrongCase, UserRole.ADMIN)).toBe(false);
    });
  });
});
