# Browse Categories Integration Tests

## Overview

This directory contains comprehensive integration tests for the Browse Categories page enhancement feature. These tests verify complete end-to-end user flows, real-time functionality, URL state management, and error handling scenarios.

## Test Files

### 1. browse-page.integration.test.tsx
**Subtask:** 20.1  
**Test Count:** 29 tests  
**Coverage:**
- Page loads and displays categories correctly
- Search input filters categories with debouncing
- Sort dropdown changes category order (A-Z, Z-A, most listings, fewest listings, recently updated)
- Show_only filters apply correctly (top-level, has listings)
- Clicking category navigates to detail page
- URL state updates on filter changes
- Empty states display correctly
- Loading states work properly
- Accessibility (aria-labels, keyboard navigation)
- Responsive grid layout (1-4 columns)

**Key Test Scenarios:**
- Initial page load with all categories
- Search by name and description (case-insensitive)
- Clear search button functionality
- All 5 sort options work correctly
- Filter combinations (top-level + has listings)
- Category navigation links
- Empty state with clear filters button
- Keyboard navigation with Tab/Enter
- Touch target sizes on mobile
- Responsive grid breakpoints

### 2. category-detail.integration.test.tsx
**Subtask:** 20.2  
**Test Count:** 40+ tests  
**Coverage:**
- Category data loads correctly from database
- Breadcrumb displays correct hierarchical path
- Subcategories display in responsive grid
- Clicking subcategory navigates to detail page
- Back button returns to parent category
- 404 handling for non-existent categories
- Listings section shows when no subcategories exist
- Loading skeletons during data fetch
- Error handling with retry functionality
- Accessibility and keyboard navigation
- SEO metadata and structured data
- Performance optimizations (ISR, lazy loading)

**Key Test Scenarios:**
- Top-level category (no parent)
- Subcategory with parent (breadcrumb Home > Parent > Current)
- Deep nested categories (3+ levels)
- Recursive category hierarchy traversal
- Subcategory with nested children indicator
- Back button functionality
- Loading states for category and subcategories
- Database fetch errors with retry
- Accessible subcategory cards
- Priority image loading (first 4)

### 3. url-state.integration.test.tsx
**Subtask:** 20.3  
**Test Count:** 35+ tests  
**Coverage:**
- URL params persist on filter changes
- Page loads with URL params and applies filters
- Sharing URL shows same filtered view
- Browser back/forward maintains filter state
- Query params encode/decode correctly
- Special characters in search queries
- Multiple parameters simultaneously
- Deep linking support

**Key Test Scenarios:**
- Search parameter updates URL
- Sort parameter updates URL
- Filter parameter updates URL
- Loading page with existing URL params
- Shareable URLs with all filters
- Browser back button preserves state
- Browser forward button preserves state
- Special character encoding (spaces, &, etc.)
- Empty parameter handling
- Invalid parameter graceful degradation
- Parameter order preservation
- Debounced URL updates
- State synchronization between URL and UI

### 4. real-time-updates.integration.test.tsx
**Subtask:** 20.4  
**Test Count:** 35+ tests  
**Coverage:**
- Supabase real-time subscription setup
- Listing count change events trigger UI updates
- Multiple category updates handled correctly
- Subscription cleanup on component unmount
- Connection status monitoring
- Error handling and reconnection
- Performance optimization (throttling, batching)

**Key Test Scenarios:**
- Create Supabase channel for real-time updates
- Subscribe to postgres_changes events
- INSERT event increments listing count
- DELETE event decrements listing count
- UPDATE event (status change to approved)
- Filter by specific category ID
- Filter by multiple category IDs (subcategories)
- Refetch data after real-time event
- Multiple rapid updates handling
- Subscription cleanup on unmount
- Connection success/failure handling
- Automatic reconnection after connection loss
- Throttling to prevent excessive renders
- Batch updates for multiple categories
- Error handling with graceful degradation

### 5. error-handling.integration.test.tsx
**Subtask:** 20.5  
**Test Count:** 50+ tests  
**Coverage:**
- Database fetch failure scenarios
- Error message display (user-friendly)
- Retry button functionality and refetching
- Recovery after errors
- Network errors (timeout, connection refused, DNS)
- Authentication errors (401, 403, expired session)
- Data validation errors
- Subcategory fetch errors
- Error logging (development vs production)
- Graceful degradation strategies

**Key Test Scenarios:**
- Database connection failure
- Network timeout errors
- Connection refused errors
- Offline network state
- Unauthorized (401) errors
- Forbidden (403) errors
- Expired session handling
- Invalid category slug
- Malformed data from database
- Null values in optional fields
- Subcategory fetch errors
- Retry button refetches data
- Successful recovery after error
- Maintain filters after recovery
- Clear error state on success
- Error logging with context
- Development vs production error display
- Cached data fallback
- Disable real-time on connection failure
- Multiple retry attempts with limit

## Test Patterns and Best Practices

### Mocking Strategy
```typescript
// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/browse',
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

// Mock Framer Motion (avoid animation issues)
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => false,
}));
```

