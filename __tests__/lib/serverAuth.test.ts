
/**
 * Unit tests for lib/serverAuth.ts
 * Tests server-side authentication middleware and helpers
 */

import { NextApiRequest, NextApiResponse } from 'next';
import {
  getAccessToken,
  getUserFromToken,
  withAuth,
  withPermission,
  withRole,
  withAnyRole
} from '../../lib/serverAuth';
import { UserValues } from '../../types/UserValues';
import { Permission, UserRole } from '../../lib/auth';

// Mock fetch globally
global.fetch = jest.fn();

describe('lib/serverAuth', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));
    
    mockReq = {
      headers: {}
    };
    
    mockRes = {
      status: statusMock as any,
      json: jsonMock
    };
  });

  describe('getAccessToken', () => {
    it('should extract access token from Authorization header', () => {
      mockReq.headers = {
        authorization: 'Bearer test-token-123'
      };

      const token = getAccessToken(mockReq as NextApiRequest);
      
      expect(token).toBe('test-token-123');
    });

    it('should return null if Authorization header is missing', () => {
      mockReq.headers = {};

      const token = getAccessToken(mockReq as NextApiRequest);
      
      expect(token).toBeNull();
    });

    it('should return null if Authorization header does not start with "Bearer "', () => {
      mockReq.headers = {
        authorization: 'Basic test-token-123'
      };

      const token = getAccessToken(mockReq as NextApiRequest);
      
      expect(token).toBeNull();
    });

    it('should return null if Authorization header is "Bearer " without token', () => {
      mockReq.headers = {
        authorization: 'Bearer '
      };

      const token = getAccessToken(mockReq as NextApiRequest);
      
      expect(token).toBe('');
    });
  });

  describe('getUserFromToken', () => {
    const mockUser: UserValues = {
      _id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user']
    };

    beforeEach(() => {
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080';
    });

    it('should fetch and return user data with valid token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      const user = await getUserFromToken('valid-token');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/users/me',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer valid-token'
          }
        }
      );
      expect(user).toEqual(mockUser);
    });

    it('should return null if API response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const user = await getUserFromToken('invalid-token');

      expect(user).toBeNull();
    });

    it('should return null and log error if fetch throws', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const user = await getUserFromToken('error-token');

      expect(user).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching user from token:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('withAuth', () => {
    const mockUser: UserValues = {
      _id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user']
    };

    it('should call handler with user if authentication succeeds', async () => {
      mockReq.headers = {
        authorization: 'Bearer valid-token'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      const handler = jest.fn();
      
      await withAuth(
        mockReq as NextApiRequest,
        mockRes as NextApiResponse,
        handler
      );

      expect(handler).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        mockUser
      );
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should return 401 if no access token provided', async () => {
      mockReq.headers = {};

      const handler = jest.fn();
      
      await withAuth(
        mockReq as NextApiRequest,
        mockRes as NextApiResponse,
        handler
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No access token provided' });
      expect(handler).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const handler = jest.fn();
      
      await withAuth(
        mockReq as NextApiRequest,
        mockRes as NextApiResponse,
        handler
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid or expired access token' });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('withPermission', () => {
    const mockUserWithPermission: UserValues = {
      _id: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      roles: ['admin']
    };

    const mockUserWithoutPermission: UserValues = {
      _id: 'user-123',
      email: 'user@example.com',
      name: 'Regular User',
      roles: ['user']
    };

    it('should call handler if user has required permission', async () => {
      mockReq.headers = {
        authorization: 'Bearer admin-token'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserWithPermission
      });

      const handler = jest.fn();
      
      await withPermission(
        mockReq as NextApiRequest,
        mockRes as NextApiResponse,
        Permission.MANAGE_USERS,
        handler
      );

      expect(handler).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        mockUserWithPermission
      );
    });

    it('should return 403 if user lacks required permission', async () => {
      mockReq.headers = {
        authorization: 'Bearer user-token'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserWithoutPermission
      });

      const handler = jest.fn();
      
      await withPermission(
        mockReq as NextApiRequest,
        mockRes as NextApiResponse,
        Permission.MANAGE_USERS,
        handler
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Permission required: manage_users'
      });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('withRole', () => {
    const mockAdmin: UserValues = {
      _id: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      roles: ['admin']
    };

    const mockUser: UserValues = {
      _id: 'user-123',
      email: 'user@example.com',
      name: 'Regular User',
      roles: ['user']
    };

    it('should call handler if user has required role', async () => {
      mockReq.headers = {
        authorization: 'Bearer admin-token'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAdmin
      });

      const handler = jest.fn();
      
      await withRole(
        mockReq as NextApiRequest,
        mockRes as NextApiResponse,
        UserRole.ADMIN,
        handler
      );

      expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockAdmin);
    });

    it('should return 403 if user lacks required role', async () => {
      mockReq.headers = {
        authorization: 'Bearer user-token'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      const handler = jest.fn();
      
      await withRole(
        mockReq as NextApiRequest,
        mockRes as NextApiResponse,
        UserRole.ADMIN,
        handler
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Role required: admin'
      });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('withAnyRole', () => {
    const mockLeagueManager: UserValues = {
      _id: 'lm-123',
      email: 'lm@example.com',
      name: 'League Manager',
      roles: ['league_manager']
    };

    const mockUser: UserValues = {
      _id: 'user-123',
      email: 'user@example.com',
      name: 'Regular User',
      roles: ['user']
    };

    it('should call handler if user has any of the required roles', async () => {
      mockReq.headers = {
        authorization: 'Bearer lm-token'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLeagueManager
      });

      const handler = jest.fn();
      
      await withAnyRole(
        mockReq as NextApiRequest,
        mockRes as NextApiResponse,
        [UserRole.ADMIN, UserRole.LEAGUE_MANAGER],
        handler
      );

      expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockLeagueManager);
    });

    it('should return 403 if user has none of the required roles', async () => {
      mockReq.headers = {
        authorization: 'Bearer user-token'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      const handler = jest.fn();
      
      await withAnyRole(
        mockReq as NextApiRequest,
        mockRes as NextApiResponse,
        [UserRole.ADMIN, UserRole.LEAGUE_MANAGER],
        handler
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'One of these roles required: admin, league_manager'
      });
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
