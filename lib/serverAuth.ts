
/**
 * Server-side Authentication Middleware for API Routes
 * 
 * This module provides middleware functions for validating authentication
 * and authorization in Next.js API routes.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { UserValues } from '../types/UserValues';
import { Permission, UserRole, hasPermission, hasRole } from './auth';

/**
 * Extract and validate access token from request headers
 */
export function getAccessToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Fetch user from backend using access token
 */
export async function getUserFromToken(accessToken: string): Promise<UserValues | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.ok) {
      const userData = await response.json();
      return userData;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user from token:', error);
    return null;
  }
}

/**
 * Middleware to require authentication
 * Returns user if authenticated, sends 401 response otherwise
 */
export async function withAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (req: NextApiRequest, res: NextApiResponse, user: UserValues) => Promise<void>
): Promise<void> {
  const accessToken = getAccessToken(req);
  
  if (!accessToken) {
    res.status(401).json({ error: 'No access token provided' });
    return;
  }
  
  const user = await getUserFromToken(accessToken);
  
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired access token' });
    return;
  }
  
  // Call the actual handler with authenticated user
  await handler(req, res, user);
}

/**
 * Middleware to require specific permission
 */
export async function withPermission(
  req: NextApiRequest,
  res: NextApiResponse,
  permission: Permission,
  handler: (req: NextApiRequest, res: NextApiResponse, user: UserValues) => Promise<void>
): Promise<void> {
  await withAuth(req, res, async (req, res, user) => {
    if (!hasPermission(user, permission)) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: `Permission required: ${permission}`
      });
      return;
    }
    
    await handler(req, res, user);
  });
}

/**
 * Middleware to require specific role
 */
export async function withRole(
  req: NextApiRequest,
  res: NextApiResponse,
  role: UserRole,
  handler: (req: NextApiRequest, res: NextApiResponse, user: UserValues) => Promise<void>
): Promise<void> {
  await withAuth(req, res, async (req, res, user) => {
    if (!hasRole(user, role)) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: `Role required: ${role}`
      });
      return;
    }
    
    await handler(req, res, user);
  });
}

/**
 * Middleware to require any of the specified roles
 */
export async function withAnyRole(
  req: NextApiRequest,
  res: NextApiResponse,
  roles: UserRole[],
  handler: (req: NextApiRequest, res: NextApiResponse, user: UserValues) => Promise<void>
): Promise<void> {
  await withAuth(req, res, async (req, res, user) => {
    const hasRequiredRole = roles.some(role => hasRole(user, role));
    
    if (!hasRequiredRole) {
      res.status(403).json({ 
        error: 'Forbidden',
        message: `One of these roles required: ${roles.join(', ')}`
      });
      return;
    }
    
    await handler(req, res, user);
  });
}
