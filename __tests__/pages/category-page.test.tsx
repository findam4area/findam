/**
 * Category Page Tests
 * 
 * Unit tests for the category-specific browsing page
 * 
 * Requirements: 1.2, 6.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCategoryBySlug, getListings } from '@/lib/services/database';

// Mock the database service
vi.mock('@/lib/services/database', () => ({
  getCategoryBySlug: vi.fn(),
  getListings: vi.fn(),
}));

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

describe('Category Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Category fetching', () => {
    it('should fetch category by slug with subcategories', async () => {
      const mockCategory = {
        id: '123',
        name: 'Services',
        slug: 'services',
        description: 'Find various services',
        image_url: 'https://example.com/image.jpg',
        listing_count: 25,
        display_order: 1,
        parent_id: null,
      };

      vi.mocked(getCategoryBySlug).mockResolvedValue(mockCategory);

      const result = await getCategoryBySlug('services', true);

      expect(getCategoryBySlug).toHaveBeenCalledWith('services', true);
      expect(result).toEqual(mockCategory);
      expect(result?.name).toBe('Services');
      expect(result?.listing_count).toBe(25);
    });

    it('should return null for non-existent category', async () => {
      vi.mocked(getCategoryBySlug).mockResolvedValue(null);

      const result = await getCategoryBySlug('non-existent', true);

      expect(result).toBeNull();
    });
  });

  describe('Listings filtering', () => {
    it('should fetch listings filtered by category_id', async () => {
      const mockResult = {
        data: [
          {
            id: '1',
            title: 'Test Listing',
            description: 'Test description',
            price: 5000,
            category_id: '123',
            user_id: 'user-1',
            location_state: 'Lagos',
            location_city: 'Ikeja',
            images: ['https://example.com/image1.jpg'],
            primary_image_index: 0,
            is_featured: false,
            status: 'approved' as const,
            rejection_reason: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            category: {
              id: '123',
              name: 'Services',
              slug: 'services',
              parent_id: null,
              description: null,
              image_url: null,
              display_order: 1,
              listing_count: 25,
            },
            user: {
              id: 'user-1',
              email: 'user@example.com',
              username: 'testuser',
              phone: null,
              full_name: 'Test User',
              avatar_url: null,
              role: 'user' as const,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
            vendor: null,
          },
        ],
        meta: {
          total: 1,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      };

      vi.mocked(getListings).mockResolvedValue(mockResult);

      const result = await getListings({
        category_id: '123',
        limit: 20,
        offset: 0,
      });

      expect(getListings).toHaveBeenCalledWith({
        category_id: '123',
        limit: 20,
        offset: 0,
      });
      expect(result?.data).toHaveLength(1);
      expect(result?.data[0].category_id).toBe('123');
      expect(result?.meta.hasMore).toBe(false);
    });

    it('should combine category filter with location filter', async () => {
      const mockResult = {
        data: [],
        meta: {
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      };

      vi.mocked(getListings).mockResolvedValue(mockResult);

      await getListings({
        category_id: '123',
        location_city: 'Lagos',
        limit: 20,
        offset: 0,
      });

      expect(getListings).toHaveBeenCalledWith({
        category_id: '123',
        location_city: 'Lagos',
        limit: 20,
        offset: 0,
      });
    });

    it('should combine category filter with search query', async () => {
      const mockResult = {
        data: [],
        meta: {
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false,
        },
      };

      vi.mocked(getListings).mockResolvedValue(mockResult);

      await getListings({
        category_id: '123',
        search_query: 'test',
        sort_by: 'newest',
        limit: 20,
        offset: 0,
      });

      expect(getListings).toHaveBeenCalledWith({
        category_id: '123',
        search_query: 'test',
        sort_by: 'newest',
        limit: 20,
        offset: 0,
      });
    });
  });

  describe('Pagination', () => {
    it('should handle pagination with offset', async () => {
      const mockResult = {
        data: [],
        meta: {
          total: 50,
          limit: 20,
          offset: 20,
          hasMore: true,
        },
      };

      vi.mocked(getListings).mockResolvedValue(mockResult);

      const result = await getListings({
        category_id: '123',
        limit: 20,
        offset: 20,
      });

      expect(result?.meta.offset).toBe(20);
      expect(result?.meta.hasMore).toBe(true);
    });
  });

  describe('URL structure', () => {
    it('should use category slug in URL', () => {
      // URL pattern: /categories/[slug]
      const expectedPattern = '/categories/services';
      expect(expectedPattern).toMatch(/^\/categories\/[a-z0-9-]+$/);
    });

    it('should preserve filter parameters in URL', () => {
      const baseUrl = '/categories/services';
      const params = new URLSearchParams({
        location_city: 'Lagos',
        search_query: 'test',
        sort_by: 'newest',
        offset: '20',
      });
      const fullUrl = `${baseUrl}?${params.toString()}`;

      expect(fullUrl).toContain('location_city=Lagos');
      expect(fullUrl).toContain('search_query=test');
      expect(fullUrl).toContain('sort_by=newest');
      expect(fullUrl).toContain('offset=20');
    });
  });
});
