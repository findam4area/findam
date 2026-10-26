/**
 * Unit Tests for Conversion Funnel Tracking
 * Requirements: 18.4, 30.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  trackConversionFunnel,
  trackListingViewFunnel,
  trackListingClickFunnel,
  trackVendorContactFunnel,
  trackPurchaseFunnel,
  calculateFunnelMetrics,
  trackFunnelDropOff,
  trackFunnelCompletionTime,
} from '../conversion-funnel';
import * as analytics from '../index';

// Mock the analytics module
vi.mock('../index', () => ({
  trackEvent: vi.fn(),
}));

describe('Conversion Funnel Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.sessionStorage = sessionStorageMock as any;
  });

  describe('trackConversionFunnel', () => {
    it('should track funnel event with all properties', () => {
      const event = {
        step: 'view' as const,
        listingId: 'listing-123',
        listingTitle: 'Test Listing',
        listingPrice: 50000,
        categoryId: 'cat-1',
        categoryName: 'Electronics',
        vendorId: 'vendor-1',
        vendorName: 'Test Vendor',
        timestamp: '2024-01-01T00:00:00Z',
        userId: 'user-1',
      };

      trackConversionFunnel(event);

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'funnel_view',
        expect.objectContaining({
          funnel_step: 'view',
          listing_id: 'listing-123',
          listing_title: 'Test Listing',
          listing_price: 50000,
          category_id: 'cat-1',
          category_name: 'Electronics',
          vendor_id: 'vendor-1',
          vendor_name: 'Test Vendor',
          user_id: 'user-1',
          timestamp: '2024-01-01T00:00:00Z',
        })
      );
    });

    it('should include session_id in tracked event', () => {
      const event = {
        step: 'click' as const,
        listingId: 'listing-123',
        listingTitle: 'Test Listing',
        timestamp: '2024-01-01T00:00:00Z',
      };

      trackConversionFunnel(event);

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'funnel_click',
        expect.objectContaining({
          session_id: expect.any(String),
        })
      );
    });
  });

  describe('trackListingViewFunnel', () => {
    it('should track listing view with metadata', () => {
      trackListingViewFunnel('listing-123', 'Test Listing', {
        price: 50000,
        categoryId: 'cat-1',
        categoryName: 'Electronics',
        vendorId: 'vendor-1',
        vendorName: 'Test Vendor',
        source: 'homepage',
        position: 3,
      });

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'funnel_view',
        expect.objectContaining({
          listing_id: 'listing-123',
          listing_title: 'Test Listing',
          listing_price: 50000,
          category_id: 'cat-1',
          vendor_id: 'vendor-1',
          source: 'homepage',
          position: 3,
        })
      );
    });

    it('should track listing view without optional metadata', () => {
      trackListingViewFunnel('listing-123', 'Test Listing');

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'funnel_view',
        expect.objectContaining({
          listing_id: 'listing-123',
          listing_title: 'Test Listing',
        })
      );
    });
  });

  describe('trackListingClickFunnel', () => {
    it('should track listing click with click element', () => {
      trackListingClickFunnel('listing-123', 'Test Listing', {
        clickElement: 'card',
        source: 'search_results',
      });

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'funnel_click',
        expect.objectContaining({
          listing_id: 'listing-123',
          click_element: 'card',
          source: 'search_results',
        })
      );
    });
  });

  describe('trackVendorContactFunnel', () => {
    it('should track vendor contact with contact method', () => {
      trackVendorContactFunnel('listing-123', 'vendor-1', {
        listingTitle: 'Test Listing',
        vendorName: 'Test Vendor',
        contactMethod: 'chat',
        messageLength: 150,
      });

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'funnel_contact',
        expect.objectContaining({
          listing_id: 'listing-123',
          vendor_id: 'vendor-1',
          contact_method: 'chat',
          message_length: 150,
        })
      );
    });
  });

  describe('trackPurchaseFunnel', () => {
    it('should track purchase with order details', () => {
      trackPurchaseFunnel('listing-123', 'vendor-1', {
        listingTitle: 'Test Listing',
        price: 50000,
        quantity: 2,
        totalAmount: 100000,
        paymentMethod: 'paystack',
        orderId: 'order-123',
      });

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'funnel_purchase',
        expect.objectContaining({
          listing_id: 'listing-123',
          vendor_id: 'vendor-1',
          listing_price: 50000,
          quantity: 2,
          total_amount: 100000,
          payment_method: 'paystack',
          order_id: 'order-123',
        })
      );
    });
  });

  describe('calculateFunnelMetrics', () => {
    it('should calculate conversion rates correctly', () => {
      const metrics = calculateFunnelMetrics(1000, 500, 100, 20);

      expect(metrics).toEqual({
        totalViews: 1000,
        totalClicks: 500,
        totalContacts: 100,
        totalPurchases: 20,
        viewToClickRate: 50, // 500/1000 * 100
        clickToContactRate: 20, // 100/500 * 100
        contactToPurchaseRate: 20, // 20/100 * 100
        overallConversionRate: 2, // 20/1000 * 100
      });
    });

    it('should handle zero values correctly', () => {
      const metrics = calculateFunnelMetrics(0, 0, 0, 0);

      expect(metrics).toEqual({
        totalViews: 0,
        totalClicks: 0,
        totalContacts: 0,
        totalPurchases: 0,
        viewToClickRate: 0,
        clickToContactRate: 0,
        contactToPurchaseRate: 0,
        overallConversionRate: 0,
      });
    });

    it('should handle partial funnel data', () => {
      const metrics = calculateFunnelMetrics(1000, 0, 0, 0);

      expect(metrics.viewToClickRate).toBe(0);
      expect(metrics.overallConversionRate).toBe(0);
    });
  });

  describe('trackFunnelDropOff', () => {
    it('should track funnel drop-off with reason', () => {
      trackFunnelDropOff('click', 'listing-123', 'price_too_high');

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'funnel_drop_off',
        expect.objectContaining({
          from_step: 'click',
          listing_id: 'listing-123',
          reason: 'price_too_high',
        })
      );
    });

    it('should track funnel drop-off without reason', () => {
      trackFunnelDropOff('view', 'listing-123');

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'funnel_drop_off',
        expect.objectContaining({
          from_step: 'view',
          listing_id: 'listing-123',
          reason: undefined,
        })
      );
    });
  });

  describe('trackFunnelCompletionTime', () => {
    it('should track funnel completion time in ms and minutes', () => {
      const durationMs = 300000; // 5 minutes

      trackFunnelCompletionTime('listing-123', durationMs);

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'funnel_completion',
        expect.objectContaining({
          listing_id: 'listing-123',
          duration_ms: 300000,
          duration_minutes: 5,
        })
      );
    });

    it('should round duration to nearest minute', () => {
      const durationMs = 330000; // 5.5 minutes

      trackFunnelCompletionTime('listing-123', durationMs);

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'funnel_completion',
        expect.objectContaining({
          duration_minutes: 6, // Rounded up
        })
      );
    });
  });

  describe('Session ID Generation', () => {
    it('should generate session ID for each event', () => {
      trackListingViewFunnel('listing-1', 'Listing 1');
      trackListingViewFunnel('listing-2', 'Listing 2');

      // Both calls should include a session_id
      expect(analytics.trackEvent).toHaveBeenNthCalledWith(
        1,
        'funnel_view',
        expect.objectContaining({
          session_id: expect.any(String),
        })
      );
      
      expect(analytics.trackEvent).toHaveBeenNthCalledWith(
        2,
        'funnel_view',
        expect.objectContaining({
          session_id: expect.any(String),
        })
      );
    });
  });
});
