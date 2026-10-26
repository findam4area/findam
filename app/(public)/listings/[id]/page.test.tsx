/**
 * ListingDetail Page Integration Tests
 * 
 * Tests Requirements 17.1-17.12:
 * - Complete listing information display
 * - Image gallery with 3-5 images
 * - Vendor information with approved badge
 * - Contact buttons (Call, Message)
 * - Report listing button
 * - SEO metadata with Open Graph tags
 * - Mobile-first responsive layout
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ListingDetailPage, { generateMetadata } from './page';
import { getListingById } from '@/lib/services/database';
import { createClient } from '@/lib/supabase/server';
import type { ListingWithRelations } from '@/lib/types/core';

// Mock dependencies
vi.mock('@/lib/services/database', () => ({
  getListingById: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('@/components/features/image-gallery', () => ({
  ImageGallery: ({ images, alt }: any) => (
    <div data-testid="image-gallery">
      <span>{alt}</span>
      <span>{images.length} images</span>
    </div>
  ),
}));

// Mock listing data
const mockListing: ListingWithRelations = {
  id: 'test-listing-id',
  title: 'Test Product',
  description: 'This is a test product description',
  price: 50000,
  category_id: 'cat-id',
  user_id: 'user-id',
  location_state: 'Lagos',
  location_city: 'Ikeja',
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
  ],
  primary_image_index: 0,
  is_featured: true,
  status: 'approved',
  rejection_reason: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  category: {
    id: 'cat-id',
    name: 'Electronics',
    slug: 'electronics',
    parent_id: null,
    description: 'Electronic items',
    image_url: null,
    display_order: 0,
    listing_count: 10,
  },
  user: {
    id: 'user-id',
    email: 'test@example.com',
    username: 'testuser',
    phone: '+2348012345678',
    full_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
    role: 'user',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  vendor: {
    user_id: 'user-id',
    business_name: 'Test Business',
    approved_at: '2024-01-01T00:00:00Z',
    approved_badge_enabled: true,
  },
};

describe('ListingDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Supabase client with complete query chain
    // For the main page query (with joins)
    const mockEqChainFull = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockListing,
        error: null,
      }),
    };
    
    // For metadata query (simpler, with media array)
    const mockEqChainMetadata = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'test-listing-id',
          title: 'Test Product',
          description: 'This is a test product description',
          price: 50000,
          thumbnail_url: null,
          state: 'Lagos',
          lga: 'Ikeja',
          media: [
            { media_url: 'https://example.com/image1.jpg', media_type: 'image' },
            { media_url: 'https://example.com/image2.jpg', media_type: 'image' },
          ],
        },
        error: null,
      }),
    };
    
    // For update query (views count increment)
    const mockUpdateChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
    
    // Switch between query chains based on the operation
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'listings') {
          return {
            select: vi.fn().mockImplementation((query: string) => {
              // If query contains 'media:listing_media', use metadata chain
              if (query.includes('media:listing_media')) {
                return mockEqChainMetadata;
              }
              // Otherwise use full query chain
              return mockEqChainFull;
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }
        return mockUpdateChain;
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  describe('Page Rendering - Requirement 17.1', () => {
    it('should render complete listing information', async () => {
      (getListingById as any).mockResolvedValue(mockListing);
      
      const params = Promise.resolve({ id: 'test-listing-id' });
      const page = await ListingDetailPage({ params });
      
      const { container } = render(page);
      
      // Check title is rendered
      expect(container.textContent).toContain('Test Product');
      
      // Check description is rendered
      expect(container.textContent).toContain('This is a test product description');
      
      // Check price is rendered
      expect(container.textContent).toContain('50,000');
      
      // Check location is rendered
      expect(container.textContent).toContain('Ikeja');
      expect(container.textContent).toContain('Lagos');
      
      // Check category is rendered
      expect(container.textContent).toContain('Electronics');
    });

    it('should render image gallery with correct props', async () => {
      (getListingById as any).mockResolvedValue(mockListing);
      
      const params = Promise.resolve({ id: 'test-listing-id' });
      const page = await ListingDetailPage({ params });
      
      const { getByTestId } = render(page);
      
      const gallery = getByTestId('image-gallery');
      expect(gallery).toBeTruthy();
      expect(gallery.textContent).toContain('Test Product');
      expect(gallery.textContent).toContain('3 images');
    });
  });

  describe('Vendor Information - Requirement 17.6', () => {
    it('should display vendor name and approved badge when vendor is approved', async () => {
      (getListingById as any).mockResolvedValue(mockListing);
      
      const params = Promise.resolve({ id: 'test-listing-id' });
      const page = await ListingDetailPage({ params });
      
      const { container } = render(page);
      
      // Check vendor name
      expect(container.textContent).toContain('Test User');
      
      // Check approved badge
      expect(container.textContent).toContain('Verified Vendor');
    });

    it('should not display approved badge when vendor badge is disabled', async () => {
      const listingWithoutBadge = {
        ...mockListing,
        vendor: {
          ...mockListing.vendor!,
          approved_badge_enabled: false,
        },
      };
      
      (getListingById as any).mockResolvedValue(listingWithoutBadge);
      
      const params = Promise.resolve({ id: 'test-listing-id' });
      const page = await ListingDetailPage({ params });
      
      const { container } = render(page);
      
      expect(container.textContent).not.toContain('Verified Vendor');
    });
  });

  describe('Contact Buttons - Requirement 17.7', () => {
    it('should render Call button with tel: link when phone is available', async () => {
      (getListingById as any).mockResolvedValue(mockListing);
      
      const params = Promise.resolve({ id: 'test-listing-id' });
      const page = await ListingDetailPage({ params });
      
      const { container } = render(page);
      
      const callLink = container.querySelector('a[href^="tel:"]');
      expect(callLink).toBeTruthy();
      expect(callLink?.getAttribute('href')).toBe('tel:2348012345678');
    });

    it('should render WhatsApp button with correct link when phone is available', async () => {
      (getListingById as any).mockResolvedValue(mockListing);
      
      const params = Promise.resolve({ id: 'test-listing-id' });
      const page = await ListingDetailPage({ params });
      
      const { container } = render(page);
      
      const whatsappLink = container.querySelector('a[href^="https://wa.me"]');
      expect(whatsappLink).toBeTruthy();
      expect(whatsappLink?.getAttribute('href')).toContain('2348012345678');
      expect(whatsappLink?.getAttribute('href')).toContain('Test%20Product');
    });

    it('should render Email button when phone is not available', async () => {
      const listingWithoutPhone = {
        ...mockListing,
        user: {
          ...mockListing.user!,
          phone: null,
        },
      };
      
      (getListingById as any).mockResolvedValue(listingWithoutPhone);
      
      const params = Promise.resolve({ id: 'test-listing-id' });
      const page = await ListingDetailPage({ params });
      
      const { container } = render(page);
      
      const emailLink = container.querySelector('a[href^="mailto:"]');
      expect(emailLink).toBeTruthy();
      expect(emailLink?.getAttribute('href')).toContain('test@example.com');
    });
  });

  describe('Report Listing Button - Requirement 17.7', () => {
    it('should render Report Listing button', async () => {
      (getListingById as any).mockResolvedValue(mockListing);
      
      const params = Promise.resolve({ id: 'test-listing-id' });
      const page = await ListingDetailPage({ params });
      
      const { container } = render(page);
      
      expect(container.textContent).toContain('Report Listing');
    });
  });

  describe('SEO Metadata - Requirement 17.10', () => {
    it('should generate proper metadata with Open Graph tags', async () => {
      (getListingById as any).mockResolvedValue(mockListing);
      
      const params = Promise.resolve({ id: 'test-listing-id' });
      const metadata = await generateMetadata({ params });
      
      expect(metadata.title).toContain('Test Product');
      expect(metadata.title).toContain('50,000');
      expect(metadata.description).toBe('This is a test product description');
      
      // Check Open Graph
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toContain('Test Product');
      const images = Array.isArray(metadata.openGraph?.images) 
        ? metadata.openGraph?.images 
        : [metadata.openGraph?.images];
      expect(images).toHaveLength(1);
      expect(images[0]).toMatchObject({
        url: 'https://example.com/image1.jpg',
        width: 1200,
        height: 630,
        alt: 'Test Product',
      });
    });

    it('should use primary image for Open Graph', async () => {
      // Override the mock for this test to return different media
      const mockEqChainCustom = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'test-listing-id',
            title: 'Test Product',
            description: 'This is a test product description',
            price: 50000,
            thumbnail_url: 'https://example.com/image2.jpg', // Use thumbnail_url as primary
            state: 'Lagos',
            lga: 'Ikeja',
            media: [],
          },
          error: null,
        }),
      };
      
      const mockSupabaseCustom = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue(mockEqChainCustom),
        }),
      };
      
      vi.mocked(createClient).mockResolvedValue(mockSupabaseCustom as any);
      
      const params = Promise.resolve({ id: 'test-listing-id' });
      const metadata = await generateMetadata({ params });
      
      const images = Array.isArray(metadata.openGraph?.images) 
        ? metadata.openGraph?.images 
        : [metadata.openGraph?.images];
      expect(images[0]).toMatchObject({
        url: 'https://example.com/image2.jpg',
      });
    });
  });

  describe('Authorization - Requirement 17.1', () => {
    it('should show pending listing to owner', async () => {
      const pendingListing = {
        ...mockListing,
        status: 'pending' as const,
      };
      
      (getListingById as any).mockResolvedValue(pendingListing);
      
      // Mock authenticated user as owner
      const mockEqChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: pendingListing,
          error: null,
        }),
      };
      
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-id' } },
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue(mockEqChain),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
      
      const params = Promise.resolve({ id: 'test-listing-id' });
      const page = await ListingDetailPage({ params });
      
      const { container } = render(page);
      
      expect(container.textContent).toContain('Pending Approval');
    });

    it('should show rejected listing with reason to owner', async () => {
      const rejectedListing = {
        ...mockListing,
        status: 'rejected' as const,
        rejection_reason: 'Does not meet quality standards',
      };
      
      (getListingById as any).mockResolvedValue(rejectedListing);
      
      // Mock authenticated user as owner
      const mockEqChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: rejectedListing,
          error: null,
        }),
      };
      
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-id' } },
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue(mockEqChain),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
      vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
      
      const params = Promise.resolve({ id: 'test-listing-id' });
      const page = await ListingDetailPage({ params });
      
      const { container } = render(page);
      
      expect(container.textContent).toContain('Rejected');
      expect(container.textContent).toContain('Does not meet quality standards');
    });
  });

  describe('Responsive Layout - Requirement 17.8', () => {
    it('should have mobile-first grid layout classes', async () => {
      (getListingById as any).mockResolvedValue(mockListing);
      
      const params = Promise.resolve({ id: 'test-listing-id' });
      const page = await ListingDetailPage({ params });
      
      const { container } = render(page);
      
      // Check for responsive grid classes
      const gridElement = container.querySelector('.grid-cols-1.lg\\:grid-cols-2');
      expect(gridElement).toBeTruthy();
    });

    it('should have minimum touch target sizes for buttons', async () => {
      (getListingById as any).mockResolvedValue(mockListing);
      
      const params = Promise.resolve({ id: 'test-listing-id' });
      const page = await ListingDetailPage({ params });
      
      const { container } = render(page);
      
      // Check for min-h-[44px] class on buttons (44x44px minimum)
      const buttons = container.querySelectorAll('.min-h-\\[44px\\]');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
