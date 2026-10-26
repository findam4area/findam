/**
 * Unit tests for AdminSidebar component
 * 
 * Tests:
 * - Renders navigation items correctly
 * - Displays pending count badges
 * - Shows mobile menu toggle button
 * - Highlights active routes
 * - Handles mobile menu open/close
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminSidebar from '../admin-sidebar';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/admin/dashboard'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

describe('AdminSidebar', () => {
  const defaultProps = {
    pendingListingsCount: 5,
    pendingVendorsCount: 3,
  };

  it('renders navigation items with correct labels', () => {
    render(<AdminSidebar {...defaultProps} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Pending Listings')).toBeInTheDocument();
    expect(screen.getByText('Pending Vendors')).toBeInTheDocument();
  });

  it('displays pending count badges when counts are greater than 0', () => {
    render(<AdminSidebar {...defaultProps} />);

    // Should show badge with count 5 for listings
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // Should show badge with count 3 for vendors
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not display badges when counts are 0', () => {
    render(<AdminSidebar pendingListingsCount={0} pendingVendorsCount={0} />);

    // Should not show any badges
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders mobile menu toggle button', () => {
    render(<AdminSidebar {...defaultProps} />);

    // Should have menu toggle button
    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('renders back to site link', () => {
    render(<AdminSidebar {...defaultProps} />);

    // Should have back to site links
    const backLinks = screen.getAllByText(/Back to site/i);
    expect(backLinks.length).toBeGreaterThan(0);
  });

  it('applies active styling to current route', () => {
    // The mock is already set up to return '/admin/dashboard' at the top
    render(<AdminSidebar {...defaultProps} />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('bg-blue-50', 'text-blue-700');
  });

  it('handles mobile menu toggle', async () => {
    const user = userEvent.setup();
    render(<AdminSidebar {...defaultProps} />);

    const menuButton = screen.getByLabelText('Toggle menu');
    
    // Initially, sidebar should be hidden on mobile (has -translate-x-full)
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('-translate-x-full');

    // Click to open menu
    await user.click(menuButton);
    
    // Sidebar should be visible (translate-x-0)
    expect(sidebar).toHaveClass('translate-x-0');
  });

  it('has proper ARIA labels for accessibility', () => {
    render(<AdminSidebar {...defaultProps} />);

    // Navigation should have proper label
    expect(screen.getByLabelText('Admin navigation')).toBeInTheDocument();

    // Badge should have descriptive label
    const listingsBadge = screen.getByLabelText('5 pending');
    expect(listingsBadge).toBeInTheDocument();
  });
});
