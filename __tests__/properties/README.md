# Property-Based Tests for Browse Categories Feature

This directory contains property-based tests using the fast-check library to validate the Browse Categories page enhancement. Property-based testing generates hundreds of random test cases to verify that invariants hold across all possible inputs.

## Test Files Overview

### 1. `arbitraries.ts`
Custom generators for creating random test data:
- **categoryArbitrary()**: Generates random categories with all fields
- **urlArbitrary()**: Generates various URL formats (valid, invalid, null)
- **slugArbitrary()**: Generates URL-safe slugs
- **searchQueryArbitrary()**: Generates search strings
- **sortOptionArbitrary()**: Generates sort option values
- **dateArbitrary()**: Generates dates for badge testing
- **categoryListArbitrary()**: Generates arrays of categories

### 2. `image-fallback.property.test.ts` (7 tests)
**Property 1: Image Fallback Handling**

Tests that image fallback logic handles all URL formats correctly:
- ✅ Null/empty URLs use fallback
- ✅ Valid HTTP/HTTPS URLs don't use fallback
- ✅ Local paths (starting with /) don't use fallback  
- ✅ Invalid formats (ftp://, plain text, etc.) use fallback
- ✅ All URL arbitrary values handled correctly

**Requirements Validated:** 1.5

### 3. `filtering.property.test.ts` (17 tests)
**Property 4: Search Filtering Completeness**
- ✅ Returns all categories when search is empty
- ✅ Returns all matching and excludes all non-matching
- ✅ Case-insensitive search
- ✅ Searches both name and description fields
- ✅ Maintains original ordering

**Property 5: Clear Button Visibility**
- ✅ Shows clear button only for non-empty input
- ✅ Hides for whitespace-only input

**Property 6: Search Clear Restoration**
- ✅ Restores all categories when search is cleared
- ✅ Idempotent (clearing multiple times has same effect)

**Property 8: Top-Level Filter Correctness**
- ✅ Returns only categories with parent_id === null
- ✅ Excludes all categories with non-null parent_id
- ✅ Handles edge cases (all top-level, none top-level)

**Property 9: Active Listings Filter Correctness**
- ✅ Returns only categories with listing_count > 0
- ✅ Excludes categories with listing_count === 0
- ✅ Handles edge cases (all have listings, none have listings)

**Requirements Validated:** 2.2, 2.3, 2.6, 2.7, 3.8, 3.9

### 4. `sorting.property.test.ts` (14 tests)
**Property 7: Category Sorting Correctness**

Tests all 5 sort options with comprehensive invariants:

**Alphabetical Ascending:**
- ✅ Adjacent items in alphabetical order
- ✅ Doesn't modify original array

**Alphabetical Descending:**
- ✅ Adjacent items in reverse alphabetical order
- ✅ Reverse of alphabetical-asc

**Most Listings:**
- ✅ Adjacent items have decreasing listing counts
- ✅ First category has maximum listing count

**Fewest Listings:**
- ✅ Adjacent items have increasing listing counts
- ✅ First category has minimum listing count

**Recently Updated:**
- ✅ Adjacent items have decreasing update times
- ✅ Categories without updated_at treated as oldest

**General Properties:**
- ✅ Stable sorting (maintains relative order for equal values)
- ✅ Returns same number of categories
- ✅ Contains all original categories (no duplicates/missing)
- ✅ Idempotent (sorting twice gives same result)

**Requirements Validated:** 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7

### 5. `badges.property.test.ts` (24 tests)
**Property 11: Badge Logic Correctness**

**Popular Badge (listing_count > 100):**
- ✅ Shows for listing_count > 100
- ✅ Doesn't show for listing_count ≤ 100
- ✅ Exact threshold at 100

**Recently Updated Badge (updated within 7 days):**
- ✅ Shows for updates within 7 days
- ✅ Doesn't show for updates 7+ days ago
- ✅ Handles missing updated_at
- ✅ Handles invalid date strings gracefully

**New Badge (created within 30 days):**
- ✅ Shows for categories created within 30 days
- ✅ Doesn't show for categories 30+ days old
- ✅ Handles missing created_at

**Subcategory Count:**
- ✅ Correctly reports subcategory count
- ✅ Defaults to 0 when not provided

**Multiple Badges:**
- ✅ Allows multiple badges simultaneously
- ✅ Allows no badges
- ✅ Badge calculation is pure function

**Property 12: Trending Categories Selection**
- ✅ Returns top 3 by listing_count descending
- ✅ Handles fewer than 3 categories
- ✅ Returns empty array for empty input
- ✅ Returns categories with highest listing counts
- ✅ Doesn't modify original array

**Property 14: Subcategory Count Indicator**
- ✅ Displays only when count > 0
- ✅ Count matches actual number of direct children
- ✅ Only counts direct children, not grandchildren
- ✅ Returns 0 for categories with no children

**Requirements Validated:** 4.2, 4.3, 4.5, 4.4, 1.4

### 6. `navigation.property.test.ts` (17 tests)
**Property 2: Category Card Required Fields**
- ✅ Always has required fields (name, listing_count)
- ✅ Listing count never negative
- ✅ Truncates long descriptions to 2 lines
- ✅ Handles null/empty descriptions gracefully
- ✅ Preserves short descriptions without truncation

**Property 3: Category Navigation Links**
- ✅ Generates correct URL for any slug
- ✅ Handles slugs with special characters (hyphens)
- ✅ All generated slugs are URL-safe
- ✅ Different slugs produce different URLs

**Property 10: URL State Persistence**
- ✅ Builds correct query string from filter state
- ✅ Round-trip: state → query → state (idempotent)
- ✅ Omits empty search parameter
- ✅ Handles URL with multiple parameters
- ✅ Handles URL with single parameter
- ✅ URL-encodes special characters
- ✅ Preserves existing params when adding new param
- ✅ Enables sharing (same URL produces same state)

**Requirements Validated:** 1.6, 1.7, 3.10, 15.1-15.7

### 7. `breadcrumb.property.test.ts` (12 tests)
**Property 13: Breadcrumb Path Construction**

Tests breadcrumb building with various parent chain depths:
- ✅ Always starts with Home
- ✅ Always ends with current category
- ✅ Correct length for top-level category (2 items)
- ✅ Builds correct path for nested categories (1-5 levels)
- ✅ Maintains correct order (root → leaf)
- ✅ Handles broken parent chain gracefully
- ✅ Detects and handles circular references (no infinite loop)
- ✅ Doesn't infinite loop on deep hierarchies (up to 20 levels)
- ✅ Generates valid href for all items
- ✅ Marks only the last item as current
- ✅ Deterministic (same input produces same output)
- ✅ Handles subcategories from arbitrary generator

**Requirements Validated:** 7.1, 7.2, 7.3, 16.11, 16.12

## Test Statistics

### Total Coverage
- **6 test files**
- **91 property tests**
- **14 properties validated**
- **Each property runs 50-100 test cases** (total: 4,500+ test executions)

### Properties Tested

| Property # | Description | Tests | File |
|------------|-------------|-------|------|
| 1 | Image Fallback Handling | 7 | image-fallback |
| 2 | Category Card Required Fields | 5 | navigation |
| 3 | Category Navigation Links | 4 | navigation |
| 4 | Search Filtering Completeness | 5 | filtering |
| 5 | Clear Button Visibility | 2 | filtering |
| 6 | Search Clear Restoration | 2 | filtering |
| 7 | Category Sorting Correctness | 14 | sorting |
| 8 | Top-Level Filter Correctness | 4 | filtering |
| 9 | Active Listings Filter Correctness | 4 | filtering |
| 10 | URL State Persistence | 8 | navigation |
| 11 | Badge Logic Correctness | 16 | badges |
| 12 | Trending Categories Selection | 5 | badges |
| 13 | Breadcrumb Path Construction | 12 | breadcrumb |
| 14 | Subcategory Count Indicator | 3 | badges |

### Requirements Coverage

| Requirement | Description | Properties |
|-------------|-------------|------------|
| 1.4 | Subcategory indicator | 14 |
| 1.5 | Image fallback | 1 |
| 1.6 | Category card fields | 2 |
| 1.7 | Category navigation | 3 |
| 2.2, 2.3 | Search filtering | 4 |
| 2.6 | Clear button visibility | 5 |
| 2.7 | Search clear restoration | 6 |
| 3.1-3.7 | Sorting | 7 |
| 3.8 | Top-level filter | 8 |
| 3.9 | Active listings filter | 9 |
| 3.10 | URL state management | 10 |
| 4.2, 4.3, 4.5 | Badge logic | 11 |
| 4.4 | Trending categories | 12 |
| 7.1-7.3 | Breadcrumb navigation | 13 |
| 15.1-15.7 | URL sharing | 10 |
| 16.11, 16.12 | Hierarchical breadcrumb | 13 |

## Running the Tests

```bash
# Run all property tests
npm test __tests__/properties/

# Run specific test file
npm test __tests__/properties/image-fallback.property.test.ts

# Run with verbose output
npm test -- __tests__/properties/ --reporter=verbose

# Run with coverage
npm test -- __tests__/properties/ --coverage
```

## Key Features of These Tests

### 1. Shrinking
When a property fails, fast-check automatically shrinks the failing input to the minimal counterexample, making debugging easier.

### 2. Randomization
Each test run uses different random values, increasing the likelihood of finding edge cases.

### 3. Reproducibility
Failed tests include a seed value that can be used to reproduce the exact same test case.

### 4. Comprehensive Coverage
By testing hundreds of random inputs, we verify behavior across:
- Empty inputs
- Single items
- Large arrays
- Edge cases (null, undefined, empty strings)
- Boundary values (exactly at thresholds)
- Extreme values (very long strings, deep hierarchies)

### 5. Pure Function Testing
All properties test pure functions that:
- Don't mutate original inputs
- Always return the same output for the same input
- Have no side effects

## Property-Based Testing Benefits

1. **Finds edge cases** you wouldn't think to test manually
2. **Documents invariants** as executable specifications
3. **Reduces test maintenance** - one property test replaces many unit tests
4. **Increases confidence** - hundreds of test cases per property
5. **Catches regressions** - random testing finds issues missed by static tests

## Next Steps

To add more property tests:

1. Create a new test file in `__tests__/properties/`
2. Import arbitraries from `arbitraries.ts`
3. Write property tests using `fc.assert()` and `fc.property()`
4. Document the property being tested with comments
5. Reference the requirement numbers being validated

Example:
```typescript
it('should maintain some invariant', () => {
  fc.assert(
    fc.property(categoryArbitrary(), (category) => {
      // Test invariant here
      expect(someFunction(category)).toBe(expectedValue);
    }),
    { numRuns: 100 } // Run 100 random test cases
  );
});
```
