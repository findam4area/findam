/**
 * Analytics Integration Tests
 * Tests for end-to-end analytics integration
 * Requirements: 18.1, 18.2, 30.1, 30.2
 */

import { describe, it, expect } from 'vitest';
import { ANALYTICS_CONFIG } from '../config';

describe('Analytics Integration', () => {
  describe('Configuration', () => {
    it('should have valid analytics configuration', () => {
      expect(ANALYTICS_CONFIG).toBeDefined();
      expect(ANALYTICS_CONFIG.posthog).toBeDefined();
      expect(ANALYTICS_CONFIG.vercel).toBeDefined();
      expect(ANALYTICS_CONFIG.events).toBeDefined();
    });

    it('should have PostHog configuration', () => {
      const { posthog } = ANALYTICS_CONFIG;
      
      expect(posthog.apiKey).toBeDefined();
      expect(posthog.apiHost).toBeDefined();
      expect(typeof posthog.enabled).toBe('boolean');
      expect(typeof posthog.enableFeatureFlags).toBe('boolean');
      expect(typeof posthog.enableSessionRecording).toBe('boolean');
      expect(typeof posthog.respectDNT).toBe('boolean');
    });

    it('should have Vercel Analytics configuration', () => {
      const { vercel } = ANALYTICS_CONFIG;
      
      expect(typeof vercel.enabled).toBe('boolean');
      expect(typeof vercel.debug).toBe('boolean');
    });

    it('should enable PostHog only when API key is present', () => {
      const { posthog } = ANALYTICS_CONFIG;
      
      if (posthog.apiKey) {
        expect(posthog.enabled).toBe(true);
      } else {
        expect(posthog.enabled).toBe(false);
      }
    });
  });

  describe('Event Configuration', () => {
    it('should have search event names configured', () => {
      const { search } = ANALYTICS_CONFIG.events;
      
      expect(search.query).toBe('search_query');
      expect(search.autocomplete).toBe('search_autocomplete');
      expect(search.results).toBe('search_results');
    });

    it('should have filter event names configured', () => {
      const { filter } = ANALYTICS_CONFIG.events;
      
      expect(filter.applied).toBe('filter_applied');
      expect(filter.cleared).toBe('filter_cleared');
      expect(filter.category).toBe('filter_category');
      expect(filter.price).toBe('filter_price');
      expect(filter.location).toBe('filter_location');
    });

    it('should have interaction event names configured', () => {
      const { interaction } = ANALYTICS_CONFIG.events;
      
      expect(interaction.save).toBe('listing_saved');
      expect(interaction.unsave).toBe('listing_unsaved');
      expect(interaction.share).toBe('listing_shared');
      expect(interaction.contact).toBe('vendor_contacted');
      expect(interaction.view).toBe('listing_viewed');
      expect(interaction.like).toBe('listing_liked');
    });

    it('should have funnel event names configured', () => {
      const { funnel } = ANALYTICS_CONFIG.events;
      
      expect(funnel.view).toBe('funnel_view');
      expect(funnel.click).toBe('funnel_click');
      expect(funnel.contact).toBe('funnel_contact');
      expect(funnel.purchase).toBe('funnel_purchase');
    });

    it('should have scroll depth event names configured', () => {
      const { scroll } = ANALYTICS_CONFIG.events;
      
      expect(scroll.depth25).toBe('scroll_depth_25');
      expect(scroll.depth50).toBe('scroll_depth_50');
      expect(scroll.depth75).toBe('scroll_depth_75');
      expect(scroll.depth100).toBe('scroll_depth_100');
    });
  });

  describe('Privacy Settings', () => {
    it('should respect Do Not Track by default', () => {
      expect(ANALYTICS_CONFIG.posthog.respectDNT).toBe(true);
    });

    it('should mask all inputs by default for privacy', () => {
      expect(ANALYTICS_CONFIG.posthog.maskAllInputs).toBe(true);
    });

    it('should not mask all text by default (for usability)', () => {
      expect(ANALYTICS_CONFIG.posthog.maskAllText).toBe(false);
    });

    it('should have autocapture enabled by default', () => {
      expect(ANALYTICS_CONFIG.posthog.autocapture.enabled).toBe(true);
    });
  });

  describe('Autocapture Settings', () => {
    it('should capture pageviews', () => {
      expect(ANALYTICS_CONFIG.posthog.autocapture.capturePageview).toBe(true);
    });

    it('should capture pageleave', () => {
      expect(ANALYTICS_CONFIG.posthog.autocapture.capturePageleave).toBe(true);
    });

    it('should capture clicks', () => {
      expect(ANALYTICS_CONFIG.posthog.autocapture.captureClicks).toBe(true);
    });
  });
});
