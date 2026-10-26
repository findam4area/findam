# Implementation Plan: Sophisticated Marketplace Homepage

## Overview

This implementation plan transforms the FindAm marketplace homepage into a sophisticated business directory marketplace with enhanced features including AI-powered semantic search (pgvector), personalized recommendations, real-time activity feeds, advanced animations, and comprehensive SEO optimization. The implementation uses Next.js 14+ App Router, Supabase with pgvector extension, TanStack Query for state management, and Framer Motion for animations.

## Tasks

- [x] 1. Database Setup and Schema Implementation
  - [x] 1.1 Enable pgvector extension and create vector search infrastructure
    - Enable pgvector extension in Supabase
    - Create listings table with embedding VECTOR(1536) column
    - Create HNSW index on embedding column for fast similarity search
    - Create categories, profiles, activities, reviews, user_interactions, subscriptions tables
    - _Requirements: 22.1, 22.5_
  
  - [x] 1.2 Implement Row Level Security (RLS) policies
    - Create RLS policies for listings (public read, owner write)
    - Create RLS policies for profiles (public read, owner update)
    - Create RLS policies for reviews (public read, authenticated insert)
    - Create RLS policies for user_interactions (owner read/write)
    - _Requirements: 31.1_
  
  - [x] 1.3 Create database functions and triggers
    - Create match_listings() function for vector similarity search
    - Create recommend_listings() function for personalized recommendations
    - Create update_vendor_rating() trigger function
    - Create trigger on reviews table to update vendor ratings
    - _Requirements: 22.3, 25.7_
  
  - [ ]* 1.4 Write property tests for database functions
    - **Property 8: Vector Search Similarity Bounds**
    - **Validates: Requirements 22.10**
    - Test that all similarity scores are between 0 and 1 inclusive
  
  - [ ]* 1.5 Write property tests for rating calculations
    - **Property 14: Average Rating Calculation Correctness**
    - **Validates: Requirements 25.12**
    - Test that average rating equals arithmetic mean of all review ratings

- [x] 2. Core Homepage Components - Hero Section
  - [x] 2.1 Create HeroSection component with animated stats
    - Implement HeroSection client component with TypeScript interfaces
    - Add animated stats counter (users, listings, rating) with counting animation
    - Implement staggered fade-in animations for headline text
    - Add floating animated badges with subtle motion effects
    - Ensure clean background with minimal decorative elements (no heavy gradients)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 2.2 Implement SearchBar with autocomplete
    - Create SearchBar component with debounced input (300ms)
    - Implement autocomplete dropdown with hybrid search (keyword + semantic)
    - Add keyboard navigation (arrow keys, Enter, Escape)
    - Display up to 8 suggestions (listings, categories, vendors)
    - Highlight matching text in suggestions
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.9_
  
  - [ ]* 2.3 Write unit tests for SearchBar debouncing
    - Test debounce delays API calls to max 1 per 300ms
    - Test keyboard navigation functionality
    - _Requirements: 12.7, 12.9_
  
  - [ ]* 2.4 Write property test for search idempotence
    - **Property 12: Search Query Idempotence**
    - **Validates: Requirements 12.11**
    - Test that searching same term twice returns consistent results

- [x] 3. Category Showcase and Featured Listings
  - [x] 3.1 Implement CategoryShowcase with auto-rotation
    - Create CategoryShowcase client component
    - Implement auto-rotation every 3 seconds with pause on hover
    - Add hover effects (elevation, scale) within 200ms
    - Fetch category item counts from Supabase
    - Display solid accent colors (no gradients)
    - Implement responsive grid (2 cols mobile, 6 cols desktop)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_
  
  - [x] 3.2 Create FeaturedListings component with lazy loading
    - Implement FeaturedListings client component with TanStack Query
    - Add lazy loading for images with blur-up placeholders
    - Display skeleton loading states while fetching
    - Implement hover effects (lift, overlay) on listing cards
    - Display boost badges with subtle accent styling
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_
  
  - [x] 3.3 Create reusable ListingCard component
    - Implement ListingCard with variants (default, compact, featured)
    - Add hover effects (translateY -4px, shadow, overlay)
    - Display thumbnail, title, price, location, views, likes
    - Add video play button overlay for listings with videos
    - Support keyboard navigation and screen reader announcements
    - _Requirements: 3.2, 3.3, 3.4, 3.10_
  
  - [ ]* 3.4 Write unit tests for ListingCard interactions
    - Test hover effects and animations
    - Test keyboard navigation
    - Test screen reader announcements

