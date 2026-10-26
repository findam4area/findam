# Implementation Plan: FindAm Curated Directory

## Overview

This implementation plan builds a youth-centric curated directory platform connecting young Nigerians with services, opportunities, and businesses. The plan follows a 12-week MVP approach with 5 phases: Foundation setup, Core homepage features, Multi-image listings system, Manual approval system, and Polish for launch.

**Technology Stack**: Next.js 16.2.6 (App Router, Server Components, Server Actions), TypeScript (strict mode), Supabase (PostgreSQL, Auth, Storage via @supabase/ssr), Tailwind CSS, Radix UI, Zod, Vitest, Playwright, fast-check

**MVP Focus**: Simple, manually-curated directory with essential features only. All features must be fully functional and production-ready with complete validation, error handling, and user feedback.

## Tasks

- [x] 1. Phase 1: Foundation Setup (Weeks 1-2)
  - [x] 1.1 Initialize Next.js 16.2.6 project with TypeScript strict mode
    - Create new Next.js 16.2.6 project with App Router enabled
    - Configure TypeScript with strict mode (strictNullChecks, noImplicitAny, strictFunctionTypes)
    - Set up path aliases (@/, @/components, @/lib)
    - Install core dependencies: @supabase/ssr, @supabase/supabase-js, Zod, Tailwind CSS, Radix UI
    - Configure next.config.js for images (Supabase storage domain)
    - _Requirements: 14.1, 14.2, 14.3, 14.7_

  - [x] 1.2 Configure Supabase SSR clients for Next.js 16
    - Create lib/supabase/server.ts with server-side client using @supabase/ssr (for Server Components and Server Actions)
    - Create lib/supabase/client.ts with client-side client using @supabase/ssr (for Client Components)
    - Create lib/supabase/middleware.ts with middleware client for auth state refresh
    - Add environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
    - Add connection error handling with user-friendly messages
    - _Requirements: 15.1, 15.8, 15.9_

  - [x] 1.3 Create core TypeScript type definitions
    - Create lib/types/core.ts with User, Category, Listing, VendorApplication, ApprovedVendor interfaces
    - Define Listing interface with images: string[] (array of 3-5 image URLs) and primary_image_index: number
    - Define ImageUploadResult, ImageGalleryImage types for multi-image handling
    - Define authentication types: LoginInput, RegisterInput, PasswordResetInput
    - Define filter types: BrowseFilters, CreateListingInput, VendorApplicationInput
    - Define ActionResult<T> type for Server Action responses
    - _Requirements: 13.1, 13.2, 14.4, 14.5, 14.8_

  - [x] 1.4 Create database migration for core schema with multi-image support
    - Create users table with id, email, phone, full_name, avatar_url, role, timestamps
    - Create categories table with id, name, slug, parent_id, description, image_url, display_order, listing_count
    - Create listings table with images TEXT[] (array of 3-5 URLs), primary_image_index INTEGER (default 0), status, rejection_reason
    - Add constraints: valid_images_count CHECK (array_length(images, 1) BETWEEN 1 AND 5)
    - Add constraints: valid_primary_image CHECK (primary_image_index >= 0 AND primary_image_index < array_length(images, 1))
    - Create vendor_applications table with id, user_id, business_name, business_description, contact_email, contact_phone, status, rejection_reason, timestamps
    - Create approved_vendors table with user_id, business_name, approved_at, approved_badge_enabled
    - Add indexes on frequently queried columns (status, category_id, is_featured, created_at)
    - Create trigger function update_category_listing_count() for automatic listing count updates
    - _Requirements: 13.1, 13.2, 15.1, 15.2_

  - [x] 1.5 Implement Row Level Security (RLS) policies
    - Enable RLS on all tables
    - Users: public read, users update own profile
    - Categories: public read
    - Listings: public see approved, users see own, admins see all
    - Vendor applications: users see own, admins see all
    - Approved vendors: public read
    - Test policies with different user roles (anonymous, authenticated user, admin)
    - _Requirements: 15.2_

  - [x] 1.6 Create Supabase storage buckets with RLS policies
    - Create 'avatars' bucket: public read, file size limit 2MB, allowed types: image/jpeg, image/png, image/webp
    - Create 'listings' bucket: public read, file size limit 5MB per image, allowed types: image/jpeg, image/png, image/webp
    - Configure storage path structure: listings/{user_id}/{listing_id}/image-{index}-{timestamp}.webp
    - Implement storage RLS: users can upload to own folder, anyone can read, users can delete own files
    - Verify bucket configuration with test upload
    - _Requirements: 13.3, 13.5, 13.6, 13.15, 15.1, 15.10_

  - [x] 1.7 Create Zod validation schemas with multi-image support
    - Create lib/validation/schemas.ts
    - Define registerSchema: email (RFC 5322), password (min 8 chars, uppercase, lowercase, digit), full_name (min 2 chars)
    - Define loginSchema: email, password
    - Define createListingSchema: title (5-100 chars), description (20-2000 chars), price (nullable, positive), category_id (uuid), location_state, location_city, images (array 1-5 URLs), primary_image_index (0-4)
    - Define updateListingImagesSchema: images array with refinement to ensure primary_image_index < images.length
    - Define imageUploadSchema: file validation with type and size checks
    - Define vendorApplicationSchema: business_name (2-100 chars), business_description (20-500 chars), contact_email, contact_phone (Nigerian format)
    - Define browseFiltersSchema: category_id (optional uuid), location_city (optional), search_query (optional, max 100), sort_by (enum: newest, featured)
    - Define rejectReasonSchema: reason (min 10 chars, max 500)
    - _Requirements: 2.4, 2.5, 13.4, 13.5, 14.4_

  - [x] 1.8 Set up Tailwind CSS with youth-centric custom configuration
    - Configure custom colors for youth-centric design (vibrant blues, purples, warm accents)
    - Define responsive breakpoints: mobile (320-767px), tablet (768-1023px), desktop (1024px+)
    - Add custom font family (Inter or DM Sans)
    - Configure minimum touch target sizes (44x44px)
    - Add custom animations for smooth interactions
    - Ensure WCAG AA contrast ratios (4.5:1 minimum for text)
    - _Requirements: 9.4, 11.1, 11.2, 11.3_

  - [x] 1.9 Create middleware for auth state management
    - Create middleware.ts in project root
    - Use Supabase middleware client to refresh auth tokens on every request
    - Protect authenticated routes (/listings/create, /profile, /vendor/apply)
    - Protect admin routes (/admin/*)
    - Redirect unauthenticated users to login page
    - _Requirements: 2.7, 15.8_

- [x] 2. Checkpoint - Foundation complete
  - Verify TypeScript compiles without errors (`npm run build`)
  - Verify Supabase connection works with all three clients (server, client, middleware)
  - Verify storage buckets are accessible
  - Ensure database migrations applied successfully
  - Ensure all tests pass, ask the user if questions arise

- [x] 3. Phase 2: Authentication System (Weeks 2-3)
  - [x] 3.1 Create authentication Server Actions for Next.js 16
    - Create lib/actions/auth-actions.ts with 'use server' directive
    - Implement registerAction(formData): validate with Zod, create user in Supabase Auth, create user record in users table, return ActionResult
    - Implement loginAction(formData): validate credentials, create session with cookies, return ActionResult
    - Implement logoutAction(): clear session cookie, redirect to homepage
    - Implement requestPasswordResetAction(formData): send reset email via Supabase Auth
    - Implement resetPasswordAction(formData): verify token, update password
    - Add comprehensive error handling with specific error messages (invalid credentials, email in use, network failures)
    - Use revalidatePath() after successful login/logout to update UI
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.8, 2.9_

  - [x] 3.2 Create authentication utility functions
    - Create lib/services/auth.ts
    - Implement getCurrentUser(): get authenticated user from Server Component context
    - Implement requireAuth(): throw error if not authenticated (for protected actions)
    - Implement requireAdmin(): throw error if not admin (for admin actions)
    - Add session validation and error handling
    - _Requirements: 2.7, 2.8_

  - [x] 3.3 Create authentication UI components with complete functionality
    - Create components/auth/login-form.tsx as Client Component ('use client')
    - Add email and password fields with real-time validation feedback
    - Show field-level errors immediately on blur
    - Add submit button with loading state (disabled during submission)
    - Display server error messages prominently
    - Add "Forgot Password?" link to reset page
    - Add "Don't have an account? Sign up" link
    - Apply mobile-first design with proper spacing and touch targets (44x44px minimum)
    - _Requirements: 2.1, 2.6, 2.10, 2.16_

  - [x] 3.4 Create registration form component with complete validation
    - Create components/auth/register-form.tsx as Client Component
    - Add email, password, full_name fields with real-time validation
    - Show password strength indicator (weak/medium/strong)
    - Display validation requirements: 8+ chars, uppercase, lowercase, digit
    - Show inline error messages for each field
    - Add submit button with loading state
    - Display server error messages (email already in use, etc.)
    - Add "Already have an account? Log in" link
    - Apply mobile-first design
    - _Requirements: 2.1, 2.4, 2.5, 2.9, 2.10, 2.16_

  - [x] 3.5 Create password reset flow components
    - Create components/auth/password-reset-request-form.tsx: email input, submit button, loading state
    - Create components/auth/password-reset-form.tsx: new password input with validation, confirm password, submit button
    - Add success messages after email sent and password reset
    - Handle token expiry errors gracefully
    - Apply mobile-first design
    - _Requirements: 2.8_

  - [x] 3.6 Create authentication pages with Next.js 16 App Router
    - Create app/(auth)/login/page.tsx as Server Component, render LoginForm
    - Create app/(auth)/register/page.tsx as Server Component, render RegisterForm
    - Create app/(auth)/reset-password/page.tsx as Server Component, render reset request form
    - Create app/(auth)/reset-password/confirm/page.tsx as Server Component, render reset form with token validation
    - Add proper metadata for SEO (title, description)
    - Redirect authenticated users away from auth pages
    - _Requirements: 2.1, 2.11_

  - [x] 3.7 Write property-based tests for authentication validation
    - Create __tests__/validation/auth.test.ts using fast-check
    - Property: any valid RFC 5322 email should pass registerSchema validation
    - Property: any password with 8+ chars, uppercase, lowercase, digit should pass
    - Property: any password without required elements should fail
    - Example tests: specific valid and invalid cases
    - _Requirements: 2.4, 2.5_

- [x] 4. Phase 3: Core Homepage Features (Weeks 3-4)
  - [x] 4.1 Create database service for categories
    - Create lib/services/database.ts
    - Implement getCategories(): fetch all categories ordered by display_order using server-side Supabase client
    - Implement getCategoryBySlug(slug): fetch single category with subcategories
    - Add comprehensive error handling for database connection failures
    - Return properly typed results with TypeScript
    - _Requirements: 1.1, 15.2, 15.9_

  - [x] 4.2 Create CategoryGrid Server Component
    - Create components/features/category-grid.tsx (Server Component, no 'use client')
    - Fetch categories directly in component using server-side Supabase client
    - Display all categories in responsive grid layout with images, names, listing counts
    - Use Next.js 16 Image component with proper sizing (sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw")
    - Handle click navigation to category-specific page with Next.js Link
    - Show placeholder images when category images fail to load
    - Display empty state message with call-to-action when zero categories available
    - Render with mobile-first design (single column on mobile, 2 cols tablet, 3+ cols desktop)
    - Add loading skeleton for Server Component streaming
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8_

  - [x] 4.3 Create CategoryCard component with keyboard navigation
    - Create components/features/category-card.tsx as Client Component for interactivity
    - Display category image, name, listing count
    - Support keyboard navigation: Tab to focus, Enter to navigate
    - Add focus indicators for accessibility
    - Apply hover effects with smooth transitions
    - Handle image loading errors gracefully
    - _Requirements: 1.6, 1.7_

  - [x] 4.4 Create database service for featured listings
    - Add getFeaturedListings(limit) to lib/services/database.ts
    - Fetch listings with status='approved' AND is_featured=true
    - Order by created_at DESC
    - Join with users table and categories table for complete data
    - Return listings with primary_image from images array (images[primary_image_index])
    - Add error handling
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 4.5 Create FeaturedListings Server Component
    - Create components/features/featured-listings.tsx (Server Component)
    - Fetch featured listings directly in component
    - Display listings with primary image, title, price, location, vendor badge
    - Use Next.js 16 Image component with priority={true} for first 3 images
    - Handle click navigation to listing detail page
    - Show placeholder images when unavailable
    - Display "No featured listings yet" message when empty
    - Render with mobile-first responsive card layout (1 col mobile, 2 cols tablet, 3+ cols desktop)
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x] 4.6 Create HeroSection component with functional search
    - Create components/features/hero-section.tsx (Server Component for structure)
    - Create components/features/hero-search.tsx (Client Component for search functionality)
    - Display prominent headline: "Find Services & Opportunities Across Nigeria"
    - Add engaging subheadline explaining the directory purpose
    - Add functional "Sign Up" and "Browse Categories" CTA buttons that navigate correctly
    - Include search bar with real-time input and category filter dropdown
    - Handle search submission: navigate to /browse?search_query={query}&category_id={id}
    - Apply vibrant youth-centric design with background imagery
    - Ensure WCAG AA contrast ratio (4.5:1 minimum) for all text
    - Render with mobile-first responsive design (stack vertically on mobile)
    - Use Next.js 16 Image component for background with fill and priority
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 4.7 Create NavigationBar component with complete functionality
    - Create components/layout/navigation-bar.tsx (Client Component for interactivity)
    - Create components/layout/user-menu.tsx (Client Component for dropdown)
    - Display logo (left) with Link to homepage
    - Add search bar (center) with real-time input and Enter key submission
    - Show user avatar and dropdown menu when authenticated (logout, profile, my listings)
    - Show Login/Sign Up buttons when not authenticated with proper navigation
    - Implement logout functionality via logoutAction Server Action
    - Handle search submission: navigate to /browse?search_query={query}
    - Collapse to hamburger menu on mobile (<768px) with smooth slide animation
    - Support complete keyboard navigation (Tab through items, Enter to activate)
    - Highlight active route for current page
    - Apply sticky positioning for always-visible navigation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9_

  - [x] 4.8 Create MobileMenu component
    - Create components/layout/mobile-menu.tsx (Client Component)
    - Display navigation links: Home, Browse, Categories
    - Show user section when authenticated: avatar, name, My Listings, Profile, Logout
    - Show Login/Sign Up buttons when not authenticated
    - Add close button with smooth slide-out animation
    - Handle click outside to close menu
    - Support keyboard navigation and Escape key to close
    - Apply mobile-optimized touch targets (44x44px minimum)
    - _Requirements: 8.6, 8.7_

  - [x] 4.9 Create Footer Server Component
    - Create components/layout/footer.tsx (Server Component)
    - Display 4 columns: About (About Us, How It Works, Contact), Categories, For Vendors (Become a Vendor, Create Listing), Legal (Privacy Policy, Terms of Service)
    - All links must navigate to implemented pages (create placeholder pages if needed)
    - Display social media icons with functional links: Twitter, Instagram, Facebook
    - Show copyright notice with current year (© 2024 FindAm. All rights reserved.)
    - Display privacy policy link
    - Render with mobile-first design (stack columns vertically on mobile <768px)
    - Apply accessible styling with proper contrast
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 4.10 Create static pages for footer links
    - Create app/(public)/about/page.tsx with about content and SEO metadata
    - Create app/(public)/how-it-works/page.tsx with explanation of directory process
    - Create app/(public)/contact/page.tsx with contact form or contact information
    - Create app/(public)/privacy/page.tsx with privacy policy
    - Create app/(public)/terms/page.tsx with terms of service
    - All pages must be fully functional with proper layout and navigation
    - Apply consistent styling and mobile-first design
    - _Requirements: 7.1, 7.2_

  - [x] 4.11 Create homepage layout with all sections
    - Create app/(public)/page.tsx (Server Component)
    - Compose layout: HeroSection → CategoryGrid → FeaturedListings → Footer
    - Apply semantic HTML with proper heading hierarchy (h1 for hero, h2 for sections)
    - Add proper spacing between sections
    - Render all sections with mobile-first design and smooth transitions
    - Add loading states with Suspense boundaries for Server Component streaming
    - Include proper SEO metadata (title, description, Open Graph tags)
    - Ensure core content displays without JavaScript (progressive enhancement)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 5. Checkpoint - Homepage complete
  - Verify homepage displays correctly on mobile (320px) and desktop (1920px)
  - Test all navigation links work end-to-end
  - Verify search functionality navigates correctly
  - Test authentication flow from navigation bar
  - Ensure all tests pass, ask the user if questions arise

- [x] 6. Phase 4: Multi-Image Listings System (Weeks 5-7)
  - [x] 6.1 Create image storage service with complete error handling
    - Create lib/services/storage.ts implementing StorageService interface
    - Implement uploadImage(file, bucket, userId): generate unique filename, upload to Supabase storage, return ImageUploadResult with URL, path, size
    - Implement deleteImage(imagePath, bucket): delete file from Supabase storage
    - Implement getPublicUrl(imagePath, bucket): return public URL for image
    - Implement validateImage(file, bucket): check file type (JPEG/PNG/WebP) and size (2MB avatars, 5MB listings), return validation result
    - Add comprehensive error handling: upload failures, network errors, storage full
    - Generate structured filenames: {user_id}/{listing_id}/image-{index}-{timestamp}.webp
    - _Requirements: 13.3, 13.5, 13.6, 13.7, 13.8, 13.15_

  - [x] 6.2 Create image upload Server Actions
    - Create lib/actions/image-actions.ts with 'use server' directive
    - Implement uploadImageAction(formData, bucket): validate file, check auth, upload to storage, return ActionResult<ImageUploadResult>
    - Implement deleteImageAction(imagePath, bucket): validate auth, delete from storage, return ActionResult
    - Add authentication checks (user must be logged in)
    - Add authorization checks (user can only delete own images)
    - Handle upload progress tracking for client
    - Return structured errors for client display
    - _Requirements: 13.3, 13.6, 13.7, 13.8, 13.15_

  - [x] 6.3 Create ImageUploader Client Component with drag-drop
    - Create components/shared/image-uploader.tsx (Client Component)
    - Implement drag-and-drop zone with visual feedback (border highlight on dragover)
    - Add file input button as fallback
    - Support selecting 1-5 images at once (enforce maxImages limit)
    - Perform client-side validation: file type (JPEG/PNG/WebP), file size (5MB max per image)
    - Display preview grid showing thumbnails for all selected images
    - Show upload progress bar for each image (0-100%)
    - Upload images sequentially via uploadImageAction Server Action
    - Display upload errors inline per image with retry option
    - Allow reordering images via drag-drop (first image = primary)
    - Allow removing individual images (delete from storage via deleteImageAction)
    - Collect uploaded image URLs and pass to parent via onImagesUploaded callback
    - Apply mobile-optimized touch-friendly design
    - _Requirements: 13.1, 13.3, 13.6, 13.7, 13.8, 13.9, 13.10, 13.14, 13.16_

  - [x] 6.4 Create ImageGallery Client Component with fullscreen viewer
    - Create components/features/image-gallery.tsx (Client Component)
    - Display main image prominently with primary image by default
    - Display thumbnail strip showing all 3-5 images
    - Highlight current image thumbnail with ring border
    - Show "Primary" badge on primary image thumbnail
    - Handle thumbnail click: switch main image smoothly
    - Implement fullscreen modal viewer on main image click
    - Add navigation arrows (Previous/Next) in fullscreen mode
    - Support keyboard navigation: Arrow keys for prev/next, Escape to close fullscreen
    - Support touch gestures on mobile: swipe for prev/next
    - Use Next.js 16 Image component with proper sizes and fill for responsive loading
    - Add blur placeholder for better UX during loading
    - Apply mobile-first responsive layout
    - _Requirements: 13.11, 17.2, 17.3, 17.4, 17.5, 17.8, 17.11_

  - [x] 6.5 Create image optimization utilities
    - Create lib/utils/image.ts
    - Define IMAGE_SIZES constants: thumbnail (200), card (400), detail (800), fullscreen (1920)
    - Define IMAGE_QUALITY constants: thumbnail (75), card (80), detail (85), fullscreen (90)
    - Implement getImageSizes(context): return responsive sizes string for Next.js Image component
    - Implement validateImageFile(file, bucket): client-side validation before upload
    - Implement generateImageFilename(userId, prefix): generate unique filename with timestamp
    - _Requirements: 13.14, 13.15_

  - [x] 6.6 Create listing database service
    - Add getListings(filters) to lib/services/database.ts: fetch listings with filtering, sorting, pagination
    - Add getListingById(id): fetch single listing with joins (user, category, vendor status)
    - Add createListing(data): insert listing with status='pending' and images array
    - Add updateListingImages(listingId, images, primaryIndex): update images and primary_image_index
    - Add getUserListings(userId): fetch all listings for specific user
    - Handle database errors with user-friendly messages
    - _Requirements: 15.2, 15.9_

  - [x] 6.7 Create listing Server Actions
    - Create lib/actions/listing-actions.ts with 'use server' directive
    - Implement createListingAction(formData): validate with createListingSchema, check auth, insert listing, revalidate browse pages, return ActionResult<listingId>
    - Implement updateListingImagesAction(listingId, imageUrls, primaryIndex): validate with updateListingImagesSchema, check auth, update listing, return ActionResult
    - Add authentication checks (user must be logged in)
    - Add authorization checks (user can only update own listings)
    - Use revalidatePath() to update cached pages after mutations
    - Return structured errors for display
    - _Requirements: 3.1, 13.9, 13.10_

  - [x] 6.8 Create ListingForm Client Component with multi-image upload
    - Create components/features/listing-form.tsx (Client Component)
    - Add form fields: title (text), description (textarea), price (number, optional), category_id (dropdown), location_state (dropdown), location_city (text)
    - Integrate ImageUploader component for multi-image upload (3-5 images required)
    - Implement real-time field validation with Zod schema
    - Show inline error messages for each field on blur
    - Collect uploaded image URLs from ImageUploader
    - Submit form via createListingAction Server Action
    - Show loading state during submission (disable form, show spinner)
    - Display success message and redirect to /listings/my-listings on success
    - Display server errors prominently
    - Apply mobile-first form design with proper spacing and touch targets
    - _Requirements: 13.1, 13.3, 13.4, 13.9, 13.16_

  - [x] 6.9 Create CreateListing page
    - Create app/(authenticated)/listings/create/page.tsx (Server Component)
    - Fetch categories for dropdown using server-side Supabase client
    - Fetch Nigerian states for dropdown
    - Render ListingForm with fetched data
    - Add authentication guard (redirect to login if not authenticated)
    - Add page metadata for SEO
    - Apply consistent page layout
    - _Requirements: 13.1, 13.16_

  - [x] 6.10 Create ListingDetail page with image gallery
    - Create app/(public)/listings/[id]/page.tsx (Server Component with dynamic params)
    - Fetch listing with joins: user, category, approved_vendors
    - Display complete listing information: title, description, price, category, location
    - Render ImageGallery component with all listing images
    - Display vendor information with approved badge if applicable
    - Add functional contact buttons: Call (tel: link), Message (opens WhatsApp or email)
    - Show "Report Listing" button
    - Add SEO metadata with Open Graph tags for social sharing
    - Use Next.js 16 Image component for optimal loading
    - Implement proper error handling (listing not found)
    - Apply mobile-first responsive layout
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 17.10, 17.11, 17.12_

  - [x] 6.11 Create ListingCard component for grid display
    - Create components/features/listing-card.tsx (Server Component)
    - Display primary image using Next.js 16 Image component
    - Show title, price, location, category
    - Display vendor badge if seller has approved vendor status
    - Show status badge (Pending/Approved/Rejected) when showStatus={true}
    - Handle click navigation to listing detail page
    - Apply card hover effects
    - Render with mobile-first responsive design
    - _Requirements: 5.3, 13.12_

  - [x] 6.12 Create Browse page with filters
    - Create app/(public)/browse/page.tsx (Server Component with searchParams)
    - Fetch listings based on URL search params (category_id, location_city, search_query, sort_by)
    - Create components/features/browse-filters.tsx (Client Component)
    - Add filter controls: category dropdown, city input, search query input, sort dropdown (newest, featured)
    - Update URL params on filter change using useSearchParams and router.push
    - Display listings grid with ListingCard components
    - Show empty state with helpful message and "Clear Filters" button when no results
    - Add "Load More" button for pagination (offset-based)
    - Support keyboard navigation through filters and results
    - Apply mobile-first design (filters collapse to modal on mobile)
    - Persist filter state in URL for sharing and bookmarking
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11_

  - [x] 6.13 Create CategoryPage for category-specific browsing
    - Create app/(public)/categories/[slug]/page.tsx (Server Component with dynamic params)
    - Fetch category by slug
    - Fetch listings filtered by category_id
    - Display category name, description, image, listing count
    - Reuse BrowseFilters component (pre-fill category filter, allow other filters)
    - Display listings grid with pagination
    - Add breadcrumb navigation: Home > Categories > {Category Name}
    - Apply mobile-first design
    - _Requirements: 1.2, 6.1_

  - [x] 6.14 Create MyListings page for user's own listings
    - Create app/(authenticated)/listings/my-listings/page.tsx (Server Component)
    - Fetch current user's listings via getUserListings
    - Display listings with status indicators (Pending, Approved, Rejected)
    - Show rejection reasons for rejected listings
    - Add "Edit" and "Delete" buttons for each listing
    - Add "Create New Listing" button at top
    - Show empty state when user has no listings
    - Apply mobile-first responsive table/card layout
    - _Requirements: 3.2_

  - [ ]* 6.15 Write property-based tests for listing validation
    - Create __tests__/validation/listings.test.ts using fast-check
    - Property: images array length must be 1-5
    - Property: primary_image_index must be < images.length
    - Property: title must be 5-100 chars
    - Property: price must be positive or null
    - Example tests: specific valid and invalid listing data
    - _Requirements: 13.1, 13.2, 14.4_

  - [ ]* 6.16 Write integration tests for image upload flow
    - Create __tests__/actions/image-actions.test.ts
    - Mock Supabase storage client
    - Test: successful image upload returns URL
    - Test: oversized image is rejected
    - Test: invalid file type is rejected
    - Test: unauthenticated upload is rejected
    - Test: image deletion removes file from storage
    - _Requirements: 13.6, 13.7, 13.8_

- [x] 7. Checkpoint - Listings system complete
  - Test multi-image upload end-to-end (select 5 images, reorder, remove one, submit)
  - Verify image gallery displays correctly on mobile and desktop
  - Test listing creation flow with validation errors
  - Verify browse filters work correctly with combinations
  - Ensure all tests pass, ask the user if questions arise
- [x] 8. Phase 5: Manual Approval System (Weeks 8-9)
  - [x] 8.1 Create admin listing approval Server Actions
    - Create lib/actions/admin-actions.ts with 'use server' directive
    - Implement approveListingAction(listingId): check admin auth, update status='approved', revalidate browse pages, send notification, return ActionResult
    - Implement rejectListingAction(listingId, reason): validate reason (min 10 chars), check admin auth, update status='rejected' with reason, send notification, return ActionResult
    - Implement approveVendorAction(applicationId): check admin auth, update application status, create approved_vendors record, send notification, return ActionResult
    - Implement rejectVendorAction(applicationId, reason): validate reason, check admin auth, update status with reason, send notification, return ActionResult
    - Add comprehensive authorization checks (only admin role can approve/reject)
    - Use revalidatePath() to update all relevant cached pages
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 4.4, 4.6_

  - [x] 8.2 Create admin database service
    - Add getPendingListings() to lib/services/database.ts: fetch listings with status='pending', join with users and categories
    - Add getPendingVendorApplications(): fetch vendor_applications with status='pending', join with users
    - Add error handling
    - _Requirements: 3.2, 3.3, 4.3_

  - [x] 8.3 Create ListingApprovalCard Client Component
    - Create components/admin/listing-approval-card.tsx (Client Component)
    - Display listing thumbnail (primary image), title, description preview, user name, category, submitted date
    - Add "Approve" button with loading state that calls approveListingAction
    - Add "Reject" button that opens rejection reason modal
    - Show success/error messages after action
    - Apply mobile-responsive card layout
    - _Requirements: 3.3, 3.4_

  - [x] 8.4 Create RejectListingModal Client Component
    - Create components/admin/reject-listing-modal.tsx (Client Component using Radix Dialog)
    - Display textarea for rejection reason (min 10 chars, max 500 chars)
    - Show character count
    - Validate reason length client-side
    - Submit via rejectListingAction Server Action
    - Show loading state during submission
    - Close modal and show success message on completion
    - _Requirements: 3.6_

  - [x] 8.5 Create admin listings dashboard page
    - Create app/(admin)/admin/listings/page.tsx (Server Component)
    - Add admin authentication guard (redirect non-admins)
    - Fetch pending listings via getPendingListings()
    - Display pending count badge
    - Render grid of ListingApprovalCard components
    - Show empty state when no pending listings
    - Add filters: sort by date, search by title/user
    - Apply mobile-first responsive design
    - _Requirements: 3.2, 3.3_

  - [x] 8.6 Create VendorApprovalCard Client Component
    - Create components/admin/vendor-approval-card.tsx (Client Component)
    - Display business name, description, contact email, contact phone, user name, submitted date
    - Add "Approve" button with loading state that calls approveVendorAction
    - Add "Reject" button that opens rejection reason modal
    - Show success/error messages after action
    - Apply mobile-responsive card layout
    - _Requirements: 4.3, 4.4_

  - [x] 8.7 Create RejectVendorModal Client Component
    - Create components/admin/reject-vendor-modal.tsx (Client Component using Radix Dialog)
    - Display textarea for rejection reason (min 10 chars, max 500 chars)
    - Show character count
    - Validate reason length client-side
    - Submit via rejectVendorAction Server Action
    - Show loading state during submission
    - Close modal and show success message on completion
    - _Requirements: 4.6_

  - [x] 8.8 Create admin vendors dashboard page
    - Create app/(admin)/admin/vendors/page.tsx (Server Component)
    - Add admin authentication guard
    - Fetch pending vendor applications via getPendingVendorApplications()
    - Display pending count badge
    - Render grid of VendorApprovalCard components
    - Show empty state when no pending applications
    - Add filters: sort by date, search by business name
    - Apply mobile-first responsive design
    - _Requirements: 4.3_

  - [x] 8.9 Create admin dashboard layout
    - Create app/(admin)/admin/layout.tsx (Server Component)
    - Add admin authentication guard for entire route group
    - Create admin sidebar navigation: Dashboard, Pending Listings, Pending Vendors
    - Show pending count badges on navigation items
    - Apply responsive layout (sidebar collapses on mobile)
    - _Requirements: 3.2, 4.3_

  - [x] 8.10 Create admin dashboard home page
    - Create app/(admin)/admin/page.tsx (Server Component)
    - Display summary cards: Total Listings, Pending Listings, Total Vendors, Pending Vendors, Total Users
    - Show recent activity: latest listings, latest vendor applications
    - Add quick action buttons: Review Listings, Review Vendors
    - Apply mobile-first card layout
    - _Requirements: 3.2, 4.3_

  - [x] 8.11 Create vendor application form
    - Create app/(authenticated)/vendors/apply/page.tsx (Server Component)
    - Create components/features/vendor-application-form.tsx (Client Component)
    - Add form fields: business_name, business_description, contact_email, contact_phone (Nigerian format)
    - Implement real-time validation with Zod schema
    - Show inline error messages on blur
    - Submit via Server Action (create in lib/actions/vendor-actions.ts)
    - Show loading state during submission
    - Display success message and redirect to profile on success
    - Apply mobile-first form design
    - _Requirements: 4.1, 4.2_

  - [x] 8.12 Create vendor application Server Action
    - Create lib/actions/vendor-actions.ts with 'use server' directive
    - Implement submitVendorApplicationAction(formData): validate with vendorApplicationSchema, check auth, insert application with status='pending', return ActionResult
    - Add authentication check
    - Add duplicate application check (user cannot apply twice)
    - Return structured errors
    - _Requirements: 4.1, 4.2_

  - [x] 8.13 Create VendorBadge component
    - Create components/shared/vendor-badge.tsx (Server Component)
    - Display checkmark icon with "Verified Vendor" text
    - Add tooltip explaining badge meaning on hover
    - Apply accessible styling with proper contrast
    - Render responsively for mobile and desktop
    - _Requirements: 4.5_

  - [x] 8.14 Integrate vendor badge into listing displays
    - Update ListingCard to show VendorBadge when seller is approved vendor
    - Update ListingDetail to show VendorBadge on vendor information section
    - Update FeaturedListings to show VendorBadge on cards
    - Fetch vendor status via join in database queries
    - _Requirements: 4.5, 17.6_

  - [x] 8.15 Create notification service (basic email via Supabase)
    - Create lib/services/notifications.ts
    - Implement sendListingApprovedNotification(userId, listingId): send email via Supabase
    - Implement sendListingRejectedNotification(userId, listingId, reason): send email with reason
    - Implement sendVendorApprovedNotification(userId, applicationId): send email
    - Implement sendVendorRejectedNotification(userId, applicationId, reason): send email with reason
    - Add error handling (log errors but don't fail approval workflow)
    - _Requirements: 3.7, 4.7_

  - [x] 8.16 Integrate notifications into approval actions
    - Call sendListingApprovedNotification in approveListingAction after successful approval
    - Call sendListingRejectedNotification in rejectListingAction after successful rejection
    - Call sendVendorApprovedNotification in approveVendorAction after successful approval
    - Call sendVendorRejectedNotification in rejectVendorAction after successful rejection
    - Handle notification failures gracefully (don't block approval)
    - _Requirements: 3.7, 4.7_

- [x] 9. Checkpoint - Approval system complete
  - Test listing approval workflow end-to-end (pending → approved, listing visible on browse page)
  - Test listing rejection workflow (pending → rejected with reason)
  - Test vendor approval workflow (application → approved, badge visible)
  - Test vendor rejection workflow (application → rejected with reason)
  - Verify notifications are sent (check email)
  - Ensure all tests pass, ask the user if questions arise

- [ ] 10. Phase 6: Polish & Launch (Weeks 10-12)
  - [x] 10.1 Implement mobile responsiveness refinements
    - Audit all pages for mobile breakpoints (320px, 375px, 414px, 768px)
    - Verify all touch targets meet minimum 44x44px (buttons, links, form inputs)
    - Test all forms on mobile devices for usability
    - Verify navigation hamburger menu animations smooth
    - Test image loading and display on mobile (portrait and landscape)
    - Verify card layouts adapt correctly to narrow screens
    - Test table displays (convert to cards on mobile if needed)
    - _Requirements: 11.2, 11.3, 11.4, 11.6, 11.7, 11.8_

  - [x] 10.2 Optimize images with Next.js 16 Image component
    - Audit all Image component usages for proper sizes attribute
    - Add priority prop to above-the-fold images (hero, featured listings)
    - Implement blur placeholders for better perceived performance
    - Configure remotePatterns in next.config.js for Supabase storage domain
    - Verify lazy loading works for below-fold images
    - Test image loading on slow 3G connection
    - Ensure WebP/AVIF formats used automatically
    - _Requirements: 11.4, 11.5, 13.14, 13.15_

  - [x] 10.3 Create seed data generation script
    - Create scripts/seed-data.ts
    - Generate 20 users with realistic Nigerian names, emails, phones
    - Generate admin user (email: admin@findam.ng, password: Admin123)
    - Generate 10 categories: Services, Products, Opportunities, Education, Health, Technology, Fashion, Food, Real Estate, Events
    - Generate 50 listings across categories: mix of pending (10), approved (35), rejected (5)
    - Generate listing images: use placeholder images with proper dimensions
    - Generate 10 vendor applications: mix of pending (3), approved (5), rejected (2)
    - Create approved_vendors records for approved applications
    - Add referential integrity checks before inserting
    - Check for existing data before seeding (skip if data exists)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [x] 10.4 Implement accessibility improvements
    - Ensure all interactive elements have keyboard navigation (Tab, Enter, Space, Arrow keys)
    - Add ARIA labels to icons and icon-only buttons
    - Add ARIA live regions for dynamic content updates (success messages, errors)
    - Verify color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI components)
    - Test with keyboard-only navigation (no mouse)
    - Add skip-to-content link for keyboard users
    - Ensure proper heading hierarchy on all pages (h1 → h2 → h3, no skipping)
    - Test focus indicators are visible on all interactive elements
    - Add alt text to all images (descriptive for content, empty for decorative)
    - _Requirements: 9.6, 10.4, 11.9_

  - [x] 10.5 Create user profile page
    - Create app/(authenticated)/profile/page.tsx (Server Component)
    - Fetch current user data from Supabase
    - Display user information: avatar, name, email, phone, join date
    - Show vendor application status if exists (pending/approved/rejected with reason)
    - Add "Edit Profile" button opening edit modal
    - Add avatar upload via ImageUploader (2MB max, single image)
    - Show user's listings count with link to /listings/my-listings
    - Apply mobile-first responsive layout
    - _Requirements: 2.7, 13.13_

  - [x] 10.6 Create user profile edit functionality
    - Create components/features/profile-edit-form.tsx (Client Component)
    - Add form fields: full_name, phone, avatar upload
    - Implement real-time validation
    - Create updateProfileAction Server Action in lib/actions/user-actions.ts
    - Handle avatar upload separately via uploadImageAction
    - Show success message after update
    - Apply mobile-first form design
    - _Requirements: 2.7, 13.13_

  - [x] 10.7 Implement error boundaries and error pages
    - Create app/error.tsx for general error handling (Client Component)
    - Create app/not-found.tsx for 404 errors (Server Component)
    - Create app/(admin)/admin/error.tsx for admin errors
    - Display user-friendly error messages with illustrations
    - Include "Go to Homepage" and "Try Again" buttons
    - Log errors to console for debugging
    - Apply consistent error page styling
    - _Requirements: 1.4, 15.7_

  - [x] 10.8 Add loading states to all async operations
    - Create app/loading.tsx for page-level loading (skeleton)
    - Create app/(authenticated)/listings/create/loading.tsx
    - Create app/(admin)/admin/listings/loading.tsx
    - Add Suspense boundaries around Server Components that fetch data
    - Create skeleton components: ListingCardSkeleton, CategoryCardSkeleton
    - Add loading spinners to forms during submission
    - Add progress indicators to image uploads
    - Show loading states on admin approval actions
    - _Requirements: 13.7, 13.14_

  - [x] 10.9 Implement toast notifications for user feedback
    - Install and configure sonner toast library (already in package.json)
    - Create lib/utils/toast.ts with success, error, info toast helpers
    - Add toast notifications to all Server Actions: success on create/update, error on failure
    - Show toast on login/logout
    - Show toast on listing approval/rejection
    - Show toast on vendor application submission
    - Position toasts appropriately for mobile (bottom) and desktop (top-right)
    - _Requirements: 3.1, 3.7, 4.2, 4.7_

  - [ ]* 10.10 Write E2E test for user registration and login flow
    - Create tests/e2e/auth-flow.spec.ts using Playwright
    - Test: User can register with valid credentials → redirects to homepage → user menu visible
    - Test: User cannot register with existing email → error message displayed
    - Test: User can login with correct credentials → redirects to homepage
    - Test: User cannot login with incorrect credentials → error message displayed
    - Test: User can logout successfully → Login button visible
    - Test on mobile viewport (iPhone 12) and desktop (1920x1080)
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.9_

  - [ ]* 10.11 Write E2E test for multi-image listing creation flow
    - Create tests/e2e/create-listing.spec.ts using Playwright
    - Test: Authenticated user can upload 3 images → see previews → reorder → remove one → upload new → submit listing
    - Test: Listing shows as pending in My Listings page
    - Test: Listing requires all mandatory fields → validation errors shown
    - Test: Images must be 1-5 → error when trying to upload 6th
    - Test: Oversized image is rejected → error message shown
    - Test on mobile and desktop viewports
    - _Requirements: 13.1, 13.3, 13.6, 13.7, 13.9, 13.10_

  - [ ]* 10.12 Write E2E test for browse and filter flow
    - Create tests/e2e/browse-listings.spec.ts using Playwright
    - Test: User can browse all approved listings
    - Test: User can filter by category → results update → URL params update
    - Test: User can filter by location → results update
    - Test: User can search by keyword → results update
    - Test: Filters work together (category + city + search) → results match all filters
    - Test: Empty state shown when no results match filters
    - Test: "Clear Filters" button resets all filters
    - Test on mobile and desktop viewports
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.10_

  - [ ]* 10.13 Write E2E test for image gallery interaction
    - Create tests/e2e/image-gallery.spec.ts using Playwright
    - Test: User can view listing with 3-5 images
    - Test: Clicking thumbnail changes main image
    - Test: Clicking main image opens fullscreen viewer
    - Test: Arrow keys navigate between images in fullscreen
    - Test: Escape key closes fullscreen viewer
    - Test: Swipe gestures work on mobile (simulate touch events)
    - Test: Primary badge shown on primary image thumbnail
    - _Requirements: 17.2, 17.3, 17.4, 17.5, 17.11_

  - [ ]* 10.14 Write E2E test for admin approval workflow
    - Create tests/e2e/admin-approval.spec.ts using Playwright
    - Test: Admin can see pending listings
    - Test: Admin can approve listing → listing becomes visible on browse page
    - Test: Admin can reject listing with reason → reason shown to user
    - Test: Admin can see pending vendor applications
    - Test: Admin can approve vendor → badge visible on listings
    - Test: Admin can reject vendor with reason
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 4.4, 4.5, 4.6_

  - [x] 10.15 Performance optimization and Lighthouse audit
    - Run Lighthouse audit on homepage, browse page, listing detail page
    - Optimize Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
    - Implement static generation where possible (categories, homepage)
    - Add revalidation strategies (revalidate: 3600 for semi-static data)
    - Optimize bundle size (check with next/bundle-analyzer)
    - Ensure all images properly sized and lazy loaded
    - Target Lighthouse scores: Performance 90+, Accessibility 95+, Best Practices 90+, SEO 95+
    - _Requirements: 11.5, 11.8_

  - [x] 10.16 Set up production environment configuration
    - Document required environment variables in README.md
    - Create .env.example file with all required variables and descriptions
    - Add production Supabase URLs and keys to deployment platform (Vercel)
    - Configure next.config.js for production (disable sourcemaps, enable compression)
    - Set up error monitoring with Sentry (already in package.json)
    - Configure Vercel Analytics (already in package.json)
    - Add security headers in next.config.js (CSP, X-Frame-Options, etc.)
    - _Requirements: 15.1, 16.8_

  - [x] 10.17 Database setup and migration for production
    - Apply all database migrations to production Supabase instance
    - Verify RLS policies are enabled and working correctly
    - Create storage buckets with correct configuration
    - Test storage upload and retrieval from production
    - Create admin user account for production
    - Run seed data script on production (optional, for demo)
    - _Requirements: 15.1, 15.2, 15.10_

  - [ ] 10.18 Deploy to Vercel and verify production
    - Connect GitHub repository to Vercel
    - Configure environment variables in Vercel dashboard
    - Deploy to production
    - Verify homepage loads correctly
    - Test authentication flow in production
    - Test listing creation with image upload in production
    - Test admin approval workflow in production
    - Test on real mobile devices (iOS Safari, Chrome Android)
    - Monitor error logs and fix any production-specific issues
    - _Requirements: 11.8, 16.1, 16.8_

  - [ ] 10.19 Create documentation for deployment and maintenance
    - Document deployment process in DEPLOYMENT.md
    - Document environment variables and their purposes
    - Document database schema and migration process
    - Document Supabase storage bucket structure
    - Document admin user creation process
    - Document common troubleshooting steps
    - Document backup and restore procedures
    - _Requirements: 16.8_

  - [x] 10.20 Fix all ESLint issues for production code quality
    - Fix all React unescaped entities: Replace apostrophes (') with &apos; or &#39;, quotes (") with &quot; or &#34; (~60 errors)
    - Fix all React Hook dependency warnings: Add missing dependencies to useEffect arrays or wrap functions in useCallback (~40 warnings)
    - Replace all <img> tags with Next.js <Image /> component for better performance and LCP optimization (~30 warnings)
    - Refactor test files to fix module assignment errors in lib/__tests__/api-endpoints.test.ts and lib/errors/__tests__/imports.test.ts (~25 errors)
    - Fix critical React Hooks Rules violations: Remove conditional Hook calls in components/features/image-gallery.tsx (~5 errors)
    - Fix miscellaneous issues: Replace HTML <a> tags with Next.js <Link />, fix invalid ARIA attributes (~8 errors)
    - Verify ESLint passes with 0 errors and 0 warnings after all fixes
    - _Requirements: 14.2, 14.3_

- [ ] 11. Final checkpoint - MVP launch ready
  - Verify all core features work in production environment
  - Verify mobile experience is smooth on real devices (iOS and Android)
  - Verify admin workflows function correctly end-to-end
  - Verify images load optimally with Next.js 16 Image component
  - Verify accessibility standards met (keyboard navigation, screen reader compatible)
  - Verify performance meets targets (Lighthouse scores 90+)
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- All tasks produce fully functional, production-ready implementations (no placeholders or mock data)
- Every form includes complete validation, error handling, and user feedback
- All navigation must work end-to-end with proper routing
- Multi-image upload is a core feature requiring complete implementation
- Next.js 16 Server Components and Server Actions are used throughout for optimal performance
- Mobile-first approach maintained throughout implementation
- All images optimized using Next.js 16 Image component with proper sizing
- Property-based tests supplement example-based tests for validation logic
- Focus on getting core features working correctly before adding polish

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4", "1.5", "1.6", "1.7", "1.8", "1.9"] },
    { "id": 2, "tasks": ["3.1", "3.2"] },
    { "id": 3, "tasks": ["3.3", "3.4", "3.5", "3.6", "3.7"] },
    { "id": 4, "tasks": ["4.1", "4.4"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.5", "4.6", "4.9", "4.10"] },
    { "id": 6, "tasks": ["4.7", "4.8"] },
    { "id": 7, "tasks": ["4.11"] },
    { "id": 8, "tasks": ["6.1", "6.5", "6.6"] },
    { "id": 9, "tasks": ["6.2", "6.7"] },
    { "id": 10, "tasks": ["6.3", "6.4", "6.11"] },
    { "id": 11, "tasks": ["6.8", "6.9", "6.10", "6.12", "6.13", "6.14", "6.15", "6.16"] },
    { "id": 12, "tasks": ["8.1", "8.2"] },
    { "id": 13, "tasks": ["8.3", "8.4", "8.6", "8.7", "8.12", "8.13", "8.15"] },
    { "id": 14, "tasks": ["8.5", "8.8", "8.11"] },
    { "id": 15, "tasks": ["8.9", "8.10", "8.14", "8.16"] },
    { "id": 16, "tasks": ["10.1", "10.2", "10.3", "10.4"] },
    { "id": 17, "tasks": ["10.5", "10.6", "10.7", "10.8", "10.9"] },
    { "id": 18, "tasks": ["10.10", "10.11", "10.12", "10.13", "10.14"] },
    { "id": 19, "tasks": ["10.15", "10.16", "10.17"] },
    { "id": 20, "tasks": ["10.18", "10.19"] }
  ]
}
```
