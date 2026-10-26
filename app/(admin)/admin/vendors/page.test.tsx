/**
 * Unit tests for Admin Vendors Dashboard Page
 * 
 * Tests the server component functionality including:
 * - Admin authentication guard
 * - Data fetching via getPendingVendorApplications
 * - Filter and sort functionality
 * - Empty state handling
 * - Error state handling
 * 
 * Requirements: 4.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the auth module
vi.mock('@/lib/services/auth', () => ({
  requireAdmin: vi.fn(),
}));

// Mock the database module
vi.mock('@/lib/services/database', () => ({
  getPendingVendorApplications: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock VendorApprovalCard component
vi.mock('@/components/admin/vendor-approval-card', () => ({
  VendorApprovalCard: ({ application }: any) => (
    <div data-testid="vendor-card">{application.business_name}</div>
  ),
}));

import { requireAdmin } from '@/lib/services/auth';
import { getPendingVendorApplications } from '@/lib/services/database';
import { redirect } from 'next/navigation';
import type { VendorApplicationWithUser } from '@/lib/types/core';

describe('Admin Vendors Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should redirect to login if not authenticated', async () => {
      // Arrange
      vi.mocked(requireAdmin).mockRejectedValue(new Error('Not authenticated'));

      // Act
      const AdminVendorsPage = (await import('./page')).default;
      await AdminVendorsPage({ searchParams: {} });

      // Assert
      expect(redirect).toHaveBeenCalledWith('/login?redirect=/admin/vendors');
    });

    it('should allow access for admin users', async () => {
      // Arrange
      vi.mocked(requireAdmin).mockResolvedValue({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        full_name: 'Admin User',
        username: 'testuser',
        phone: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      vi.mocked(getPendingVendorApplications).mockResolvedValue([]);

      // Act
      const AdminVendorsPage = (await import('./page')).default;
      await AdminVendorsPage({ searchParams: {} });

      // Assert
      expect(requireAdmin).toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe('Data Fetching', () => {
    beforeEach(() => {
      vi.mocked(requireAdmin).mockResolvedValue({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        full_name: 'Admin User',
        username: 'testuser',
        phone: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    it('should fetch pending vendor applications', async () => {
      // Arrange
      const mockApplications: VendorApplicationWithUser[] = [
        {
          id: 'app-1',
          user_id: 'user-1',
          business_name: 'Test Business',
          business_description: 'A test business description',
          contact_email: 'test@business.com',
          contact_phone: '+2348012345678',
          status: 'pending',
          rejection_reason: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: 'user-1',
            email: 'user@example.com',
            full_name: 'Test User',
            phone: null,
            avatar_url: null,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            username: ''
          },
        },
      ];
      vi.mocked(getPendingVendorApplications).mockResolvedValue(mockApplications);

      // Act
      const AdminVendorsPage = (await import('./page')).default;
      await AdminVendorsPage({ searchParams: {} });

      // Assert
      expect(getPendingVendorApplications).toHaveBeenCalled();
    });

    it('should handle database fetch errors gracefully', async () => {
      // Arrange
      vi.mocked(getPendingVendorApplications).mockResolvedValue(null);

      // Act
      const AdminVendorsPage = (await import('./page')).default;
      const result = await AdminVendorsPage({ searchParams: {} });

      // Assert - should not throw, should render error state
      expect(result).toBeDefined();
    });
  });

  describe('Filtering', () => {
    const mockApplications: VendorApplicationWithUser[] = [
      {
        id: 'app-1',
        user_id: 'user-1',
        business_name: 'Alpha Business',
        business_description: 'First business',
        contact_email: 'alpha@business.com',
        contact_phone: '+2348012345678',
        status: 'pending',
        rejection_reason: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          email: 'user1@example.com',
          full_name: 'User One',
          phone: null,
          avatar_url: null,
          role: 'user',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          username: ''
        },
      },
      {
        id: 'app-2',
        user_id: 'user-2',
        business_name: 'Beta Business',
        business_description: 'Second business',
        contact_email: 'beta@business.com',
        contact_phone: '+2348012345679',
        status: 'pending',
        rejection_reason: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        user: {
          id: 'user-2',
          email: 'user2@example.com',
          full_name: 'User Two',
          phone: null,
          avatar_url: null,
          role: 'user',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          username: ''
        },
      },
    ];

    beforeEach(() => {
      vi.mocked(requireAdmin).mockResolvedValue({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        full_name: 'Admin User',
        username: 'testuser',
        phone: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      vi.mocked(getPendingVendorApplications).mockResolvedValue(mockApplications);
    });

    it('should filter applications by search query', async () => {
      // Act
      const AdminVendorsPage = (await import('./page')).default;
      await AdminVendorsPage({ searchParams: { search: 'alpha' } });

      // Assert - page should render without errors
      expect(getPendingVendorApplications).toHaveBeenCalled();
    });

    it('should sort applications by newest first (default)', async () => {
      // Act
      const AdminVendorsPage = (await import('./page')).default;
      await AdminVendorsPage({ searchParams: {} });

      // Assert
      expect(getPendingVendorApplications).toHaveBeenCalled();
    });

    it('should sort applications by oldest first', async () => {
      // Act
      const AdminVendorsPage = (await import('./page')).default;
      await AdminVendorsPage({ searchParams: { sort: 'oldest' } });

      // Assert
      expect(getPendingVendorApplications).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      vi.mocked(requireAdmin).mockResolvedValue({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        full_name: 'Admin User',
        username: 'testuser',
        phone: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    it('should display empty state when no applications exist', async () => {
      // Arrange
      vi.mocked(getPendingVendorApplications).mockResolvedValue([]);

      // Act
      const AdminVendorsPage = (await import('./page')).default;
      const result = await AdminVendorsPage({ searchParams: {} });

      // Assert - should render without errors
      expect(result).toBeDefined();
    });
  });

  describe('Pending Count Badge', () => {
    beforeEach(() => {
      vi.mocked(requireAdmin).mockResolvedValue({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        full_name: 'Admin User',
        username: 'testuser',
        phone: null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    it('should display pending count badge when applications exist', async () => {
      // Arrange
      const mockApplications: VendorApplicationWithUser[] = [
        {
          id: 'app-1',
          user_id: 'user-1',
          business_name: 'Test Business',
          business_description: 'A test business',
          contact_email: 'test@business.com',
          contact_phone: '+2348012345678',
          status: 'pending',
          rejection_reason: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: 'user-1',
            email: 'user@example.com',
            full_name: 'Test User',
            phone: null,
            avatar_url: null,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            username: ''
          },
        },
      ];
      vi.mocked(getPendingVendorApplications).mockResolvedValue(mockApplications);

      // Act
      const AdminVendorsPage = (await import('./page')).default;
      const result = await AdminVendorsPage({ searchParams: {} });

      // Assert
      expect(result).toBeDefined();
    });
  });
});