- [x] 4. Checkpoint - Verify core components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Vendor Directory and Activity Feed
  - [x] 5.1 Implement VendorDirectory component
    - Create VendorDirectory client component with TanStack Query
    - Display 8-12 featured vendors in responsive grid
    - Show verification badges (phone, NIN, video)
    - Display vendor ratings with star icons
    - Add hover effects (scale, glow) on vendor cards
    - Implement infinite scroll or pagination
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_
  
  - [x] 5.2 Create VerificationBadge component
    - Implement VerificationBadge with types (phone, nin, video, full)
    - Add tooltips explaining each verification type
    - Support multiple sizes (sm, md, lg)
    - _Requirements: 4.3, 4.9_
  
  - [ ]* 5.3 Write property test for vendor rating invariant
    - **Property 10: Vendor Rating Range Invariant**
    - **Validates: Requirements 4.10**
    - Test that all vendor ratings are between 0 and 5 inclusive
  
  - [x] 5.4 Implement ActivityFeed with real-time subscriptions
    - Create ActivityFeed client component
    - Subscribe to Supabase realtime channel for activities
    - Display recent 10-20 activities with timestamps and avatars
    - Implement slide-in animation for new activities
    - Handle connection errors with fallback to polling
    - Anonymize sensitive user information
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  
  - [ ]* 5.5 Write property test for activity ordering
    - **Property 10: Activity Timestamp Ordering**
    - **Validates: Requirements 5.10**
    - Test that newer activities appear before older activities

- [x] 6. AI-Powered Search and Recommendations
  - [x] 6.1 Implement embedding generation pipeline
    - Create API route for generating embeddings using OpenAI
    - Implement automatic embedding generation on listing create/update
    - Add caching for embedding generation (24 hours)
    - Handle embedding generation failures gracefully
    - _Requirements: 22.2, 22.6, 22.8_
  
  - [x] 6.2 Implement semantic search functionality
    - Create searchSemantic() function using pgvector
    - Combine vector search with keyword search (hybrid)
    - Implement fallback to keyword search on vector search failure
    - Combine vector search with traditional filters (price, location, category)
    - _Requirements: 22.3, 22.4, 22.7, 22.9_
  
  - [ ]* 6.3 Write property test for vector search ordering
    - **Property 9: Vector Search Results Ordering**
    - **Validates: Requirements 22.11**
    - Test that results are ordered by descending similarity score
  
  - [x] 6.4 Implement RecommendationsSection component
    - Create RecommendationsSection client component
    - Implement fetchRecommendations() with collaborative filtering
    - Generate user embeddings from browsing history
    - Display 4-8 personalized listings for authenticated users
    - Show trending listings for anonymous users
    - Add "Refresh Recommendations" button
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_
  
  - [ ]* 6.5 Write property test for recommendation referential integrity
    - **Property 10: Recommendation Referential Integrity**
    - **Validates: Requirements 10.10**
    - Test that all recommended listings exist and are active

- [x] 7. Deals Section and Trust Indicators
  - [x] 7.1 Implement DealsSection with countdown timers
    - Create DealsSection client component
    - Fetch deals with discount_percentage > 0
    - Implement useCountdown hook with 1-second updates
    - Display original price, discounted price, discount percentage
    - Auto-remove expired deals
    - Sort deals by discount percentage or expiration time
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.9_
  
  - [ ]* 7.2 Write unit tests for useCountdown hook
    - Test countdown calculation accuracy
    - Test 1-second update interval
    - Test countdown stops at zero
    - _Requirements: 13.4, 13.9_
  
  - [ ]* 7.3 Write property test for deal price invariant
    - **Property 10: Deal Price Invariant**
    - **Validates: Requirements 13.10**
    - Test that discounted price is always less than original price
  
  - [x] 7.4 Create TrustSection component
    - Display security features (ScamShield, verification, secure payments)
    - Show user testimonials with ratings
    - Display aggregate statistics (users, listings, rating)
    - Add hover effects (lift, glow) on testimonial cards
    - Implement carousel or grid layout for testimonials
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [ ]* 7.5 Write property test for testimonial rating invariant
    - **Property 10: Testimonial Rating Range**
    - **Validates: Requirements 6.10**
    - Test that all testimonial ratings are between 1 and 5 inclusive

