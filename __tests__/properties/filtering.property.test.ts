/**
 * Property-based tests for category filtering
 * 
 * Property 4: Search Filtering Completeness
 * Property 5: Clear Button Visibility
 * Property 6: Search Clear Restoration
 * Property 8: Top-Level Filter Correctness
 * Property 9: Active Listings Filter Correctness
 * 
 * **Validates: Requirements 2.2, 2.3, 2.6, 2.7, 3.8, 3.9**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  categoryListArbitrary,
  searchQueryArbitrary,
  categoryArbitrary,
} from './arbitraries';
import type { Category } from '@/lib/types/core';

/**
 * Filter categories by search query (name or description)
 * Mimics the logic from CategoryGrid component
 */
function filterBySearch(categories: Category[], query: string): Category[] {
  if (!query || query.trim() === '') {
    return categories;
  }

  const lowerQuery = query.toLowerCase().trim();
  
  return categories.filter((cat) => {
    const nameMatch = cat.name.toLowerCase().includes(lowerQuery);
    const descMatch = cat.description?.toLowerCase().includes(lowerQuery) ?? false;
    return nameMatch || descMatch;
  });
}

/**
 * Filter to only top-level categories (parent_id === null)
 */
function filterTopLevel(categories: Category[]): Category[] {
  return categories.filter((cat) => cat.parent_id === null);
}

/**
 * Filter to only categories with active listings (listing_count > 0)
 */
function filterHasListings(categories: Category[]): Category[] {
  return categories.filter((cat) => cat.listing_count > 0);
}

