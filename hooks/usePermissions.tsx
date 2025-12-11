
/**
 * Custom hook for permission-based UI rendering
 * 
 * This hook provides easy access to permission checks in React components
 */

import { useMemo } from 'react';
import useAuth from './useAuth';
import { 
  Permission, 
  UserRole, 
  hasPermission, 
  hasRole, 
  hasAnyPermission,
  hasAllPermissions,
  hasAnyRole,
  canManageClub,
  canManageTeamPlayers,
  isAuthenticated,
  getUserPermissions
} from '../lib/auth';

export function usePermissions() {
  const { user } = useAuth();
  
  return useMemo(() => ({
    // Authentication checks
    isAuthenticated: isAuthenticated(user),
    
    // Permission checks
    hasPermission: (permission: Permission) => hasPermission(user, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(user, permissions),
    
    // Role checks
    hasRole: (role: UserRole) => hasRole(user, role),
    hasAnyRole: (roles: UserRole[]) => hasAnyRole(user, roles),
    
    // Resource-specific checks
    canManageClub: (clubId: number) => canManageClub(user, clubId),
    canManageTeamPlayers: (teamId: number) => canManageTeamPlayers(user, teamId),
    
    // Get all user permissions
    permissions: getUserPermissions(user),
    
    // Quick role checks
    isAdmin: hasRole(user, UserRole.ADMIN),
    isLeagueManager: hasRole(user, UserRole.LEAGUE_ADMIN),
    isReferee: hasRole(user, UserRole.REFEREE),
    isClubManager: hasRole(user, UserRole.CLUB_MANAGER),
    
    // User data
    user
  }), [user]);
}

export default usePermissions;