- [x] 8. Checkpoint - Verify AI features and deals work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Enhanced Footer and Newsletter
  - [x] 9.1 Implement EnhancedFooter component
    - Create EnhancedFooter server component
    - Display 4-6 columns with categorized links
    - Add social media links with icon buttons
    - Display payment method logos and security badges
    - Include copyright notice and company information
    - Implement responsive stacking on mobile
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.9, 7.10_
  
  - [x] 9.2 Create newsletter signup form
    - Implement newsletter form with email validation (Zod)
    - Add submit button with loading state
    - Display success/error messages
    - Validate email format before submission
    - _Requirements: 7.2, 7.7_
  
  - [ ]* 9.3 Write property test for email validation
    - **Property 7: Email Validation Error Handling**
    - **Validates: Requirements 7.11**
    - Test that invalid emails return error messages

- [x] 10. State Management with TanStack Query
  - [x] 10.1 Set up TanStack Query configuration
    - Create QueryClient with retry logic and exponential backoff
    - Configure stale time (5 minutes for listings)
    - Set up query key structure (hierarchical)
    - Implement query placeholders for stale data
    - _Requirements: 29.1, 29.2, 29.3, 29.7, 29.9_
  
  - [x] 10.2 Implement query hooks for all data fetching
    - Create useListings hook with infinite query for pagination
    - Create useVendors hook with prefetching
    - Create useActivities hook with realtime subscription
    - Create useRecommendations hook with user-based caching
    - _Requirements: 29.5, 29.8_
  
  - [x] 10.3 Implement optimistic updates for user interactions
    - Add optimistic updates for likes
    - Add optimistic updates for saves
    - Add optimistic updates for follows
    - Implement rollback on mutation failure
    - _Requirements: 29.4_
  
  - [x] 10.4 Implement query invalidation on mutations
    - Invalidate listings queries on create/update/delete
    - Invalidate vendor queries on profile update
    - Invalidate activity queries on new activity
    - _Requirements: 29.6_
  
  - [ ]* 10.5 Write property test for cache invalidation
    - **Property 18: Query Cache Invalidation on Mutation**
    - **Validates: Requirements 29.11**
    - Test that all related caches are invalidated on successful mutations

- [x] 11. Performance Optimization
  - [x] 11.1 Implement image optimization
    - Use Next.js Image component with priority for above-fold images
    - Generate blur-up placeholders (base64)
    - Implement lazy loading for below-fold images
    - Configure automatic WebP conversion
    - _Requirements: 8.4, 8.5, 8.10_
  0
  - [x] 11.2 Implement code splitting and lazy loading
    - Code split non-critical components
    - Lazy load heavy components (video player, charts)
    - Implement dynamic imports for modals and overlays
    - _Requirements: 8.6_
  
  - [x] 11.3 Configure ISR and caching
    - Set up ISR with 60-second revalidation for homepage
    - Implement service worker caching for static assets
    - Configure cache-first strategy for assets
    - Configure network-first strategy for dynamic content
    - _Requirements: 8.7, 8.8, 17.1, 17.5_
  
  - [ ]* 11.4 Write performance tests
    - Test FCP < 1.5s on 3G connections
    - Test LCP < 2.5s on 3G connections
    - Test CLS < 0.1
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 12. SEO and Metadata Optimization
  - [x] 12.1 Implement Next.js Metadata API
    - Create metadata configuration for homepage
    - Add title tag (under 60 characters)
    - Add meta description (under 160 characters)
    - Add Open Graph tags for social sharing
    - Add Twitter Card tags
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 28.1_
  
  - [x] 12.2 Implement structured data (JSON-LD)
    - Create Organization schema
    - Create WebSite schema with search action
    - Create LocalBusiness schema
    - Add breadcrumb structured data
    - _Requirements: 20.5, 28.3, 28.6_
  
  - [ ]* 12.3 Write property test for structured data validation
    - **Property 17: Structured Data Schema Validation**
    - **Validates: Requirements 28.11**
    - Test that JSON-LD validates against schema.org specifications
  
  - [x] 12.4 Generate dynamic sitemaps and OG images
    - Create dynamic sitemap including all listings and categories
    - Implement OG image generation using Vercel OG
    - Add canonical URLs to prevent duplicate content
    - Generate robots.txt with proper directives
    - _Requirements: 20.9, 20.10, 28.2, 28.4, 28.7, 28.8_

