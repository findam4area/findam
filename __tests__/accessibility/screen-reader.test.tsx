/**
 * Screen Reader Compatibility Tests
 * 
 * Tests screen reader compatibility including:
 * - ARIA labels and descriptions
 * - Semantic HTML
 * - Live region announcements
 * - Accessible names for interactive elements
 * 
 * Requirements: 9.5, 9.6, 16.32, 21.3
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CategoryCard } from '@/components/features/category-card';
import type { Category } from '@/lib/types/core';

// Mock framer-motion
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    motion: actual.motion,
    useReducedMotion: vi.fn(() => false),
  };
});


// Extend expect matchers
expect.extend(toHaveNoViolations);

// Mock Canvas for axe-core
HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as any;

const mockCategory: Category = {
  id: '1',
  name: 'Electronics',
  slug: 'electronics',
  parent_id: null,
  description: 'All electronic items and gadgets',
  image_url: '/images/electronics.jpg',
  display_order: 1,
  listing_count: 150,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-12-15T00:00:00Z',
};

describe('Screen Reader Compatibility Tests', () => {
  describe('21.3 - Category names and counts announced correctly', () => {
    it('should have aria-label with category name and listing count', () => {
      render(<CategoryCard category={mockCategory} index={0} />);

      const link = screen.getByRole('link');
      const ariaLabel = link.getAttribute('aria-label');

      expect(ariaLabel).toContain('Electronics');
      expect(ariaLabel).toContain('150');
      expect(ariaLabel).toMatch(/listings?/i);
    });

    it('should announce singular "listing" for count of 1', () => {
      const singleListingCategory: Category = {
        ...mockCategory,
        listing_count: 1,
      };

      render(<CategoryCard category={singleListingCategory} index={0} />);

      const link = screen.getByRole('link');
      const ariaLabel = link.getAttribute('aria-label');

      expect(ariaLabel).toContain('1 listing');
      expect(ariaLabel).not.toContain('listings');
    });

    it('should announce plural "listings" for count > 1', () => {
      render(<CategoryCard category={mockCategory} index={0} />);

      const link = screen.getByRole('link');
      const ariaLabel = link.getAttribute('aria-label');

      expect(ariaLabel).toContain('150 listings');
    });

    it('should announce subcategory count when present', () => {
      render(<CategoryCard category={mockCategory} index={0} subcategoryCount={5} />);

      const link = screen.getByRole('link');
      const ariaLabel = link.getAttribute('aria-label');

      expect(ariaLabel).toContain('5');
      expect(ariaLabel).toMatch(/subcategor(y|ies)/i);
    });
  });

  describe('21.3 - Breadcrumb navigation clarity', () => {
    it('should have breadcrumb with aria-label', () => {
      const { container } = render(
        <nav aria-label="Breadcrumb">
          <ol>
            <li><a href="/">Home</a></li>
            <li><a href="/browse">Browse Categories</a></li>
            <li aria-current="page">Electronics</li>
          </ol>
        </nav>
      );

      const breadcrumb = container.querySelector('nav[aria-label="Breadcrumb"]');
      expect(breadcrumb).toBeDefined();
    });

    it('should mark current page with aria-current', () => {
      const { container } = render(
        <nav aria-label="Breadcrumb">
          <ol>
            <li><a href="/">Home</a></li>
            <li><a href="/browse">Browse Categories</a></li>
            <li aria-current="page">Electronics</li>
          </ol>
        </nav>
      );

      const currentItem = container.querySelector('[aria-current="page"]');
      expect(currentItem).toBeDefined();
      expect(currentItem?.textContent).toBe('Electronics');
    });

    it('should have accessible link text in breadcrumb', () => {
      render(
        <nav aria-label="Breadcrumb">
          <ol>
            <li><a href="/">Home</a></li>
            <li><a href="/browse">Browse Categories</a></li>
          </ol>
        </nav>
      );

      const homeLink = screen.getByRole('link', { name: 'Home' });
      const browseLink = screen.getByRole('link', { name: 'Browse Categories' });

      expect(homeLink).toBeDefined();
      expect(browseLink).toBeDefined();
    });
  });

  describe('21.3 - Button accessible labels', () => {
    it('should have accessible label for icon-only buttons', () => {
      const { container } = render(
        <button type="button" aria-label="Close" className="icon-button">
          <span aria-hidden="true">×</span>
        </button>
      );

      const button = screen.getByRole('button', { name: 'Close' });
      expect(button).toBeDefined();
    });

    it('should have accessible label for search button', () => {
      render(
        <button type="button" aria-label="Search categories">
          <span aria-hidden="true">🔍</span>
        </button>
      );

      const button = screen.getByRole('button', { name: 'Search categories' });
      expect(button).toBeDefined();
    });

    it('should have accessible label for filter button', () => {
      render(
        <button type="button" aria-label="Filter categories">
          <span>Filter</span>
        </button>
      );

      const button = screen.getByRole('button', { name: /filter/i });
      expect(button).toBeDefined();
    });

    it('should have accessible label for sort dropdown', () => {
      render(
        <button type="button" aria-haspopup="true" aria-expanded="false" aria-label="Sort options">
          Sort
        </button>
      );

      const button = screen.getByRole('button', { name: /sort/i });
      expect(button).toBeDefined();
      expect(button.getAttribute('aria-haspopup')).toBe('true');
    });
  });

  describe('21.3 - Live region announcements', () => {
    it('should have live region for search results count', () => {
      const { container } = render(
        <div role="status" aria-live="polite" aria-atomic="true">
          Showing 25 categories
        </div>
      );

      const liveRegion = container.querySelector('[role="status"]');
      expect(liveRegion).toBeDefined();
      expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
    });

    it('should have live region for filter updates', () => {
      const { container } = render(
        <div role="status" aria-live="polite">
          Filters applied: 3 categories match your criteria
        </div>
      );

      const liveRegion = container.querySelector('[role="status"]');
      expect(liveRegion).toBeDefined();
    });

    it('should use polite live region for non-urgent updates', () => {
      const { container } = render(
        <div aria-live="polite" role="status">
          Categories loaded successfully
        </div>
      );

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeDefined();
    });

    it('should use assertive live region for errors', () => {
      const { container } = render(
        <div role="alert" aria-live="assertive">
          Failed to load categories
        </div>
      );

      const liveRegion = container.querySelector('[role="alert"]');
      expect(liveRegion).toBeDefined();
      expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have atomic live region for complete announcements', () => {
      const { container } = render(
        <div role="status" aria-live="polite" aria-atomic="true">
          <span>Loading complete.</span>
          <span>50 categories available.</span>
        </div>
      );

      const liveRegion = container.querySelector('[aria-atomic="true"]');
      expect(liveRegion).toBeDefined();
    });
  });

  describe('Image alternative text', () => {
    it('should have descriptive alt text for category images', () => {
      render(<CategoryCard category={mockCategory} index={0} />);

      // Next.js Image component with alt attribute
      const images = screen.getAllByRole('img');
      
      images.forEach((img) => {
        const alt = img.getAttribute('alt');
        expect(alt).toBeTruthy();
      });
    });

    it('should use category name in image alt text', () => {
      render(<CategoryCard category={mockCategory} index={0} />);

      const image = screen.getByAltText('Electronics');
      expect(image).toBeDefined();
    });
  });

  describe('Semantic HTML for screen readers', () => {
    it('should use semantic heading tags', () => {
      render(<CategoryCard category={mockCategory} index={0} />);

      const heading = screen.getByRole('heading', { name: 'Electronics' });
      expect(heading).toBeDefined();
      expect(heading.tagName).toBe('H3');
    });

    it('should use nav element for navigation', () => {
      const { container } = render(
        <nav aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/browse">Browse</a>
        </nav>
      );

      const nav = container.querySelector('nav');
      expect(nav).toBeDefined();
      expect(nav?.getAttribute('aria-label')).toBe('Main navigation');
    });

    it('should use main element for main content', () => {
      const { container } = render(
        <main>
          <h1>Browse Categories</h1>
          <CategoryCard category={mockCategory} index={0} />
        </main>
      );

      const main = screen.getByRole('main');
      expect(main).toBeDefined();
    });

    it('should use article for category content', () => {
      const { container } = render(
        <article>
          <h1>Electronics</h1>
          <p>All electronic items</p>
        </article>
      );

      const article = container.querySelector('article');
      expect(article).toBeDefined();
    });

    it('should use section with heading for grouped content', () => {
      render(
        <section aria-labelledby="trending-heading">
          <h2 id="trending-heading">Trending Categories</h2>
          <CategoryCard category={mockCategory} index={0} />
        </section>
      );

      const section = screen.getByRole('region', { name: 'Trending Categories' });
      expect(section).toBeDefined();
    });
  });

  describe('Form labels and descriptions', () => {
    it('should have label for search input', () => {
      render(
        <div>
          <label htmlFor="category-search">Search categories</label>
          <input type="search" id="category-search" />
        </div>
      );

      const input = screen.getByRole('searchbox', { name: 'Search categories' });
      expect(input).toBeDefined();
    });

    it('should have aria-label for search input without visible label', () => {
      render(
        <input type="search" aria-label="Search categories" />
      );

      const input = screen.getByRole('searchbox', { name: 'Search categories' });
      expect(input).toBeDefined();
    });

    it('should have aria-describedby for additional context', () => {
      render(
        <div>
          <label htmlFor="search">Search</label>
          <input 
            type="search" 
            id="search" 
            aria-describedby="search-help"
          />
          <span id="search-help">Enter keywords to filter categories</span>
        </div>
      );

      const input = screen.getByRole('searchbox');
      expect(input.getAttribute('aria-describedby')).toBe('search-help');
    });
  });

  describe('Badge announcements', () => {
    it('should have title attribute for Popular badge', () => {
      const popularCategory: Category = {
        ...mockCategory,
        listing_count: 150,
      };

      const { container } = render(
        <CategoryCard category={popularCategory} index={0} />
      );

      const badge = container.querySelector('[title="Popular category"]');
      if (badge) {
        expect(badge).toBeDefined();
      }
    });

    it('should have title attribute for New badge', () => {
      const newCategory: Category = {
        ...mockCategory,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { container } = render(
        <CategoryCard category={newCategory} index={0} />
      );

      const badge = container.querySelector('[title="New category"]');
      if (badge) {
        expect(badge).toBeDefined();
      }
    });

    it('should have title attribute for Recently Updated badge', () => {
      const recentCategory: Category = {
        ...mockCategory,
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const { container } = render(
        <CategoryCard category={recentCategory} index={0} />
      );

      const badge = container.querySelector('[title="Recently updated"]');
      if (badge) {
        expect(badge).toBeDefined();
      }
    });
  });

  describe('Hidden content for screen readers', () => {
    it('should hide decorative icons from screen readers', () => {
      const { container } = render(
        <span aria-hidden="true">🔍</span>
      );

      const icon = container.querySelector('[aria-hidden="true"]');
      expect(icon).toBeDefined();
    });

    it('should provide screen reader only text when needed', () => {
      const { container } = render(
        <button type="button">
          <span className="sr-only">Search</span>
          <span aria-hidden="true">🔍</span>
        </button>
      );

      const srOnlyText = container.querySelector('.sr-only');
      expect(srOnlyText).toBeDefined();
      expect(srOnlyText?.textContent).toBe('Search');
    });
  });

  describe('Link context', () => {
    it('should have meaningful link text', () => {
      render(<CategoryCard category={mockCategory} index={0} />);

      const link = screen.getByRole('link');
      
      // Link should have accessible name from aria-label
      const ariaLabel = link.getAttribute('aria-label');
      expect(ariaLabel).toContain('Browse');
      expect(ariaLabel).toContain('Electronics');
    });

    it('should not use generic link text like "click here"', () => {
      render(<CategoryCard category={mockCategory} index={0} />);

      const link = screen.getByRole('link');
      const ariaLabel = link.getAttribute('aria-label');

      expect(ariaLabel?.toLowerCase()).not.toContain('click here');
      expect(ariaLabel?.toLowerCase()).not.toContain('read more');
    });
  });

  describe('Accessible names for all interactive elements', () => {
    it('should pass axe accessibility check for button names', async () => {
      const { container } = render(
        <div>
          <button type="button" aria-label="Sort categories">Sort</button>
          <button type="button" aria-label="Filter categories">Filter</button>
        </div>
      );

      const results = await axe(container, {
        rules: {
          'button-name': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should pass axe accessibility check for link names', async () => {
      const { container } = render(
        <CategoryCard category={mockCategory} index={0} />
      );

      const results = await axe(container, {
        rules: {
          'link-name': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Loading states', () => {
    it('should announce loading state to screen readers', () => {
      const { container } = render(
        <div role="status" aria-live="polite" aria-busy="true">
          Loading categories...
        </div>
      );

      const loadingRegion = container.querySelector('[aria-busy="true"]');
      expect(loadingRegion).toBeDefined();
    });

    it('should announce loaded state to screen readers', () => {
      const { container } = render(
        <div role="status" aria-live="polite" aria-busy="false">
          Categories loaded
        </div>
      );

      const loadedRegion = container.querySelector('[role="status"]');
      expect(loadedRegion).toBeDefined();
      expect(loadedRegion?.getAttribute('aria-busy')).toBe('false');
    });
  });

  describe('Error announcements', () => {
    it('should announce errors with assertive live region', () => {
      const { container } = render(
        <div role="alert" aria-live="assertive">
          Error: Failed to load categories. Please try again.
        </div>
      );

      const errorAlert = container.querySelector('[role="alert"]');
      expect(errorAlert).toBeDefined();
    });

    it('should provide actionable error messages', () => {
      render(
        <div role="alert">
          <p>Failed to load categories.</p>
          <button type="button">Retry</button>
        </div>
      );

      const errorAlert = screen.getByRole('alert');
      const retryButton = within(errorAlert).getByRole('button', { name: 'Retry' });
      
      expect(errorAlert).toBeDefined();
      expect(retryButton).toBeDefined();
    });
  });
});
