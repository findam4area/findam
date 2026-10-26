# Implementation Plan: Browse Categories Page Enhancement

## Overview

Transform the `/browse` page from a listings display into a comprehensive categories browsing experience with hierarchical subcategory support, search/filtering capabilities, and enhanced visual design. This implementation includes database migrations, translation infrastructure removal, 13 new/enhanced components, and comprehensive testing.

## Tasks

- [x] 1. Database schema updates and migrations
  - [x] 1.1 Create migration to add slug column if missing
    - Write migration file `supabase/migrations/0XX_add_category_slug.sql`
    - Generate slugs for existing categories from their names
    - Add unique index on slug column
    - Test migration on local database
    - _Requirements: 1.7, 16.1, 16.9_
  
  - [x] 1.2 Create migration to remove translation infrastructure
    - Write migration file `supabase/migrations/0XX_remove_translation_columns.sql`
    - Drop name_translations and description_translations columns
    - Drop GIN indexes for translation columns
    - Update table comments to remove translation references
    - Test migration on local database
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [x] 2. Remove translation infrastructure from codebase
  - [x] 2.1 Delete language selector component
    - Remove file `components/categories/language-selector.tsx`
    - Verify no other files import or reference this component
    - _Requirements: 17.5, 17.6, 17.7_
  
  - [x] 2.2 Update TypeScript type definitions
    - Remove name_translations and description_translations from Category interface in `lib/types/core.ts`
    - Remove language parameter types and translation-related types
    - Update all type imports across the codebase
    - _Requirements: 17.14, 17.15_
  
  - [x] 2.3 Remove translation logic from database service
    - Update `lib/services/database.ts` transformCategory function to use name/description directly
    - Remove language query parameter handling from category fetch functions
    - Update all category queries to exclude translation columns
    - _Requirements: 17.8, 17.9, 17.10, 17.11, 17.17_
  
  - [x] 2.4 Clean up translation utility functions
    - Search codebase for translation utility functions (grep for "translation", "translate", "lang")
    - Remove utility functions specifically for handling translations
    - Remove language detection or language preference logic
    - _Requirements: 17.13, 17.18, 17.19_

- [ ] 3. Create shared UI components
  - [x] 3.1 Create Breadcrumb component
    - Create `components/shared/breadcrumb.tsx` with BreadcrumbItem interface
    - Implement semantic HTML with nav element and aria-label="breadcrumb"
    - Add schema.org BreadcrumbList structured data
    - Support current page indicator (last item)
    - Style with responsive design and hover states
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 16.37, 16.38_
  
  - [x] 3.2 Create LoadingSkeleton component
    - Create `components/shared/loading-skeleton.tsx`
    - Implement shimmer animation with CSS keyframes
    - Support configurable count and layout (grid/list)
    - Match responsive grid layout (1-4 columns)
    - Style with gray-800 background and shimmer effect
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 16.23, 16.24_
  
  - [x] 3.3 Create EmptyState component
    - Create `components/shared/empty-state.tsx`
    - Support customizable title, message, icon, and action button
    - Implement centered layout with icon, heading, and description
    - Add optional action button (e.g., "Clear Filters", "Retry")
    - Style with accessible contrast and responsive design
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 4. Enhance CategoryCard component
  - [x] 4.1 Add Framer Motion animations to CategoryCard
    - Add fade-in and slide-up animation on initial render
    - Implement staggered animation delays based on index prop
    - Add hover scale effect (1.05x) with smooth transition
    - Ensure animations respect prefers-reduced-motion
    - _Requirements: 5.1, 5.2, 5.6_
  
  - [x] 4.2 Add hover effects and visual enhancements
    - Implement gradient border animation on hover using CSS pseudo-elements
    - Add image overlay brightness change on hover
    - Add "Explore Category" button overlay on hover (desktop only)
    - Add bottom gradient indicator bar that scales on hover
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [x] 4.3 Add category badges to CategoryCard
    - Implement getCategoryBadges utility function in `lib/utils/categories.ts`
    - Add "Popular" badge when listing_count > 100
    - Add "Recently Updated" badge when updated within 7 days
    - Add "New" badge when created within 30 days
    - Add subcategory count indicator when category has children
    - _Requirements: 1.4, 4.2, 4.3, 4.5_
  
  - [x] 4.4 Optimize CategoryCard images
    - Use Next.js Image component with priority for first 6 cards
    - Implement responsive sizes attribute for different viewports
    - Add blur placeholder with generateBlurDataURL function
    - Implement lazy loading for images below the fold
    - Add image error handling with fallback placeholder
    - _Requirements: 1.5, 5.7, 11.3, 11.4_
  
  - [x] 4.5 Enhance CategoryCard accessibility
    - Add descriptive aria-label with category name and listing count
    - Implement visible focus ring with 2px primary-500 color
    - Support keyboard navigation (Enter/Space to navigate)
    - Ensure minimum 44x44px touch targets on mobile
    - Add tap animation on mobile (scale down to 0.98)
    - _Requirements: 9.3, 9.4, 9.5, 8.2, 8.3_

