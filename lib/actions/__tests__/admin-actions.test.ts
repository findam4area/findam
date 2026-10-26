/**
 * Unit tests for Admin Server Actions
 * 
 * These tests verify the admin actions for approving and rejecting
 * listings and vendor applications with proper authorization checks.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  approveListingAction,
  rejectListingAction,
  approveVendorAction,
  rejectVendorAction,
} from '../admin-actions';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  })),
}));

vi.mock('@/lib/services/auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Import mocked modules
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/services/auth';
import { revalidatePath } from 'next/cache';

describe('Admin Actions - Listing Approval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('approveListingAction', () => {
    it('should approve a listing successfully', async () => {
      // Mock admin user
      (requireAdmin as Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
      });

      // Mock Supabase responses
      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'listing-id',
          title: 'Test Listing',
          user_id: 'user-id',
          category_id: 'category-id',
          status: 'pending',
          users: {
            email: 'user@example.com',
            username: 'testuser',
          },
        },
        error: null,
      });
      const mockUpdate = vi.fn().mockReturnThis();

      (createClient as Mock).mockReturnValue({
        from: mockFrom,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'listings') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      // Execute action
      const result = await approveListingAction('listing-id');

      // Verify result
      expect(result.success).toBe(true);
      expect(requireAdmin).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/browse');
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    it('should reject invalid listing ID', async () => {
      (requireAdmin as Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
      });

      const result = await approveListingAction('invalid-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid listing ID');
    });

    it('should require admin authorization', async () => {
      (requireAdmin as Mock).mockRejectedValue(
        Object.assign(new Error('Admin privileges required'), {
          name: 'ForbiddenError',
        })
      );

      const result = await approveListingAction(
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin privileges required');
    });
  });

  describe('rejectListingAction', () => {
    it('should reject a listing with valid reason', async () => {
      // Mock admin user
      (requireAdmin as Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
      });

      // Mock Supabase responses
      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'listing-id',
          title: 'Test Listing',
          user_id: 'user-id',
          status: 'pending',
          users: {
            email: 'user@example.com',
            username: 'testuser',
          },
        },
        error: null,
      });
      const mockUpdate = vi.fn().mockReturnThis();

      (createClient as Mock).mockReturnValue({
        from: mockFrom,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'listings') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      // Execute action
      const result = await rejectListingAction(
        'listing-id',
        'Listing does not meet our quality standards'
      );

      // Verify result
      expect(result.success).toBe(true);
      expect(requireAdmin).toHaveBeenCalled();
    });

    it('should reject reason that is too short', async () => {
      (requireAdmin as Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
      });

      const result = await rejectListingAction('listing-id', 'Too short');

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 10 characters');
    });
  });
});

describe('Admin Actions - Vendor Approval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('approveVendorAction', () => {
    it('should approve a vendor application successfully', async () => {
      // Mock admin user
      (requireAdmin as Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
      });

      // Mock Supabase responses
      const mockFrom = vi.fn();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'application-id',
          user_id: 'user-id',
          business_name: 'Test Business',
          status: 'pending',
          users: {
            email: 'vendor@example.com',
            username: 'vendor',
          },
        },
        error: null,
      });
      const mockUpdate = vi.fn().mockReturnThis();
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      (createClient as Mock).mockReturnValue({
        from: mockFrom,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'vendor_applications') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        } else if (table === 'approved_vendors') {
          return {
            insert: mockInsert,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      // Execute action
      const result = await approveVendorAction('application-id');

      // Verify result
      expect(result.success).toBe(true);
      expect(requireAdmin).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/admin/vendors');
    });

    it('should require admin authorization', async () => {
      (requireAdmin as Mock).mockRejectedValue(
        Object.assign(new Error('Admin privileges required'), {
          name: 'ForbiddenError',
        })
      );

      const result = await approveVendorAction(
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin privileges required');
    });
  });

  describe('rejectVendorAction', () => {
    it('should reject a vendor application with valid reason', async () => {
      // Mock admin user
      (requireAdmin as Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
      });

      // Mock Supabase responses
      const mockFrom = vi.fn();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'application-id',
          user_id: 'user-id',
          business_name: 'Test Business',
          status: 'pending',
          users: {
            email: 'vendor@example.com',
            username: 'vendor',
          },
        },
        error: null,
      });
      const mockUpdate = vi.fn().mockReturnThis();

      (createClient as Mock).mockReturnValue({
        from: mockFrom,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'vendor_applications') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      // Execute action
      const result = await rejectVendorAction(
        'application-id',
        'Business information is incomplete'
      );

      // Verify result
      expect(result.success).toBe(true);
      expect(requireAdmin).toHaveBeenCalled();
    });

    it('should reject reason that is too short', async () => {
      (requireAdmin as Mock).mockResolvedValue({
        id: 'admin-id',
        role: 'admin',
      });

      const result = await rejectVendorAction('application-id', 'No');

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 10 characters');
    });
  });
});
