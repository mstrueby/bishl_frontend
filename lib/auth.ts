
/**
 * Centralized Authorization and RBAC Utilities
 * 
 * This module provides utilities for role-based access control (RBAC)
 * and permission checking across the application.
 */

import { UserValues } from '../types/UserValues';

// Define all possible roles in the system
export enum UserRole {
  ADMIN = 'admin',
  LEAGUE_MANAGER = 'league_manager',
  REFEREE = 'referee',
  CLUB_MANAGER = 'club_manager',
  USER = 'user'
}

// Define all possible permissions
export enum Permission {
  // Tournament Management
  MANAGE_TOURNAMENTS = 'manage_tournaments',
  VIEW_TOURNAMENTS = 'view_tournaments',
  
  // Match Management
  MANAGE_MATCHES = 'manage_matches',
  EDIT_MATCH_RESULTS = 'edit_match_results',
  VIEW_MATCHES = 'view_matches',
  
  // Club Management
  MANAGE_CLUBS = 'manage_clubs',
  MANAGE_OWN_CLUB = 'manage_own_club',
  VIEW_CLUBS = 'view_clubs',
  
  // Player Management
  MANAGE_PLAYERS = 'manage_players',
  MANAGE_OWN_TEAM_PLAYERS = 'manage_own_team_players',
  VIEW_PLAYERS = 'view_players',
  
  // Referee Management
  MANAGE_REFEREES = 'manage_referees',
  VIEW_REFEREE_ASSIGNMENTS = 'view_referee_assignments',
  
  // Post Management
  MANAGE_POSTS = 'manage_posts',
  PUBLISH_POSTS = 'publish_posts',
  VIEW_POSTS = 'view_posts',
  
  // Document Management
  MANAGE_DOCUMENTS = 'manage_documents',
  VIEW_DOCUMENTS = 'view_documents',
  
  // Venue Management
  MANAGE_VENUES = 'manage_venues',
  VIEW_VENUES = 'view_venues'
}

// Role to permissions mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.MANAGE_TOURNAMENTS,
    Permission.VIEW_TOURNAMENTS,
    Permission.MANAGE_MATCHES,
    Permission.EDIT_MATCH_RESULTS,
    Permission.VIEW_MATCHES,
    Permission.MANAGE_CLUBS,
    Permission.VIEW_CLUBS,
    Permission.MANAGE_PLAYERS,
    Permission.VIEW_PLAYERS,
    Permission.MANAGE_REFEREES,
    Permission.VIEW_REFEREE_ASSIGNMENTS,
    Permission.MANAGE_POSTS,
    Permission.PUBLISH_POSTS,
    Permission.VIEW_POSTS,
    Permission.MANAGE_DOCUMENTS,
    Permission.VIEW_DOCUMENTS,
    Permission.MANAGE_VENUES,
    Permission.VIEW_VENUES
  ],
  [UserRole.LEAGUE_MANAGER]: [
    Permission.MANAGE_TOURNAMENTS,
    Permission.VIEW_TOURNAMENTS,
    Permission.MANAGE_MATCHES,
    Permission.EDIT_MATCH_RESULTS,
    Permission.VIEW_MATCHES,
    Permission.VIEW_CLUBS,
    Permission.VIEW_PLAYERS,
    Permission.MANAGE_REFEREES,
    Permission.VIEW_REFEREE_ASSIGNMENTS,
    Permission.MANAGE_POSTS,
    Permission.PUBLISH_POSTS,
    Permission.VIEW_POSTS,
    Permission.VIEW_DOCUMENTS,
    Permission.VIEW_VENUES
  ],
  [UserRole.REFEREE]: [
    Permission.VIEW_TOURNAMENTS,
    Permission.VIEW_MATCHES,
    Permission.VIEW_REFEREE_ASSIGNMENTS,
    Permission.VIEW_CLUBS,
    Permission.VIEW_PLAYERS,
    Permission.VIEW_POSTS,
    Permission.VIEW_DOCUMENTS
  ],
  [UserRole.CLUB_MANAGER]: [
    Permission.VIEW_TOURNAMENTS,
    Permission.VIEW_MATCHES,
    Permission.MANAGE_OWN_CLUB,
    Permission.VIEW_CLUBS,
    Permission.MANAGE_OWN_TEAM_PLAYERS,
    Permission.VIEW_PLAYERS,
    Permission.VIEW_POSTS,
    Permission.VIEW_DOCUMENTS
  ],
  [UserRole.USER]: [
    Permission.VIEW_TOURNAMENTS,
    Permission.VIEW_MATCHES,
    Permission.VIEW_CLUBS,
    Permission.VIEW_PLAYERS,
    Permission.VIEW_POSTS,
    Permission.VIEW_DOCUMENTS
  ]
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: UserValues | null, permission: Permission): boolean {
  if (!user || !user.role) {
    return false;
  }
  
  const userRole = user.role as UserRole;
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: UserValues | null, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: UserValues | null, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: UserValues | null, role: UserRole): boolean {
  if (!user || !user.role) {
    return false;
  }
  return user.role === role;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(user: UserValues | null, roles: UserRole[]): boolean {
  return roles.some(role => hasRole(user, role));
}

/**
 * Check if a user can manage a specific club
 */
export function canManageClub(user: UserValues | null, clubId: number): boolean {
  if (!user) {
    return false;
  }
  
  // Admins can manage any club
  if (hasRole(user, UserRole.ADMIN)) {
    return true;
  }
  
  // Club managers can only manage their own club
  if (hasRole(user, UserRole.CLUB_MANAGER)) {
    return user.club_id === clubId;
  }
  
  return false;
}

/**
 * Check if a user can manage a specific team's players
 */
export function canManageTeamPlayers(user: UserValues | null, teamId: number): boolean {
  if (!user) {
    return false;
  }
  
  // Admins can manage any team
  if (hasRole(user, UserRole.ADMIN)) {
    return true;
  }
  
  // Club managers can manage their club's teams
  if (hasRole(user, UserRole.CLUB_MANAGER) && user.team_ids) {
    return user.team_ids.includes(teamId);
  }
  
  return false;
}

/**
 * Check if a user is authenticated
 */
export function isAuthenticated(user: UserValues | null): boolean {
  return user !== null && user !== undefined;
}

/**
 * Get user permissions
 */
export function getUserPermissions(user: UserValues | null): Permission[] {
  if (!user || !user.role) {
    return [];
  }
  
  const userRole = user.role as UserRole;
  return rolePermissions[userRole] || [];
}

/**
 * Higher-order function to require authentication
 */
export function requireAuth(user: UserValues | null): void {
  if (!isAuthenticated(user)) {
    throw new Error('Authentication required');
  }
}

/**
 * Higher-order function to require specific permission
 */
export function requirePermission(user: UserValues | null, permission: Permission): void {
  requireAuth(user);
  
  if (!hasPermission(user, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Higher-order function to require specific role
 */
export function requireRole(user: UserValues | null, role: UserRole): void {
  requireAuth(user);
  
  if (!hasRole(user, role)) {
    throw new Error(`Role required: ${role}`);
  }
}
