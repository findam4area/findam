/**
 * Property-based tests for category badges
 * 
 * Property 11: Badge Logic Correctness
 * Property 12: Trending Categories Selection
 * Property 14: Subcategory Count Indicator
 * 
 * **Validates: Requirements 4.2, 4.3, 4.5, 1.4**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  categoryArbitrary,
  categoryListArbitrary,
  nonEmptyCategoryListArbitrary,
} from './arbitraries';
import { getCategoryBadges, type CategoryBadges } from '@/lib/utils/categories';
import type { Category } from '@/lib/types/core';

describe('Property 11: Badge Logic Correctness', () => {
  describe('Popular Badge (listing_count > 100)', () => {
    it('should mark category as popular when listing_count > 100', () => {
      fc.assert(
        fc.property(
          categoryArbitrary(),
          fc.integer({ min: 101, max: 1000 }),
          (category, listingCount) => {
            const cat = { ...category, listing_count: listingCount };
            const badges = getCategoryBadges(cat);

            // Property: listing_count > 100 implies isPopular = true
            expect(badges.isPopular).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT mark category as popular when listing_count <= 100', () => {
      fc.assert(
        fc.property(
          categoryArbitrary(),
          fc.integer({ min: 0, max: 100 }),
          (category, listingCount) => {
            const cat = { ...category, listing_count: listingCount };
            const badges = getCategoryBadges(cat);

            // Property: listing_count <= 100 implies isPopular = false
            expect(badges.isPopular).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have exact threshold at 100 (boundary test)', () => {
      const catAt100: Category = {
        id: '1',
        name: 'Test',
        slug: 'test',
        parent_id: null,
        description: null,
        image_url: null,
        display_order: 0,
        listing_count: 100,
      };

      const catAt101: Category = {
        ...catAt100,
        listing_count: 101,
      };

      const badges100 = getCategoryBadges(catAt100);
      const badges101 = getCategoryBadges(catAt101);

      // Property: Exactly at threshold should NOT be popular
      expect(badges100.isPopular).toBe(false);
      // Property: One above threshold should be popular
      expect(badges101.isPopular).toBe(true);
    });
  });

  describe('Recently Updated Badge (updated within 7 days)', () => {
    it('should mark category as recently updated when updated within 7 days', () => {
      fc.assert(
        fc.property(
          categoryArbitrary(),
          fc.integer({ min: 0, max: 6 }), // 0-6 days ago
          (category, daysAgo) => {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            const cat = { ...category, updated_at: date.toISOString() };
            const badges = getCategoryBadges(cat);

            // Property: Updated within 7 days implies isRecentlyUpdated = true
            expect(badges.isRecentlyUpdated).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT mark category as recently updated when updated 7+ days ago', () => {
      fc.assert(
        fc.property(
          categoryArbitrary(),
          fc.integer({ min: 7, max: 365 }), // 7-365 days ago
          (category, daysAgo) => {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            const cat = { ...category, updated_at: date.toISOString() };
            const badges = getCategoryBadges(cat);

            // Property: Updated 7+ days ago implies isRecentlyUpdated = false
            expect(badges.isRecentlyUpdated).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle missing updated_at (treat as not recently updated)', () => {
      fc.assert(
        fc.property(categoryArbitrary(), (category) => {
          const cat = { ...category, updated_at: undefined };
          const badges = getCategoryBadges(cat);

          // Property: No updated_at implies isRecentlyUpdated = false
          expect(badges.isRecentlyUpdated).toBe(false);
        }),
        { numRuns: 50 }
      );
    });

    it('should handle invalid date strings gracefully', () => {
      const cat: Category = {
        id: '1',
        name: 'Test',
        slug: 'test',
        parent_id: null,
        description: null,
        image_url: null,
        display_order: 0,
        listing_count: 10,
        updated_at: 'invalid-date',
      };

      const badges = getCategoryBadges(cat);

      // Property: Invalid date should not crash and should return false
      expect(badges.isRecentlyUpdated).toBe(false);
    });
  });

  describe('New Badge (created within 30 days)', () => {
    it('should mark category as new when created within 30 days', () => {
      fc.assert(
        fc.property(
          categoryArbitrary(),
          fc.integer({ min: 0, max: 29 }), // 0-29 days ago
          (category, daysAgo) => {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            const cat = { ...category, created_at: date.toISOString() };
            const badges = getCategoryBadges(cat);

            // Property: Created within 30 days implies isNew = true
            expect(badges.isNew).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT mark category as new when created 30+ days ago', () => {
      fc.assert(
        fc.property(
          categoryArbitrary(),
          fc.integer({ min: 30, max: 365 }), // 30-365 days ago
          (category, daysAgo) => {
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            const cat = { ...category, created_at: date.toISOString() };
            const badges = getCategoryBadges(cat);

            // Property: Created 30+ days ago implies isNew = false
            expect(badges.isNew).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle missing created_at (treat as not new)', () => {
      fc.assert(
        fc.property(categoryArbitrary(), (category) => {
          const cat = { ...category, created_at: undefined };
          const badges = getCategoryBadges(cat);

          // Property: No created_at implies isNew = false
          expect(badges.isNew).toBe(false);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Subcategory Count Indicator', () => {
    it('should correctly report subcategory count', () => {
      fc.assert(
        fc.property(
          categoryArbitrary(),
          fc.integer({ min: 0, max: 50 }),
          (category, count) => {
            const badges = getCategoryBadges(category, count);

            // Property: subcategoryCount should match input parameter
            expect(badges.subcategoryCount).toBe(count);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should default to 0 when no subcategory count provided', () => {
      fc.assert(
        fc.property(categoryArbitrary(), (category) => {
          const badges = getCategoryBadges(category);

          // Property: Default subcategoryCount should be 0
          expect(badges.subcategoryCount).toBe(0);
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Multiple Badge Combinations', () => {
    it('should allow multiple badges simultaneously', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 1000 * 60 * 60 * 24);

      const cat: Category = {
        id: '1',
        name: 'Test',
        slug: 'test',
        parent_id: null,
        description: null,
        image_url: null,
        display_order: 0,
        listing_count: 150, // Popular
        created_at: yesterday.toISOString(), // New
        updated_at: yesterday.toISOString(), // Recently Updated
      };

      const badges = getCategoryBadges(cat, 5); // Has subcategories

      // Property: Category can have all 4 badges at once
      expect(badges.isPopular).toBe(true);
      expect(badges.isNew).toBe(true);
      expect(badges.isRecentlyUpdated).toBe(true);
      expect(badges.subcategoryCount).toBe(5);
    });

    it('should allow no badges', () => {
      const longAgo = new Date();
      longAgo.setFullYear(longAgo.getFullYear() - 1);

      const cat: Category = {
        id: '1',
        name: 'Test',
        slug: 'test',
        parent_id: null,
        description: null,
        image_url: null,
        display_order: 0,
        listing_count: 50, // Not popular
        created_at: longAgo.toISOString(), // Not new
        updated_at: longAgo.toISOString(), // Not recently updated
      };

      const badges = getCategoryBadges(cat, 0); // No subcategories

      // Property: Category can have no badges
      expect(badges.isPopular).toBe(false);
      expect(badges.isNew).toBe(false);
      expect(badges.isRecentlyUpdated).toBe(false);
      expect(badges.subcategoryCount).toBe(0);
    });
  });

  describe('Badge Calculation is Pure Function', () => {
    it('should return same result for same input', () => {
      fc.assert(
        fc.property(
          categoryArbitrary(),
          fc.integer({ min: 0, max: 10 }),
          (category, subcategoryCount) => {
            const badges1 = getCategoryBadges(category, subcategoryCount);
            const badges2 = getCategoryBadges(category, subcategoryCount);

            // Property: Same input should produce identical output
            expect(badges1).toEqual(badges2);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

describe('Property 12: Trending Categories Selection', () => {
  /**
   * Get top 3 trending categories (by listing_count descending)
   */
  function getTrendingCategories(categories: Category[]): Category[] {
    return [...categories]
      .sort((a, b) => b.listing_count - a.listing_count)
      .slice(0, 3);
  }

  it('should return top 3 categories by listing_count descending', () => {
    fc.assert(
      fc.property(nonEmptyCategoryListArbitrary(), (categories) => {
        const trending = getTrendingCategories(categories);
        const expected = Math.min(3, categories.length);

        // Property: Returns at most 3 categories
        expect(trending.length).toBeLessThanOrEqual(3);
        expect(trending.length).toBe(expected);

        // Property: Trending categories are sorted by listing_count descending
        for (let i = 0; i < trending.length - 1; i++) {
          expect(trending[i].listing_count).toBeGreaterThanOrEqual(
            trending[i + 1].listing_count
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle fewer than 3 categories', () => {
    fc.assert(
      fc.property(
        fc.array(categoryArbitrary(), { minLength: 0, maxLength: 2 }),
        (categories) => {
          const trending = getTrendingCategories(categories);

          // Property: Returns all categories when fewer than 3
          expect(trending.length).toBe(categories.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return empty array for empty input', () => {
    const trending = getTrendingCategories([]);

    // Property: Empty input returns empty output
    expect(trending).toEqual([]);
  });

  it('should return categories with highest listing counts', () => {
    fc.assert(
      fc.property(nonEmptyCategoryListArbitrary(), (categories) => {
        if (categories.length < 4) return true; // Skip small lists

        const trending = getTrendingCategories(categories);
        const allListingCounts = categories.map((c) => c.listing_count).sort((a, b) => b - a);
        const top3Counts = allListingCounts.slice(0, 3);
        const trendingCounts = trending.map((c) => c.listing_count);

        // Property: Trending categories have the top 3 listing counts
        expect(trendingCounts).toEqual(top3Counts);
      }),
      { numRuns: 100 }
    );
  });

  it('should not modify the original array', () => {
    fc.assert(
      fc.property(categoryListArbitrary(), (categories) => {
        const original = [...categories];
        getTrendingCategories(categories);

        // Property: Original array should remain unchanged
        expect(categories).toEqual(original);
      }),
      { numRuns: 50 }
    );
  });
});

describe('Property 14: Subcategory Count Indicator', () => {
  /**
   * Check if category should show subcategory indicator
   */
  function shouldShowSubcategoryIndicator(subcategoryCount: number): boolean {
    return subcategoryCount > 0;
  }

  /**
   * Count direct children of a category
   */
  function countDirectChildren(
    categories: Category[],
    parentId: string
  ): number {
    return categories.filter((cat) => cat.parent_id === parentId).length;
  }

  it('should display indicator only when subcategories exist (count > 0)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 50 }), (count) => {
        const shouldShow = shouldShowSubcategoryIndicator(count);

        // Property: Indicator shown iff count > 0
        if (count > 0) {
          expect(shouldShow).toBe(true);
        } else {
          expect(shouldShow).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should count match actual number of direct children', () => {
    fc.assert(
      fc.property(
        categoryListArbitrary(),
        fc.uuid(),
        (categories, parentId) => {
          const count = countDirectChildren(categories, parentId);
          const children = categories.filter((cat) => cat.parent_id === parentId);

          // Property: Count should match number of children
          expect(count).toBe(children.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only count direct children, not grandchildren', () => {
    const parentId = 'parent-123';
    const childId = 'child-456';

    const categories: Category[] = [
      {
        id: parentId,
        name: 'Parent',
        slug: 'parent',
        parent_id: null,
        description: null,
        image_url: null,
        display_order: 0,
        listing_count: 0,
      },
      {
        id: childId,
        name: 'Child',
        slug: 'child',
        parent_id: parentId, // Direct child
        description: null,
        image_url: null,
        display_order: 0,
        listing_count: 0,
      },
      {
        id: 'grandchild-789',
        name: 'Grandchild',
        slug: 'grandchild',
        parent_id: childId, // Grandchild (not direct child)
        description: null,
        image_url: null,
        display_order: 0,
        listing_count: 0,
      },
    ];

    const count = countDirectChildren(categories, parentId);

    // Property: Should count only direct children (1), not grandchildren
    expect(count).toBe(1);
  });

  it('should return 0 for categories with no children', () => {
    fc.assert(
      fc.property(categoryListArbitrary(), fc.uuid(), (categories, randomId) => {
        // Ensure no category has this parent_id
        const categoriesWithoutChildren = categories.map((cat) => ({
          ...cat,
          parent_id: cat.parent_id === randomId ? null : cat.parent_id,
        }));

        const count = countDirectChildren(categoriesWithoutChildren, randomId);

        // Property: Categories without children should have count 0
        expect(count).toBe(0);
      }),
      { numRuns: 50 }
    );
  });
});