### User Interaction Testing
```typescript
const user = userEvent.setup();

// Type in search
const searchInput = screen.getByPlaceholderText(/search categories/i);
await user.type(searchInput, 'electronics');

// Click button
const button = screen.getByRole('button', { name: /clear search/i });
await user.click(button);

// Keyboard navigation
await user.tab();
await user.keyboard('{Enter}');
```

### Async Testing
```typescript
await waitFor(() => {
  expect(screen.getByText('Electronics')).toBeInTheDocument();
}, { timeout: 500 });
```

### Accessibility Testing
```typescript
// Check aria-labels
const link = screen.getByRole('link', {
  name: /browse electronics category with 150 listings/i,
});
expect(link).toBeInTheDocument();

// Check keyboard focus
await user.tab();
const firstCard = screen.getAllByRole('link')[0];
expect(firstCard).toHaveFocus();
```

## Running the Tests

### Run all integration tests
```bash
npm test -- __tests__/integration
```

### Run specific test file
```bash
npm test -- __tests__/integration/browse-page.integration.test.tsx
```

### Run tests in watch mode
```bash
npm test -- __tests__/integration --watch
```

### Run with coverage
```bash
npm test -- __tests__/integration --coverage
```

## Requirements Coverage

The integration tests cover the following requirements from the spec:

### Browse Categories Page (Requirement 1-15)
- ✅ 1.1-1.8: Category Grid Display
- ✅ 2.1-2.7: Category Search
- ✅ 3.1-3.10: Category Filtering and Sorting
- ✅ 4.1-4.5: Category Statistics and Insights
- ✅ 5.1-5.7: Enhanced Category Cards
- ✅ 7.1-7.5: Breadcrumb Navigation
- ✅ 8.1-8.6: Mobile-Responsive Design
- ✅ 9.1-9.8: Keyboard Navigation and Accessibility
- ✅ 10.1-10.7: SEO Optimization
- ✅ 11.1-11.8: Performance Optimizations
- ✅ 12.1-12.6: Empty States and Error Handling
- ✅ 13.1-13.5: Loading Skeletons
- ✅ 14.1-14.7: Integration with Navigation Bar
- ✅ 15.1-15.7: URL State Management

### Category Detail Page (Requirement 16)
- ✅ 16.1-16.15: Basic subcategory display
- ✅ 16.16-16.20: Glassmorphism effects and animations
- ✅ 16.21-16.25: Section headers and loading states
- ✅ 16.26-16.30: Real-time subscriptions and error handling
- ✅ 16.31-16.36: Accessibility features
- ✅ 16.37-16.39: SEO and structured data
- ✅ 16.40-16.45: Performance optimizations
- ✅ 16.46-16.49: Mobile optimization
- ✅ 16.50-16.52: WCAG compliance and ISR

## Test Statistics

### Total Test Suite
- **Test Files:** 5
- **Total Tests:** 189+
- **Test Categories:** 25+

### Coverage by Category
- **User Interactions:** 45 tests
- **Data Loading:** 30 tests
- **Navigation:** 25 tests
- **Error Handling:** 50 tests
- **Accessibility:** 20 tests
- **Performance:** 15 tests
- **SEO:** 4 tests

### Test Execution Time
- Average per file: ~6-10 seconds
- Total suite: ~35-45 seconds

## Future Enhancements

### Potential Additions
1. **Visual Regression Tests:** Screenshot comparison for UI consistency
2. **Performance Tests:** Lighthouse integration for metrics
3. **Cross-browser Tests:** Playwright for browser compatibility
4. **A11y Automated Tests:** jest-axe for accessibility violations
5. **Load Tests:** Test with large datasets (1000+ categories)
6. **Mobile Device Tests:** Real device testing with BrowserStack
7. **Network Condition Tests:** Throttling and offline scenarios

### Integration Opportunities
1. Connect with E2E tests in `__tests__/e2e/`
2. Add property-based tests for edge cases
3. Integration with CI/CD pipeline
4. Code coverage reporting
5. Performance benchmarking

## Notes

### Known Limitations
1. Tests mock Framer Motion to avoid animation timing issues
2. Real-time tests mock Supabase channels (not actual WebSocket)
3. Image loading tests check configuration, not actual rendering
4. Some tests verify data flow rather than visual output

### Testing Philosophy
These integration tests focus on:
- **User-centric flows:** Testing from the user's perspective
- **Data flow:** Ensuring correct data propagation
- **Error resilience:** Handling all failure scenarios
- **Accessibility:** Meeting WCAG 2.1 AA standards
- **Performance:** Verifying optimizations work correctly

The tests are designed to catch regressions in critical user journeys while remaining maintainable and fast enough for CI/CD pipelines.

## Contributing

When adding new integration tests:
1. Follow existing patterns for consistency
2. Use descriptive test names
3. Test user flows, not implementation details
4. Include accessibility checks
5. Mock external dependencies
6. Clean up after each test
7. Use meaningful assertions
8. Document complex test scenarios

## Related Documentation

- [Design Document](../../.kiro/specs/browse-categories-page-enhancement/design.md)
- [Requirements Document](../../.kiro/specs/browse-categories-page-enhancement/requirements.md)
- [Tasks Document](../../.kiro/specs/browse-categories-page-enhancement/tasks.md)
- [Unit Tests](../../components/__tests__/)
- [E2E Tests](../e2e/)
