/**
 * Unit tests for PrivacySettings component
 * Requirements: 18.9, 30.10, 31.6, 31.7, 31.8
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PrivacySettings } from '../privacy-settings';
import * as cookieConsent from '@/lib/gdpr/cookie-consent';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock cookie consent module
vi.mock('@/lib/gdpr/cookie-consent', () => ({
  getCookieConsent: vi.fn(),
  setCookieConsent: vi.fn(),
}));

describe('PrivacySettings', () => {
  const defaultProps = {
    userId: 'test-user-id',
    userEmail: 'test@example.com',
    deletionScheduledAt: null,
    accountStatus: 'active',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock default cookie consent
    vi.mocked(cookieConsent.getCookieConsent).mockReturnValue({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    });

    // Mock window.open
    global.window.open = vi.fn();
    
    // Mock fetch
    global.fetch = vi.fn();
  });

  describe('Cookie Preferences', () => {
    it('should render cookie preferences section', () => {
      render(<PrivacySettings {...defaultProps} />);

      expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
      expect(screen.getByText('Necessary Cookies')).toBeInTheDocument();
      expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
      expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
      expect(screen.getByText('Functional Cookies')).toBeInTheDocument();
    });

    it('should display current cookie preferences', () => {
      render(<PrivacySettings {...defaultProps} />);

      const necessaryCheckbox = screen.getByLabelText('Necessary cookies (required)');
      const analyticsCheckbox = screen.getByLabelText('Analytics cookies');

      expect(necessaryCheckbox).toBeChecked();
      expect(necessaryCheckbox).toBeDisabled();
      expect(analyticsCheckbox).not.toBeChecked();
    });

    it('should allow toggling optional cookie preferences', () => {
      render(<PrivacySettings {...defaultProps} />);

      const analyticsCheckbox = screen.getByLabelText('Analytics cookies');
      
      fireEvent.click(analyticsCheckbox);
      
      expect(analyticsCheckbox).toBeChecked();
    });

    it('should save cookie preferences when button clicked', () => {
      const { toast } = require('sonner');
      render(<PrivacySettings {...defaultProps} />);

      const saveButton = screen.getByText('Save Cookie Preferences');
      fireEvent.click(saveButton);

      expect(cookieConsent.setCookieConsent).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Preferences Saved', {
        description: 'Your cookie preferences have been updated.',
      });
    });
  });

  describe('Data Export', () => {
    it('should render data export section', () => {
      render(<PrivacySettings {...defaultProps} />);

      expect(screen.getByText('Export Your Data')).toBeInTheDocument();
      expect(screen.getByText(/GDPR Article 20/)).toBeInTheDocument();
    });

    it('should display data export information', () => {
      render(<PrivacySettings {...defaultProps} />);

      expect(screen.getByText('Profile information')).toBeInTheDocument();
      expect(screen.getByText("Listings you've created")).toBeInTheDocument();
      expect(screen.getByText("Reviews you've written")).toBeInTheDocument();
    });

    it('should trigger JSON export when button clicked', () => {
      const { toast } = require('sonner');
      render(<PrivacySettings {...defaultProps} />);

      const jsonButton = screen.getByText('Export as JSON');
      fireEvent.click(jsonButton);

      expect(window.open).toHaveBeenCalledWith('/api/gdpr/export?format=json', '_blank');
      expect(toast.success).toHaveBeenCalledWith('Data Export Started', {
        description: 'Your data is being prepared for download in JSON format.',
      });
    });

    it('should trigger CSV export when button clicked', () => {
      const { toast } = require('sonner');
      render(<PrivacySettings {...defaultProps} />);

      const csvButton = screen.getByText('Export as CSV');
      fireEvent.click(csvButton);

      expect(window.open).toHaveBeenCalledWith('/api/gdpr/export?format=csv', '_blank');
      expect(toast.success).toHaveBeenCalledWith('Data Export Started', {
        description: 'Your data is being prepared for download in CSV format.',
      });
    });
  });

  describe('Data Deletion', () => {
    it('should render data deletion section', () => {
      render(<PrivacySettings {...defaultProps} />);

      expect(screen.getByText('Delete Your Account')).toBeInTheDocument();
      expect(screen.getByText(/GDPR Article 17/)).toBeInTheDocument();
    });

    it('should display deletion warning', () => {
      render(<PrivacySettings {...defaultProps} />);

      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText(/Remove all your personal information/)).toBeInTheDocument();
      expect(screen.getByText(/30-day grace period/)).toBeInTheDocument();
    });

    it('should show confirmation dialog when delete button clicked', () => {
      render(<PrivacySettings {...defaultProps} />);

      const deleteButton = screen.getByText('Delete My Account');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Final Confirmation')).toBeInTheDocument();
      expect(screen.getByText(/Are you absolutely sure/)).toBeInTheDocument();
    });

    it('should schedule deletion when confirmed', async () => {
      const { toast } = require('sonner');
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Deletion scheduled',
          scheduledDate: '2024-02-01T00:00:00Z',
        }),
      });

      // Mock window.location.reload
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      render(<PrivacySettings {...defaultProps} />);

      // Open confirmation dialog
      const deleteButton = screen.getByText('Delete My Account');
      fireEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByText('Yes, Delete My Account');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/gdpr/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'schedule', gracePeriodDays: 30 }),
        });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should display deletion scheduled alert when account deletion is scheduled', () => {
      const props = {
        ...defaultProps,
        deletionScheduledAt: '2024-02-01T00:00:00Z',
        accountStatus: 'deletion_scheduled',
      };

      render(<PrivacySettings {...props} />);

      expect(screen.getByText('Account Deletion Scheduled')).toBeInTheDocument();
      expect(screen.getByText('Cancel Deletion')).toBeInTheDocument();
    });

    it('should cancel deletion when cancel button clicked', async () => {
      const { toast } = require('sonner');
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Deletion cancelled' }),
      });

      // Mock window.location.reload
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      const props = {
        ...defaultProps,
        deletionScheduledAt: '2024-02-01T00:00:00Z',
        accountStatus: 'deletion_scheduled',
      };

      render(<PrivacySettings {...props} />);

      const cancelButton = screen.getByText('Cancel Deletion');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/gdpr/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cancel' }),
        });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Privacy Rights Information', () => {
    it('should display privacy rights information', () => {
      render(<PrivacySettings {...defaultProps} />);

      expect(screen.getByText('Your Privacy Rights')).toBeInTheDocument();
      expect(screen.getByText('Right to Access')).toBeInTheDocument();
      expect(screen.getByText('Right to be Forgotten')).toBeInTheDocument();
      expect(screen.getByText('Right to Object')).toBeInTheDocument();
      expect(screen.getByText('Data Portability')).toBeInTheDocument();
    });

    it('should display links to privacy policy and terms', () => {
      render(<PrivacySettings {...defaultProps} />);

      const privacyLink = screen.getByRole('link', { name: /Privacy Policy/ });
      const termsLink = screen.getByRole('link', { name: /Terms of Service/ });

      expect(privacyLink).toHaveAttribute('href', '/privacy');
      expect(termsLink).toHaveAttribute('href', '/terms');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for checkboxes', () => {
      render(<PrivacySettings {...defaultProps} />);

      expect(screen.getByLabelText('Necessary cookies (required)')).toBeInTheDocument();
      expect(screen.getByLabelText('Analytics cookies')).toBeInTheDocument();
      expect(screen.getByLabelText('Marketing cookies')).toBeInTheDocument();
      expect(screen.getByLabelText('Functional cookies')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(<PrivacySettings {...defaultProps} />);

      const headings = container.querySelectorAll('h1, h2, h3');
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
