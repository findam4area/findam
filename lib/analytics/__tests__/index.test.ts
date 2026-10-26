/**
 * Analytics Unit Tests
 * Tests for custom event tracking functions
 * Requirements: 18.1, 18.2, 18.3, 18.4, 30.1, 30.2, 30.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import posthog from 'posthog-js';
import {
  trackEvent,
  trackSearch,
  trackAutocomplete,
  trackFilter,
  trackSave,
  trackShare,
  trackContact,
  trackListingView,
  trackFunnelStep,
  identifyUser,
  resetUser,
  setUserProperties,
} from '../index';
import { ANALYTICS_CONFIG } from '../config';

// Mock posthog
vi.mock('posthog-js', () => ({
  default: {
    __loaded: true,
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    people: {
      set: vi.fn(),
    },
  },
}));

describe('Analytics Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track custom events with PostHog when enabled', () => {
      const eventName = 'test_event';
      const properties = { foo: 'bar', count: 42 };

      trackEvent(eventName, properties);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(eventName, properties);
      }
    });

    it('should handle events without properties', () => {
      const eventName = 'simple_event';

      trackEvent(eventName);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(eventName, undefined);
      }
    });
  });

  describe('trackSearch', () => {
    it('should track search queries with query and results count', () => {
      const query = 'laptop';
      const resultsCount = 42;

      trackSearch(query, resultsCount);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(
          ANALYTICS_CONFIG.events.search.query,
          expect.objectContaining({
            query,
            results_count: resultsCount,
            timestamp: expect.any(String),
          })
        );
      }
    });

    it('should include timestamp in ISO 8601 format', () => {
      trackSearch('test', 10);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        const callArgs = (posthog.capture as any).mock.calls[0][1];
        const timestamp = callArgs.timestamp;
        
        // Verify ISO 8601 format (Requirement 18.11)
        expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      }
    });
  });

  describe('trackAutocomplete', () => {
    it('should track autocomplete interactions', () => {
      const query = 'macbook';
      const selectedType = 'listing';

      trackAutocomplete(query, selectedType);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(
          ANALYTICS_CONFIG.events.search.autocomplete,
          expect.objectContaining({
            query,
            selected_type: selectedType,
            timestamp: expect.any(String),
          })
        );
      }
    });
  });

  describe('trackFilter', () => {
    it('should track filter applications', () => {
      const filterType = 'category';
      const filterValue = 'electronics';

      trackFilter(filterType, filterValue);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(
          ANALYTICS_CONFIG.events.filter.applied,
          expect.objectContaining({
            filter_type: filterType,
            filter_value: filterValue,
            timestamp: expect.any(String),
          })
        );
      }
    });

    it('should handle complex filter values', () => {
      const filterType = 'price';
      const filterValue = { min: 10000, max: 50000 };

      trackFilter(filterType, filterValue);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(
          ANALYTICS_CONFIG.events.filter.applied,
          expect.objectContaining({
            filter_type: filterType,
            filter_value: filterValue,
          })
        );
      }
    });
  });

  describe('trackSave', () => {
    it('should track listing saves', () => {
      const listingId = 'listing-123';
      const listingTitle = 'MacBook Pro M3';

      trackSave(listingId, listingTitle);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(
          ANALYTICS_CONFIG.events.interaction.save,
          expect.objectContaining({
            listing_id: listingId,
            listing_title: listingTitle,
            timestamp: expect.any(String),
          })
        );
      }
    });
  });

  describe('trackShare', () => {
    it('should track listing shares with share method', () => {
      const listingId = 'listing-123';
      const listingTitle = 'MacBook Pro';
      const shareMethod = 'whatsapp';

      trackShare(listingId, listingTitle, shareMethod);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(
          ANALYTICS_CONFIG.events.interaction.share,
          expect.objectContaining({
            listing_id: listingId,
            listing_title: listingTitle,
            share_method: shareMethod,
            timestamp: expect.any(String),
          })
        );
      }
    });
  });

  describe('trackContact', () => {
    it('should track vendor contact with listing ID', () => {
      const vendorId = 'vendor-456';
      const listingId = 'listing-123';

      trackContact(vendorId, listingId);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(
          ANALYTICS_CONFIG.events.interaction.contact,
          expect.objectContaining({
            vendor_id: vendorId,
            listing_id: listingId,
            timestamp: expect.any(String),
          })
        );
      }
    });

    it('should track vendor contact without listing ID', () => {
      const vendorId = 'vendor-456';

      trackContact(vendorId);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(
          ANALYTICS_CONFIG.events.interaction.contact,
          expect.objectContaining({
            vendor_id: vendorId,
            listing_id: undefined,
            timestamp: expect.any(String),
          })
        );
      }
    });
  });

  describe('trackListingView', () => {
    it('should track listing views', () => {
      const listingId = 'listing-789';
      const listingTitle = 'iPhone 15 Pro';

      trackListingView(listingId, listingTitle);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(
          ANALYTICS_CONFIG.events.interaction.view,
          expect.objectContaining({
            listing_id: listingId,
            listing_title: listingTitle,
            timestamp: expect.any(String),
          })
        );
      }
    });
  });

  describe('trackFunnelStep', () => {
    it('should track view funnel step', () => {
      const listingId = 'listing-123';

      trackFunnelStep('view', listingId);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(
          ANALYTICS_CONFIG.events.funnel.view,
          expect.objectContaining({
            listing_id: listingId,
            funnel_step: 'view',
            timestamp: expect.any(String),
          })
        );
      }
    });

    it('should track click funnel step', () => {
      const listingId = 'listing-123';

      trackFunnelStep('click', listingId);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(
          ANALYTICS_CONFIG.events.funnel.click,
          expect.objectContaining({
            listing_id: listingId,
            funnel_step: 'click',
          })
        );
      }
    });

    it('should track contact funnel step', () => {
      const listingId = 'listing-123';

      trackFunnelStep('contact', listingId);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(
          ANALYTICS_CONFIG.events.funnel.contact,
          expect.objectContaining({
            listing_id: listingId,
            funnel_step: 'contact',
          })
        );
      }
    });

    it('should track purchase funnel step with metadata', () => {
      const listingId = 'listing-123';
      const metadata = { amount: 500000, currency: 'NGN' };

      trackFunnelStep('purchase', listingId, metadata);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.capture).toHaveBeenCalledWith(
          ANALYTICS_CONFIG.events.funnel.purchase,
          expect.objectContaining({
            listing_id: listingId,
            funnel_step: 'purchase',
            amount: 500000,
            currency: 'NGN',
            timestamp: expect.any(String),
          })
        );
      }
    });
  });

  describe('identifyUser', () => {
    it('should identify user with ID and properties', () => {
      const userId = 'user-123';
      const properties = {
        name: 'John Doe',
        email: 'john@example.com',
        plan: 'pro',
      };

      identifyUser(userId, properties);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.identify).toHaveBeenCalledWith(userId, properties);
      }
    });

    it('should identify user without properties', () => {
      const userId = 'user-456';

      identifyUser(userId);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.identify).toHaveBeenCalledWith(userId, undefined);
      }
    });
  });

  describe('resetUser', () => {
    it('should reset user identity on logout', () => {
      resetUser();

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.reset).toHaveBeenCalled();
      }
    });
  });

  describe('setUserProperties', () => {
    it('should set user properties', () => {
      const properties = {
        theme: 'dark',
        language: 'en',
        notifications_enabled: true,
      };

      setUserProperties(properties);

      if (ANALYTICS_CONFIG.posthog.enabled) {
        expect(posthog.people.set).toHaveBeenCalledWith(properties);
      }
    });
  });
});