- [x] 13. Accessibility Implementation
  - [x] 13.1 Implement keyboard navigation
    - Add visible focus indicators to all interactive elements
    - Support full keyboard navigation (Tab, Enter, Escape, Arrow keys)
    - Implement skip links to main content
    - _Requirements: 15.4, 15.8_
  
  - [x] 13.2 Add ARIA labels and semantic HTML
    - Add alt text for all images and icons
    - Add ARIA labels for all interactive components
    - Use proper heading hierarchy (h1-h6)
    - Add aria-live regions for dynamic content
    - _Requirements: 15.2, 15.5, 15.6, 15.7_
  
  - [x] 13.3 Ensure color contrast compliance
    - Verify 4.5:1 contrast ratio for normal text
    - Verify 3:1 contrast ratio for large text
    - Support browser zoom up to 200%
    - _Requirements: 15.3, 15.10_
  
  - [ ]* 13.4 Write property test for keyboard equivalence
    - **Property 11: Keyboard Activation Equivalence**
    - **Validates: Requirements 15.11**
    - Test that keyboard activation produces same result as mouse click

- [x] 14. Checkpoint - Verify performance and accessibility
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Security and Rate Limiting
  - [x] 15.1 Implement rate limiting
    - Set up rate limiting (100 requests/min per IP) using Upstash
    - Apply rate limiting to search and autocomplete endpoints
    - Return 429 status code when limit exceeded
    - _Requirements: 31.2, 31.11_
  
  - [x] 15.2 Implement input sanitization and CSRF protection
    - Sanitize all user inputs to prevent XSS
    - Implement CSRF protection for form submissions
    - Add Content Security Policy (CSP) headers
    - _Requirements: 31.3, 31.4, 31.10_
  
  - [ ]* 15.3 Write property test for rate limit responses
    - **Property 20: Rate Limit Error Response**
    - **Validates: Requirements 31.11**
    - Test that exceeding rate limit returns 429 status code

- [x] 16. Analytics and A/B Testing
  - [x] 16.1 Integrate Vercel Analytics and PostHog
    - Set up Vercel Analytics for performance monitoring
    - Integrate PostHog for user behavior tracking
    - Implement custom event tracking (search, filter, save, share)
    - Track conversion funnels (view → click → contact → purchase)
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 30.1, 30.2, 30.6_
  
  - [x] 16.2 Implement A/B testing framework
    - Set up feature flags for gradual rollout
    - Implement A/B test variant assignment
    - Track scroll depth (25%, 50%, 75%, 100%)
    - Implement cohort analysis for retention
    - _Requirements: 18.6, 30.3, 30.7_
  
  - [ ]* 16.3 Write property test for A/B test consistency
    - **Property 19: A/B Test Variant Consistency**
    - **Validates: Requirements 30.11**
    - Test that users are consistently assigned to same variant
  
  - [x] 16.4 Implement GDPR compliance
    - Add cookie consent banner
    - Implement data export functionality
    - Implement data deletion workflow
    - Respect user privacy preferences
    - _Requirements: 18.9, 30.10, 31.6, 31.7, 31.8_