- [ ] 5. Create search and filter components
  - [x] 5.1 Create CategorySearch component
    - Create `components/features/category-search.tsx` as client component
    - Implement search input with clear button
    - Add debounced search with 300ms delay using use-debounce
    - Update URL query params on search change
    - Make search bar sticky on mobile
    - Add accessible label and search icon
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 8.5_
  
  - [x] 5.2 Create CategoryFilters component
    - Create `components/features/category-filters.tsx` as client component
    - Add sort dropdown with 5 options (alphabetical asc/desc, most/fewest listings, recently updated)
    - Add "top-level only" checkbox filter
    - Add "has listings" checkbox filter
    - Update URL query params on filter changes
    - Implement mobile responsive layout (vertical stack)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 8.1_
  
  - [x] 5.3 Create CategoryStats component
    - Create `components/features/category-stats.tsx`
    - Display total categories count and total listings count
    - Show trending section with top 3 categories by listing count
    - Style with grid layout (1-3 columns responsive)
    - Add icons for each stat card (FolderOpen, Package, TrendingUp)
    - _Requirements: 4.1, 4.4_

- [x] 6. Create CategoryGrid component
  - [x] 6.1 Create CategoryGrid with filtering logic
    - Create `components/features/category-grid.tsx` as client component
    - Implement client-side filtering by search query (name and description)
    - Implement client-side sorting based on selected option
    - Use useMemo for performance optimization
    - Handle empty state with EmptyState component
    - _Requirements: 1.2, 1.3, 2.2, 2.3, 2.4, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [x] 6.2 Implement responsive grid layout
    - Configure Tailwind grid: 1 col mobile, 2 tablet, 3 desktop, 4 large screens
    - Map categories with CategoryCard, passing index for animations
    - Handle loading state with LoadingSkeleton
    - Handle error state with error message display
    - _Requirements: 1.3, 13.5_

- [x] 7. Create CategoryPreviewPopover component
  - [x] 7.1 Build hover preview popover (desktop only)
    - Create `components/features/category-preview-popover.tsx` as client component
    - Implement 500ms hover delay before showing
    - Fetch subcategories (up to 5) and top 3 listings on hover
    - Use floating-ui for positioning
    - Display subcategories with names and listing counts
    - Display top 3 listings with thumbnails and titles
    - Add "View All" link to category detail page
    - Close after 200ms mouse leave
    - Desktop only (min-width 1024px)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [x] 7.2 Make popover keyboard accessible
    - Support keyboard focus and tab navigation
    - Close with Escape key
    - Ensure WCAG 2.1 compliance
    - _Requirements: 9.7_

