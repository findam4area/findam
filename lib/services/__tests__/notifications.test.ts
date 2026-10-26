/**
 * Unit tests for notification service
 * 
 * Tests email notification functions for listing and vendor approval/rejection.
 * Verifies error handling strategy: log errors but don't fail workflows.
 * 
 * Requirements: 3.7, 4.7
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendListingApprovedNotification,
  sendListingRejectedNotification,
  sendVendorApprovedNotification,
  sendVendorRejectedNotification,
} from '../notifications';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

describe('Notification Service', () => {
  let consoleErrorSpy: any;
  let consoleLogSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on console methods to verify logging
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('sendListingApprovedNotification', () => {
    it('should send email when listing data is found', async () => {
      // Mock successful listing fetch
      const mockListing = {
        id: 'listing-123',
        title: 'Test Product',
        user_id: 'user-123',
        users: {
          email: 'user@example.com',
          full_name: 'John Doe',
        },
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockListing,
              error: null,
            }),
          }),
        }),
      });

      // Call the function
      await sendListingApprovedNotification('user-123', 'listing-123');

      // Verify database query was made
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('listings');

      // Verify email was "sent" (logged to console)
      expect(consoleLogSpy).toHaveBeenCalled();
      const emailLog = consoleLogSpy.mock.calls[0][0];
      expect(emailLog).toContain('user@example.com');
      expect(emailLog).toContain('Test Product');
      expect(emailLog).toContain('approved');
    });

    it('should not throw error when listing is not found', async () => {
      // Mock listing not found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      // Should not throw
      await expect(
        sendListingApprovedNotification('user-123', 'listing-123')
      ).resolves.not.toThrow();

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not throw error when database query fails', async () => {
      // Mock database error
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Database connection failed')),
          }),
        }),
      });

      // Should not throw
      await expect(
        sendListingApprovedNotification('user-123', 'listing-123')
      ).resolves.not.toThrow();

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not throw error when user email is missing', async () => {
      // Mock listing without user email
      const mockListing = {
        id: 'listing-123',
        title: 'Test Product',
        user_id: 'user-123',
        users: null, // No user data
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockListing,
              error: null,
            }),
          }),
        }),
      });

      // Should not throw
      await expect(
        sendListingApprovedNotification('user-123', 'listing-123')
      ).resolves.not.toThrow();

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('sendListingRejectedNotification', () => {
    it('should send email with rejection reason', async () => {
      // Mock successful listing fetch
      const mockListing = {
        id: 'listing-123',
        title: 'Test Product',
        user_id: 'user-123',
        users: {
          email: 'user@example.com',
          full_name: 'John Doe',
        },
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockListing,
              error: null,
            }),
          }),
        }),
      });

      const rejectionReason = 'Images are not clear enough';

      // Call the function
      await sendListingRejectedNotification('user-123', 'listing-123', rejectionReason);

      // Verify email was "sent" with rejection reason
      expect(consoleLogSpy).toHaveBeenCalled();
      const emailLog = consoleLogSpy.mock.calls[0][0];
      expect(emailLog).toContain('user@example.com');
      expect(emailLog).toContain('Test Product');
      expect(emailLog).toContain(rejectionReason);
    });

    it('should handle empty rejection reason', async () => {
      const mockListing = {
        id: 'listing-123',
        title: 'Test Product',
        user_id: 'user-123',
        users: {
          email: 'user@example.com',
          full_name: 'John Doe',
        },
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockListing,
              error: null,
            }),
          }),
        }),
      });

      // Call with empty reason
      await sendListingRejectedNotification('user-123', 'listing-123', '');

      // Should still send email
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not throw error when listing fetch fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      // Should not throw
      await expect(
        sendListingRejectedNotification('user-123', 'listing-123', 'Test reason')
      ).resolves.not.toThrow();

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('sendVendorApprovedNotification', () => {
    it('should send email when vendor application data is found', async () => {
      // Mock successful application fetch
      const mockApplication = {
        id: 'app-123',
        user_id: 'user-123',
        business_name: 'Test Business',
        users: {
          email: 'vendor@example.com',
          full_name: 'Jane Smith',
        },
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockApplication,
              error: null,
            }),
          }),
        }),
      });

      // Call the function
      await sendVendorApprovedNotification('user-123', 'app-123');

      // Verify database query was made
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('vendor_applications');

      // Verify email was "sent"
      expect(consoleLogSpy).toHaveBeenCalled();
      const emailLog = consoleLogSpy.mock.calls[0][0];
      expect(emailLog).toContain('vendor@example.com');
      expect(emailLog).toContain('Test Business');
      expect(emailLog).toContain('approved');
    });

    it('should not throw error when application is not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      // Should not throw
      await expect(
        sendVendorApprovedNotification('user-123', 'app-123')
      ).resolves.not.toThrow();

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not throw error when user email is missing', async () => {
      const mockApplication = {
        id: 'app-123',
        user_id: 'user-123',
        business_name: 'Test Business',
        users: null, // No user data
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockApplication,
              error: null,
            }),
          }),
        }),
      });

      // Should not throw
      await expect(
        sendVendorApprovedNotification('user-123', 'app-123')
      ).resolves.not.toThrow();

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('sendVendorRejectedNotification', () => {
    it('should send email with rejection reason', async () => {
      const mockApplication = {
        id: 'app-123',
        user_id: 'user-123',
        business_name: 'Test Business',
        users: {
          email: 'vendor@example.com',
          full_name: 'Jane Smith',
        },
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockApplication,
              error: null,
            }),
          }),
        }),
      });

      const rejectionReason = 'Incomplete business information provided';

      // Call the function
      await sendVendorRejectedNotification('user-123', 'app-123', rejectionReason);

      // Verify email was "sent" with rejection reason
      expect(consoleLogSpy).toHaveBeenCalled();
      const emailLog = consoleLogSpy.mock.calls[0][0];
      expect(emailLog).toContain('vendor@example.com');
      expect(emailLog).toContain('Test Business');
      expect(emailLog).toContain(rejectionReason);
    });

    it('should not throw error when application fetch fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      // Should not throw
      await expect(
        sendVendorRejectedNotification('user-123', 'app-123', 'Test reason')
      ).resolves.not.toThrow();

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle special characters in rejection reason', async () => {
      const mockApplication = {
        id: 'app-123',
        user_id: 'user-123',
        business_name: 'Test Business',
        users: {
          email: 'vendor@example.com',
          full_name: 'Jane Smith',
        },
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockApplication,
              error: null,
            }),
          }),
        }),
      });

      const reasonWithSpecialChars = 'Reason with <html> & "quotes" and \'apostrophes\'';

      // Should handle special characters without crashing
      await expect(
        sendVendorRejectedNotification('user-123', 'app-123', reasonWithSpecialChars)
      ).resolves.not.toThrow();

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Error handling strategy', () => {
    it('should never throw errors to ensure approval workflows complete', async () => {
      // Mock complete database failure
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Complete database failure');
      });

      // All notification functions should resolve successfully
      await expect(
        sendListingApprovedNotification('user-123', 'listing-123')
      ).resolves.not.toThrow();

      await expect(
        sendListingRejectedNotification('user-123', 'listing-123', 'reason')
      ).resolves.not.toThrow();

      await expect(
        sendVendorApprovedNotification('user-123', 'app-123')
      ).resolves.not.toThrow();

      await expect(
        sendVendorRejectedNotification('user-123', 'app-123', 'reason')
      ).resolves.not.toThrow();

      // Errors should be logged
      expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
    });

    it('should log errors but continue execution', async () => {
      // Mock database error
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Network timeout')),
          }),
        }),
      });

      // Call all notification functions
      await sendListingApprovedNotification('user-123', 'listing-123');
      await sendListingRejectedNotification('user-123', 'listing-123', 'reason');
      await sendVendorApprovedNotification('user-123', 'app-123');
      await sendVendorRejectedNotification('user-123', 'app-123', 'reason');

      // All should have logged errors
      expect(consoleErrorSpy.mock.calls.length).toBeGreaterThan(0);

      // Verify error messages contain context
      const errorCalls = consoleErrorSpy.mock.calls;
      expect(errorCalls.some((call: any) => 
        call[0].includes('[Notification Error]')
      )).toBe(true);
    });
  });
});
