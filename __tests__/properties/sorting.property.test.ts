/**
 * Property-based tests for category sorting
 * 
 * Property 7: Category Sorting Correctness
 * Test sorting invariants for all sort options
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { categoryListArbitrary, nonEmptyCategoryListArbitrary } from './arbitraries';
import type { Category } from '@/lib/types/core';

type SortOption =
  | 'alphabetical-asc'
  | 'alphabetical-desc'
  | 'most-listings'
  | 'fewest-listings'
  | 'recently-updated';

/**
 * Sort categories based on selected option
 * Mimics the logic from CategoryGrid component
 */
function sortCategories(categories: Category[], sortOption: SortOption): Category[] {
  const sorted = [...categories]; // Create a copy to avoid mutation

  switch (sortOption) {
    case 'alphabetical-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'alphabetical-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));

    case 'most-listings':
      return sorted.sort((a, b) => b.listing_count - a.listing_count);

    case 'fewest-listings':
      return sorted.sort((a, b) => a.listing_count - b.listing_count);

    case 'recently-updated':
      return sorted.sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA; // Most recent first
      });

    default:
      return sorted;
  }
}

describe('Property 7: Category Sorting Correctness', () => {
  describe('Alphabetical Ascending', () => {
    it('should sort categories in alphabetical order (A-Z)', () => {
      fc.assert(
        fc.property(nonEmptyCategoryListArbitrary(), (categories) => {
          const sorted = sortCategories(categories, 'alphabetical-asc');

          // Property: Adjacent items should be in alphabetical order
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].name.localeCompare(sorted[i + 1].name)).toBeLessThanOrEqual(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should not modify the original array', () => {
      fc.assert(
        fc.property(categoryListArbitrary(), (categories) => {
          const original = [...categories];
          sortCategories(categories, 'alphabetical-asc');

          // Property: Original array should remain unchanged
          expect(categories).toEqual(original);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Alphabetical Descending', () => {
    it('should sort categories in reverse alphabetical order (Z-A)', () => {
      fc.assert(
        fc.property(nonEmptyCategoryListArbitrary(), (categories) => {
          const sorted = sortCategories(categories, 'alphabetical-desc');

          // Property: Adjacent items should be in reverse alphabetical order
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].name.localeCompare(sorted[i + 1].name)).toBeGreaterThanOrEqual(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should be the reverse of alphabetical-asc', () => {
      fc.assert(
        fc.property(categoryListArbitrary(), (categories) => {
          const asc = sortCategories(categories, 'alphabetical-asc');
          const desc = sortCategories(categories, 'alphabetical-desc');

          // Property: desc should be the reverse of asc
          expect(desc).toEqual(asc.reverse());
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Most Listings', () => {
    it('should sort categories by listing_count descending', () => {
      fc.assert(
        fc.property(nonEmptyCategoryListArbitrary(), (categories) => {
          const sorted = sortCategories(categories, 'most-listings');

          // Property: Adjacent items should have decreasing listing counts
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].listing_count).toBeGreaterThanOrEqual(sorted[i + 1].listing_count);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should place category with most listings first', () => {
      fc.assert(
        fc.property(nonEmptyCategoryListArbitrary(), (categories) => {
          if (categories.length === 0) return true;

          const sorted = sortCategories(categories, 'most-listings');
          const maxListingCount = Math.max(...categories.map((c) => c.listing_count));

          // Property: First category should have the maximum listing count
          expect(sorted[0].listing_count).toBe(maxListingCount);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Fewest Listings', () => {
    it('should sort categories by listing_count ascending', () => {
      fc.assert(
        fc.property(nonEmptyCategoryListArbitrary(), (categories) => {
          const sorted = sortCategories(categories, 'fewest-listings');

          // Property: Adjacent items should have increasing listing counts
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].listing_count).toBeLessThanOrEqual(sorted[i + 1].listing_count);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should place category with fewest listings first', () => {
      fc.assert(
        fc.property(nonEmptyCategoryListArbitrary(), (categories) => {
          if (categories.length === 0) return true;

          const sorted = sortCategories(categories, 'fewest-listings');
          const minListingCount = Math.min(...categories.map((c) => c.listing_count));

          // Property: First category should have the minimum listing count
          expect(sorted[0].listing_count).toBe(minListingCount);
        }),
        { numRuns: 50 }
      );
    });

    // Note: "Reverse" property removed - stable sort with duplicate values
    // means the reverse property doesn't always hold. Individual ordering tests
    // are sufficient to verify correct sort behavior.
  });

  describe('Recently Updated', () => {
    it('should sort categories by updated_at descending (most recent first)', () => {
      fc.assert(
        fc.property(nonEmptyCategoryListArbitrary(), (categories) => {
          const sorted = sortCategories(categories, 'recently-updated');

          // Property: Adjacent items should have decreasing update times
          for (let i = 0; i < sorted.length - 1; i++) {
            const dateA = sorted[i].updated_at
              ? new Date(sorted[i].updated_at!).getTime()
              : 0;
            const dateB = sorted[i + 1].updated_at
              ? new Date(sorted[i + 1].updated_at!).getTime()
              : 0;

            expect(dateA).toBeGreaterThanOrEqual(dateB);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should handle categories without updated_at (treat as oldest)', () => {
      const categoriesWithoutDates: Category[] = [
        {
          id: '1',
          name: 'No Date',
          slug: 'no-date',
          parent_id: null,
          description: null,
          image_url: null,
          display_order: 0,
          listing_count: 10,
          updated_at: undefined,
        },
        {
          id: '2',
          name: 'With Date',
          slug: 'with-date',
          parent_id: null,
          description: null,
          image_url: null,
          display_order: 0,
          listing_count: 10,
          updated_at: new Date().toISOString(),
        },
      ];

      const sorted = sortCategories(categoriesWithoutDates, 'recently-updated');

      // Property: Category with date should come before category without date
      expect(sorted[0].updated_at).toBeDefined();
      expect(sorted[1].updated_at).toBeUndefined();
    });
  });

  describe('Stable Sorting', () => {
    it('should maintain relative order for equal values (stable sort)', () => {
      const categoriesWithSameName: Category[] = [
        {
          id: '1',
          name: 'Same',
          slug: 'same-1',
          parent_id: null,
          description: 'First',
          image_url: null,
          display_order: 0,
          listing_count: 10,
        },
        {
          id: '2',
          name: 'Same',
          slug: 'same-2',
          parent_id: null,
          description: 'Second',
          image_url: null,
          display_order: 0,
          listing_count: 10,
        },
      ];

      const sorted = sortCategories(categoriesWithSameName, 'alphabetical-asc');

      // Property: Original order should be preserved for equal names
      // Note: JavaScript's Array.sort is stable as of ES2019
      expect(sorted[0].description).toBe('First');
      expect(sorted[1].description).toBe('Second');
    });
  });

  describe('General Sorting Properties', () => {
    it('should return the same number of categories', () => {
      fc.assert(
        fc.property(
          categoryListArbitrary(),
          fc.constantFrom(
            'alphabetical-asc' as const,
            'alphabetical-desc' as const,
            'most-listings' as const,
            'fewest-listings' as const,
            'recently-updated' as const
          ),
          (categories, sortOption) => {
            const sorted = sortCategories(categories, sortOption);

            // Property: Sorting doesn't add or remove categories
            expect(sorted.length).toBe(categories.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain all original categories (no duplicates, no missing)', () => {
      fc.assert(
        fc.property(
          categoryListArbitrary(),
          fc.constantFrom(
            'alphabetical-asc' as const,
            'alphabetical-desc' as const,
            'most-listings' as const,
            'fewest-listings' as const,
            'recently-updated' as const
          ),
          (categories, sortOption) => {
            const sorted = sortCategories(categories, sortOption);

            // Property: All original categories are present in sorted result
            categories.forEach((cat) => {
              expect(sorted).toContainEqual(cat);
            });

            // Property: No extra categories added
            sorted.forEach((cat) => {
              expect(categories).toContainEqual(cat);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be idempotent (sorting twice gives same result)', () => {
      fc.assert(
        fc.property(
          categoryListArbitrary(),
          fc.constantFrom(
            'alphabetical-asc' as const,
            'alphabetical-desc' as const,
            'most-listings' as const,
            'fewest-listings' as const,
            'recently-updated' as const
          ),
          (categories, sortOption) => {
            const sorted1 = sortCategories(categories, sortOption);
            const sorted2 = sortCategories(sorted1, sortOption);

            // Property: Sorting an already sorted array returns the same result
            expect(sorted2).toEqual(sorted1);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
