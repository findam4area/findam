/**
 * Property-based tests for category navigation
 * 
 * Property 2: Category Card Required Fields
 * Property 3: Category Navigation Links
 * Property 10: URL State Persistence
 * 
 * **Validates: Requirements 1.6, 1.7, 3.10, 15.1-15.7**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  categoryArbitrary,
  searchQueryArbitrary,
  sortOptionArbitrary,
  showOnlyOptionArbitrary,
  slugArbitrary,
} from './arbitraries';
import type { Category } from '@/lib/types/core';

describe('Property 2: Category Card Required Fields', () => {
  /**
   * Check if category has all required fields for display
   */
  function hasRequiredFields(category: Category): boolean {
    return (
      typeof category.name === 'string' &&
      category.name.length > 0 &&
      typeof category.listing_count === 'number' &&
      category.listing_count >= 0
    );
  }

  /**
   * Truncate description to 2 lines (approximate: 100 chars)
   */
  function truncateDescription(description: string | null, maxLength: number = 100): string {
    if (!description) return '';
    return description.length > maxLength
      ? description.substring(0, maxLength) + '...'
      : description;
  }

  it('should always have required fields (name and listing_count)', () => {
    fc.assert(
      fc.property(categoryArbitrary(), (category) => {
        // Property: All generated categories have required fields
        expect(hasRequiredFields(category)).toBe(true);
        expect(category.name).toBeDefined();
        expect(category.listing_count).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should display listing count (never negative)', () => {
    fc.assert(
      fc.property(categoryArbitrary(), (category) => {
        // Property: listing_count is always non-negative
        expect(category.listing_count).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should truncate long descriptions to 2 lines', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 150, maxLength: 500 }),
        (longDescription) => {
          const truncated = truncateDescription(longDescription, 100);

          // Property: Truncated text is at most maxLength + 3 (for '...')
          expect(truncated.length).toBeLessThanOrEqual(103);

          // Property: Truncation adds '...' for long text
          if (longDescription.length > 100) {
            expect(truncated.endsWith('...')).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle null or empty descriptions gracefully', () => {
    const categoryWithNull: Category = {
      id: '1',
      name: 'Test',
      slug: 'test',
      parent_id: null,
      description: null,
      image_url: null,
      display_order: 0,
      listing_count: 10,
    };

    const truncated = truncateDescription(categoryWithNull.description);

    // Property: Null description returns empty string
    expect(truncated).toBe('');
  });

  it('should preserve short descriptions without truncation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (shortDescription) => {
          const truncated = truncateDescription(shortDescription, 100);

          // Property: Short text is unchanged
          expect(truncated).toBe(shortDescription);
          expect(truncated.endsWith('...')).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Property 3: Category Navigation Links', () => {
  /**
   * Generate navigation URL for a category
   */
  function getCategoryUrl(slug: string): string {
    return `/categories/${slug}`;
  }

  /**
   * Validate that slug is URL-safe
   */
  function isValidSlug(slug: string): boolean {
    // Slug should be lowercase, alphanumeric, and hyphens only
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
  }

  it('should generate correct URL for any category slug', () => {
    fc.assert(
      fc.property(categoryArbitrary(), (category) => {
        const url = getCategoryUrl(category.slug);

        // Property: URL always starts with /categories/
        expect(url).toMatch(/^\/categories\//);

        // Property: URL ends with the slug
        expect(url).toBe(`/categories/${category.slug}`);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle slugs with special characters (hyphens)', () => {
    const slugsWithHyphens = [
      'electronics-devices',
      'home-and-garden',
      'sports-and-outdoors',
      'health-beauty-wellness',
    ];

    slugsWithHyphens.forEach((slug) => {
      const url = getCategoryUrl(slug);

      // Property: URL correctly includes hyphenated slug
      expect(url).toBe(`/categories/${slug}`);
    });
  });

  it('should validate that all generated slugs are URL-safe', () => {
    fc.assert(
      fc.property(slugArbitrary(), (slug) => {
        // Property: All generated slugs pass URL-safe validation
        expect(isValidSlug(slug)).toBe(true);

        // Property: Slug has no spaces
        expect(slug).not.toMatch(/\s/);

        // Property: Slug is lowercase
        expect(slug).toBe(slug.toLowerCase());
      }),
      { numRuns: 100 }
    );
  });

  it('should create unique URLs for categories with different slugs', () => {
    fc.assert(
      fc.property(slugArbitrary(), slugArbitrary(), (slug1, slug2) => {
        const url1 = getCategoryUrl(slug1);
        const url2 = getCategoryUrl(slug2);

        // Property: Different slugs produce different URLs
        if (slug1 !== slug2) {
          expect(url1).not.toBe(url2);
        } else {
          expect(url1).toBe(url2);
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('Property 10: URL State Persistence', () => {
  interface FilterState {
    search?: string;
    sort?: string;
    show_only?: string | null;
  }

  /**
   * Build URL query string from filter state
   */
  function buildQueryString(state: FilterState): string {
    const params = new URLSearchParams();

    if (state.search && state.search.trim() !== '') {
      params.set('search', state.search);
    }

    if (state.sort) {
      params.set('sort', state.sort);
    }

    if (state.show_only) {
      params.set('show_only', state.show_only);
    }

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Parse query string back to filter state
   */
  function parseQueryString(queryString: string): FilterState {
    const params = new URLSearchParams(queryString);
    return {
      search: params.get('search') || undefined,
      sort: params.get('sort') || undefined,
      show_only: params.get('show_only') || undefined,
    };
  }

  it('should build correct query string from filter state', () => {
    fc.assert(
      fc.property(
        searchQueryArbitrary(),
        sortOptionArbitrary(),
        showOnlyOptionArbitrary(),
        (search, sort, showOnly) => {
          const state: FilterState = {
            search: search || undefined,
            sort,
            show_only: showOnly,
          };

          const queryString = buildQueryString(state);

          // Property: Empty state produces empty query string
          if (!state.search && !state.sort && !state.show_only) {
            expect(queryString).toBe('');
          }

          // Property: Query string starts with ? when not empty
          if (queryString.length > 0) {
            expect(queryString).toMatch(/^\?/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should round-trip: state → query → state (idempotent)', () => {
    fc.assert(
      fc.property(
        searchQueryArbitrary(),
        sortOptionArbitrary(),
        showOnlyOptionArbitrary(),
        (search, sort, showOnly) => {
          const originalState: FilterState = {
            search: search && search.trim() !== '' ? search : undefined,
            sort,
            show_only: showOnly,
          };

          // Convert to query string and back
          const queryString = buildQueryString(originalState);
          const parsedState = parseQueryString(queryString);

          // Property: Round-trip should preserve state
          // Note: undefined becomes null when not in URL (both represent "not set")
          expect(parsedState.search).toBe(originalState.search);
          expect(parsedState.sort).toBe(originalState.sort);
          
          // show_only can be null or undefined, both mean "not set"
          if (originalState.show_only === null || originalState.show_only === undefined) {
            expect(parsedState.show_only === null || parsedState.show_only === undefined).toBe(true);
          } else {
            expect(parsedState.show_only).toBe(originalState.show_only);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should omit empty search parameter from URL', () => {
    fc.assert(
      fc.property(sortOptionArbitrary(), (sort) => {
        const state: FilterState = {
          search: '', // Empty search
          sort,
        };

        const queryString = buildQueryString(state);

        // Property: Empty search should not appear in query string
        expect(queryString).not.toMatch(/search=/);
      }),
      { numRuns: 50 }
    );
  });

  it('should handle URL with multiple parameters', () => {
    const state: FilterState = {
      search: 'electronics',
      sort: 'most-listings',
      show_only: 'top_level',
    };

    const queryString = buildQueryString(state);

    // Property: Query string contains all parameters
    expect(queryString).toMatch(/search=electronics/);
    expect(queryString).toMatch(/sort=most-listings/);
    expect(queryString).toMatch(/show_only=top_level/);
  });

  it('should handle URL with single parameter', () => {
    fc.assert(
      fc.property(searchQueryArbitrary(), (search) => {
        if (!search || search.trim() === '') return true;

        const state: FilterState = { search };
        const queryString = buildQueryString(state);

        // Property: Single parameter URL is valid
        // Use URLSearchParams to build expected string (handles encoding correctly)
        const expectedParams = new URLSearchParams();
        expectedParams.set('search', search);
        const expected = `?${expectedParams.toString()}`;
        
        expect(queryString).toBe(expected);
      }),
      { numRuns: 50 }
    );
  });

  it('should URL-encode special characters in search query', () => {
    const specialCharQueries = [
      'electronics & devices',
      'home/garden',
      'sports+outdoors',
      'health=beauty',
    ];

    specialCharQueries.forEach((search) => {
      const state: FilterState = { search };
      const queryString = buildQueryString(state);

      // Property: Special characters are encoded
      expect(queryString).toMatch(/\?search=/);

      // Parse back and verify
      const parsed = parseQueryString(queryString);
      expect(parsed.search).toBe(search);
    });
  });

  it('should preserve all existing params when adding new param', () => {
    fc.assert(
      fc.property(
        searchQueryArbitrary(),
        sortOptionArbitrary(),
        (search, sort) => {
          if (!search || search.trim() === '') return true;

          // Start with search param
          const state1: FilterState = { search };
          const queryString1 = buildQueryString(state1);

          // Add sort param (simulating user interaction)
          const state2: FilterState = { search, sort };
          const queryString2 = buildQueryString(state2);

          // Property: New query string still contains original search param
          const parsed = parseQueryString(queryString2);
          expect(parsed.search).toBe(search);
          expect(parsed.sort).toBe(sort);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enable sharing: same URL produces same state', () => {
    fc.assert(
      fc.property(
        searchQueryArbitrary(),
        sortOptionArbitrary(),
        showOnlyOptionArbitrary(),
        (search, sort, showOnly) => {
          const state: FilterState = {
            search: search && search.trim() !== '' ? search : undefined,
            sort,
            show_only: showOnly,
          };

          const queryString = buildQueryString(state);

          // User 1 generates URL
          const user1State = parseQueryString(queryString);

          // User 2 receives same URL
          const user2State = parseQueryString(queryString);

          // Property: Both users see the same filter state
          expect(user1State).toEqual(user2State);
        }
      ),
      { numRuns: 100 }
    );
  });
});