- [x] 8. Create BrowsePage server component
  - [x] 8.1 Create new browse page structure
    - Create/update `app/(public)/browse/page.tsx` as server component
    - Parse URL search params (search, sort, show_only)
    - Fetch categories from database with getCategories function
    - Apply server-side filtering for show_only param
    - Render page header with title and description
    - _Requirements: 1.1, 3.8, 3.9_
  
  - [x] 8.2 Integrate all components in BrowsePage
    - Add CategorySearch with initialSearch prop
    - Add CategoryFilters with initialSort and initialShowOnly props
    - Add CategoryStats with category statistics
    - Add CategoryGrid with filtered categories
    - Add Footer component at bottom
    - Implement ISR with 3600s revalidate
    - _Requirements: 1.2, 14.1, 14.2, 18.1, 18.2, 18.3, 11.1_
  
  - [x] 8.3 Add SEO metadata to BrowsePage
    - Set page title: "Browse Categories - FindAm"
    - Add meta description about exploring categories
    - Add Open Graph meta tags for social sharing
    - Add canonical URL meta tag pointing to "/browse"
    - Implement schema.org CollectionPage structured data
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 9. Create subcategory components
  - [x] 9.1 Create SubcategoryCard component
    - Create `components/features/subcategory-card.tsx` as client component
    - Implement glassmorphism design (backdrop-blur, semi-transparent bg, border)
    - Add Framer Motion animations (fade-in, slide-up with staggered delays)
    - Add hover effects (3% scale, gradient border, image brightness)
    - Display subcategory image, name, description (2 lines), listing count
    - Show nested subcategory indicator when subcategory has children
    - Add fixed aspect ratio (4/3) to prevent layout shifts
    - _Requirements: 16.7, 16.8, 16.16, 16.17, 16.18, 16.19, 16.20, 16.44_
  
  - [x] 9.2 Create SubcategoryGrid component
    - Create `components/features/subcategory-grid.tsx` as client component
    - Implement responsive grid (2 cols mobile, 3 tablet, 4 desktop)
    - Map subcategories to SubcategoryCard with index prop
    - Add section header "Explore Subcategories" with gradient underline
    - Display subcategory count (e.g., "12 subcategories available")
    - Implement real-time updates with Supabase subscriptions
    - _Requirements: 16.6, 16.21, 16.22, 16.27_
  
  - [x] 9.3 Enhance SubcategoryCard accessibility
    - Add descriptive aria-label with subcategory name, listing count, nested count
    - Implement visible focus ring with 3px offset and primary-500 color
    - Support keyboard navigation (Enter/Space to navigate)
    - Ensure minimum 44x44px touch targets on mobile
    - Add tap animation on mobile (scale down to 0.97)
    - _Requirements: 16.32, 16.35, 16.36, 16.49, 16.50_

