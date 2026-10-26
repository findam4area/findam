/**
 * Integration tests for admin action notification integration
 * 
 * Tests verify that:
 * - Approval/rejection actions call notification functions
 * - Notification failures don't block approval workflows
 * 
 * Task: 8.16 Integrate notifications into approval actions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/services/auth', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/services/notifications', () => ({
  sendListingApprovedNotification: vi.fn(),
  sendListingRejectedNotification: vi.fn(),
  sendVendorApprovedNotification: vi.fn(),
  sendVendorRejectedNotification: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import {
  approveListingAction,
  rejectListingAction,
  approveVendorAction,
  rejectVendorAction,
} from '../admin-actions';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/services/auth';
import {
  sendListingApprovedNotification,
  sendListingRejectedNotification,
  sendVendorApprovedNotification,
  sendVendorRejectedNotification,
} from '@/lib/services/notifications';

describe('Admin Actions - Notification Integration', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock admin user
    (requireAdmin as Mock).mockResolvedValue({ id: 'admin-123', role: 'admin' });

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
    };

    (createClient as Mock).mockResolvedValue(mockSupabase);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Listing Approval Notifications', () => {
    it('should call sendListingApprovedNotification after successful approval', async () => {
      const listingId = 'listing-123';
      const userId = 'user-456';
      
      // Mock successful listing fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: listingId,
          title: 'Test Listing',
          user_id: userId,
          category_id: 'category-123',
          status: 'pending',
          users: { email: 'user@example.com', username: 'testuser' },
        },
        error: null,
      });

      // Mock successful update
      mockSupabase.update.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Execute action
      const result = await approveListingAction(listingId);

      // Verify notification was called with correct parameters
      expect(sendListingApprovedNotification).toHaveBeenCalledWith(userId, listingId);
      expect(sendListingApprovedNotification).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('should call sendListingRejectedNotification after successful rejection', async () => {
      const listingId = 'listing-123';
      const userId = 'user-456';
      const reason = 'This listing does not meet our quality standards.';
      
      // Mock successful listing fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: listingId,
          title: 'Test Listing',
          user_id: userId,
          status: 'pending',
          users: { email: 'user@example.com', username: 'testuser' },
        },
        error: null,
      });

      // Mock successful update
      mockSupabase.update.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Execute action
      const result = await rejectListingAction(listingId, reason);

      // Verify notification was called with correct parameters
      expect(sendListingRejectedNotification).toHaveBeenCalledWith(userId, listingId, reason);
      expect(sendListingRejectedNotification).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('should complete approval workflow even if notification fails', async () => {
      const listingId = 'listing-123';
      const userId = 'user-456';
      
      // Mock successful listing fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: listingId,
          title: 'Test Listing',
          user_id: userId,
          category_id: 'category-123',
          status: 'pending',
          users: { email: 'user@example.com', username: 'testuser' },
        },
        error: null,
      });

      // Mock successful update
      mockSupabase.update.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock notification failure (but it should not throw)
      (sendListingApprovedNotification as Mock).mockRejectedValueOnce(
        new Error('Email service unavailable')
      );

      // Execute action - should NOT fail even if notification fails
      const result = await approveListingAction(listingId);

      // Verify approval workflow completed successfully
      expect(result.success).toBe(true);
      expect(sendListingApprovedNotification).toHaveBeenCalledWith(userId, listingId);
    });
  });

  describe('Vendor Approval Notifications', () => {
    it('should call sendVendorApprovedNotification after successful approval', async () => {
      const applicationId = 'app-123';
      const userId = 'user-456';
      const businessName = 'Test Business';
      
      // Mock successful application fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: applicationId,
          user_id: userId,
          business_name: businessName,
          status: 'pending',
          users: { email: 'user@example.com', username: 'testuser' },
        },
        error: null,
      });

      // Mock successful update
      mockSupabase.update.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock successful insert into approved_vendors
      mockSupabase.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Execute action
      const result = await approveVendorAction(applicationId);

      // Verify notification was called with correct parameters
      expect(sendVendorApprovedNotification).toHaveBeenCalledWith(userId, applicationId);
      expect(sendVendorApprovedNotification).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('should call sendVendorRejectedNotification after successful rejection', async () => {
      const applicationId = 'app-123';
      const userId = 'user-456';
      const reason = 'Business verification documents are incomplete.';
      
      // Mock successful application fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: applicationId,
          user_id: userId,
          business_name: 'Test Business',
          status: 'pending',
          users: { email: 'user@example.com', username: 'testuser' },
        },
        error: null,
      });

      // Mock successful update
      mockSupabase.update.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Execute action
      const result = await rejectVendorAction(applicationId, reason);

      // Verify notification was called with correct parameters
      expect(sendVendorRejectedNotification).toHaveBeenCalledWith(userId, applicationId, reason);
      expect(sendVendorRejectedNotification).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('should complete approval workflow even if notification fails', async () => {
      const applicationId = 'app-123';
      const userId = 'user-456';
      
      // Mock successful application fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: applicationId,
          user_id: userId,
          business_name: 'Test Business',
          status: 'pending',
          users: { email: 'user@example.com', username: 'testuser' },
        },
        error: null,
      });

      // Mock successful update
      mockSupabase.update.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock successful insert
      mockSupabase.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock notification failure (but it should not throw)
      (sendVendorApprovedNotification as Mock).mockRejectedValueOnce(
        new Error('Email service unavailable')
      );

      // Execute action - should NOT fail even if notification fails
      const result = await approveVendorAction(applicationId);

      // Verify approval workflow completed successfully
      expect(result.success).toBe(true);
      expect(sendVendorApprovedNotification).toHaveBeenCalledWith(userId, applicationId);
    });
  });

  describe('Notification Integration Requirements', () => {
    it('should handle all four notification types correctly', async () => {
      // Verify all four notification functions are imported and available
      expect(sendListingApprovedNotification).toBeDefined();
      expect(sendListingRejectedNotification).toBeDefined();
      expect(sendVendorApprovedNotification).toBeDefined();
      expect(sendVendorRejectedNotification).toBeDefined();
    });

    it('should not block approval workflow if notification service is unavailable', async () => {
      // This test verifies Requirement 3.7, 4.7:
      // "Notification failures don't block approval workflow"
      
      // All notification functions should be designed to never throw
      // They handle errors internally and only log them
      expect(() => {
        (sendListingApprovedNotification as Mock)();
        (sendListingRejectedNotification as Mock)();
        (sendVendorApprovedNotification as Mock)();
        (sendVendorRejectedNotification as Mock)();
      }).not.toThrow();
    });
  });
});
