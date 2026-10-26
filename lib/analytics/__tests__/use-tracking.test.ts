/**
 * Unit Tests for Custom Tracking Hooks
 * Requirements: 18.3, 18.4, 30.6
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useSearchTracking,
  useFilterTracking,
  useListingTracking,
  useCTATracking,
  useCategoryTracking,
} from '../use-tracking';
import * as analytics from '../index';
import * as conversionFunnel from '../conversion-funnel';

// Mock analytics modules
vi.mock('../index', () => ({
  trackSearch: vi.fn(),
  trackAutocomplete: vi.fn(),
  trackFilter: vi.fn(),
  trackSave: vi.fn(),
  trackShare: vi.fn(),
  trackContact: vi.fn(),
  trackListingView: vi.fn(),
  trackEvent: vi.fn(),
}));

vi.mock('../conversion-funnel', () => ({
  trackListingViewFunnel: vi.fn(),
  trackListingClickFunnel: vi.fn(),
  trackVendorContactFunnel: vi.fn(),
  trackPurchaseFunnel: vi.fn(),
}));

describe('Custom Tracking Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSearchTracking', () => {
    it('should track search query', () => {
      const { result } = renderHook(() => useSearchTracking());

      act(() => {
        result.current.trackSearchQuery('laptop', 45);
      });

      expect(analytics.trackSearch).toHaveBeenCalledWith('laptop', 45);
    });

    it('should track autocomplete selection', () => {
      const { result } = renderHook(() => useSearchTracking());

      act(() => {
        result.current.trackAutocompleteSelection('laptop', 'listing');
      });

      expect(analytics.trackAutocomplete).toHaveBeenCalledWith('laptop', 'listing');
    });
  });

  describe('useFilterTracking', () => {
    it('should track filter applied', () => {
      const { result } = renderHook(() => useFilterTracking());

      act(() => {
        result.current.trackFilterApplied('price', { min: 0, max: 50000 });
      });

      expect(analytics.trackFilter).toHaveBeenCalledWith('price', { min: 0, max: 50000 });
    });

    it('should track filter cleared', () => {
      const { result } = renderHook(() => useFilterTracking());

      act(() => {
        result.current.trackFilterCleared();
      });

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'filter_cleared',
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('useListingTracking', () => {
    it('should track listing view with metadata', () => {
      const { result } = renderHook(() => useListingTracking());

      act(() => {
        result.current.trackView('listing-123', 'Test Listing', {
          price: 50000,
          categoryId: 'cat-1',
          vendorId: 'vendor-1',
          source: 'homepage',
          position: 3,
        });
      });

      // Should track regular view
      expect(analytics.trackListingView).toHaveBeenCalledWith('listing-123', 'Test Listing');

      // Should track funnel view
      expect(conversionFunnel.trackListingViewFunnel).toHaveBeenCalledWith(
        'listing-123',
        'Test Listing',
        expect.objectContaining({
          price: 50000,
          categoryId: 'cat-1',
          vendorId: 'vendor-1',
          source: 'homepage',
          position: 3,
        })
      );
    });

    it('should track listing click', () => {
      const { result } = renderHook(() => useListingTracking());

      act(() => {
        result.current.trackClick('listing-123', 'Test Listing', {
          clickElement: 'card',
          source: 'search',
        });
      });

      expect(conversionFunnel.trackListingClickFunnel).toHaveBeenCalledWith(
        'listing-123',
        'Test Listing',
        expect.objectContaining({
          clickElement: 'card',
          source: 'search',
        })
      );
    });

    it('should track listing save', () => {
      const { result } = renderHook(() => useListingTracking());

      act(() => {
        result.current.trackSave('listing-123', 'Test Listing');
      });

      expect(analytics.trackSave).toHaveBeenCalledWith('listing-123', 'Test Listing');
    });

    it('should track listing share', () => {
      const { result } = renderHook(() => useListingTracking());

      act(() => {
        result.current.trackShare('listing-123', 'Test Listing', 'whatsapp');
      });

      expect(analytics.trackShare).toHaveBeenCalledWith('listing-123', 'Test Listing', 'whatsapp');
    });

    it('should track vendor contact', () => {
      const { result } = renderHook(() => useListingTracking());

      act(() => {
        result.current.trackContact('listing-123', 'vendor-1', {
          contactMethod: 'chat',
          messageLength: 150,
        });
      });

      // Should track regular contact
      expect(analytics.trackContact).toHaveBeenCalledWith('vendor-1', 'listing-123');

      // Should track funnel contact
      expect(conversionFunnel.trackVendorContactFunnel).toHaveBeenCalledWith(
        'listing-123',
        'vendor-1',
        expect.objectContaining({
          contactMethod: 'chat',
          messageLength: 150,
        })
      );
    });

    it('should track purchase', () => {
      const { result } = renderHook(() => useListingTracking());

      act(() => {
        result.current.trackPurchase('listing-123', 'vendor-1', {
          price: 50000,
          quantity: 2,
          totalAmount: 100000,
          paymentMethod: 'paystack',
          orderId: 'order-123',
        });
      });

      expect(conversionFunnel.trackPurchaseFunnel).toHaveBeenCalledWith(
        'listing-123',
        'vendor-1',
        expect.objectContaining({
          price: 50000,
          quantity: 2,
          totalAmount: 100000,
          paymentMethod: 'paystack',
          orderId: 'order-123',
        })
      );
    });
  });

  describe('useCTATracking', () => {
    it('should track CTA click with position', () => {
      const { result } = renderHook(() => useCTATracking());

      act(() => {
        result.current.trackCTAClick('hero_signup', 'Get Started Free', 'hero_section');
      });

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'cta_click',
        expect.objectContaining({
          button_id: 'hero_signup',
          button_text: 'Get Started Free',
          position: 'hero_section',
          timestamp: expect.any(String),
        })
      );
    });

    it('should track CTA click without position', () => {
      const { result } = renderHook(() => useCTATracking());

      act(() => {
        result.current.trackCTAClick('signup', 'Sign Up');
      });

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'cta_click',
        expect.objectContaining({
          button_id: 'signup',
          button_text: 'Sign Up',
          position: undefined,
        })
      );
    });
  });

  describe('useCategoryTracking', () => {
    it('should track category view', () => {
      const { result } = renderHook(() => useCategoryTracking());

      act(() => {
        result.current.trackCategoryView('cat-1', 'Electronics');
      });

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'category_view',
        expect.objectContaining({
          category_id: 'cat-1',
          category_name: 'Electronics',
          timestamp: expect.any(String),
        })
      );
    });

    it('should track category click with source', () => {
      const { result } = renderHook(() => useCategoryTracking());

      act(() => {
        result.current.trackCategoryClick('cat-1', 'Electronics', 'homepage');
      });

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        'category_click',
        expect.objectContaining({
          category_id: 'cat-1',
          category_name: 'Electronics',
          source: 'homepage',
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('Hook stability', () => {
    it('should maintain stable callback references', () => {
      const { result, rerender } = renderHook(() => useSearchTracking());

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      // Callbacks should be the same reference across renders
      expect(firstRender.trackSearchQuery).toBe(secondRender.trackSearchQuery);
      expect(firstRender.trackAutocompleteSelection).toBe(
        secondRender.trackAutocompleteSelection
      );
    });

    it('should maintain stable listing tracking callbacks', () => {
      const { result, rerender } = renderHook(() => useListingTracking());

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      expect(firstRender.trackView).toBe(secondRender.trackView);
      expect(firstRender.trackClick).toBe(secondRender.trackClick);
      expect(firstRender.trackSave).toBe(secondRender.trackSave);
    });
  });
});