- [x] 10. Create CategoryDetailPage server component
  - [x] 10.1 Create category detail page structure
    - Create `app/(main)/categories/[slug]/page.tsx` as server component
    - Parse slug param and fetch category by slug with getCategoryBySlug
    - Fetch subcategories where parent_id equals current category id
    - Return 404 if category not found
    - Implement ISR with 1800s revalidate
    - _Requirements: 16.1, 16.2, 16.3, 16.52_
  
  - [x] 10.2 Build hierarchical breadcrumb
    - Implement buildCategoryBreadcrumb function to traverse parent chain
    - Recursively fetch parent categories up to root
    - Build breadcrumb items array from root to current category
    - Render Breadcrumb component with full path
    - _Requirements: 16.11, 16.12, 16.13_
  
  - [x] 10.3 Add parent navigation and category header
    - Fetch parent category when parent_id is not null
    - Display "Back to {Parent_Category_Name}" button above header
    - Implement category header section with image, name, full description
    - _Requirements: 16.4, 16.13, 16.14_
  
  - [x] 10.4 Integrate subcategories section
    - Conditionally render SubcategoryGrid when subcategories exist
    - Pass subcategories array to SubcategoryGrid component
    - Display LoadingSkeleton while fetching subcategory data
    - Handle subcategory fetch errors with error message and retry button
    - _Requirements: 16.5, 16.6, 16.15, 16.29_
  
  - [x] 10.5 Add category listings section
    - Create CategoryListingsSection component showing listings in the category
    - Integrate with existing listing display components
    - Support pagination or infinite scroll
    - _Requirements: 16.1_
  
  - [x] 10.6 Add Footer to CategoryDetailPage
    - Import and render Footer component at bottom of page
    - Ensure consistent footer display across all pages
    - _Requirements: 18.1, 18.2, 18.3, 18.10_
  
  - [x] 10.7 Add SEO metadata to CategoryDetailPage
    - Set page title: "{Category_Name} - Browse Subcategories - FindAm"
    - Add meta description with category description
    - Add Open Graph meta tags with category info
    - Add canonical URL meta tag pointing to "/categories/{slug}"
    - Implement proper heading hierarchy (h1 for category, h2 for sections)
    - _Requirements: 16.39, 16.46, 16.47, 16.48_
  
  - [x] 10.8 Implement category not found page
    - Create `app/(main)/categories/[slug]/not-found.tsx`
    - Display friendly 404 message with link back to browse page
    - Style consistently with site design
    - _Requirements: 16.1_

- [x] 11. Add URL state management
  - [x] 11.1 Implement URL state persistence
    - Update CategorySearch to update URL search param on change
    - Update CategoryFilters to update URL sort and show_only params
    - Use Next.js useSearchParams and useRouter for URL manipulation
    - Preserve all existing params when updating individual params
    - _Requirements: 3.10, 15.1, 15.2, 15.3, 15.4_
  
  - [x] 11.2 Implement URL state restoration
    - Parse URL params on page load in BrowsePage
    - Pass initial values to CategorySearch and CategoryFilters
    - Apply filters and sorting based on URL params
    - Enable sharing and bookmarking of filtered views
    - _Requirements: 15.5, 15.6, 15.7_

- [x] 12. Implement database service functions
  - [x] 12.1 Create category fetch functions
    - Implement getCategories() to fetch all categories ordered by display_order
    - Implement getCategoryBySlug(slug, includeSubcategories) with optional subcategories
    - Implement getTopLevelCategories() for footer and filtering
    - Implement getCategoryById(id) for breadcrumb construction
    - Add proper error handling and logging for all functions
    - _Requirements: 1.1, 16.2, 16.3, 18.19_
  
  - [x] 12.2 Optimize database queries
    - Add batch fetching with relations (subcategories count)
    - Ensure proper index usage (parent_id, display_order, slug, listing_count)
    - Use single query with joins to avoid N+1 queries
    - _Requirements: Performance optimization_

- [x] 13. Add error handling and loading states
  - [x] 13.1 Implement error boundaries
    - Create global error boundary in `app/error.tsx` if not exists
    - Create page-level error handling in BrowsePage and CategoryDetailPage
    - Display user-friendly error messages with retry buttons
    - Log errors to monitoring service (Sentry already configured)
    - _Requirements: 12.5, 12.6, 16.28, 16.29, 16.30_
  
  - [x] 13.2 Add loading states
    - Display LoadingSkeleton while categories are being fetched
    - Display LoadingSkeleton for subcategories in CategoryDetailPage
    - Use React Suspense for streaming category data
    - Implement smooth fade transition from skeleton to actual content
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 11.2, 16.23, 16.24, 16.25_

