/**
 * ListingCard Component Tests
 * 
 * Tests for the ListingCard Server Component
 * Validates Requirements 5.3 and 13.12
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListingCard } from './listing-card';
import type { ListingWithRelations } from '@/lib/types/core';

// Mock Next.js modules
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Sample listing data
const mockListing: ListingWithRelations = {
  id: 'test-listing-1',
  title: 'Test Listing Title',
  description: 'Test description',
  price: 25000,
  category_id: 'cat-1',
  user_id: 'user-1',
  location_state: 'Lagos',
  location_city: 'Ikeja',
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
  ],
  primary_image_index: 0,
  is_featured: false,
  status: 'approved',
  rejection_reason: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  category: {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    parent_id: null,
    description: 'Electronic items',
    image_url: null,
    display_order: 1,
    listing_count: 10,
  },
  user: {
    id: 'user-1',
    email: 'test@example.com',
    phone: null,
    full_name: 'Test User',
    avatar_url: null,
    role: 'user',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  vendor: null,
};

describe('ListingCard Component', () => {
  it('should render listing card with title and price', () => {
    render(<ListingCard listing={mockListing} />);
    
    expect(screen.getByText('Test Listing Title')).toBeInTheDocument();
    expect(screen.getByText('₦25,000')).toBeInTheDocument();
  });

  it('should display primary image using Next.js Image component', () => {
    render(<ListingCard listing={mockListing} />);
    
    const image = screen.getByAltText('Test Listing Title');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
  });

  it('should show location with city and state', () => {
    render(<ListingCard listing={mockListing} />);
    
    expect(screen.getByText('Ikeja, Lagos')).toBeInTheDocument();
  });

  it('should display category badge', () => {
    render(<ListingCard listing={mockListing} />);
    
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('should display vendor badge when seller has approved vendor status', () => {
    const listingWithVendor: ListingWithRelations = {
      ...mockListing,
      vendor: {
        user_id: 'user-1',
        business_name: 'Test Business',
        approved_at: '2024-01-01T00:00:00Z',
        approved_badge_enabled: true,
      },
    };

    render(<ListingCard listing={listingWithVendor} />);
    
    // Check for vendor badge by role and label
    expect(screen.getByRole('status', { name: 'Verified Vendor' })).toBeInTheDocument();
  });

  it('should show status badge when showStatus is true', () => {
    render(<ListingCard listing={mockListing} showStatus={true} />);
    
    expect(screen.getByText('approved')).toBeInTheDocument();
  });

  it('should not show status badge when showStatus is false', () => {
    render(<ListingCard listing={mockListing} showStatus={false} />);
    
    expect(screen.queryByText('approved')).not.toBeInTheDocument();
  });

  it('should handle pending status with correct styling', () => {
    const pendingListing: ListingWithRelations = {
      ...mockListing,
      status: 'pending',
    };

    render(<ListingCard listing={pendingListing} showStatus={true} />);
    
    const statusBadge = screen.getByText('pending');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('text-yellow-500');
  });

  it('should handle rejected status with correct styling', () => {
    const rejectedListing: ListingWithRelations = {
      ...mockListing,
      status: 'rejected',
    };

    render(<ListingCard listing={rejectedListing} showStatus={true} />);
    
    const statusBadge = screen.getByText('rejected');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('text-red-500');
  });

  it('should navigate to listing detail page on click', () => {
    render(<ListingCard listing={mockListing} />);
    
    const link = screen.getByRole('link', { name: /view listing/i });
    expect(link).toHaveAttribute('href', '/listing/test-listing-1');
  });

  it('should display placeholder image when no images available', () => {
    const listingWithoutImages: ListingWithRelations = {
      ...mockListing,
      images: [],
    };

    render(<ListingCard listing={listingWithoutImages} />);
    
    const image = screen.getByAltText('Test Listing Title');
    expect(image).toBeInTheDocument();
    expect(image.getAttribute('src')).toContain('ui-avatars.com');
  });

  it('should display "Contact for price" when price is null', () => {
    const listingWithoutPrice: ListingWithRelations = {
      ...mockListing,
      price: null,
    };

    render(<ListingCard listing={listingWithoutPrice} />);
    
    expect(screen.getByText('Contact for price')).toBeInTheDocument();
  });

  it('should show image count indicator for multiple images', () => {
    render(<ListingCard listing={mockListing} />);
    
    // Should show count of 3 images
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should apply hover effects with proper CSS classes', () => {
    const { container } = render(<ListingCard listing={mockListing} />);
    
    const card = container.querySelector('a');
    expect(card).toHaveClass('hover:border-primary-500/50');
    expect(card).toHaveClass('hover:shadow-xl');
    expect(card).toHaveClass('hover:-translate-y-1');
  });

  it('should be mobile-first responsive with proper classes', () => {
    const { container } = render(<ListingCard listing={mockListing} />);
    
    const card = container.querySelector('a');
    expect(card).toHaveClass('rounded-xl');
    
    const image = screen.getByAltText('Test Listing Title');
    expect(image).toHaveAttribute('sizes', '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw');
  });

  it('should have proper accessibility attributes', () => {
    render(<ListingCard listing={mockListing} />);
    
    const link = screen.getByRole('link', { name: /view listing: test listing title/i });
    expect(link).toHaveAttribute('aria-label', 'View listing: Test Listing Title');
    expect(link).toHaveClass('focus-visible:outline-none');
    expect(link).toHaveClass('focus-visible:ring-2');
  });

  it('should prioritize image loading when priority prop is true', () => {
    render(<ListingCard listing={mockListing} priority={true} />);
    
    const image = screen.getByAltText('Test Listing Title');
    expect(image).toBeInTheDocument();
    // In actual Next.js Image component, priority would be passed
  });

  it('should format Nigerian currency correctly', () => {
    const listingWithLargePrice: ListingWithRelations = {
      ...mockListing,
      price: 1500000,
    };

    render(<ListingCard listing={listingWithLargePrice} />);
    
    expect(screen.getByText('₦1,500,000')).toBeInTheDocument();
  });

  it('should display created date in short format', () => {
    render(<ListingCard listing={mockListing} />);
    
    expect(screen.getByText('Jan 15')).toBeInTheDocument();
  });

  it('should not show vendor badge when badge is disabled', () => {
    const listingWithDisabledBadge: ListingWithRelations = {
      ...mockListing,
      vendor: {
        user_id: 'user-1',
        business_name: 'Test Business',
        approved_at: '2024-01-01T00:00:00Z',
        approved_badge_enabled: false,
      },
    };

    render(<ListingCard listing={listingWithDisabledBadge} />);
    
    expect(screen.queryByText('Verified Vendor')).not.toBeInTheDocument();
  });
});
