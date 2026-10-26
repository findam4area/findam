/**
 * Tests for ListingApprovalCard component
 * 
 * Verifies the component renders correctly and handles approve/reject actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ListingApprovalCard } from '../listing-approval-card';
import type { Listing } from '@/lib/types/core';

// Mock the admin actions
vi.mock('@/lib/actions/admin-actions', () => ({
  approveListingAction: vi.fn(),
  rejectListingAction: vi.fn(),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ alt, ...props }: any) => <img alt={alt} {...props} />,
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('ListingApprovalCard', () => {
  const mockListing: Listing & {
    user: {
      username?: string;
      full_name: string;
      email: string;
    };
    category: {
      name: string;
    };
  } = {
    id: 'listing-123',
    title: 'Test Laptop for Sale',
    description: 'This is a detailed description of a laptop for sale in excellent condition.',
    price: 50000,
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
    status: 'pending',
    rejection_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: {
      username: 'testuser',
      full_name: 'Test User',
      email: 'test@example.com',
    },
    category: {
      name: 'Electronics',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders listing information correctly', () => {
    render(<ListingApprovalCard listing={mockListing} />);

    // Check if listing title is displayed
    expect(screen.getByText('Test Laptop for Sale')).toBeInTheDocument();

    // Check if user information is displayed
    expect(screen.getByText('testuser')).toBeInTheDocument();

    // Check if category is displayed
    expect(screen.getByText('Electronics')).toBeInTheDocument();

    // Check if price is displayed
    expect(screen.getByText(/₦50,000/)).toBeInTheDocument();

    // Check if location is displayed
    expect(screen.getByText(/Ikeja, Lagos/)).toBeInTheDocument();
  });

  it('displays approve and reject buttons', () => {
    render(<ListingApprovalCard listing={mockListing} />);

    const approveButton = screen.getByRole('button', { name: /approve/i });
    const rejectButton = screen.getByRole('button', { name: /reject/i });

    expect(approveButton).toBeInTheDocument();
    expect(rejectButton).toBeInTheDocument();
  });

  it('displays primary image or placeholder', () => {
    render(<ListingApprovalCard listing={mockListing} />);

    const image = screen.getByRole('img', { name: 'Test Laptop for Sale' });
    expect(image).toBeInTheDocument();
  });

  it('displays "No image" placeholder when no images are available', () => {
    const listingWithoutImages = {
      ...mockListing,
      images: [],
    };

    render(<ListingApprovalCard listing={listingWithoutImages} />);

    expect(screen.getByText('No image')).toBeInTheDocument();
  });

  it('truncates long descriptions', () => {
    const listingWithLongDescription = {
      ...mockListing,
      description: 'A'.repeat(200),
    };

    render(<ListingApprovalCard listing={listingWithLongDescription} />);

    const description = screen.getByText(/\.\.\.$/);
    expect(description).toBeInTheDocument();
  });

  it('displays view listing link', () => {
    render(<ListingApprovalCard listing={mockListing} />);

    const viewLink = screen.getByRole('link', { name: /view listing/i });
    expect(viewLink).toBeInTheDocument();
    expect(viewLink).toHaveAttribute('href', '/listing/listing-123');
  });

  it('opens rejection modal when reject button is clicked', async () => {
    render(<ListingApprovalCard listing={mockListing} />);

    const rejectButton = screen.getByRole('button', { name: /^Reject$/i });
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(screen.getByText('Reject Listing')).toBeInTheDocument();
      expect(screen.getByLabelText(/rejection reason/i)).toBeInTheDocument();
    });
  });

  it('disables buttons during approval', async () => {
    const { approveListingAction } = await import('@/lib/actions/admin-actions');
    vi.mocked(approveListingAction).mockResolvedValue({
      success: true,
    });

    render(<ListingApprovalCard listing={mockListing} />);

    const approveButton = screen.getByRole('button', { name: /^Approve$/i });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(screen.getByText(/approving/i)).toBeInTheDocument();
    });
  });
});
