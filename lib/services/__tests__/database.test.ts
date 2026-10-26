/**
 * Unit tests for database service listing operations
 * 
 * Tests cover:
 * - createListing: creating new listings with images
 * - updateListingImages: updating listing images and primary index
 * - getListingById: fetching single listing with relations
 * - getUserListings: fetching user's listings
 * 
 * Requirements: 15.2, 15.9
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createListing,
  updateListingImages,
  getListingById,
  getUserListings,
} from '../database';

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const mockCreateClient = vi.mocked(await import('@/lib/supabase/server')).createClient;

describe('Database Service - Listing Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createListing', () => {
    it('should create a listing with valid data', async () => {
      const mockListingId = 'listing-123';
      const listingData = {
        title: 'Test Listing',
        description: 'This is a test listing with sufficient description length',
        price: 1000,
        category_id: 'cat-123',
        user_id: 'user-123',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        primary_image_index: 0,
      };

      mockCreateClient.mockResolvedValue({
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: mockListingId },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await createListing(listingData);

      expect(result).toBe(mockListingId);
    });

    it('should throw error when no images provided', async () => {
      const listingData = {
        title: 'Test Listing',
        description: 'This is a test listing with sufficient description length',
        price: 1000,
        category_id: 'cat-123',
        user_id: 'user-123',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: [],
        primary_image_index: 0,
      };

      await expect(createListing(listingData)).rejects.toThrow(
        'At least one image is required for a listing.'
      );
    });

    it('should throw error when more than 5 images provided', async () => {
      const listingData = {
        title: 'Test Listing',
        description: 'This is a test listing with sufficient description length',
        price: 1000,
        category_id: 'cat-123',
        user_id: 'user-123',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
          'https://example.com/image4.jpg',
          'https://example.com/image5.jpg',
          'https://example.com/image6.jpg',
        ],
        primary_image_index: 0,
      };

      await expect(createListing(listingData)).rejects.toThrow(
        'Maximum 5 images allowed per listing.'
      );
    });

    it('should throw error when primary_image_index is out of bounds', async () => {
      const listingData = {
        title: 'Test Listing',
        description: 'This is a test listing with sufficient description length',
        price: 1000,
        category_id: 'cat-123',
        user_id: 'user-123',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        primary_image_index: 5,
      };

      await expect(createListing(listingData)).rejects.toThrow(
        'Primary image index must be within the images array bounds.'
      );
    });

    it('should default primary_image_index to 0 when not provided', async () => {
      const mockListingId = 'listing-123';
      const listingData = {
        title: 'Test Listing',
        description: 'This is a test listing with sufficient description length',
        price: 1000,
        category_id: 'cat-123',
        user_id: 'user-123',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: mockListingId },
            error: null,
          }),
        }),
      });

      mockCreateClient.mockResolvedValue({
        from: vi.fn().mockReturnValue({
          insert: mockInsert,
        }),
      } as any);

      await createListing(listingData);

      // Verify that primary_image_index was set to 0
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          primary_image_index: 0,
          status: 'pending',
          is_featured: false,
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      const listingData = {
        title: 'Test Listing',
        description: 'This is a test listing with sufficient description length',
        price: 1000,
        category_id: 'cat-123',
        user_id: 'user-123',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: ['https://example.com/image1.jpg'],
        primary_image_index: 0,
      };

      mockCreateClient.mockResolvedValue({
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST301', message: 'Database error' },
              }),
            }),
          }),
        }),
      } as any);

      await expect(createListing(listingData)).rejects.toThrow();
    });
  });

  describe('updateListingImages', () => {
    it('should update listing images with valid data', async () => {
      const listingId = 'listing-123';
      const images = ['https://example.com/new1.jpg', 'https://example.com/new2.jpg'];
      const primaryIndex = 1;

      mockCreateClient.mockResolvedValue({
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      } as any);

      await expect(updateListingImages(listingId, images, primaryIndex)).resolves.not.toThrow();
    });

    it('should throw error when no images provided', async () => {
      const listingId = 'listing-123';
      const images: string[] = [];
      const primaryIndex = 0;

      await expect(updateListingImages(listingId, images, primaryIndex)).rejects.toThrow(
        'At least one image is required for a listing.'
      );
    });

    it('should throw error when more than 5 images provided', async () => {
      const listingId = 'listing-123';
      const images = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
        'https://example.com/image4.jpg',
        'https://example.com/image5.jpg',
        'https://example.com/image6.jpg',
      ];
      const primaryIndex = 0;

      await expect(updateListingImages(listingId, images, primaryIndex)).rejects.toThrow(
        'Maximum 5 images allowed per listing.'
      );
    });

    it('should throw error when primary_image_index is negative', async () => {
      const listingId = 'listing-123';
      const images = ['https://example.com/image1.jpg'];
      const primaryIndex = -1;

      await expect(updateListingImages(listingId, images, primaryIndex)).rejects.toThrow(
        'Primary image index must be within the images array bounds.'
      );
    });

    it('should throw error when primary_image_index is out of bounds', async () => {
      const listingId = 'listing-123';
      const images = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];
      const primaryIndex = 3;

      await expect(updateListingImages(listingId, images, primaryIndex)).rejects.toThrow(
        'Primary image index must be within the images array bounds.'
      );
    });

    it('should handle database errors gracefully', async () => {
      const listingId = 'listing-123';
      const images = ['https://example.com/new1.jpg'];
      const primaryIndex = 0;

      mockCreateClient.mockResolvedValue({
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: { code: 'PGRST301', message: 'Database error' },
            }),
          }),
        }),
      } as any);

      await expect(updateListingImages(listingId, images, primaryIndex)).rejects.toThrow();
    });
  });

  describe('getListingById', () => {
    it('should return listing with relations when found', async () => {
      const mockListing = {
        id: 'listing-123',
        title: 'Test Listing',
        description: 'Test description',
        price: 1000,
        category_id: 'cat-123',
        user_id: 'user-123',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: ['https://example.com/image1.jpg'],
        primary_image_index: 0,
        is_featured: false,
        status: 'approved',
        rejection_reason: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        category: { id: 'cat-123', name: 'Test Category', slug: 'test-category' },
        user: { id: 'user-123', email: 'test@example.com', username: 'testuser' },
        vendor: null,
      };

      mockCreateClient.mockResolvedValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockListing,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await getListingById('listing-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('listing-123');
      expect(result?.title).toBe('Test Listing');
      expect(result?.category).toBeDefined();
      expect(result?.user).toBeDefined();
    });

    it('should return null when listing not found', async () => {
      mockCreateClient.mockResolvedValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              }),
            }),
          }),
        }),
      } as any);

      const result = await getListingById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should throw error for database errors', async () => {
      mockCreateClient.mockResolvedValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST301', message: 'Database error' },
              }),
            }),
          }),
        }),
      } as any);

      await expect(getListingById('listing-123')).rejects.toThrow();
    });
  });

  describe('getUserListings', () => {
    it('should return user listings with relations', async () => {
      const mockListings = [
        {
          id: 'listing-1',
          title: 'Listing 1',
          description: 'Description 1',
          price: 1000,
          category_id: 'cat-123',
          user_id: 'user-123',
          location_state: 'Lagos',
          location_city: 'Ikeja',
          images: ['https://example.com/image1.jpg'],
          primary_image_index: 0,
          is_featured: false,
          status: 'approved',
          rejection_reason: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          category: { id: 'cat-123', name: 'Category', slug: 'category' },
          user: { id: 'user-123', email: 'test@example.com', username: 'testuser' },
          vendor: null,
        },
        {
          id: 'listing-2',
          title: 'Listing 2',
          description: 'Description 2',
          price: 2000,
          category_id: 'cat-123',
          user_id: 'user-123',
          location_state: 'Lagos',
          location_city: 'Victoria Island',
          images: ['https://example.com/image2.jpg'],
          primary_image_index: 0,
          is_featured: false,
          status: 'pending',
          rejection_reason: null,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          category: { id: 'cat-123', name: 'Category', slug: 'category' },
          user: { id: 'user-123', email: 'test@example.com', username: 'testuser' },
          vendor: null,
        },
      ];

      mockCreateClient.mockResolvedValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockListings,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await getUserListings('user-123');

      expect(result).not.toBeNull();
      expect(result).toHaveLength(2);
      expect(result?.[0].id).toBe('listing-1');
      expect(result?.[1].id).toBe('listing-2');
    });

    it('should return empty array when user has no listings', async () => {
      mockCreateClient.mockResolvedValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await getUserListings('user-123');

      expect(result).toEqual([]);
    });

    it('should throw error for database errors', async () => {
      mockCreateClient.mockResolvedValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST301', message: 'Database error' },
              }),
            }),
          }),
        }),
      } as any);

      await expect(getUserListings('user-123')).rejects.toThrow();
    });
  });
});
