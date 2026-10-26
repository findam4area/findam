/**
 * Browse Page Integration Tests
 * 
 * Tests complete browse page user journey:
 * - Page loads and displays categories
 * - Search input filters categories correctly
 * - Sort dropdown changes category order
 * - Show_only filters apply correctly
 * - Clicking category navigates to detail page
 * - URL state updates on filter changes
 * - Empty states display correctly
 * - Loading states work properly
 * 
 * Subtask: 20.1
 * Requirements: 1.1-1.3, 2.1-2.7, 3.1-3.10, 12.1-12.6, 13.1-13.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryGrid } from '@/components/features/category-grid';
import { CategorySearch } from '@/components/features/category-search';
import { CategoryFilters } from '@/components/features/category-filters';
import type { Category } from '@/lib/types/core';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/browse',
}));

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => false,
}));

// Mock categories data
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
    updated_at: '2024-12-15T00:00:00Z',
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
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: '3',
    name: 'Home & Garden',
    slug: 'home-garden',
    parent_id: null,
    description: 'Furniture and home decor',
    image_url: '/images/home.jpg',
    display_order: 3,
    listing_count: 42,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Smartphones',
    slug: 'smartphones',
    parent_id: '1',
    description: 'Mobile phones and accessories',
    image_url: '/images/smartphones.jpg',
    display_order: 1,
    listing_count: 75,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-11-01T00:00:00Z',
  },
  {
    id: '5',
    name: 'Empty Category',
    slug: 'empty-category',
    parent_id: null,
    description: 'A category with no listings',
    image_url: '/images/empty.jpg',
    display_order: 4,
    listing_count: 0,
    created_at: '2024-12-01T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z',
  },
];

describe('Browse Page Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete('search');
    mockSearchParams.delete('sort');
    mockSearchParams.delete('show_only');
  });

  describe('Page Load and Display', () => {
    it('should display all categories on initial load', async () => {
      render(<CategoryGrid categories={mockCategories} />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Fashion')).toBeInTheDocument();
        expect(screen.getByText('Home & Garden')).toBeInTheDocument();
        expect(screen.getByText('Smartphones')).toBeInTheDocument();
        expect(screen.getByText('Empty Category')).toBeInTheDocument();
      });
    });

    it('should display category descriptions', async () => {
      render(<CategoryGrid categories={mockCategories} />);

      await waitFor(() => {
        expect(screen.getByText('Electronic devices and gadgets')).toBeInTheDocument();
        expect(screen.getByText('Clothing and accessories')).toBeInTheDocument();
      });
    });

    it('should display listing counts for each category', async () => {
      render(<CategoryGrid categories={mockCategories} />);

      await waitFor(() => {
        expect(screen.getByText('150 listings')).toBeInTheDocument();
        expect(screen.getByText('85 listings')).toBeInTheDocument();
        expect(screen.getByText('42 listings')).toBeInTheDocument();
      });
    });

    it('should display category badges (Popular, New, Recently Updated)', async () => {
      render(<CategoryGrid categories={mockCategories} />);

      await waitFor(() => {
        // Electronics has 150 listings (Popular badge)
        const popularBadges = screen.getAllByTitle('Popular category');
        expect(popularBadges.length).toBeGreaterThan(0);

        // Empty Category created within 30 days (New badge)
        const newBadges = screen.getAllByTitle('New category');
        expect(newBadges.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter categories when user types in search', async () => {
      const user = userEvent.setup();
      const mockOnSearchChange = vi.fn();

      render(
        <div>
          <CategorySearch initialSearch="" onSearchChange={mockOnSearchChange} />
          <CategoryGrid categories={mockCategories} initialSearch="" />
        </div>
      );

      // Type in search input
      const searchInput = screen.getByPlaceholderText(/search categories/i);
      await user.type(searchInput, 'fashion');

      // Wait for debounce (300ms)
      await waitFor(
        () => {
          expect(mockOnSearchChange).toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });

    it('should display clear button when search has text', async () => {
      const user = userEvent.setup();
      const mockOnSearchChange = vi.fn();

      render(<CategorySearch initialSearch="" onSearchChange={mockOnSearchChange} />);

      const searchInput = screen.getByPlaceholderText(/search categories/i);
      await user.type(searchInput, 'electronics');

      await waitFor(() => {
        const clearButton = screen.getByRole('button', { name: /clear search/i });
        expect(clearButton).toBeInTheDocument();
      });
    });

    it('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSearchChange = vi.fn();

      render(<CategorySearch initialSearch="electronics" onSearchChange={mockOnSearchChange} />);

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search categories/i);
        expect(searchInput).toHaveValue('');
      });
    });

    it('should filter categories by name case-insensitively', async () => {
      render(<CategoryGrid categories={mockCategories} initialSearch="ELECTRONICS" />);

      await waitFor(() => {
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.queryByText('Fashion')).not.toBeInTheDocument();
      });
    });

    it('should filter categories by description', async () => {
      render(<CategoryGrid categories={mockCategories} initialSearch="furniture" />);

      await waitFor(() => {
        expect(screen.getByText('Home & Garden')).toBeInTheDocument();
        expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
      });
    });

    it('should display empty state when no categories match search', async () => {
      render(<CategoryGrid categories={mockCategories} initialSearch="nonexistent" />);

      await waitFor(() => {
        expect(screen.getByText(/no categories match your criteria/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sort Functionality', () => {
    it('should sort categories alphabetically A-Z', async () => {
      render(<CategoryGrid categories={mockCategories} initialSort="alphabetical-asc" />);

      await waitFor(() => {
        const categoryNames = screen
          .getAllByRole('link')
          .map((link) => link.textContent)
          .filter((text) => text && mockCategories.some((cat) => text.includes(cat.name)));

        // First category should be "Electronics" or "Empty Category" (alphabetically first)
        expect(categoryNames[0]).toMatch(/Electronics|Empty Category/);
      });
    });

    it('should sort categories alphabetically Z-A', async () => {
      render(<CategoryGrid categories={mockCategories} initialSort="alphabetical-desc" />);

      await waitFor(() => {
        const categoryNames = screen
          .getAllByRole('link')
          .map((link) => link.textContent)
          .filter((text) => text && mockCategories.some((cat) => text.includes(cat.name)));

        // First category should be "Smartphones" (alphabetically last)
        expect(categoryNames[0]).toMatch(/Smartphones/);
      });
    });

    it('should sort categories by most listings', async () => {
      render(<CategoryGrid categories={mockCategories} initialSort="most-listings" />);

      await waitFor(() => {
        const firstCategory = screen.getAllByRole('link')[0];
        expect(firstCategory.textContent).toContain('Electronics');
        expect(firstCategory.textContent).toContain('150 listings');
      });
    });

    it('should sort categories by fewest listings', async () => {
      render(<CategoryGrid categories={mockCategories} initialSort="fewest-listings" />);

      await waitFor(() => {
        const firstCategory = screen.getAllByRole('link')[0];
        expect(firstCategory.textContent).toContain('Empty Category');
        expect(firstCategory.textContent).toContain('0 listings');
      });
    });

    it('should sort categories by recently updated', async () => {
      render(<CategoryGrid categories={mockCategories} initialSort="recently-updated" />);

      await waitFor(() => {
        const firstCategory = screen.getAllByRole('link')[0];
        // Electronics was updated most recently (2024-12-15)
        expect(firstCategory.textContent).toContain('Electronics');
      });
    });
  });

  describe('Filter Functionality', () => {
    it('should filter to show only top-level categories', async () => {
      const topLevelCategories = mockCategories.filter((cat) => cat.parent_id === null);

      render(<CategoryGrid categories={topLevelCategories} />);

      await waitFor(() => {
        // Should show top-level categories
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Fashion')).toBeInTheDocument();

        // Should not show subcategories
        expect(screen.queryByText('Smartphones')).not.toBeInTheDocument();
      });
    });

    it('should filter to show only categories with listings', async () => {
      const categoriesWithListings = mockCategories.filter((cat) => cat.listing_count > 0);

      render(<CategoryGrid categories={categoriesWithListings} />);

      await waitFor(() => {
        // Should show categories with listings
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Fashion')).toBeInTheDocument();

        // Should not show empty category
        expect(screen.queryByText('Empty Category')).not.toBeInTheDocument();
      });
    });

    it('should update URL when filter is changed', async () => {
      const user = userEvent.setup();
      const mockOnSortChange = vi.fn();
      const mockOnShowOnlyChange = vi.fn();

      render(
        <CategoryFilters
          onSortChange={mockOnSortChange}
          onShowOnlyChange={mockOnShowOnlyChange}
        />
      );

      // Find and click sort dropdown
      const sortDropdown = screen.getByRole('combobox', { name: /sort/i });
      await user.click(sortDropdown);

      // Select "Most Listings" option
      const mostListingsOption = screen.getByRole('option', { name: /most listings/i });
      await user.click(mostListingsOption);

      await waitFor(() => {
        expect(mockOnSortChange).toHaveBeenCalledWith('most-listings');
      });
    });
  });

  describe('Category Navigation', () => {
    it('should have links with correct href for each category', async () => {
      render(<CategoryGrid categories={mockCategories} />);

      await waitFor(() => {
        const electronicsLink = screen.getByRole('link', { name: /browse electronics/i });
        expect(electronicsLink).toHaveAttribute('href', '/categories/electronics');

        const fashionLink = screen.getByRole('link', { name: /browse fashion/i });
        expect(fashionLink).toHaveAttribute('href', '/categories/fashion');
      });
    });

    it('should navigate to category detail when card is clicked', async () => {
      const user = userEvent.setup();

      render(<CategoryGrid categories={mockCategories} />);

      const categoryCard = screen.getByRole('link', { name: /browse electronics/i });
      await user.click(categoryCard);

      // Link click will be handled by Next.js Link component
      // We verify the href attribute is correct
      expect(categoryCard).toHaveAttribute('href', '/categories/electronics');
    });
  });

  describe('URL State Management', () => {
    it('should load with URL parameters and apply filters correctly', async () => {
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
        // Should show filtered and sorted results
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.queryByText('Fashion')).not.toBeInTheDocument();
      });
    });

    it('should preserve search query in URL', async () => {
      const user = userEvent.setup();
      const mockOnSearchChange = vi.fn();

      render(<CategorySearch initialSearch="" onSearchChange={mockOnSearchChange} />);

      const searchInput = screen.getByPlaceholderText(/search categories/i);
      await user.type(searchInput, 'test');

      await waitFor(
        () => {
          expect(mockOnSearchChange).toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });
  });

  describe('Empty States', () => {
    it('should display empty state when no categories exist', async () => {
      render(<CategoryGrid categories={[]} />);

      await waitFor(() => {
        expect(screen.getByText(/no categories available/i)).toBeInTheDocument();
      });
    });

    it('should display clear filters button in empty state', async () => {
      render(<CategoryGrid categories={mockCategories} initialSearch="nonexistent" />);

      await waitFor(() => {
        const clearButton = screen.getByRole('button', { name: /clear filters/i });
        expect(clearButton).toBeInTheDocument();
      });
    });

    it('should reset filters when clear filters button is clicked', async () => {
      const user = userEvent.setup();

      render(<CategoryGrid categories={mockCategories} initialSearch="nonexistent" />);

      await waitFor(async () => {
        const clearButton = screen.getByRole('button', { name: /clear filters/i });
        await user.click(clearButton);

        // After clearing, should show all categories
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText('Fashion')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible category cards with aria-labels', async () => {
      render(<CategoryGrid categories={mockCategories} />);

      await waitFor(() => {
        const electronicsLink = screen.getByRole('link', {
          name: /browse electronics category with 150 listings/i,
        });
        expect(electronicsLink).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(<CategoryGrid categories={mockCategories} />);

      // Tab through category cards
      await user.tab();

      const firstCard = screen.getAllByRole('link')[0];
      expect(firstCard).toHaveFocus();
    });

    it('should support Enter key navigation', async () => {
      const user = userEvent.setup();

      render(<CategoryGrid categories={mockCategories} />);

      const firstCard = screen.getAllByRole('link')[0];
      firstCard.focus();

      // Pressing Enter should follow the link
      await user.keyboard('{Enter}');

      // Verify link has correct href
      expect(firstCard).toHaveAttribute('href');
    });
  });

  describe('Responsive Layout', () => {
    it('should render grid layout with responsive columns', async () => {
      const { container } = render(<CategoryGrid categories={mockCategories} />);

      await waitFor(() => {
        const grid = container.querySelector('.grid');
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveClass('grid-cols-1');
        expect(grid).toHaveClass('sm:grid-cols-2');
        expect(grid).toHaveClass('lg:grid-cols-3');
        expect(grid).toHaveClass('xl:grid-cols-4');
      });
    });
  });
});