- [x] 17. Error Handling and Monitoring
  - [x] 17.1 Implement error boundaries
    - Create component-level error boundaries
    - Create page-level error boundaries
    - Display user-friendly error messages
    - Provide retry and recovery options
    - _Requirements: 19.1, 19.5, 19.7, 19.8_
  
  - [x] 17.2 Integrate Sentry for error tracking
    - Set up Sentry with environment configuration
    - Log errors with context (user ID, session, stack trace)
    - Filter out non-critical warnings
    - Set up alerts for critical errors
    - _Requirements: 19.6, 33.4, 33.6, 33.8_
  
  - [x] 17.3 Implement graceful degradation
    - Fall back to cached content when API fails
    - Fall back to polling when realtime fails
    - Display placeholder images when images fail to load
    - Maintain partial functionality when non-critical features fail
    - _Requirements: 19.2, 19.3, 19.4, 19.9_
  
  - [ ]* 17.4 Write property test for error recovery
    - **Property 19: Error Recovery Property**
    - **Validates: Requirements 19.10**
    - Test that retrying failed operations attempts recovery

- [x] 18. PWA and Offline Support
  - [x] 18.1 Implement service worker for PWA
    - Create service worker with cache-first strategy for static assets
    - Implement network-first strategy for dynamic content
    - Add install prompt for home screen
    - Cache homepage content for offline access
    - _Requirements: 17.1, 17.2, 17.5, 17.6_
  
  - [x] 18.2 Implement offline functionality
    - Display offline indicator when network unavailable
    - Queue user actions (likes, saves) when offline
    - Sync queued actions when connection restored
    - Display stale content warnings for data older than 24 hours
    - _Requirements: 17.3, 17.4, 17.8, 17.9_
  
  - [ ]* 18.3 Write property test for offline sync idempotence
    - **Property 10: Offline Sync Idempotence**
    - **Validates: Requirements 17.10**
    - Test that syncing queued actions completes within 5 seconds

- [x] 19. Reviews and Ratings System
  - [x] 19.1 Implement review submission functionality
    - Create API route for review submission
    - Require purchase verification before publishing
    - Support rating (1-5 stars), text, and optional images
    - Prevent multiple reviews for same listing by same user
    - _Requirements: 25.2, 25.3, 25.10_
  
  - [x] 19.2 Display reviews with sorting and filtering
    - Display average ratings with 5-star breakdown
    - Show "Verified Purchase" badges on confirmed buyer reviews
    - Sort reviews by helpfulness, recency, or rating
    - Allow vendors to respond to reviews publicly
    - _Requirements: 25.1, 25.4, 25.6, 25.8, 25.9_
  
  - [ ]* 19.3 Write property test for review rating invariant
    - **Property 13: Review Rating Range Invariant**
    - **Validates: Requirements 25.11**
    - Test that all ratings are integers between 1 and 5 inclusive

- [x] 20. Premium Subscriptions and Claimable Listings
  - [x] 20.1 Implement premium subscription flow
    - Create subscription tier selection UI (Basic, Pro, Enterprise)
    - Integrate Paystack for subscription payments
    - Activate premium features immediately on upgrade
    - Display premium badges on upgraded profiles
    - _Requirements: 24.1, 24.2, 24.3, 24.4_
  
  - [x] 20.2 Implement subscription management
    - Send renewal reminders 7 days before expiration
    - Implement 3-day grace period after expiration
    - Support promo codes and discounts
    - Allow downgrade with prorated refunds
    - _Requirements: 24.6, 24.7, 24.8, 24.9_
  
  - [ ]* 20.3 Write property test for subscription billing cycle
    - **Property 11: Subscription Billing Cycle Invariant**
    - **Validates: Requirements 24.10**
    - Test that billing_cycle is either 'monthly' or 'annual'
  
  - [ ]* 20.4 Write property test for premium feature revocation
    - **Property 12: Premium Feature Revocation on Cancellation**
    - **Validates: Requirements 24.11**
    - Test that premium features are revoked immediately on cancellation
  
  - [x] 20.5 Implement claimable business listings
    - Add "Claim This Business" buttons on unclaimed profiles
    - Create verification workflow for business documentation
    - Support verification methods (business registration, tax ID, domain)
    - Send email verification to business domain
    - Transfer ownership on claim approval
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6_
  
  - [ ]* 20.6 Write property test for claim request state invariant
    - **Property 10: Claim Request State Invariant**
    - **Validates: Requirements 23.10**
    - Test that claim status is one of: pending, approved, rejected, expired