- [x] 14. Ensure footer displays consistently
  - [x] 14.1 Verify footer on BrowsePage
    - Ensure Footer component is imported and rendered at bottom
    - Test footer displays with all 4 columns (About, Categories, For Vendors, Legal)
    - Verify footer is responsive on mobile, tablet, desktop
    - Verify Categories column populates with top-level categories
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.15, 18.16, 18.17, 18.19_
  
  - [x] 14.2 Verify footer on CategoryDetailPage
    - Ensure Footer component is imported and rendered at bottom
    - Test footer displays consistently with same styling as other pages
    - Verify social media links and copyright display correctly
    - _Requirements: 18.10, 18.11, 18.12, 18.13, 18.14, 18.18_
  
  - [x] 14.3 Remove conflicting About sections
    - Search for any About_Categories_Section on categories pages
    - Remove entire About_Categories_Section if it exists (distinct from Footer)
    - Ensure Footer Categories_Column remains unchanged
    - _Requirements: 18.8, 18.9_

- [x] 15. Checkpoint - Core functionality complete
  - Ensure all pages load without errors
  - Test category browsing, search, filtering, and sorting
  - Test category detail pages with subcategories
  - Test navigation between pages
  - Verify footer displays on all pages
  - Ask the user if questions arise

- [x] 16. Implement accessibility enhancements
  - [x] 16.1 Add keyboard navigation support
    - Ensure all interactive elements are keyboard accessible
    - Implement logical tab order (search → filters → cards)
    - Add visible focus indicators with 2px primary-500 outline
    - Ensure no keyboard traps exist
    - Test Escape key closes popovers and modals
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.7, 16.34, 16.35, 16.36_
  
  - [x] 16.2 Add screen reader support
    - Use semantic HTML (nav, main, section, article)
    - Add ARIA labels to icon buttons and interactive elements
    - Implement ARIA landmarks (role="navigation", role="main")
    - Set focus on main heading when CategoryDetailPage loads
    - Add live regions for dynamic updates (aria-live="polite")
    - _Requirements: 9.5, 9.6, 16.32, 16.33_
  
  - [x] 16.3 Ensure color contrast compliance
    - Test all text meets WCAG 2.1 Level AA contrast ratios (4.5:1)
    - Ensure badges use icons + text, not color alone
    - Test UI with grayscale to verify information isn't lost
    - _Requirements: 9.8, 16.51_
  
  - [x] 16.4 Add skip links and touch targets
    - Add "Skip to main content" link at top of page
    - Ensure minimum 44x44px touch targets on mobile
    - Add adequate spacing between interactive elements
    - _Requirements: 8.2, 16.49, 16.50_

- [x] 17. Implement performance optimizations
  - [x] 17.1 Configure ISR and caching
    - Set BrowsePage revalidate to 3600 (1 hour)
    - Set CategoryDetailPage revalidate to 1800 (30 minutes)
    - Implement React Suspense for streaming
    - _Requirements: 11.1, 16.52_
  
  - [x] 17.2 Optimize images and code splitting
    - Prioritize first 6 category images with priority={true}
    - Implement lazy loading for below-fold images
    - Use responsive sizes attribute for all images
    - Dynamic import CategoryPreviewPopover (ssr: false)
    - _Requirements: 11.3, 11.4, 11.5, 16.40, 16.41, 16.42_
  
  - [x] 17.3 Add performance monitoring
    - Configure Lighthouse CI for automated testing
    - Add web vitals tracking with @vercel/analytics
    - Set performance targets: FCP < 1.5s, LCP < 2.5s, CLS < 0.1
    - _Requirements: 11.6, 11.7, 11.8, 16.45_

