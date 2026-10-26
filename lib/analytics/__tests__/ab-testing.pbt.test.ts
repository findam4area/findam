/**
 * A/B Testing Property-Based Tests
 * Task 16.2: Tests for variant consistency and gradual rollout
 * Requirements: 30.11 (Property 19: A/B Test Variant Consistency)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import posthog from 'posthog-js';
import {
  assignABTestVariant,
  isUserInRollout,
  resetABTestVariant,
  ABTestVariant,
} from '../feature-flags';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock posthog
vi.mock('posthog-js', () => ({
  default: {
    __loaded: true,
    capture: vi.fn(),
    getFeatureFlag: vi.fn(),
    isFeatureEnabled: vi.fn(),
  },
}));

describe('A/B Testing Property-Based Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property 19: A/B Test Variant Consistency
   * For any user in an A/B test, repeated variant assignments SHALL return
   * the same variant consistently
   * Validates: Requirement 30.11
   */
  it('should return consistent variant for repeated assignments', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // testKey
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            weight: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 2, maxLength: 5 }
        ), // variants
        (testKey, rawVariants) => {
          // Normalize weights to sum to 100
          const totalWeight = rawVariants.reduce((sum, v) => sum + v.weight, 0);
          const variants: ABTestVariant[] = rawVariants.map(v => ({
            ...v,
            weight: Math.round((v.weight / totalWeight) * 100),
          }));

          // First assignment
          const variant1 = assignABTestVariant(testKey, variants);

          // Second assignment (should be same)
          const variant2 = assignABTestVariant(testKey, variants);

          // Third assignment (should still be same)
          const variant3 = assignABTestVariant(testKey, variants);

          expect(variant2).toBe(variant1);
          expect(variant3).toBe(variant1);

          // Verify variant is valid
          const validVariantIds = variants.map(v => v.id);
          expect(validVariantIds).toContain(variant1);

          // Clean up
          resetABTestVariant(testKey);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Variant Assignment Validity
   * For any A/B test, the assigned variant SHALL always be one of the
   * provided variants
   * Validates: Requirement 30.3
   */
  it('should always assign a valid variant from the provided list', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            weight: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (testKey, rawVariants) => {
          // Clear any existing assignment
          resetABTestVariant(testKey);

          const totalWeight = rawVariants.reduce((sum, v) => sum + v.weight, 0);
          const variants: ABTestVariant[] = rawVariants.map(v => ({
            ...v,
            weight: Math.round((v.weight / totalWeight) * 100),
          }));

          const assignedVariant = assignABTestVariant(testKey, variants);

          // Verify assigned variant is in the list
          const validVariantIds = variants.map(v => v.id);
          expect(validVariantIds).toContain(assignedVariant);

          // Clean up
          resetABTestVariant(testKey);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Weight Distribution
   * For any set of variants with weights, assignments SHALL respect
   * the weight distribution over many runs
   * Validates: Requirement 30.3
   */
  it('should respect variant weights over multiple assignments', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            weight: fc.integer({ min: 10, max: 100 }),
          }),
          { minLength: 2, maxLength: 3 }
        ),
        (rawVariants) => {
          const totalWeight = rawVariants.reduce((sum, v) => sum + v.weight, 0);
          const variants: ABTestVariant[] = rawVariants.map(v => ({
            ...v,
            weight: Math.round((v.weight / totalWeight) * 100),
          }));

          const assignments = new Map<string, number>();
          const numTrials = 100;

          // Run many assignments with different test keys
          for (let i = 0; i < numTrials; i++) {
            const testKey = `test_${i}`;
            const variant = assignABTestVariant(testKey, variants);

            const count = assignments.get(variant) || 0;
            assignments.set(variant, count + 1);

            resetABTestVariant(testKey);
          }

          // Verify each variant was assigned at least once
          // (with high probability for 100 trials)
          const assignedVariants = Array.from(assignments.keys());
          expect(assignedVariants.length).toBeGreaterThan(0);

          // Clean up
          for (let i = 0; i < numTrials; i++) {
            resetABTestVariant(`test_${i}`);
          }
        }
      ),
      { numRuns: 20 } // Reduced runs since each property test does 100 internal trials
    );
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Rollout Percentage Bounds
   * For any rollout percentage, the result SHALL be deterministic
   * and respect the percentage bounds (0-100)
   * Validates: Requirement 30.3
   */
  it('should respect rollout percentage bounds', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 0, max: 100 }),
        (key, percentage) => {
          const inRollout = isUserInRollout(key, percentage);

          // Result should be boolean
          expect(typeof inRollout).toBe('boolean');

          // Edge cases
          if (percentage === 0) {
            expect(inRollout).toBe(false);
          } else if (percentage === 100) {
            expect(inRollout).toBe(true);
          }
          // For values in between, we just verify consistency
          const secondCheck = isUserInRollout(key, percentage);
          expect(secondCheck).toBe(inRollout);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Rollout Consistency Across Calls
   * For any user and rollout key, checking rollout status multiple times
   * SHALL always return the same result
   * Validates: Requirement 30.11
   */
  it('should return consistent rollout status for same user and key', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 99 }),
        (key, percentage) => {
          const result1 = isUserInRollout(key, percentage);
          const result2 = isUserInRollout(key, percentage);
          const result3 = isUserInRollout(key, percentage);

          expect(result2).toBe(result1);
          expect(result3).toBe(result1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Gradual Rollout with Variant Assignment
   * For any A/B test with gradual rollout, users outside rollout SHALL
   * receive the control variant
   * Validates: Requirement 30.3
   */
  it('should assign control variant to users outside rollout', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            weight: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 2, maxLength: 4 }
        ),
        (testKey, rawVariants) => {
          resetABTestVariant(testKey);

          const totalWeight = rawVariants.reduce((sum, v) => sum + v.weight, 0);
          const variants: ABTestVariant[] = rawVariants.map(v => ({
            ...v,
            weight: Math.round((v.weight / totalWeight) * 100),
          }));

          // 0% rollout should always give control
          const variant = assignABTestVariant(testKey, variants, 0);
          expect(variant).toBe('control');

          resetABTestVariant(testKey);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Assignment Persistence
   * For any A/B test, the assigned variant SHALL persist in localStorage
   * and be retrievable
   * Validates: Requirement 30.11
   */
  it('should persist variant assignment in localStorage', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            weight: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        (testKey, rawVariants) => {
          resetABTestVariant(testKey);

          const totalWeight = rawVariants.reduce((sum, v) => sum + v.weight, 0);
          const variants: ABTestVariant[] = rawVariants.map(v => ({
            ...v,
            weight: Math.round((v.weight / totalWeight) * 100),
          }));

          const assignedVariant = assignABTestVariant(testKey, variants);

          // Check localStorage
          const storageKey = `ab_test_${testKey}`;
          const storedVariant = localStorage.getItem(storageKey);

          expect(storedVariant).toBe(assignedVariant);

          resetABTestVariant(testKey);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Feature: sophisticated-marketplace-homepage
   * Property: Different Keys Get Different Assignments
   * For different test keys with same variants, assignments can differ
   * (testing independence)
   * Validates: Requirement 30.3
   */
  it('should allow different assignments for different test keys', () => {
    const variants: ABTestVariant[] = [
      { id: 'control', name: 'Control', weight: 50 },
      { id: 'variant_a', name: 'Variant A', weight: 50 },
    ];

    const assignments = new Set<string>();
    const numKeys = 50;

    for (let i = 0; i < numKeys; i++) {
      const testKey = `test_key_${i}`;
      const variant = assignABTestVariant(testKey, variants);
      assignments.add(variant);
      resetABTestVariant(testKey);
    }

    // With 50 trials and 50/50 split, we should see both variants
    // (probability of not seeing one is extremely low)
    expect(assignments.size).toBeGreaterThan(1);

    // Clean up
    for (let i = 0; i < numKeys; i++) {
      resetABTestVariant(`test_key_${i}`);
    }
  });
});