- [x] 21. Image Management and Media Optimization
  - [x] 21.1 Implement image upload and gallery
    - Support uploading up to 10 images per listing
    - Support video uploads (60s max, 100MB max)
    - Implement drag-and-drop reordering
    - Create image gallery with thumbnail navigation and lightbox
    - _Requirements: 26.1, 26.2, 26.3, 26.5_
  
  - [x] 21.2 Implement image optimization pipeline
    - Auto-generate multiple image sizes (thumbnail, medium, large)
    - Compress images to WebP format
    - Display upload progress with percentage
    - Validate image formats (JPEG, PNG, WebP)
    - Store media in Supabase Storage with CDN
    - _Requirements: 26.4, 26.6, 26.7, 26.8, 26.10_
  
  - [ ]* 21.3 Write property test for image compression constraint
    - **Property 15: Image Compression Size Constraint**
    - **Validates: Requirements 26.11**
    - Test that compressed images are under 5MB

- [x] 22. Final Integration and Testing
  - [x] 22.1 Integrate all components into homepage
    - Wire HeroSection, CategoryShowcase, FeaturedListings together
    - Wire VendorDirectory, ActivityFeed, RecommendationsSection together
    - Wire DealsSection, TrustSection, EnhancedFooter together
    - Ensure proper data flow between components
    - _Requirements: All_
  
  - [ ]* 22.2 Write E2E tests for critical user flows
    - Test homepage load within performance budget
    - Test search and autocomplete flow
    - Test listing card click navigation
    - Test category selection and navigation
    - Test offline mode functionality
    - _Requirements: 33.2_
  
  - [ ]* 22.3 Write visual regression tests
    - Test homepage matches snapshot
    - Test listing card matches snapshot
    - Test vendor card matches snapshot
    - _Requirements: 33.3_
  
  - [x] 22.4 Configure monitoring and health checks
    - Set up health check endpoints
    - Configure performance monitoring with Core Web Vitals
    - Set up smoke tests for post-deployment
    - _Requirements: 33.5, 33.7, 33.9_

- [x] 23. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- E2E tests validate critical user flows
- The implementation uses TypeScript throughout as specified in the design document
- All components follow Next.js 14+ App Router patterns with Server and Client Components
- TanStack Query is used for all data fetching and state management
- Framer Motion is used for all animations and micro-interactions
- Supabase with pgvector extension is used for database and vector search
- Heavy gradients have been removed in favor of subtle accent colors per design update

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "10.1"] },
    { "id": 2, "tasks": ["1.4", "1.5", "2.1", "6.1"] },
    { "id": 3, "tasks": ["2.2", "3.1", "6.2", "10.2"] },
    { "id": 4, "tasks": ["2.3", "2.4", "3.2", "3.3", "6.3", "10.3"] },
    { "id": 5, "tasks": ["3.4", "5.1", "5.2", "6.4", "10.4"] },
    { "id": 6, "tasks": ["5.3", "5.4", "5.5", "6.5", "7.1", "10.5"] },
    { "id": 7, "tasks": ["7.2", "7.3", "7.4", "9.1", "11.1"] },
    { "id": 8, "tasks": ["7.5", "9.2", "11.2", "11.3"] },
    { "id": 9, "tasks": ["9.3", "11.4", "12.1", "12.2"] },
    { "id": 10, "tasks": ["12.3", "12.4", "13.1", "13.2"] },
    { "id": 11, "tasks": ["13.3", "13.4", "15.1", "15.2"] },
    { "id": 12, "tasks": ["15.3", "16.1", "16.2"] },
    { "id": 13, "tasks": ["16.3", "16.4", "17.1", "17.2"] },
    { "id": 14, "tasks": ["17.3", "17.4", "18.1"] },
    { "id": 15, "tasks": ["18.2", "18.3", "19.1"] },
    { "id": 16, "tasks": ["19.2", "19.3", "20.1", "20.2"] },
    { "id": 17, "tasks": ["20.3", "20.4", "20.5", "20.6"] },
    { "id": 18, "tasks": ["21.1", "21.2"] },
    { "id": 19, "tasks": ["21.3", "22.1"] },
    { "id": 20, "tasks": ["22.2", "22.3", "22.4"] }
  ]
}
```