- [x] 18. Write unit tests for utility functions
  - [ ]* 18.1 Write tests for getCategoryBadges utility
    - Test isPopular badge when listing_count > 100
    - Test isRecentlyUpdated badge when updated within 7 days
    - Test isNew badge when created within 30 days
    - Test no badges when conditions not met
    - _Property 11: Badge Logic Correctness_
  
  - [ ]* 18.2 Write tests for filtering logic
    - Test search filtering by name (case-insensitive)
    - Test search filtering by description (case-insensitive)
    - Test combined name and description search
    - Test empty results handling
    - _Property 4: Search Filtering Completeness_
  
  - [ ]* 18.3 Write tests for sorting logic
    - Test alphabetical ascending sort
    - Test alphabetical descending sort
    - Test sorting by listing count (most/fewest)
    - Test sorting by recently updated
    - _Property 7: Category Sorting Correctness_
  
  - [ ]* 18.4 Write tests for breadcrumb construction
    - Test breadcrumb for top-level category (1 level)
    - Test breadcrumb for nested categories (2-3 levels)
    - Test breadcrumb for deeply nested categories (4+ levels)
    - Test breadcrumb when parent_id chain is broken
    - _Property 13: Breadcrumb Path Construction_

- [x] 19. Write property-based tests
  - [ ]* 19.1 Write property test for image fallback handling
    - Generate random categories with null, invalid, and valid image_urls
    - Verify correct image source or fallback is used for all cases
    - Test with various invalid URL formats
    - _Property 1: Image Fallback Handling (Requirements 1.5)_
  
  - [ ]* 19.2 Write property test for category card required fields
    - Generate random categories with various field values
    - Verify rendered HTML contains name, description (truncated), listing count
    - Test with long descriptions to verify truncation
    - _Property 2: Category Card Required Fields (Requirements 1.6)_
  
  - [ ]* 19.3 Write property test for category navigation
    - Generate random categories with various slugs
    - Verify clicking card triggers navigation to correct URL
    - Test with special characters in slugs
    - _Property 3: Category Navigation Links (Requirements 1.7)_
  
  - [ ]* 19.4 Write property test for search filtering
    - Generate random search queries and category lists
    - Verify filtering returns all matching categories
    - Verify filtering excludes all non-matching categories
    - Test case-insensitivity
    - _Property 4: Search Filtering Completeness (Requirements 2.2, 2.3)_
  
  - [ ]* 19.5 Write property test for clear button visibility
    - Generate random search inputs (empty and non-empty)
    - Verify clear button visible for non-empty input only
    - Test with various input lengths
    - _Property 5: Clear Button Visibility (Requirements 2.6)_
  
  - [ ]* 19.6 Write property test for search clear restoration
    - Generate random filtered states
    - Apply clear action and verify all categories restored
    - Test with various filter combinations
    - _Property 6: Search Clear Restoration (Requirements 2.7)_
  
  - [ ]* 19.7 Write property test for category sorting
    - Generate random category lists
    - Test all 5 sort options produce correct ordering
    - Verify stable sorting for equal values
    - _Property 7: Category Sorting Correctness (Requirements 3.1-3.5)_
  
  - [ ]* 19.8 Write property test for top-level filter
    - Generate categories with mixed parent_id values (null and non-null)
    - Verify filter returns only categories with parent_id = null
    - Test edge cases (all null, all non-null, mixed)
    - _Property 8: Top-Level Filter Correctness (Requirements 3.8)_
  
  - [ ]* 19.9 Write property test for active listings filter
    - Generate categories with various listing_count values (0, positive)
    - Verify filter returns only categories with listing_count > 0
    - Test edge cases (all zero, all positive, mixed)
    - _Property 9: Active Listings Filter Correctness (Requirements 3.9)_
  
  - [ ]* 19.10 Write property test for URL state persistence
    - Generate random filter states (search, sort, show_only)
    - Apply filters and verify URL params match state
    - Test URL can be shared and restored correctly
    - _Property 10: URL State Persistence (Requirements 3.10)_
  
  - [ ]* 19.11 Write property test for badge logic
    - Generate categories with various listing_count, updated_at, created_at values
    - Verify Popular badge logic (listing_count > 100)
    - Verify Recently Updated badge logic (updated within 7 days)
    - Verify New badge logic (created within 30 days)
    - _Property 11: Badge Logic Correctness (Requirements 4.2, 4.3, 4.5)_
  
  - [ ]* 19.12 Write property test for trending categories
    - Generate random category lists
    - Verify trending section shows top 3 by listing_count descending
    - Test with fewer than 3 categories
    - _Property 12: Trending Categories Selection (Requirements 4.4)_
  
  - [ ]* 19.13 Write property test for breadcrumb construction
    - Generate categories with various parent chain depths
    - Verify breadcrumb shows complete path from Home to current
    - Test with circular references (should not infinite loop)
    - _Property 13: Breadcrumb Path Construction (Requirements 7.1-7.3, 16.11-16.12)_
  
  - [ ]* 19.14 Write property test for subcategory count indicator
    - Generate categories with 0 to N subcategories
    - Verify indicator displays only when children exist
    - Verify count matches actual number of direct children
    - _Property 14: Subcategory Count Indicator (Requirements 1.4)_

