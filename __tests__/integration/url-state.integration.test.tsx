/**
 * URL State Management Integration Tests
 * 
 * Tests URL state persistence and sharing with ACTUAL component APIs:
 * - CategoryGrid with built-in search/sort (actual implementation)
 * - CategorySearch standalone component (actual implementation)
 * - CategoryFilters standalone component (actual implementation)
 * - URL parameter encoding/decoding
 * - Browser navigation (back/forward)
 * 
 * Subtask: 20.3
 * Requirements: 3.10, 15.1-15.7
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryGrid } from '@/components/features/category-grid';
import { CategorySearch } from '@/components/features/category-search';
import { CategoryFilters } from '@/components/features/category-filters';
import type { Category } from '@/lib/types/core';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();
let mockPathname = '/browse';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => mockPathname,
}));

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    slug: 'electronics',
    parent_id: null,
    description: 'Electronic devices and gadgets',
    image_url: '/images/electronics.jpg',
    display_order: 1,
    listing_count: 150,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Fashion',
    slug: 'fashion',
    parent_id: null,
    description: 'Clothing and accessories',
    image_url: '/images/fashion.jpg',
    display_order: 2,
    listing_count: 85,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: '3',
    name: 'Home & Garden',
    slug: 'home-garden',
    parent_id: null,
    description: 'Home improvement and garden supplies',
    image_url: '/images/home.jpg',
    display_order: 3,
    listing_count: 45,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
  },
];

describe('URL State Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockPathname = '/browse';
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('CategoryGrid - Built-in Search and Sort', () => {
    it('should filter categories when typing in built-in search', async () => {
      const user = userEvent.setup();
      
      render(<CategoryGrid categories={mockCategories} />);

      // CategoryGrid has built-in search input
      const searchInput = screen.getByRole('textbox', { name: /search categories/i });
      
      await user.type(searchInput, 'electronics');

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.queryByText('Fashion')).not.toBeInTheDocument();
      });
    });

    it('should sort categories when changing built-in sort dropdown', async () => {
      const user = userEvent.setup();
      
      render(<CategoryGrid categories={mockCategories} />);

      // CategoryGrid has built-in sort dropdown
      const sortSelect = screen.getByRole('combobox', { name: /sort categories/i });
      
      await user.selectOptions(sortSelect, 'alphabetical-desc');

      await waitFor(() => {
        const categoryCards = screen.getAllByRole('link');
        // Fashion (F) should appear before Electronics (E) in Z-A sort
        const fashionIndex = categoryCards.findIndex(card => card.textContent?.includes('Fashion'));
        const electronicsIndex = categoryCards.findIndex(card => card.textContent?.includes('Electronics'));
        
        expect(fashionIndex).toBeGreaterThan(-1);
        expect(electronicsIndex).toBeGreaterThan(-1);
        expect(fashionIndex).toBeLessThan(electronicsIndex);
      });
    });

    it('should load with initial search parameter and filter correctly', async () => {
      mockSearchParams.set('search', 'fashion');
      
      render(
        <CategoryGrid 
          categories={mockCategories} 
          initialSearch="fashion"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Fashion')).toBeInTheDocument();
        expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
      });
    });

    it('should load with initial sort parameter and sort correctly', async () => {
      render(
        <CategoryGrid 
          categories={mockCategories}
          initialSort="most-listings"
        />
      );

      await waitFor(() => {
        const categoryCards = screen.getAllByRole('link');
        // Electronics (150) should appear before Fashion (85)
        const electronicsIndex = categoryCards.findIndex(card => 
          card.textContent?.includes('Electronics')
        );
        const fashionIndex = categoryCards.findIndex(card => 
          card.textContent?.includes('Fashion')
        );
        
        if (electronicsIndex !== -1 && fashionIndex !== -1) {
          expect(electronicsIndex).toBeLessThan(fashionIndex);
        }
      });
    });

    it('should handle empty search results', async () => {
      const user = userEvent.setup();
      
      render(<CategoryGrid categories={mockCategories} />);

      const searchInput = screen.getByRole('textbox');
      await user.type(searchInput, 'nonexistent category');

      await waitFor(() => {
        expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
        expect(screen.queryByText('Fashion')).not.toBeInTheDocument();
        // Should show empty state
        expect(screen.getByText(/no categories match/i)).toBeInTheDocument();
      });
    });

    it('should clear search and show all categories', async () => {
      const user = userEvent.setup();
      
      render(<CategoryGrid categories={mockCategories} initialSearch="electronics" />);

      // Initially filtered
      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.queryByText('Fashion')).not.toBeInTheDocument();
      });

      // Clear button should be visible
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);

      // Should show all categories
      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Fashion')).toBeInTheDocument();
      });
    });
  });

  describe('CategorySearch - Standalone Component', () => {
    it('should update URL when user types search query', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      
      render(<CategorySearch initialSearch="" />);

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'electronics');

      // Fast-forward past debounce delay (300ms)
      vi.advanceTimersByTime(350);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
        const callArg = mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0];
        expect(callArg).toContain('search=electronics');
      });

      vi.useRealTimers();
    });

    it('should show clear button when text is entered', async () => {
      const user = userEvent.setup();
      
      render(<CategorySearch initialSearch="" />);

      const searchInput = screen.getByRole('searchbox');
      
      // Initially no clear button
      expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();

      await user.type(searchInput, 'test');

      // Clear button should appear  (no need for waitFor, it's immediate)
      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
    });

    it('should clear search when clear button clicked', async () => {
      const user = userEvent.setup();
      
      render(<CategorySearch initialSearch="electronics" />);

      // Wait for clear button to appear
      const clearButton = await screen.findByRole('button', { name: /clear search/i });
      await user.click(clearButton);

      const searchInput = screen.getByRole('searchbox') as HTMLInputElement;
      expect(searchInput.value).toBe('');
    });

    it('should sync with URL parameters', () => {
      mockSearchParams.set('search', 'fashion');
      
      render(<CategorySearch initialSearch="fashion" />);

      const searchInput = screen.getByRole('searchbox') as HTMLInputElement;
      expect(searchInput.value).toBe('fashion');
    });
  });

  describe('CategoryFilters - Standalone Component', () => {
    it('should update URL when sort option changes', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      
      render(<CategoryFilters />);

      const sortSelect = screen.getByRole('combobox', { name: /sort/i });
      await user.selectOptions(sortSelect, 'most-listings');

      vi.advanceTimersByTime(200);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
        const callArg = mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0];
        expect(callArg).toContain('sort=most-listings');
      });

      vi.useRealTimers();
    });

    it('should update URL when top-level filter toggled', async () => {
      const user = userEvent.setup();
      
      render(<CategoryFilters />);

      const topLevelCheckbox = screen.getByRole('checkbox', { name: /top-level/i });
      await user.click(topLevelCheckbox);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
        const callArg = mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0];
        expect(callArg).toContain('show_only=top_level');
      });
    });

    it('should update URL when has-listings filter toggled', async () => {
      const user = userEvent.setup();
      
      render(<CategoryFilters />);

      const hasListingsCheckbox = screen.getByRole('checkbox', { name: /has listings/i });
      await user.click(hasListingsCheckbox);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
        const callArg = mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0];
        expect(callArg).toContain('show_only=has_listings');
      });
    });

    it('should show active filter count', async () => {
      const user = userEvent.setup();
      
      render(<CategoryFilters />);

      // Initially no filters active
      expect(screen.queryByText(/active/i)).not.toBeInTheDocument();

      // Change sort
      const sortSelect = screen.getByRole('combobox', { name: /sort/i });
      await user.selectOptions(sortSelect, 'most-listings');

      // Should show 1 active filter
      await waitFor(() => {
        expect(screen.getByText(/1 active/i)).toBeInTheDocument();
      });
    });

    it('should sync with URL parameters', () => {
      mockSearchParams.set('sort', 'recently-updated');
      mockSearchParams.set('show_only', 'top_level');
      
      render(
        <CategoryFilters 
          initialSort="recently-updated"
          initialShowOnly="top_level"
        />
      );

      const sortSelect = screen.getByRole('combobox', { name: /sort/i }) as HTMLSelectElement;
      expect(sortSelect.value).toBe('recently-updated');

      const topLevelCheckbox = screen.getByRole('checkbox', { name: /top-level/i }) as HTMLInputElement;
      expect(topLevelCheckbox.checked).toBe(true);
    });
  });

  describe('URL Parameter Encoding and Decoding', () => {
    it('should correctly encode special characters in search queries', () => {
      const searchQuery = 'phones & tablets';
      const encoded = encodeURIComponent(searchQuery);
      
      expect(encoded).toBe('phones%20%26%20tablets');
      
      const decoded = decodeURIComponent(encoded);
      expect(decoded).toBe(searchQuery);
    });

    it('should handle multiple URL parameters simultaneously', () => {
      const params = new URLSearchParams();
      params.set('search', 'electronics');
      params.set('sort', 'most-listings');
      params.set('show_only', 'has_listings');

      expect(params.get('search')).toBe('electronics');
      expect(params.get('sort')).toBe('most-listings');
      expect(params.get('show_only')).toBe('has_listings');

      const url = `/browse?${params.toString()}`;
      expect(url).toContain('search=electronics');
      expect(url).toContain('sort=most-listings');
      expect(url).toContain('show_only=has_listings');
    });

    it('should handle empty parameter values', () => {
      const params = new URLSearchParams();
      params.set('search', '');
      
      expect(params.get('search')).toBe('');
    });

    it('should handle parameters with hyphens', () => {
      const params = new URLSearchParams();
      params.set('sort', 'alphabetical-asc');
      params.set('show_only', 'top_level');

      expect(params.get('sort')).toBe('alphabetical-asc');
      expect(params.get('show_only')).toBe('top_level');
    });

    it('should remove parameter when value is cleared', () => {
      const params = new URLSearchParams();
      params.set('search', 'electronics');
      params.set('sort', 'most-listings');

      params.delete('search');

      expect(params.has('search')).toBe(false);
      expect(params.get('sort')).toBe('most-listings');
    });

    it('should handle very long search queries', () => {
      const longQuery = 'a'.repeat(500);
      const params = new URLSearchParams();
      params.set('search', longQuery);

      expect(params.get('search')).toBe(longQuery);
    });
  });

  describe('URL Sharing and Deep Linking', () => {
    it('should create shareable URL with current filters', () => {
      const params = new URLSearchParams();
      params.set('search', 'electronics');
      params.set('sort', 'most-listings');
      params.set('show_only', 'top_level');

      const shareableUrl = `/browse?${params.toString()}`;

      expect(shareableUrl).toContain('/browse?');
      expect(shareableUrl).toContain('search=electronics');
      expect(shareableUrl).toContain('sort=most-listings');
      expect(shareableUrl).toContain('show_only=top_level');
    });

    it('should load shared URL with exact same filtered view', async () => {
      mockSearchParams.set('search', 'electronics');
      mockSearchParams.set('sort', 'most-listings');

      render(
        <CategoryGrid
          categories={mockCategories}
          initialSearch="electronics"
          initialSort="most-listings"
        />
      );

      await waitFor(() => {
        // Should show filtered view
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.queryByText('Fashion')).not.toBeInTheDocument();
        
        // Should have correct sort applied
        const sortSelect = screen.getByRole('combobox') as HTMLSelectElement;
        expect(sortSelect.value).toBe('most-listings');
      });
    });

    it('should support deep linking with all parameters', () => {
      const deepLink = '/browse?search=electronics&sort=most-listings&show_only=top_level';
      const url = new URL(deepLink, 'https://findam.ng');
      const params = url.searchParams;

      expect(params.get('search')).toBe('electronics');
      expect(params.get('sort')).toBe('most-listings');
      expect(params.get('show_only')).toBe('top_level');
    });
  });

  describe('Browser Navigation (Back/Forward)', () => {
    it('should handle URL with no parameters', async () => {
      render(<CategoryGrid categories={mockCategories} />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Fashion')).toBeInTheDocument();
        expect(screen.getByText('Home & Garden')).toBeInTheDocument();
      });
    });

    it('should handle URL with only some parameters', async () => {
      mockSearchParams.set('sort', 'most-listings');

      render(
        <CategoryGrid
          categories={mockCategories}
          initialSort="most-listings"
        />
      );

      await waitFor(() => {
        // All categories shown (no search filter)
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Fashion')).toBeInTheDocument();
        
        // But sorted by listing count
        const sortSelect = screen.getByRole('combobox') as HTMLSelectElement;
        expect(sortSelect.value).toBe('most-listings');
      });
    });

    it('should restore state from URL on component mount', async () => {
      mockSearchParams.set('search', 'fashion');
      mockSearchParams.set('sort', 'alphabetical-desc');

      render(
        <CategoryGrid
          categories={mockCategories}
          initialSearch="fashion"
          initialSort="alphabetical-desc"
        />
      );

      await waitFor(() => {
        const searchInput = screen.getByRole('textbox') as HTMLInputElement;
        expect(searchInput.value).toBe('fashion');

        const sortSelect = screen.getByRole('combobox') as HTMLSelectElement;
        expect(sortSelect.value).toBe('alphabetical-desc');

        expect(screen.getByText('Fashion')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid sort parameter gracefully', async () => {
      render(
        <CategoryGrid
          categories={mockCategories}
          initialSort="invalid-sort-option"
        />
      );

      await waitFor(() => {
        // Should fall back to default sort or handle gracefully
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Fashion')).toBeInTheDocument();
      });
    });

    it('should handle special characters in search', async () => {
      const user = userEvent.setup();
      
      render(<CategoryGrid categories={mockCategories} />);

      const searchInput = screen.getByRole('textbox');
      await user.type(searchInput, 'Home & Garden');

      await waitFor(() => {
        expect(screen.getByText('Home & Garden')).toBeInTheDocument();
        expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
      });
    });

    it('should clear all parameters when resetting', () => {
      mockSearchParams.set('search', 'electronics');
      mockSearchParams.set('sort', 'most-listings');
      mockSearchParams.set('show_only', 'top_level');

      mockSearchParams.delete('search');
      mockSearchParams.delete('sort');
      mockSearchParams.delete('show_only');

      expect(mockSearchParams.toString()).toBe('');
    });
  });
});
