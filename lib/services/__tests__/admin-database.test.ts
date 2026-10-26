/**
 * Unit tests for admin database service functions
 * 
 * Tests getPendingListings() and getPendingVendorApplications() functions
 * with proper TypeScript typing and error handling.
 * 
 * Requirements: 3.2, 3.3, 4.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPendingListings, getPendingVendorApplications } from '../database';
import { createClient } from '@/lib/supabase/server';

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Admin Database Service', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    };

    // Mock createClient to return our mock
    vi.mocked(createClient).mockResolvedValue(mockSupabase);
  });

  describe('getPendingListings', () => {
    it('should fetch pending listings with relations', async () => {
      // Mock data
      const mockData = [
        {
          id: 'listing-1',
          title: 'Test Listing 1',
          description: 'Test description',
          price: 1000,
          category_id: 'cat-1',
          user_id: 'user-1',
          location_state: 'Lagos',
          location_city: 'Ikeja',
          images: ['image1.jpg', 'image2.jpg'],
          primary_image_index: 0,
          is_featured: false,
          status: 'pending',
          rejection_reason: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          category: {
            id: 'cat-1',
            name: 'Services',
            slug: 'services',
            parent_id: null,
            description: null,
            image_url: null,
            display_order: 1,
            listing_count: 5,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          user: {
            id: 'user-1',
            email: 'test@example.com',
            username: 'testuser',
            avatar_url: null,
          },
          vendor: null,
        },
      ];

      // Mock Supabase query chain
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Execute function
      const result = await getPendingListings();

      // Assertions
      expect(result).not.toBeNull();
      expect(result).toHaveLength(1);
      expect(result![0].status).toBe('pending');
      expect(result![0].category).toBeDefined();
      expect(result![0].user).toBeDefined();

      // Verify Supabase was called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('listings');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('category:categories'));
    });

    it('should return empty array when no pending listings', async () => {
      // Mock empty result
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Execute function
      const result = await getPendingListings();

      // Assertions
      expect(result).not.toBeNull();
      expect(result).toHaveLength(0);
    });

    it('should return null on database error', async () => {
      // Mock error
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error', code: 'PGRST301' },
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Execute function
      const result = await getPendingListings();

      // Assertions
      expect(result).toBeNull();
    });

    it('should handle unexpected errors gracefully', async () => {
      // Mock unexpected error
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Execute function
      const result = await getPendingListings();

      // Assertions
      expect(result).toBeNull();
    });
  });

  describe('getPendingVendorApplications', () => {
    it('should fetch pending vendor applications with user data', async () => {
      // Mock data
      const mockData = [
        {
          id: 'app-1',
          user_id: 'user-1',
          business_name: 'Test Business',
          business_description: 'Test business description',
          contact_email: 'business@example.com',
          contact_phone: '+2348012345678',
          status: 'pending',
          rejection_reason: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          user: {
            id: 'user-1',
            email: 'test@example.com',
            username: 'testuser',
            avatar_url: null,
            full_name: 'Test User',
          },
        },
      ];

      // Mock Supabase query chain
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Execute function
      const result = await getPendingVendorApplications();

      // Assertions
      expect(result).not.toBeNull();
      expect(result).toHaveLength(1);
      expect(result![0].status).toBe('pending');
      expect(result![0].business_name).toBe('Test Business');
      expect(result![0].user).toBeDefined();
      expect(result![0].user.full_name).toBe('Test User');

      // Verify Supabase was called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('vendor_applications');
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('user:users'));
    });

    it('should return empty array when no pending applications', async () => {
      // Mock empty result
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Execute function
      const result = await getPendingVendorApplications();

      // Assertions
      expect(result).not.toBeNull();
      expect(result).toHaveLength(0);
    });

    it('should return null on database error', async () => {
      // Mock error
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error', code: 'PGRST301' },
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      // Execute function
      const result = await getPendingVendorApplications();

      // Assertions
      expect(result).toBeNull();
    });

    it('should handle unexpected errors gracefully', async () => {
      // Mock unexpected error
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Execute function
      const result = await getPendingVendorApplications();

      // Assertions
      expect(result).toBeNull();
    });
  });
});