- [x] 20. Write integration tests
  - [ ]* 20.1 Write integration test for browse page flow
    - Test page loads and displays categories
    - Test search filters categories correctly
    - Test sort option changes order
    - Test show_only filters apply correctly
    - Test clicking category navigates to detail page
  
  - [ ]* 20.2 Write integration test for category detail page flow
    - Test page loads category data
    - Test breadcrumb displays correct path
    - Test subcategories display when present
    - Test clicking subcategory navigates to its detail page
    - Test back button returns to parent category
  
  - [ ]* 20.3 Write integration test for URL state management
    - Test URL params persist on filter changes
    - Test page loads with URL params and applies filters
    - Test sharing URL shows same filtered view
  
  - [ ]* 20.4 Write integration test for real-time updates
    - Mock Supabase subscription
    - Trigger listing count change event
    - Verify category listing counts update in UI
  
  - [ ]* 20.5 Write integration test for error handling
    - Mock database fetch failure
    - Verify error message displays
    - Verify retry button refetches data
    - Test recovery after error

- [ ] 21. Write accessibility tests
  - [ ]* 21.1 Run automated accessibility tests
    - Run axe-core scan on BrowsePage
    - Run axe-core scan on CategoryDetailPage
    - Verify 0 violations for WCAG 2.1 Level AA
    - Run Lighthouse accessibility audit (score > 95)
  
  - [ ]* 21.2 Test keyboard navigation
    - Test Tab moves through all interactive elements
    - Test visible focus indicators on all focusable elements
    - Test Enter/Space activates category cards
    - Test Escape closes popovers
    - Verify no keyboard traps exist
  
  - [ ]* 21.3 Test screen reader compatibility
    - Test with NVDA/JAWS/VoiceOver
    - Verify category names and counts announced correctly
    - Verify breadcrumb navigation is clear
    - Verify all buttons have accessible labels
    - Test live region announcements for dynamic updates
  
  - [ ]* 21.4 Test color contrast and touch targets
    - Verify all text meets 4.5:1 contrast ratio
    - Verify touch targets meet 44x44px minimum on mobile
    - Test reduced motion preferences respected

- [x] 22. Performance testing and optimization
  - [ ]* 22.1 Run Lighthouse performance tests
    - Test BrowsePage with Lighthouse CI
    - Test CategoryDetailPage with Lighthouse CI
    - Verify Performance score > 90
    - Verify FCP < 1.5s, LCP < 2.5s, CLS < 0.1
    - Address any performance issues identified
  
  - [ ]* 22.2 Test on 3G network
    - Simulate 3G throttling
    - Verify FCP < 1.5s on 3G
    - Test image lazy loading works correctly
    - Verify progressive enhancement with loading skeletons
  
  - [ ]* 22.3 Analyze bundle size
    - Run `npm run analyze` to check bundle size
    - Verify CategoryPreviewPopover is code-split
    - Check for unnecessary dependencies
    - Optimize imports to reduce bundle size