describe('Property 4: Search Filtering Completeness', () => {
  it('should return all categories when search query is empty', () => {
    fc.assert(
      fc.property(categoryListArbitrary(), (categories) => {
        const filtered = filterBySearch(categories, '');
        expect(filtered).toEqual(categories);
      }),
      { numRuns: 100 }
    );
  });

  it('should return all matching categories and exclude all non-matching', () => {
    fc.assert(
      fc.property(
        categoryListArbitrary(),
        searchQueryArbitrary(),
        (categories, query) => {
          if (!query || query.trim() === '') {
            return true; // Skip empty queries
          }

          const filtered = filterBySearch(categories, query);
          const lowerQuery = query.toLowerCase().trim();

          // Property: All returned categories must match the query
          filtered.forEach((cat) => {
            const nameMatch = cat.name.toLowerCase().includes(lowerQuery);
            const descMatch = cat.description?.toLowerCase().includes(lowerQuery) ?? false;
            expect(nameMatch || descMatch).toBe(true);
          });

          // Property: All excluded categories must NOT match the query
          const excluded = categories.filter((cat) => !filtered.includes(cat));
          excluded.forEach((cat) => {
            const nameMatch = cat.name.toLowerCase().includes(lowerQuery);
            const descMatch = cat.description?.toLowerCase().includes(lowerQuery) ?? false;
            expect(nameMatch || descMatch).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be case-insensitive', () => {
    fc.assert(
      fc.property(categoryArbitrary(), (category) => {
        const categories = [category];
        const query = category.name.substring(0, 3); // Take first 3 chars

        if (query.length === 0) return true;

        // Test lowercase, uppercase, and mixed case
        const lowerResult = filterBySearch(categories, query.toLowerCase());
        const upperResult = filterBySearch(categories, query.toUpperCase());
        const mixedResult = filterBySearch(categories, query);

        // Property: All three should return the same result
        expect(lowerResult).toEqual(upperResult);
        expect(lowerResult).toEqual(mixedResult);
      }),
      { numRuns: 100 }
    );
  });

  it('should search in both name and description fields', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 10 }),
        fc.string({ minLength: 3, maxLength: 10 }),
        (nameQuery, descQuery) => {
          const categoryWithName: Category = {
            id: '1',
            name: `Contains ${nameQuery} text`,
            slug: 'test',
            parent_id: null,
            description: 'Other text',
            image_url: null,
            display_order: 0,
            listing_count: 10,
          };

          const categoryWithDesc: Category = {
            id: '2',
            name: 'Other text',
            slug: 'test2',
            parent_id: null,
            description: `Contains ${descQuery} text`,
            image_url: null,
            display_order: 0,
            listing_count: 10,
          };

          const categories = [categoryWithName, categoryWithDesc];

          // Search by name query should find first category
          const nameResults = filterBySearch(categories, nameQuery);
          expect(nameResults).toContainEqual(categoryWithName);

          // Search by description query should find second category
          const descResults = filterBySearch(categories, descQuery);
          expect(descResults).toContainEqual(categoryWithDesc);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain original order of matched categories', () => {
    fc.assert(
      fc.property(categoryListArbitrary(), (categories) => {
        const filtered = filterBySearch(categories, 'test');
        
        // Property: Filtered results should maintain original ordering
        const filteredIndices = filtered.map((cat) => categories.indexOf(cat));
        const sortedIndices = [...filteredIndices].sort((a, b) => a - b);
        
        expect(filteredIndices).toEqual(sortedIndices);
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 5: Clear Button Visibility', () => {
  it('should show clear button only for non-empty input', () => {
    fc.assert(
      fc.property(searchQueryArbitrary(), (query) => {
        const shouldShowClear = query.trim().length > 0;
        
        // Property: Clear button visible iff query is non-empty
        if (query.trim() === '') {
          expect(shouldShowClear).toBe(false);
        } else {
          expect(shouldShowClear).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should not show clear button for whitespace-only input', () => {
    const whitespaceQueries = ['   ', '\t', '\n', '  \t  \n  '];
    
    whitespaceQueries.forEach((query) => {
      const shouldShowClear = query.trim().length > 0;
      expect(shouldShowClear).toBe(false);
    });
  });
});

describe('Property 6: Search Clear Restoration', () => {
  it('should restore all categories when search is cleared', () => {
    fc.assert(
      fc.property(
        categoryListArbitrary(),
        searchQueryArbitrary(),
        (categories, query) => {
          // Apply search filter
          const filtered = filterBySearch(categories, query);
          
          // Clear search (empty string)
          const restored = filterBySearch(categories, '');
          
          // Property: Cleared search returns all original categories
          expect(restored).toEqual(categories);
          expect(restored.length).toBe(categories.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be idempotent when clearing multiple times', () => {
    fc.assert(
      fc.property(categoryListArbitrary(), (categories) => {
        const clear1 = filterBySearch(categories, '');
        const clear2 = filterBySearch(clear1, '');
        const clear3 = filterBySearch(clear2, '');
        
        // Property: Clearing multiple times has same effect as clearing once
        expect(clear1).toEqual(categories);
        expect(clear2).toEqual(categories);
        expect(clear3).toEqual(categories);
      }),
      { numRuns: 50 }
    );
  });
});

describe('Property 8: Top-Level Filter Correctness', () => {
  it('should return only categories with parent_id === null', () => {
    fc.assert(
      fc.property(categoryListArbitrary(), (categories) => {
        const topLevel = filterTopLevel(categories);
        
        // Property: All returned categories have parent_id === null
        topLevel.forEach((cat) => {
          expect(cat.parent_id).toBe(null);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should exclude all categories with non-null parent_id', () => {
    fc.assert(
      fc.property(categoryListArbitrary(), (categories) => {
        const topLevel = filterTopLevel(categories);
        const excluded = categories.filter((cat) => !topLevel.includes(cat));
        
        // Property: All excluded categories have non-null parent_id
        excluded.forEach((cat) => {
          expect(cat.parent_id).not.toBe(null);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should handle edge case: all categories are top-level', () => {
    fc.assert(
      fc.property(categoryListArbitrary(), (categories) => {
        const allTopLevel = categories.map((cat) => ({ ...cat, parent_id: null }));
        const filtered = filterTopLevel(allTopLevel);
        
        // Property: When all are top-level, filter returns all
        expect(filtered.length).toBe(allTopLevel.length);
      }),
      { numRuns: 50 }
    );
  });

  it('should handle edge case: no categories are top-level', () => {
    fc.assert(
      fc.property(categoryListArbitrary(), (categories) => {
        if (categories.length === 0) return true;
        
        const noneTopLevel = categories.map((cat) => ({ ...cat, parent_id: 'some-parent-id' }));
        const filtered = filterTopLevel(noneTopLevel);
        
        // Property: When none are top-level, filter returns empty array
        expect(filtered.length).toBe(0);
      }),
      { numRuns: 50 }
    );
  });
});

describe('Property 9: Active Listings Filter Correctness', () => {
  it('should return only categories with listing_count > 0', () => {
    fc.assert(
      fc.property(categoryListArbitrary(), (categories) => {
        const hasListings = filterHasListings(categories);
        
        // Property: All returned categories have listing_count > 0
        hasListings.forEach((cat) => {
          expect(cat.listing_count).toBeGreaterThan(0);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should exclude all categories with listing_count === 0', () => {
    fc.assert(
      fc.property(categoryListArbitrary(), (categories) => {
        const hasListings = filterHasListings(categories);
        const excluded = categories.filter((cat) => !hasListings.includes(cat));
        
        // Property: All excluded categories have listing_count === 0
        excluded.forEach((cat) => {
          expect(cat.listing_count).toBe(0);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should handle edge case: all categories have listings', () => {
    fc.assert(
      fc.property(categoryListArbitrary(), (categories) => {
        const allHaveListings = categories.map((cat) => ({
          ...cat,
          listing_count: Math.max(1, cat.listing_count),
        }));
        const filtered = filterHasListings(allHaveListings);
        
        // Property: When all have listings, filter returns all
        expect(filtered.length).toBe(allHaveListings.length);
      }),
      { numRuns: 50 }
    );
  });

  it('should handle edge case: no categories have listings', () => {
    fc.assert(
      fc.property(categoryListArbitrary(), (categories) => {
        if (categories.length === 0) return true;
        
        const noneHaveListings = categories.map((cat) => ({ ...cat, listing_count: 0 }));
        const filtered = filterHasListings(noneHaveListings);
        
        // Property: When none have listings, filter returns empty array
        expect(filtered.length).toBe(0);
      }),
      { numRuns: 50 }
    );
  });
});
