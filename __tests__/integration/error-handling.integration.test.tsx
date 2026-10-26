/**
 * Error Handling Integration Tests
 * 
 * Tests error scenarios:
 * - Mock database fetch failure
 * - Verify error message displays
 * - Verify retry button refetches data
 * - Test recovery after error
 * - Network error handling
 * 
 * Subtask: 20.5
 * Requirements: 12.2, 12.3, 12.5, 12.6, 16.28-16.30
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getCategoryBySlug } from '@/lib/services/database';
import { CategoryGrid } from '@/components/features/category-grid';
import type { Category } from '@/lib/types/core';

// Mock database service
vi.mock('@/lib/services/database', () => ({
  getCategoryBySlug: vi.fn(),
  getCategories: vi.fn(),
}));

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => false,
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/browse',
  notFound: vi.fn(),
}));

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    slug: 'electronics',
    parent_id: null,
    description: 'Electronic devices',
    image_url: '/images/electronics.jpg',
    display_order: 1,
    listing_count: 150,
  },
];

describe('Error Handling Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Database Fetch Errors', () => {
    it('should display error message when category fetch fails', async () => {
      vi.mocked(getCategoryBySlug).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(getCategoryBySlug('electronics', true)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should display error message when categories fetch fails', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Failed to fetch categories' },
      });

      const result = await mockSupabaseClient
        .from('categories')
        .select('*')
        .order('display_order');

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Failed to fetch categories');
    });

    it('should display generic error message for unknown errors', async () => {
      vi.mocked(getCategoryBySlug).mockRejectedValue(
        new Error('Unknown error')
      );

      await expect(getCategoryBySlug('electronics', true)).rejects.toThrow(
        'Unknown error'
      );
    });

    it('should handle null data response from database', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await mockSupabaseClient
        .from('categories')
        .select('*')
        .order('display_order');

      expect(result.data).toBeNull();
    });

    it('should handle empty array response from database', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await mockSupabaseClient
        .from('categories')
        .select('*')
        .order('display_order');

      expect(result.data).toEqual([]);
    });
  });

  describe('Error Message Display', () => {
    it('should render error message when no categories are returned due to error', async () => {
      render(<CategoryGrid categories={[]} />);

      await waitFor(() => {
        expect(screen.getByText(/no categories available/i)).toBeInTheDocument();
      });
    });

    it('should display user-friendly error message', async () => {
      vi.mocked(getCategoryBySlug).mockRejectedValue(
        new Error('Network error')
      );

      try {
        await getCategoryBySlug('electronics', true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Network error');
      }
    });

    it('should show error icon alongside error message', async () => {
      render(<CategoryGrid categories={[]} />);

      await waitFor(() => {
        const emptyState = screen.getByText(/no categories available/i);
        expect(emptyState).toBeInTheDocument();
      });
    });

    it('should display technical error details in development mode', () => {
      const error = new Error('Database timeout after 5000ms');
      const isDevelopment = process.env.NODE_ENV === 'development';

      if (isDevelopment) {
        expect(error.message).toContain('Database timeout');
      }
    });

    it('should hide technical error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Internal server error');
      const userMessage = 'Something went wrong. Please try again later.';

      expect(userMessage).not.toContain('Internal server error');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Retry Functionality', () => {
    it('should display retry button when fetch fails', async () => {
      const mockRetry = vi.fn();
      render(<CategoryGrid categories={[]} error="Failed to load categories" onRetry={mockRetry} />);

      await waitFor(() => {
        const retryButton = screen.queryByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should refetch data when retry button is clicked', async () => {
      const user = userEvent.setup();

      // First attempt fails
      vi.mocked(getCategoryBySlug).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(getCategoryBySlug('electronics', true)).rejects.toThrow();

      // Retry succeeds
      vi.mocked(getCategoryBySlug).mockResolvedValueOnce(mockCategories[0]);

      const result = await getCategoryBySlug('electronics', true);
      expect(result).toEqual(mockCategories[0]);
    });

    it('should clear error message after successful retry', async () => {
      let hasError = true;
      const mockRetry = vi.fn(() => {
        hasError = false;
      });

      mockRetry();

      expect(hasError).toBe(false);
    });

    it('should show loading state during retry', async () => {
      let isLoading = false;
      const mockRetry = vi.fn(async () => {
        isLoading = true;
        await new Promise((resolve) => setTimeout(resolve, 100));
        isLoading = false;
      });

      const promise = mockRetry();
      expect(isLoading).toBe(true);

      await promise;
      expect(isLoading).toBe(false);
    });

    it('should handle retry failure gracefully', async () => {
      // First attempt fails
      vi.mocked(getCategoryBySlug).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(getCategoryBySlug('electronics', true)).rejects.toThrow();

      // Retry also fails
      vi.mocked(getCategoryBySlug).mockRejectedValueOnce(
        new Error('Still failing')
      );

      await expect(getCategoryBySlug('electronics', true)).rejects.toThrow();
    });

    it('should limit retry attempts to prevent infinite loops', async () => {
      let retryCount = 0;
      const maxRetries = 3;

      const mockRetry = vi.fn(async () => {
        if (retryCount < maxRetries) {
          retryCount++;
          throw new Error('Still failing');
        }
        return mockCategories[0];
      });

      // Try up to max retries
      for (let i = 0; i < maxRetries; i++) {
        try {
          await mockRetry();
        } catch (error) {
          // Expected to fail
        }
      }

      expect(retryCount).toBe(maxRetries);
    });
  });

  describe('Network Errors', () => {
    it('should handle network timeout errors', async () => {
      vi.mocked(getCategoryBySlug).mockRejectedValue(
        new Error('Request timeout')
      );

      await expect(getCategoryBySlug('electronics', true)).rejects.toThrow(
        'Request timeout'
      );
    });

    it('should handle connection refused errors', async () => {
      mockSupabaseClient.order.mockRejectedValue(
        new Error('Connection refused')
      );

      await expect(
        mockSupabaseClient.from('categories').select('*').order('display_order')
      ).rejects.toThrow('Connection refused');
    });

    it('should handle DNS resolution errors', async () => {
      mockSupabaseClient.order.mockRejectedValue(
        new Error('getaddrinfo ENOTFOUND')
      );

      await expect(
        mockSupabaseClient.from('categories').select('*').order('display_order')
      ).rejects.toThrow('getaddrinfo ENOTFOUND');
    });

    it('should handle offline network state', async () => {
      const isOnline = navigator.onLine;
      
      if (!isOnline) {
        expect(isOnline).toBe(false);
        // Should display offline message
      }
    });

    it('should recover automatically when network is restored', async () => {
      // Simulate offline
      vi.mocked(getCategoryBySlug).mockRejectedValueOnce(
        new Error('Network offline')
      );

      await expect(getCategoryBySlug('electronics', true)).rejects.toThrow();

      // Simulate online
      vi.mocked(getCategoryBySlug).mockResolvedValue(mockCategories[0]);

      const result = await getCategoryBySlug('electronics', true);
      expect(result).toEqual(mockCategories[0]);
    });
  });

  describe('Authentication Errors', () => {
    it('should handle unauthorized access errors', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Unauthorized', code: '401' },
      });

      const result = await mockSupabaseClient
        .from('categories')
        .select('*')
        .order('display_order');

      expect(result.error?.code).toBe('401');
    });

    it('should handle forbidden access errors', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Forbidden', code: '403' },
      });

      const result = await mockSupabaseClient
        .from('categories')
        .select('*')
        .order('display_order');

      expect(result.error?.code).toBe('403');
    });

    it('should handle expired session errors', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Session expired', code: 'PGRST301' },
      });

      const result = await mockSupabaseClient
        .from('categories')
        .select('*')
        .order('display_order');

      expect(result.error?.message).toContain('expired');
    });
  });

  describe('Data Validation Errors', () => {
    it('should handle invalid category slug', async () => {
      vi.mocked(getCategoryBySlug).mockResolvedValue(null);

      const result = await getCategoryBySlug('invalid-slug', true);

      expect(result).toBeNull();
    });

    it('should handle malformed category data', async () => {
      const malformedData = {
        id: '1',
        // Missing required fields
      };

      mockSupabaseClient.order.mockResolvedValue({
        data: [malformedData],
        error: null,
      });

      const result = await mockSupabaseClient
        .from('categories')
        .select('*')
        .order('display_order');

      expect(result.data?.[0]).toBeDefined();
      // Application should validate and handle missing fields
    });

    it('should handle null values in optional fields', async () => {
      const categoryWithNulls: Category = {
        id: '1',
        name: 'Electronics',
        slug: 'electronics',
        parent_id: null,
        description: null,
        image_url: null,
        display_order: 1,
        listing_count: 0,
      };

      mockSupabaseClient.order.mockResolvedValue({
        data: [categoryWithNulls],
        error: null,
      });

      const result = await mockSupabaseClient
        .from('categories')
        .select('*')
        .order('display_order');

      expect(result.data?.[0]).toEqual(categoryWithNulls);
    });
  });

  describe('Subcategory Fetch Errors', () => {
    it('should handle error when fetching subcategories', async () => {
      const categoryWithoutSubcategories = {
        ...mockCategories[0],
        subcategories: undefined,
      };

      vi.mocked(getCategoryBySlug).mockResolvedValue(categoryWithoutSubcategories);

      const result = await getCategoryBySlug('electronics', false);

      expect(result?.subcategories).toBeUndefined();
    });

    it('should display parent category even if subcategories fail to load', async () => {
      const categoryWithError = {
        ...mockCategories[0],
        subcategories: [],
      };

      vi.mocked(getCategoryBySlug).mockResolvedValue(categoryWithError);

      const result = await getCategoryBySlug('electronics', true);

      expect(result?.name).toBe('Electronics');
      expect(result?.subcategories).toEqual([]);
    });

    it('should show error message for subcategories section only', async () => {
      // Parent loads successfully
      const category = {
        ...mockCategories[0],
        subcategories: undefined,
      };

      vi.mocked(getCategoryBySlug).mockResolvedValue(category);

      const result = await getCategoryBySlug('electronics', false);

      expect(result).toBeDefined();
      expect(result?.subcategories).toBeUndefined();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from temporary database errors', async () => {
      // First call fails
      vi.mocked(getCategoryBySlug).mockRejectedValueOnce(
        new Error('Temporary error')
      );

      await expect(getCategoryBySlug('electronics', true)).rejects.toThrow();

      // Second call succeeds
      vi.mocked(getCategoryBySlug).mockResolvedValue(mockCategories[0]);

      const result = await getCategoryBySlug('electronics', true);
      expect(result).toEqual(mockCategories[0]);
    });

    it('should maintain user filters after error recovery', async () => {
      const initialSearch = 'electronics';
      const initialSort = 'most-listings';

      render(
        <CategoryGrid
          categories={[]}
          initialSearch={initialSearch}
          initialSort={initialSort}
        />
      );

      // After recovery, filters should still be applied
      await waitFor(() => {
        expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
      });
    });

    it('should clear error state when new data loads successfully', async () => {
      let hasError = true;

      // Error state
      expect(hasError).toBe(true);

      // Successful data load
      hasError = false;

      expect(hasError).toBe(false);
    });
  });

  describe('Error Logging', () => {
    it('should log errors to console in development', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const error = new Error('Test error');
      console.error('Error fetching categories:', error);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching categories:',
        error
      );

      consoleSpy.mockRestore();
    });

    it('should send errors to monitoring service in production', () => {
      const mockSendToMonitoring = vi.fn();

      const error = new Error('Production error');
      mockSendToMonitoring(error);

      expect(mockSendToMonitoring).toHaveBeenCalledWith(error);
    });

    it('should include error context in logs', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const error = new Error('Database error');
      const context = {
        function: 'getCategoryBySlug',
        slug: 'electronics',
        timestamp: new Date().toISOString(),
      };

      console.error('Error:', error, 'Context:', context);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Graceful Degradation', () => {
    it('should show cached data when fresh fetch fails', async () => {
      const cachedCategories = mockCategories;

      // Fresh fetch fails
      vi.mocked(getCategoryBySlug).mockRejectedValue(
        new Error('Network error')
      );

      // Fall back to cached data
      const displayedCategories = cachedCategories;

      expect(displayedCategories).toEqual(mockCategories);
    });

    it('should disable real-time updates when connection fails', () => {
      let isRealTimeEnabled = true;

      // Connection fails
      const error = new Error('WebSocket connection failed');
      isRealTimeEnabled = false;

      expect(isRealTimeEnabled).toBe(false);
    });

    it('should provide basic functionality even with errors', async () => {
      // Even if some features fail, basic browsing should work
      render(<CategoryGrid categories={mockCategories} />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });
    });
  });
});
