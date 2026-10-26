/**
 * Analytics Property-Based Tests
 * Tests invariants and properties for analytics event tracking
 * Requirements: 18.11, 30.11
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import posthog from 'posthog-js';
import {
  trackEvent,
  trackSearch,
  trackFilter,
  trackFunnelStep,
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

describe('Analytics Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Event Timestamp Format
   * For any analytics event, the timestamp SHALL be in ISO 8601 format
   * Validates: Requirement 18.11
   */
  it('should always generate timestamps in ISO 8601 format', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // query
        fc.integer({ min: 0, max: 1000 }), // resultsCount
        (query, resultsCount) => {
          trackSearch(query, resultsCount);

          if (ANALYTICS_CONFIG.posthog.enabled && (posthog.capture as any).mock) {
            const callArgs = (posthog.capture as any).mock.calls[0];
            if (callArgs) {
              const properties = callArgs[1];
              const timestamp = properties.timestamp;

              // Verify ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
              expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
              
              // Verify it's a valid date
              const date = new Date(timestamp);
              expect(date.toISOString()).toBe(timestamp);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Event Name Consistency
   * For any event name, tracking the same event multiple times SHALL use the same event name
   * Validates: Requirement 18.3
   */
  it('should use consistent event names for the same event type', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.record({
          foo: fc.string(),
          bar: fc.integer(),
        }),
        (eventName, properties) => {
          vi.clearAllMocks();
          
          trackEvent(eventName, properties);
          const firstCall = (posthog.capture as any).mock.calls[0];
          
          trackEvent(eventName, properties);
          const secondCall = (posthog.capture as any).mock.calls[1];

          if (ANALYTICS_CONFIG.posthog.enabled && firstCall && secondCall) {
            // Same event name should be used
            expect(firstCall[0]).toBe(secondCall[0]);
            expect(firstCall[0]).toBe(eventName);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Funnel Step Order
   * For any funnel tracking, the funnel_step property SHALL match the step parameter
   * Validates: Requirement 18.4
   */
  it('should maintain funnel step consistency', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('view', 'click', 'contact', 'purchase'),
        fc.uuid(),
        (step, listingId) => {
          vi.clearAllMocks();
          
          trackFunnelStep(step, listingId);

          if (ANALYTICS_CONFIG.posthog.enabled && (posthog.capture as any).mock.calls[0]) {
            const properties = (posthog.capture as any).mock.calls[0][1];
            
            // Funnel step should match
            expect(properties.funnel_step).toBe(step);
            expect(properties.listing_id).toBe(listingId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Search Results Count Non-Negative
   * For any search tracking, the results count SHALL be non-negative
   * Validates: Requirement 18.3
   */
  it('should handle non-negative results counts', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 0, max: 10000 }),
        (query, resultsCount) => {
          vi.clearAllMocks();
          
          trackSearch(query, resultsCount);

          if (ANALYTICS_CONFIG.posthog.enabled && (posthog.capture as any).mock.calls[0]) {
            const properties = (posthog.capture as any).mock.calls[0][1];
            
            expect(properties.results_count).toBeGreaterThanOrEqual(0);
            expect(properties.results_count).toBe(resultsCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Filter Value Preservation
   * For any filter tracking, the filter value SHALL be preserved exactly as provided
   * Validates: Requirement 18.3
   */
  it('should preserve filter values exactly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('category', 'price', 'location', 'condition'),
        fc.oneof(
          fc.string(),
          fc.integer(),
          fc.record({
            min: fc.integer(),
            max: fc.integer(),
          })
        ),
        (filterType, filterValue) => {
          vi.clearAllMocks();
          
          trackFilter(filterType, filterValue);

          if (ANALYTICS_CONFIG.posthog.enabled && (posthog.capture as any).mock.calls[0]) {
            const properties = (posthog.capture as any).mock.calls[0][1];
            
            expect(properties.filter_type).toBe(filterType);
            expect(properties.filter_value).toEqual(filterValue);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Event Properties Immutability
   * For any event properties, the original properties object SHALL not be mutated
   * Validates: Requirement 30.6
   */
  it('should not mutate event properties', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.record({
          prop1: fc.string(),
          prop2: fc.integer(),
          prop3: fc.boolean(),
        }),
        (eventName, properties) => {
          const originalProperties = { ...properties };
          
          trackEvent(eventName, properties);

          // Original properties should remain unchanged
          expect(properties).toEqual(originalProperties);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Timestamp Ordering
   * For any sequence of events, later events SHALL have timestamps >= earlier events
   * Validates: Requirement 18.11
   */
  it('should maintain timestamp ordering for sequential events', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 10 }),
        (eventNames) => {
          vi.clearAllMocks();
          
          const timestamps: string[] = [];
          
          for (const eventName of eventNames) {
            trackEvent(eventName, {});
            
            if (ANALYTICS_CONFIG.posthog.enabled) {
              const lastCall = (posthog.capture as any).mock.calls[(posthog.capture as any).mock.calls.length - 1];
              if (lastCall && lastCall[1]) {
                timestamps.push(lastCall[1].timestamp);
              }
            }
          }

          // Verify timestamps are non-decreasing
          for (let i = 1; i < timestamps.length; i++) {
            const prevTime = new Date(timestamps[i - 1]).getTime();
            const currTime = new Date(timestamps[i]).getTime();
            
            expect(currTime).toBeGreaterThanOrEqual(prevTime);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Listing ID Format Preservation
   * For any listing ID provided to tracking functions, the ID SHALL be preserved exactly
   * Validates: Requirements 18.3, 18.4
   */
  it('should preserve listing IDs exactly across all tracking functions', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        (listingId, listingTitle) => {
          vi.clearAllMocks();

          // Track through funnel
          trackFunnelStep('view', listingId);
          const viewCall = (posthog.capture as any).mock.calls[0];

          trackFunnelStep('click', listingId);
          const clickCall = (posthog.capture as any).mock.calls[1];

          if (ANALYTICS_CONFIG.posthog.enabled && viewCall && clickCall) {
            expect(viewCall[1].listing_id).toBe(listingId);
            expect(clickCall[1].listing_id).toBe(listingId);
            expect(viewCall[1].listing_id).toBe(clickCall[1].listing_id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
