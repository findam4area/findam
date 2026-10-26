/**
 * Vendor Application Page Tests
 * 
 * Tests for Task 8.11:
 * - Authentication guard redirects unauthenticated users
 * - Page renders with form component for authenticated users
 * - Page metadata is correct
 * - Mobile-first responsive layout
 * 
 * Requirements: 4.1, 4.2
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import VendorApplicationPage, { metadata } from '../page';
import { requireAuth } from '@/lib/services/auth';
import type { User } from '@/lib/types/core';

// Mock dependencies
vi.mock('@/lib/services/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock('@/components/features/vendor-application-form', () => ({
  VendorApplicationForm: () => (
    <form data-testid="vendor-application-form">
      <input name="business_name" placeholder="Business Name" />
      <textarea name="business_description" placeholder="Business Description" />
      <input name="contact_email" type="email" placeholder="Email" />
      <input name="contact_phone" type="tel" placeholder="Phone" />
      <button type="submit">Submit Application</button>
    </form>
  ),
}));

// Mock user data
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  phone: '+2348012345678',
  full_name: 'Test User',
  avatar_url: null,
  role: 'user',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('VendorApplicationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Metadata', () => {
    it('should have correct metadata', () => {
      expect(metadata.title).toBe('Apply as Vendor | FindAm');
      expect(metadata.description).toContain('Apply to become an approved vendor');
      expect(metadata.robots).toEqual({
        index: false,
        follow: false,
      });
    });
  });

  describe('Authentication', () => {
    it('should redirect to login if user is not authenticated', async () => {
      // Mock requireAuth to throw error (unauthenticated)
      vi.mocked(requireAuth).mockRejectedValueOnce(new Error('Unauthorized'));

      // Expect redirect to be called
      await expect(async () => {
        await VendorApplicationPage();
      }).rejects.toThrow('REDIRECT:/login?redirect=/vendors/apply');
    });

    it('should render page for authenticated user', async () => {
      // Mock requireAuth to return user
      vi.mocked(requireAuth).mockResolvedValueOnce(mockUser);

      // Render page
      const page = await VendorApplicationPage();
      const { container } = render(page);

      // Check that page structure is rendered
      expect(container.querySelector('.min-h-screen')).toBeTruthy();
    });
  });

  describe('Page Content', () => {
    beforeEach(() => {
      // Mock authenticated user for these tests
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
    });

    it('should display page heading', async () => {
      const page = await VendorApplicationPage();
      render(page);

      expect(screen.getByRole('heading', { name: /Apply as Vendor/i })).toBeTruthy();
    });

    it('should display benefits section', async () => {
      const page = await VendorApplicationPage();
      render(page);

      expect(screen.getByText(/Benefits of Being an Approved Vendor/i)).toBeTruthy();
      expect(screen.getByText(/Verified badge displayed/i)).toBeTruthy();
      expect(screen.getByText(/Increased customer trust/i)).toBeTruthy();
    });

    it('should render VendorApplicationForm component', async () => {
      const page = await VendorApplicationPage();
      render(page);

      expect(screen.getByTestId('vendor-application-form')).toBeTruthy();
    });

    it('should display additional info about review time', async () => {
      const page = await VendorApplicationPage();
      render(page);

      expect(screen.getByText(/Applications are typically reviewed within 2-3 business days/i)).toBeTruthy();
    });
  });

  describe('Mobile-First Design', () => {
    beforeEach(() => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
    });

    it('should have responsive container classes', async () => {
      const page = await VendorApplicationPage();
      const { container } = render(page);

      const mainContainer = container.querySelector('.container');
      expect(mainContainer?.className).toContain('mx-auto');
      expect(mainContainer?.className).toContain('px-4');
      expect(mainContainer?.className).toContain('max-w-2xl');
    });

    it('should have mobile-responsive heading classes', async () => {
      const page = await VendorApplicationPage();
      const { container } = render(page);

      const heading = container.querySelector('h1');
      expect(heading?.className).toContain('text-3xl');
      expect(heading?.className).toContain('md:text-4xl');
    });

    it('should have responsive padding on form container', async () => {
      const page = await VendorApplicationPage();
      const { container } = render(page);

      const formContainer = container.querySelector('.bg-white');
      expect(formContainer?.className).toContain('p-6');
      expect(formContainer?.className).toContain('md:p-8');
    });
  });

  describe('Requirements Validation', () => {
    beforeEach(() => {
      vi.mocked(requireAuth).mockResolvedValue(mockUser);
    });

    it('should meet Requirement 4.1: authentication guard', async () => {
      // Test that requireAuth is called
      await VendorApplicationPage();
      expect(requireAuth).toHaveBeenCalled();
    });

    it('should meet Requirement 4.2: render application form', async () => {
      // Test that form is rendered
      const page = await VendorApplicationPage();
      render(page);
      expect(screen.getByTestId('vendor-application-form')).toBeTruthy();
    });
  });
});
