/**
 * Custom arbitraries for property-based testing
 * Generates random test data for categories, URLs, search queries, and dates
 */

import fc from 'fast-check';
import type { Category } from '@/lib/types/core';

/**
 * Generate a valid slug (lowercase alphanumeric with hyphens)
 */
export const slugArbitrary = (): fc.Arbitrary<string> =>
  fc
    .stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .filter((s) => s.length > 0 && s.length <= 50);

/**
 * Generate a valid HTTP(S) URL
 */
export const httpUrlArbitrary = (): fc.Arbitrary<string> =>
  fc.oneof(
    fc.webUrl({ validSchemes: ['http', 'https'] }),
    fc.constant('https://example.com/image.jpg'),
    fc.constant('https://images.unsplash.com/photo-12345')
  );

/**
 * Generate various URL formats including invalid ones
 */
export const urlArbitrary = (): fc.Arbitrary<string | null> =>
  fc.oneof(
    fc.constant(null), // No URL
    fc.constant(''), // Empty string
    fc.constant('not-a-url'), // Invalid format
    fc.constant('ftp://example.com'), // Invalid scheme
    fc.constant('/local/path/image.jpg'), // Local path
    httpUrlArbitrary(), // Valid HTTP(S) URL
  );

/**
 * Generate a date within a range of days from now
 */
export const dateArbitrary = (
  minDaysAgo: number,
  maxDaysAgo: number
): fc.Arbitrary<string> =>
  fc
    .integer({ min: minDaysAgo, max: maxDaysAgo })
    .map((daysAgo) => {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString();
    });

/**
 * Generate a date for testing "new" badge (0-40 days ago)
 */
export const newBadgeDateArbitrary = (): fc.Arbitrary<string> =>
  dateArbitrary(0, 40);

/**
 * Generate a date for testing "recently updated" badge (0-10 days ago)
 */
export const recentlyUpdatedDateArbitrary = (): fc.Arbitrary<string> =>
  dateArbitrary(0, 10);

/**
 * Generate a random category
 */
export const categoryArbitrary = (): fc.Arbitrary<Category> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    slug: slugArbitrary(),
    parent_id: fc.option(fc.uuid(), { nil: null }),
    description: fc.option(
      fc.string({ minLength: 10, maxLength: 200 }),
      { nil: null }
    ),
    image_url: urlArbitrary(),
    display_order: fc.integer({ min: 0, max: 1000 }),
    listing_count: fc.integer({ min: 0, max: 500 }),
    created_at: fc.option(dateArbitrary(0, 365), { nil: undefined }),
    updated_at: fc.option(dateArbitrary(0, 365), { nil: undefined }),
  });

/**
 * Generate a category with specific listing count range
 */
export const categoryWithListingCountArbitrary = (
  minCount: number,
  maxCount: number
): fc.Arbitrary<Category> =>
  categoryArbitrary().map((cat) => ({
    ...cat,
    listing_count: fc.sample(fc.integer({ min: minCount, max: maxCount }), 1)[0],
  }));

/**
 * Generate a category with specific parent_id value
 */
export const categoryWithParentIdArbitrary = (
  parentId: string | null
): fc.Arbitrary<Category> =>
  categoryArbitrary().map((cat) => ({
    ...cat,
    parent_id: parentId,
  }));

/**
 * Generate a search query (letters, spaces, special chars)
 */
export const searchQueryArbitrary = (): fc.Arbitrary<string> =>
  fc.oneof(
    fc.constant(''), // Empty search
    fc.string({ minLength: 1, maxLength: 50 }), // Any string
    fc.stringMatching(/^[a-zA-Z\s]+$/), // Letters and spaces only
    fc.constant('electronics'), // Common category name
    fc.constant('ELECTRONICS'), // Uppercase
    fc.constant('ElEcTrOnIcS'), // Mixed case
  );

/**
 * Generate sort options
 */
export const sortOptionArbitrary = (): fc.Arbitrary<string> =>
  fc.constantFrom(
    'alphabetical-asc',
    'alphabetical-desc',
    'most-listings',
    'fewest-listings',
    'recently-updated'
  );

/**
 * Generate show_only filter options
 */
export const showOnlyOptionArbitrary = (): fc.Arbitrary<string | null> =>
  fc.oneof(
    fc.constant(null),
    fc.constant('top_level'),
    fc.constant('has_listings')
  );

/**
 * Generate a category list (array of categories)
 */
export const categoryListArbitrary = (): fc.Arbitrary<Category[]> =>
  fc.array(categoryArbitrary(), { minLength: 0, maxLength: 20 });

/**
 * Generate a non-empty category list
 */
export const nonEmptyCategoryListArbitrary = (): fc.Arbitrary<Category[]> =>
  fc.array(categoryArbitrary(), { minLength: 1, maxLength: 20 });

/**
 * Generate a category with subcategories
 */
export const categoryWithSubcategoriesArbitrary = (): fc.Arbitrary<{
  parent: Category;
  subcategories: Category[];
}> =>
  fc
    .tuple(categoryArbitrary(), fc.array(categoryArbitrary(), { maxLength: 10 }))
    .map(([parent, subcats]) => ({
      parent,
      subcategories: subcats.map((sub) => ({ ...sub, parent_id: parent.id })),
    }));
