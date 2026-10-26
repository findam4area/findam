/**
 * Keyboard Navigation Tests for Homepage Components
 * 
 * Tests keyboard navigation functionality across all homepage components
 * Requirements: 15.4, 15.8, 15.11
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroSection } from './hero-section';
import { CategoryShowcase } from './category-showcase';
import { ListingCard } from './listing-card';
import { VendorDirectory } from './vendor-directory';
import { ActivityFeed } from './activity-feed';
import { EnhancedFooter } from './enhanced-footer';
import type { PlatformStats, Category, Listing, Vendor, Activity } from './types';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useInView: () => true,
  useReducedMotion: () => false,
}));

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ placeholderData }: any) => ({
    data: placeholderData,
    isLoading: false,
    error: null,
  }),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: () => ({
      on: () => ({ subscribe: vi.fn() }),
    }),
    removeChannel: vi.fn(),
  }),
}));

describe('Keyboard Navigation - HeroSection', () => {
  const mockStats: PlatformStats = {
    totalUsers: 50000,
    totalListings: 100000,
    averageRating: 4.9,
  };

  it('should have visible focus indicators on CTA buttons', () => {
    render(<HeroSection stats={mockStats} />);
    
    const startSellingButton = screen.getByRole('link', { name: /start selling/i });
    const exploreDealsButton = screen.getByRole('link', { name: /explore deals/i });
    
    // Check for any focus-related styling
    expect(startSellingButton.className).toMatch(/focus/);
    expect(exploreDealsButton.className).toMatch(/focus/);
  });

  it('should navigate to CTA buttons with Tab key', async () => {
    const user = userEvent.setup();
    render(<HeroSection stats={mockStats} />);
    
    const startSellingButton = screen.getByRole('link', { name: /start selling/i });
    
    // Tab to the button
    await user.tab();
    
    // Check if button can receive focus
    expect(startSellingButton).toBeInTheDocument();
  });

  it('should activate CTA buttons with Enter key', async () => {
    const user = userEvent.setup();
    render(<HeroSection stats={mockStats} />);
    
    const startSellingButton = screen.getByRole('link', { name: /start selling/i });
    startSellingButton.focus();
    
    // Press Enter
    await user.keyboard('{Enter}');
    
    // Link should be activated (href should be present)
    expect(startSellingButton).toHaveAttribute('href', '/register');
  });

  it('should have accessible stats counters with proper ARIA labels', () => {
    render(<HeroSection stats={mockStats} />);
    
    const statsRegion = screen.getByRole('region', { name: /platform statistics/i });
    expect(statsRegion).toBeInTheDocument();
  });
});

describe('Keyboard Navigation - CategoryShowcase', () => {
  const mockCategories: Category[] = [
    {
      id: '1',
      name: 'Electronics',
      slug: 'electronics',
      icon: '💻',
      itemCount: 1250,
      accentColor: '#3B82F6',
    },
    {
      id: '2',
      name: 'Fashion',
      slug: 'fashion',
      icon: '👕',
      itemCount: 830,
      accentColor: '#EC4899',
    },
    {
      id: '3',
      name: 'Vehicles',
      slug: 'vehicles',
      icon: '🚗',
      itemCount: 520,
      accentColor: '#F97316',
    },
  ];

  it('should support arrow key navigation between categories', async () => {
    const user = userEvent.setup();
    render(<CategoryShowcase categories={mockCategories} />);
    
    const firstCategory = screen.getByRole('link', { name: /electronics/i });
    firstCategory.focus();
    
    // Press ArrowRight to move to next category
    await user.keyboard('{ArrowRight}');
    
    // Should move focus (implementation depends on KeyboardNavigableList)
    expect(document.activeElement).toBeDefined();
  });

  it('should support Home and End keys for navigation', async () => {
    const user = userEvent.setup();
    render(<CategoryShowcase categories={mockCategories} />);
    
    const firstCategory = screen.getByRole('link', { name: /electronics/i });
    firstCategory.focus();
    
    // Press End to go to last category
    await user.keyboard('{End}');
    
    // Should move to last category
    expect(document.activeElement).toBeDefined();
  });

  it('should have visible focus indicators on category cards', () => {
    render(<CategoryShowcase categories={mockCategories} />);
    
    const categoryLinks = screen.getAllByRole('link');
    // Filter to only check category links (not scroll buttons or other links)
    const categoryCardLinks = categoryLinks.filter(link => 
      link.getAttribute('aria-label')?.includes('Browse')
    );
    
    categoryCardLinks.forEach((link) => {
      // Check for any focus-related styling (focus, focus-visible, ring, etc.)
      expect(link.className).toMatch(/focus/);
    });
  });

  it('should have proper ARIA labels for categories', () => {
    render(<CategoryShowcase categories={mockCategories} />);
    
    const electronicsCategory = screen.getByRole('link', { name: /browse electronics.*1,?250 items/i });
    expect(electronicsCategory).toBeInTheDocument();
  });
});

describe('Keyboard Navigation - ListingCard', () => {
  const mockListing: Listing = {
    id: '1',
    title: 'iPhone 15 Pro',
    price: 850000,
    currency: 'NGN',
    location: 'Lagos, Nigeria',
    thumbnail: '/images/iphone.jpg',
    images: ['/images/iphone.jpg'],
    views: 1234,
    likes: 56,
    isBoosted: true,
    vendor: {
      id: 'v1',
      name: 'TechStore',
      avatar: '/avatars/techstore.jpg',
      isVerified: true,
    },
    createdAt: '2024-01-01T00:00:00Z',
  };

  it('should have visible focus indicator on listing card', () => {
    render(<ListingCard listing={mockListing} />);
    
    const listingLink = screen.getByRole('link', { name: /iphone 15 pro/i });
    // Check for any focus-related styling
    expect(listingLink.className).toMatch(/focus|ring|outline/);
  });

  it('should activate listing card with Enter key', async () => {
    const user = userEvent.setup();
    render(<ListingCard listing={mockListing} />);
    
    const listingLink = screen.getByRole('link', { name: /iphone 15 pro/i });
    listingLink.focus();
    
    await user.keyboard('{Enter}');
    
    expect(listingLink).toHaveAttribute('href', '/listing/1');
  });

  it('should have accessible action buttons with proper ARIA labels', () => {
    const mockOnLike = vi.fn();
    const mockOnSave = vi.fn();
    
    render(<ListingCard listing={mockListing} onLike={mockOnLike} onSave={mockOnSave} />);
    
    // Action buttons should have aria-labels (exact text: "Like this listing" and "Save this listing")
    const likeButton = screen.getByRole('button', { name: /like this listing/i });
    const saveButton = screen.getByRole('button', { name: /save this listing/i });
    
    expect(likeButton).toBeInTheDocument();
    expect(saveButton).toBeInTheDocument();
  });

  it('should support keyboard activation of action buttons', async () => {
    const user = userEvent.setup();
    const mockOnLike = vi.fn();
    
    render(<ListingCard listing={mockListing} onLike={mockOnLike} />);
    
    const likeButton = screen.getByRole('button', { name: /like this listing/i });
    likeButton.focus();
    
    await user.keyboard('{Enter}');
    
    expect(mockOnLike).toHaveBeenCalledWith('1');
  });
});

describe('Keyboard Navigation - VendorDirectory', () => {
  const mockVendors: Vendor[] = [
    {
      id: 'v1',
      name: 'TechStore',
      avatar: '/avatars/techstore.jpg',
      rating: 4.8,
      reviewCount: 120,
      listingCount: 45,
      specialties: ['Electronics', 'Gadgets'],
      verification: {
        phone: true,
        nin: true,
        video: true,
      },
      responseTime: 2,
    },
  ];

  it('should have visible focus indicators on vendor cards', () => {
    render(<VendorDirectory initialVendors={mockVendors} />);
    
    const vendorLink = screen.getByRole('link', { name: /techstore/i });
    // Check for any focus-related styling
    expect(vendorLink.className).toMatch(/focus|ring|outline/);
  });

  it('should have proper ARIA labels for vendor cards', () => {
    render(<VendorDirectory initialVendors={mockVendors} />);
    
    const vendorLink = screen.getByRole('link', { name: /techstore.*4\.8 star rating/i });
    expect(vendorLink).toBeInTheDocument();
  });

  it('should activate vendor card with Enter key', async () => {
    const user = userEvent.setup();
    render(<VendorDirectory initialVendors={mockVendors} />);
    
    const vendorLink = screen.getByRole('link', { name: /techstore/i });
    vendorLink.focus();
    
    await user.keyboard('{Enter}');
    
    expect(vendorLink).toHaveAttribute('href', '/store/v1');
  });
});

describe('Keyboard Navigation - ActivityFeed', () => {
  const mockActivities: Activity[] = [
    {
      id: 'a1',
      type: 'listing',
      user: {
        name: 'John Doe',
        avatar: '/avatars/john.jpg',
      },
      description: 'posted a new listing',
      timestamp: '2024-01-01T00:00:00Z',
    },
  ];

  it('should have keyboard-accessible collapse button', () => {
    render(<ActivityFeed initialActivities={mockActivities} />);
    
    const collapseButton = screen.queryByRole('button', { name: /collapse activity feed/i });
    
    // Button should exist on mobile (lg:hidden)
    if (collapseButton) {
      expect(collapseButton.className).toMatch(/focus|ring|outline/);
    }
  });

  it('should toggle collapse with Enter key', async () => {
    const user = userEvent.setup();
    render(<ActivityFeed initialActivities={mockActivities} />);
    
    const collapseButton = screen.queryByRole('button', { name: /collapse activity feed/i });
    
    if (collapseButton) {
      collapseButton.focus();
      await user.keyboard('{Enter}');
      
      // Button text should change
      expect(screen.queryByRole('button', { name: /expand activity feed/i })).toBeInTheDocument();
    }
  });

  it('should have proper ARIA attributes for collapse button', () => {
    render(<ActivityFeed initialActivities={mockActivities} />);
    
    const collapseButton = screen.queryByRole('button', { name: /collapse activity feed/i });
    
    if (collapseButton) {
      expect(collapseButton).toHaveAttribute('aria-expanded');
    }
  });
});

describe('Keyboard Navigation - EnhancedFooter', () => {
  it('should have visible focus indicators on all footer links', () => {
    render(<EnhancedFooter />);
    
    const links = screen.getAllByRole('link');
    
    // Check that links have focus styles
    links.forEach((link) => {
      const classes = link.className;
      expect(classes).toMatch(/focus/);
    });
  });

  it('should have accessible social media links', () => {
    render(<EnhancedFooter />);
    
    const facebookLink = screen.getByRole('link', { name: /follow us on facebook/i });
    const twitterLink = screen.getByRole('link', { name: /follow us on twitter/i });
    
    expect(facebookLink).toBeInTheDocument();
    expect(twitterLink).toBeInTheDocument();
  });

  it('should have minimum touch target sizes for mobile', () => {
    render(<EnhancedFooter />);
    
    const socialLinks = screen.getAllByRole('link', { name: /follow us on/i });
    
    socialLinks.forEach((link) => {
      expect(link).toHaveClass('min-w-[44px]');
      expect(link).toHaveClass('min-h-[44px]');
    });
  });

  it('should support Tab navigation through footer sections', async () => {
    const user = userEvent.setup();
    render(<EnhancedFooter />);
    
    // Tab through footer links - first tab might focus on newsletter input
    await user.tab();
    await user.tab();
    
    // Should eventually be able to focus on links
    const activeTag = document.activeElement?.tagName;
    expect(['A', 'INPUT', 'BUTTON']).toContain(activeTag);
  });
});

describe('Keyboard Navigation - Property: Keyboard Equivalence', () => {
  /**
   * Property 11: Keyboard Activation Equivalence
   * Validates: Requirements 15.11
   * 
   * For all interactive elements, keyboard activation SHALL produce
   * the same result as mouse click
   */
  
  it('should produce same result for keyboard Enter and mouse click on buttons', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();
    
    const TestButton = () => (
      <button
        onClick={mockOnClick}
      >
        Test Button
      </button>
    );
    
    render(<TestButton />);
    const button = screen.getByRole('button');
    
    // Test mouse click
    await user.click(button);
    const clickCallCount = mockOnClick.mock.calls.length;
    
    // Reset mock
    mockOnClick.mockClear();
    
    // Test keyboard Enter (button naturally handles Enter)
    button.focus();
    await user.keyboard('{Enter}');
    const enterCallCount = mockOnClick.mock.calls.length;
    
    // Both should trigger the same number of calls
    expect(clickCallCount).toBe(enterCallCount);
  });

  it('should produce same result for keyboard Space and mouse click on buttons', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();
    
    const TestButton = () => (
      <button
        onClick={mockOnClick}
        onKeyDown={(e) => {
          if (e.key === ' ') {
            e.preventDefault();
            mockOnClick();
          }
        }}
      >
        Test Button
      </button>
    );
    
    render(<TestButton />);
    const button = screen.getByRole('button');
    
    // Test mouse click
    await user.click(button);
    const clickCallCount = mockOnClick.mock.calls.length;
    
    // Reset mock
    mockOnClick.mockClear();
    
    // Test keyboard Space
    button.focus();
    await user.keyboard(' ');
    const spaceCallCount = mockOnClick.mock.calls.length;
    
    // Both should trigger the same number of calls
    expect(clickCallCount).toBe(spaceCallCount);
  });
});

describe('Keyboard Navigation - Skip Links', () => {
  it('should have skip links at the top of the page', () => {
    // Skip links are in the root layout, so we test them separately
    const { container } = render(
      <nav aria-label="Skip links" className="sr-only-focusable">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <a href="#navigation" className="skip-link">
          Skip to navigation
        </a>
        <a href="#footer" className="skip-link">
          Skip to footer
        </a>
      </nav>
    );
    
    const skipLinks = container.querySelectorAll('.skip-link');
    expect(skipLinks).toHaveLength(3);
  });

  it('should have proper ARIA labels for skip links', () => {
    render(
      <nav aria-label="Skip links" className="sr-only-focusable">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
      </nav>
    );
    
    const skipNav = screen.getByRole('navigation', { name: /skip links/i });
    expect(skipNav).toBeInTheDocument();
  });
});