- [x] 23. Manual testing across devices
  - [ ]* 23.1 Test on mobile devices
    - Test on iOS Safari and Android Chrome
    - Verify responsive grid (1 column)
    - Test touch interactions and tap animations
    - Verify sticky search bar works
    - Test swipe gestures for filters
  
  - [ ]* 23.2 Test on tablet devices
    - Test responsive grid (2-3 columns)
    - Verify all interactions work correctly
    - Test both portrait and landscape orientations
  
  - [ ]* 23.3 Test on desktop browsers
    - Test on Chrome, Firefox, Safari, Edge
    - Verify hover effects work (scale, gradient border, preview popover)
    - Test all animations are smooth (60fps)
    - Verify keyboard navigation works

- [x] 24. Final checkpoint and deployment preparation
  - Review all completed tasks
  - Run full test suite (unit + integration + e2e + accessibility)
  - Verify all requirements are met
  - Test database migrations on staging environment
  - Verify no console errors or warnings
  - Check Lighthouse scores meet targets
  - Prepare deployment checklist
  - Ask the user if ready to deploy

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoint tasks ensure incremental validation and provide opportunities for user feedback
- Property-based tests validate universal correctness properties across all inputs
- Integration tests validate component interactions and data flow
- Unit tests validate specific logic and edge cases
- The workflow follows a logical sequence: database → infrastructure cleanup → shared components → feature components → pages → state management → testing
- ISR (Incremental Static Regeneration) provides performance benefits while keeping content fresh
- Real-time subscriptions ensure category listing counts stay accurate
- All components follow Next.js 14 App Router patterns with Server/Client component separation
- Accessibility is a priority with WCAG 2.1 Level AA compliance throughout
- The design uses glassmorphism for modern visual appeal on subcategory cards
- Translation infrastructure removal simplifies the codebase and improves maintainability

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2"]
    },
    {
      "id": 1,
      "tasks": ["2.1", "2.2", "2.3", "2.4"]
    },
    {
      "id": 2,
      "tasks": ["3.1", "3.2", "3.3", "12.1", "12.2"]
    },
    {
      "id": 3,
      "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5"]
    },
    {
      "id": 4,
      "tasks": ["5.1", "5.2", "5.3", "9.1"]
    },
    {
      "id": 5,
      "tasks": ["6.1", "6.2", "9.2", "9.3"]
    },
    {
      "id": 6,
      "tasks": ["7.1", "7.2"]
    },
    {
      "id": 7,
      "tasks": ["8.1", "10.1"]
    },
    {
      "id": 8,
      "tasks": ["8.2", "10.2", "10.3"]
    },
    {
      "id": 9,
      "tasks": ["8.3", "10.4", "10.5", "10.6", "10.7", "10.8"]
    },
    {
      "id": 10,
      "tasks": ["11.1", "11.2"]
    },
    {
      "id": 11,
      "tasks": ["13.1", "13.2", "14.1", "14.2", "14.3"]
    },
    {
      "id": 12,
      "tasks": ["16.1", "16.2", "16.3", "16.4", "17.1", "17.2", "17.3"]
    },
    {
      "id": 13,
      "tasks": ["18.1", "18.2", "18.3", "18.4"]
    },
    {
      "id": 14,
      "tasks": ["19.1", "19.2", "19.3", "19.4", "19.5", "19.6", "19.7"]
    },
    {
      "id": 15,
      "tasks": ["19.8", "19.9", "19.10", "19.11", "19.12", "19.13", "19.14"]
    },
    {
      "id": 16,
      "tasks": ["20.1", "20.2", "20.3", "20.4", "20.5"]
    },
    {
      "id": 17,
      "tasks": ["21.1", "21.2", "21.3", "21.4"]
    },
    {
      "id": 18,
      "tasks": ["22.1", "22.2", "22.3"]
    },
    {
      "id": 19,
      "tasks": ["23.1", "23.2", "23.3"]
    }
  ]
}
```


