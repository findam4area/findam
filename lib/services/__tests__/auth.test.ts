/**
 * Unit tests for authentication utility functions
 * 
 * Tests cover:
 * - getCurrentUser: getting authenticated user
 * - requireAuth: requiring authentication
 * - requireAdmin: requiring admin privileges
 * - Helper functions: hasPermission, isAuthenticated, isAdmin, getUserId
 * 
 * Requirements: 2.7, 2.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCurrentUser,
  requireAuth,
  requireAdmin,
  hasPermission,
  isAuthenticated,
  isAdmin,
  getUserId,
  UnauthorizedError,
  ForbiddenError,
  SessionError,
} from '../auth';
import type { User } from '@/lib/types/core';

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(await import('@/lib/supabase/server')).createClient;

describe('Authentication Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+2348012345678',
        username: 'testuser',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        is_premium: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const user = await getCurrentUser();

      expect(user).not.toBeNull();
      expect(user?.id).toBe('user-123');
      expect(user?.email).toBe('test@example.com');
      expect(user?.role).toBe('user'); // Not admin
    });

    it('should return null when not authenticated', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any);

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it('should throw SessionError when session is invalid', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid session' },
          }),
        },
      } as any);

      await expect(getCurrentUser()).rejects.toThrow(SessionError);
    });

    it('should throw SessionError when user profile not found', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'User not found' },
              }),
            }),
          }),
        }),
      } as any);

      await expect(getCurrentUser()).rejects.toThrow(SessionError);
    });

    it('should identify admin users by email pattern', async () => {
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@findam.admin',
        phone: '+2348012345678',
        username: 'adminuser',
        avatar_url: null,
        bio: null,
        is_premium: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'admin-123', email: 'admin@findam.admin' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockAdminUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const user = await getCurrentUser();

      expect(user).not.toBeNull();
      expect(user?.role).toBe('admin');
    });
  });

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+2348012345678',
        username: 'testuser',
        avatar_url: null,
        bio: null,
        is_premium: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const user = await requireAuth();

      expect(user).toBeDefined();
      expect(user.id).toBe('user-123');
    });

    it('should throw UnauthorizedError when not authenticated', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any);

      await expect(requireAuth()).rejects.toThrow(UnauthorizedError);
      await expect(requireAuth()).rejects.toThrow('You must be logged in to perform this action.');
    });
  });

  describe('requireAdmin', () => {
    it('should return admin user when authenticated as admin', async () => {
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@findam.admin',
        phone: '+2348012345678',
        username: 'adminuser',
        avatar_url: null,
        bio: null,
        is_premium: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'admin-123', email: 'admin@findam.admin' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockAdminUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const admin = await requireAdmin();

      expect(admin).toBeDefined();
      expect(admin.role).toBe('admin');
    });

    it('should throw UnauthorizedError when not authenticated', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any);

      await expect(requireAdmin()).rejects.toThrow(UnauthorizedError);
    });

    it('should throw ForbiddenError when authenticated but not admin', async () => {
      const mockRegularUser = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+2348012345678',
        username: 'testuser',
        avatar_url: null,
        bio: null,
        is_premium: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockRegularUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      await expect(requireAdmin()).rejects.toThrow(ForbiddenError);
      await expect(requireAdmin()).rejects.toThrow('This action requires administrator privileges.');
    });
  });

  describe('hasPermission', () => {
    it('should return true when user is the resource owner', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        phone: null,
        full_name: 'Test User',
        avatar_url: null,
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(hasPermission(user, 'user-123')).toBe(true);
    });

    it('should return false when user is not the resource owner and not admin', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        phone: null,
        full_name: 'Test User',
        avatar_url: null,
        role: 'user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(hasPermission(user, 'other-user-456')).toBe(false);
    });

    it('should return true when user is admin regardless of ownership', () => {
      const admin: User = {
        id: 'admin-123',
        email: 'admin@findam.admin',
        phone: null,
        full_name: 'Admin User',
        avatar_url: null,
        role: 'admin',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(hasPermission(admin, 'other-user-456')).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+2348012345678',
        username: 'testuser',
        avatar_url: null,
        bio: null,
        is_premium: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when user is not authenticated', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any);

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when there is a session error', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Invalid session' },
          }),
        },
      } as any);

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true when user is admin', async () => {
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@findam.admin',
        phone: '+2348012345678',
        username: 'adminuser',
        avatar_url: null,
        bio: null,
        is_premium: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'admin-123', email: 'admin@findam.admin' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockAdminUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await isAdmin();

      expect(result).toBe(true);
    });

    it('should return false when user is not admin', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        phone: '+2348012345678',
        username: 'testuser',
        avatar_url: null,
        bio: null,
        is_premium: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUser,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await isAdmin();

      expect(result).toBe(false);
    });

    it('should return false when not authenticated', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any);

      const result = await isAdmin();

      expect(result).toBe(false);
    });
  });

  describe('getUserId', () => {
    it('should return user ID when authenticated', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123', email: 'test@example.com' } },
            error: null,
          }),
        },
      } as any);

      const userId = await getUserId();

      expect(userId).toBe('user-123');
    });

    it('should return null when not authenticated', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any);

      const userId = await getUserId();

      expect(userId).toBeNull();
    });

    it('should return null when there is an auth error', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Auth error' },
          }),
        },
      } as any);

      const userId = await getUserId();

      expect(userId).toBeNull();
    });
  });

  describe('Error Classes', () => {
    it('should create UnauthorizedError with correct properties', () => {
      const error = new UnauthorizedError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('UnauthorizedError');
      expect(error.message).toBe('Authentication required. Please log in to continue.');
    });

    it('should create UnauthorizedError with custom message', () => {
      const error = new UnauthorizedError('Custom message');
      
      expect(error.message).toBe('Custom message');
    });

    it('should create ForbiddenError with correct properties', () => {
      const error = new ForbiddenError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ForbiddenError');
      expect(error.message).toBe('Admin privileges required. You do not have permission to perform this action.');
    });

    it('should create SessionError with correct properties', () => {
      const error = new SessionError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SessionError');
      expect(error.message).toBe('Session validation failed. Please log in again.');
    });
  });
});
