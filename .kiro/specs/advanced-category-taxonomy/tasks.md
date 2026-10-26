# Implementation Plan: Advanced Category Taxonomy System with Business Profiles

## Overview

This implementation plan converts the design document into discrete coding tasks for the Advanced Category Taxonomy System. The system implements a comprehensive hierarchical category taxonomy with 23 main categories, business profiles with multi-category tagging, product/service listings, search and filtering capabilities, reviews and ratings, and premium features including verified badges and premium subscriptions.

The implementation follows an incremental approach, building core infrastructure first, then adding business logic, search capabilities, and finally UI components. Each task references specific requirements from the requirements document to maintain traceability.

## Tasks

- [x] 1. Set up database schema and core infrastructure
  - [x] 1.1 Create database migration for categories table with translations support
    - Create categories table with JSONB fields for multi-language support
    - Add indexes for parent_id, display_order, and name_translations (GIN)
    - Create update_updated_at_column() trigger function for timestamp updates
    - Add unique constraint on (name, parent_id) to prevent duplicates at same level
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 21.1, 21.2, 21.3_

  - [x] 1.2 Create database migration for business_profiles table with PostGIS support
    - Create business_profiles table with all fields from design
    - Add GEOGRAPHY(POINT, 4326) column for coordinates
    - Add TSVECTOR column for full-text search
    - Add optional VECTOR(1536) column for semantic search embeddings
    - Create indexes: user_id, primary_category_id, city/state, coordinates (GIST), premium status, rating, search_vector (GIN)
    - Add check constraints for business_type, price_range, premium_tier
    - Create trigger to auto-update search_vector on INSERT/UPDATE
    - Create trigger to auto-update updated_at timestamp
    - Add unique constraint on user_id (one business profile per user)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.2, 6.4, 13.6, 14.5, 15.1, 17.2_

  - [x] 1.3 Create database migrations for related tables
    - Create business_category_tags junction table with is_primary flag
    - Create product_listings table with image arrays and stock tracking
    - Create service_listings table with pricing models
    - Create business_reviews table with rating aggregation fields
    - Create category_analytics table for admin metrics
    - Add all necessary indexes and foreign key constraints
    - _Requirements: 2.2, 2.3, 2.6, 9.1, 9.2, 9.6, 10.1, 10.2, 11.1, 11.2, 20.1, 20.2_

  - [x] 1.4 Create database trigger for review rating aggregation
    - Implement update_business_rating_aggregates() function
    - Calculate average_rating (rounded to 2 decimals) from non-flagged reviews
    - Calculate review_count from non-flagged reviews
    - Create AFTER INSERT/UPDATE/DELETE trigger on business_reviews
    - Update business_profiles table with new aggregates
    - _Requirements: 11.4, 12.1, 12.2, 12.6_

  - [x] 1.5 Create TypeScript type definitions
    - Create lib/types/category.ts with Category, CategoryTranslations interfaces
    - Create lib/types/business-profile.ts with BusinessProfile, BusinessSearchFilters interfaces
    - Create lib/types/product.ts with ProductListing interface
    - Create lib/types/service.ts with ServiceListing interface
    - Create lib/types/review.ts with BusinessReview interface
    - Create lib/types/analytics.ts with CategoryAnalytics interface
    - Include all category-specific field types (FoodBeverage, HealthMedical, etc.)
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ]* 1.6 Write property test for CSV round-trip preservation
    - **Property 1: CSV round-trip preservation**
    - **Validates: Requirement 22.4**
    - Use fast-check to generate arbitrary category collections
    - Verify: formatCategoriesToCSV → parseCSVToCategories → formatCategoriesToCSV produces equivalent output
    - Test with 100+ iterations to catch edge cases

  - [ ]* 1.7 Write property test for CSV parent reference validation
    - **Property 2: CSV parent reference validation**
    - **Validates: Requirement 22.5**
    - Generate category collections with invalid parent_id references
    - Verify parser rejects with appropriate error messages
    - Ensure error messages include specific missing parent_id

  - [ ]* 1.8 Write property test for CSV display order uniqueness
    - **Property 3: CSV display order uniqueness validation**
    - **Validates: Requirement 22.6**
    - Generate categories with duplicate display_order values within same parent
    - Verify parser rejects duplicate display orders correctly
    - Test that different parents can have same display_order

- [x] 2. Checkpoint - Verify database setup
  - Ensure all migrations run successfully
  - Verify all indexes are created
  - Verify triggers execute correctly
  - Test basic CRUD operations on categories table
  - Ask the user if questions arise.

- [x] 3. Implement category data seeding and management
  - [x] 3.1 Create category seed data file
    - Create data/categories-seed.ts with all 23 main categories
    - Include all 289 subcategories with proper parent relationships
    - Set display_order for each category
    - Add icon names and descriptions for each category
    - Include English translations by default
    - _Requirements: 1.3, 1.4, 21.1_

  - [x] 3.2 Implement CSV parser for category import
    - Create lib/parsers/category-csv-parser.ts
    - Implement parseCSVToCategories() function
    - Validate parent_id references exist
    - Validate display_order uniqueness within parent
    - Return descriptive errors with line numbers for invalid data
    - _Requirements: 22.1, 22.2, 22.5, 22.6_

  - [x] 3.3 Implement CSV formatter for category export
    - Create lib/parsers/category-csv-formatter.ts
    - Implement formatCategoriesToCSV() function
    - Format output with headers: name, parent_id, display_order, description
    - Handle nested category structures
    - _Requirements: 22.3_

  - [ ]* 3.4 Write property test for CSV error messages
    - **Property 4: CSV parser error messages**
    - **Validates: Requirement 22.2**
    - Generate various malformed CSV inputs (missing fields, type errors, etc.)
    - Verify error messages include line numbers
    - Verify error messages describe specific validation failures

  - [x] 3.5 Create database seeding script
    - Create scripts/seed-categories.ts
    - Load categories-seed.ts data
    - Insert all main categories first
    - Insert subcategories with proper parent references
    - Handle idempotent execution (skip if already seeded)
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.6 Create admin API endpoint for category import
    - Create app/api/admin/categories/import/route.ts (POST)
    - Accept CSV data in request body
    - Call parseCSVToCategories() to validate
    - Insert valid categories into database
    - Return import summary with success/error counts
    - Require admin authentication
    - _Requirements: 19.1, 19.2_

- [x] 4. Implement category API endpoints
  - [x] 4.1 Create GET /api/categories endpoint
    - Create app/api/categories/route.ts (GET)
    - Query all main categories (parent_id IS NULL)
    - Include subcategories for each main category
    - Calculate business_count for each category using COUNT query
    - Support language parameter for translations (default: English)
    - Cache response for performance
    - _Requirements: 1.4, 3.1, 3.4, 21.2, 21.3, 21.4_

  - [x] 4.2 Create GET /api/categories/[id] endpoint
    - Create app/api/categories/[id]/route.ts (GET)
    - Query single category by ID
    - Include all subcategories
    - Calculate business_count
    - Return 404 if category not found
    - Support language parameter for translations
    - _Requirements: 3.2, 3.4_

  - [x] 4.3 Create GET /api/categories/[id]/businesses endpoint
    - Create app/api/categories/[id]/businesses/route.ts (GET)
    - Accept query params: subcategory_id, page, limit, sort_by
    - Query businesses with primary or secondary category matching
    - Support sorting by rating, review_count, name
    - Return paginated results with total count
    - Include business profile summaries (no full product/service lists)
    - _Requirements: 2.6, 3.3, 3.4_

  - [x] 4.4 Create admin endpoint for category reordering
    - Create app/api/admin/categories/[id]/reorder/route.ts (PATCH)
    - Accept display_order in request body
    - Update category display_order
    - Require admin authentication
    - _Requirements: 19.3_

  - [ ]* 4.5 Write unit tests for category API endpoints
    - Test GET /api/categories returns all main categories
    - Test GET /api/categories/[id] returns category with subcategories
    - Test language parameter switches translations
    - Test category not found returns 404
    - Test business count calculation is accurate

- [x] 5. Implement business profile management
  - [x] 5.1 Create profile completeness calculator
    - Create lib/utils/profile-completeness.ts
    - Implement calculateProfileCompleteness() function per design algorithm
    - Assign weights to each field (business_name: 10, description: 10, etc.)
    - Check for minimum lengths (description ≥50 chars, photos ≥3, etc.)
    - Return percentage (0-100)
    - _Requirements: 17.1, 17.2, 17.3_

  - [ ]* 5.2 Write property test for completeness calculation
    - **Property 9: Profile completeness calculation**
    - **Validates: Requirements 17.1, 17.2**
    - Generate business profiles with various field combinations
    - Verify completeness is sum of field weights for non-empty fields
    - Verify completeness capped at 100%
    - Test edge cases: empty profile (0%), fully complete (100%)

  - [x] 5.3 Create POST /api/business-profiles endpoint
    - Create app/api/business-profiles/route.ts (POST)
    - Accept CreateBusinessProfileRequest body
    - Validate required fields (business_name, description, primary_category_id, city, state)
    - Check user doesn't already have a business profile
    - Insert into business_profiles table
    - Insert primary category tag into business_category_tags with is_primary=true
    - Insert secondary category tags with is_primary=false
    - Calculate and set completeness_percentage
    - Return created business profile
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 17.1_

  - [x] 5.4 Create GET /api/business-profiles/[id] endpoint
    - Create app/api/business-profiles/[id]/route.ts (GET)
    - Query business profile by ID
    - Join with primary_category and user tables
    - Query secondary categories from business_category_tags
    - Query products, services, and recent reviews
    - Calculate rating breakdown (5-star, 4-star, etc.)
    - Return comprehensive business profile response
    - Increment view_count on each GET
    - _Requirements: 2.7, 12.5_

  - [x] 5.5 Create PATCH /api/business-profiles/[id] endpoint
    - Create app/api/business-profiles/[id]/route.ts (PATCH)
    - Accept partial UpdateBusinessProfileRequest body
    - Verify requesting user is the business owner
    - Update allowed fields in business_profiles table
    - Update category tags if categories changed
    - Recalculate completeness_percentage
    - Return updated profile
    - _Requirements: 2.2, 2.3, 2.4, 17.4_

  - [x] 5.6 Implement photo upload for business profiles
    - Create app/api/business-profiles/[id]/photos/route.ts (POST)
    - Accept multipart form data with photo files
    - Validate file formats (JPEG, PNG, WebP only)
    - Validate file sizes (max 5MB per file)
    - Validate total photo count (max 50 photos)
    - Upload to Supabase Storage
    - Update photo_urls array in business_profiles
    - Set primary_photo_url if specified
    - _Requirements: 13.1, 13.2, 13.3, 13.6_

  - [ ]* 5.7 Write unit tests for business profile operations
    - Test profile creation with valid data
    - Test duplicate profile prevention (one per user)
    - Test profile update authorization (only owner can update)
    - Test completeness calculation updates on profile changes
    - Test photo upload validation (format, size, count)

- [ ] 6. Checkpoint - Verify business profile functionality
  - Ensure business profiles can be created and updated
  - Verify completeness calculation works correctly
  - Verify photo uploads work with Supabase Storage
  - Test multi-category tagging
  - Ask the user if questions arise.

- [x] 7. Implement product and service listings
  - [x] 7.1 Create POST /api/business-profiles/[id]/products endpoint
    - Create app/api/business-profiles/[id]/products/route.ts (POST)
    - Accept CreateProductRequest with multipart form data
    - Verify requesting user owns the business profile
    - Validate product fields (title, description, price, product_type)
    - Validate price format (positive, max 2 decimals)
    - Upload product images to Supabase Storage
    - Validate image count (1-10 images)
    - Insert into product_listings table
    - Return created product
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 7.2 Create GET /api/business-profiles/[id]/products endpoint
    - Create app/api/business-profiles/[id]/products/route.ts (GET)
    - Query all products for the business profile
    - Support filtering by is_active
    - Support filtering by is_featured
    - Return products with image URLs
    - Calculate and include is_in_stock status
    - _Requirements: 9.5, 9.7_

  - [x] 7.3 Create PATCH /api/products/[id] endpoint
    - Create app/api/products/[id]/route.ts (PATCH)
    - Accept UpdateProductRequest body
    - Verify requesting user owns the parent business profile
    - Update product fields
    - Recalculate is_in_stock if stock_quantity changed
    - Return updated product
    - _Requirements: 9.6_

  - [x] 7.4 Create POST /api/business-profiles/[id]/services endpoint
    - Create app/api/business-profiles/[id]/services/route.ts (POST)
    - Accept CreateServiceRequest with multipart form data
    - Verify requesting user owns the business profile
    - Validate service fields (title, description, pricing_model)
    - Upload service images to Supabase Storage (max 5 images)
    - Insert into service_listings table
    - Return created service
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 7.5 Create GET /api/business-profiles/[id]/services endpoint
    - Create app/api/business-profiles/[id]/services/route.ts (GET)
    - Query all services for the business profile
    - Support filtering by is_active
    - Support filtering by is_featured
    - Return services with image URLs
    - Display "Contact for Quote" for custom pricing
    - _Requirements: 10.5, 10.6_

  - [x] 7.6 Create PATCH /api/services/[id] endpoint
    - Create app/api/services/[id]/route.ts (PATCH)
    - Accept partial update for service fields
    - Verify requesting user owns the parent business profile
    - Update service listing
    - Return updated service
    - _Requirements: 10.1, 10.2_

  - [ ]* 7.7 Write unit tests for product and service APIs
    - Test product creation with valid data
    - Test product image validation (count, size, format)
    - Test service creation with different pricing models
    - Test stock quantity validation for physical products
    - Test authorization (only owner can create/update)

- [x] 8. Implement review and rating system
  - [x] 8.1 Create POST /api/business-profiles/[id]/reviews endpoint
    - Create app/api/business-profiles/[id]/reviews/route.ts (POST)
    - Accept CreateReviewRequest (rating, comment)
    - Validate rating is 1-5
    - Validate comment length (10-1000 characters)
    - Check user hasn't already reviewed this business
    - Check user is not the business owner
    - Insert into business_reviews table
    - Trigger will auto-update business_profiles.average_rating and review_count
    - Return created review and updated business rating
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 8.2 Create GET /api/business-profiles/[id]/reviews endpoint
    - Create app/api/business-profiles/[id]/reviews/route.ts (GET)
    - Accept query params: page, limit, sort_by
    - Query reviews for business in reverse chronological order
    - Support sorting by recent, rating_high, rating_low
    - Calculate rating breakdown (count per star level)
    - Return paginated reviews with rating breakdown
    - _Requirements: 11.5, 12.5_

  - [x] 8.3 Create POST /api/reviews/[id]/respond endpoint
    - Create app/api/reviews/[id]/respond/route.ts (POST)
    - Accept RespondToReviewRequest (response text, max 1000 chars)
    - Verify requesting user owns the business that was reviewed
    - Check review doesn't already have a response
    - Update owner_response and responded_at fields
    - Return updated review
    - _Requirements: 11.6_

  - [x] 8.4 Create POST /api/admin/reviews/[id]/flag endpoint
    - Create app/api/admin/reviews/[id]/flag/route.ts (POST)
    - Accept FlagReviewRequest (reason)
    - Require admin authentication
    - Set is_flagged=true, store reason and timestamp
    - Trigger will recalculate business rating excluding flagged reviews
    - Return flagged review
    - _Requirements: 11.7_

  - [ ]* 8.5 Write property test for review average calculation
    - **Property 10: Review average rating calculation**
    - **Validates: Requirement 11.4**
    - Generate arbitrary sets of reviews with ratings 1-5
    - Calculate average manually and verify matches database trigger result
    - Verify rounding to 2 decimal places
    - Test with single review, multiple reviews, and edge cases

  - [ ]* 8.6 Write unit tests for review system
    - Test review submission with valid data
    - Test duplicate review prevention
    - Test owner cannot review own business
    - Test rating aggregation trigger updates business_profiles
    - Test business owner response authorization
    - Test review flagging by admin

- [x] 9. Checkpoint - Verify products, services, and reviews
  - Ensure products can be created with images
  - Verify services with different pricing models work
  - Verify review submission updates business rating
  - Test rating breakdown calculation
  - Ask the user if questions arise.

- [x] 10. Implement search and filtering
  - [x] 10.1 Create search ranking calculator
    - Create lib/utils/search-ranking.ts
    - Implement calculateSearchScore() function per design algorithm
    - Weighted scoring: text relevance (0.4), rating (0.2), category match (0.15), premium boost (0.1), verification boost (0.1), freshness (0.05)
    - Implement tiebreaker logic: review_count → view_count → created_at
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [x] 10.2 Create GET /api/search/businesses endpoint
    - Create app/api/search/businesses/route.ts (GET)
    - Accept BusinessSearchFilters query params (query, category_id, location, min_rating, price_range, etc.)
    - Build PostgreSQL full-text search query with ts_rank
    - Apply location filter using ST_DWithin if coordinates provided
    - Apply rating filter (average_rating >= min_rating)
    - Apply price_range filter
    - Apply service_attributes filters (AND logic for multiple)
    - Calculate search scores using ranking algorithm
    - Return within 2 seconds (add timeout)
    - Return paginated results with search metadata
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 7.1, 7.2, 7.3, 7.5, 7.6, 8.1, 8.2, 8.3, 8.5_

  - [x] 10.3 Create GET /api/search/autocomplete endpoint
    - Create app/api/search/autocomplete/route.ts (GET)
    - Accept query parameter (search text)
    - Query business names matching prefix
    - Query category names matching prefix
    - Query city/state names matching prefix
    - Return suggestions with type indicators (business, category, location)
    - Limit to 10 suggestions
    - _Requirements: 4.4, 4.5_

  - [ ]* 10.4 Write property test for primary category search weighting
    - **Property 7: Primary category search weighting**
    - **Validates: Requirement 2.5**
    - Generate business profiles with primary and secondary categories
    - Calculate search scores for category matches
    - Verify primary category contributes weight 1.0
    - Verify secondary categories contribute weight 0.5 or less

  - [ ]* 10.5 Write property test for multi-category query inclusion
    - **Property 8: Multi-category query inclusion**
    - **Validates: Requirement 2.6**
    - Generate business with primary category P and secondary categories S1, S2
    - Query for businesses in category P, verify business included
    - Query for businesses in S1, verify business included
    - Query for businesses in S2, verify business included

  - [ ]* 10.6 Write property test for completeness ranking boost
    - **Property 11: Completeness search ranking boost**
    - **Validates: Requirement 17.5**
    - Generate pairs of businesses with identical search scores
    - Set one with completeness > 80, other with completeness ≤ 80
    - Verify higher completeness ranks higher in results

  - [x] 10.7 Implement location-based distance calculation
    - Create lib/utils/distance-calculator.ts
    - Use PostGIS ST_Distance for coordinate distance calculation
    - Convert result to kilometers
    - Add distance field to search results when location filter applied
    - Support radius options: 5km, 10km, 25km, 50km, 80km
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [ ]* 10.8 Write unit tests for search and filtering
    - Test full-text search matches business names and descriptions
    - Test location filter with known coordinates
    - Test rating filter (min_rating threshold)
    - Test price range filter
    - Test service attributes filter (AND logic)
    - Test search ranking algorithm with known inputs
    - Test tiebreaker logic when scores are equal

- [x] 11. Implement verification and premium features
  - [x] 11.1 Create POST /api/admin/business-profiles/[id]/verify endpoint
    - Create app/api/admin/business-profiles/[id]/verify/route.ts (POST)
    - Require admin authentication
    - Accept optional verification_notes
    - Set is_verified=true, verified_at=NOW()
    - Store verification_notes in verification_documents JSONB
    - Return updated business profile
    - _Requirements: 14.1, 14.4, 14.5_

  - [x] 11.2 Create POST /api/business-profiles/[id]/premium endpoint
    - Create app/api/business-profiles/[id]/premium/route.ts (POST)
    - Accept UpgradeToPremiumRequest (tier, duration_months, payment_method)
    - Verify requesting user owns the business profile
    - Calculate premium expiration date
    - Set is_premium=true, premium_tier, premium_expires_at
    - Generate payment URL (integrate with payment provider)
    - Return payment URL and subscription ID
    - _Requirements: 15.1, 15.5, 15.6_

  - [ ] 11.3 Implement premium expiration check
    - Create cron job or scheduled function to check premium_expires_at
    - Query businesses where is_premium=true AND premium_expires_at < NOW()
    - Set is_premium=false for expired subscriptions
    - Send renewal notification 7 days before expiration
    - _Requirements: 15.7_

  - [x] 11.4 Create premium analytics endpoint
    - Create app/api/business-profiles/[id]/analytics/route.ts (GET)
    - Require business owner or admin authentication
    - Only available for premium businesses
    - Return view_count, click-through rates, engagement metrics
    - _Requirements: 15.4_

  - [ ]* 11.5 Write unit tests for verification and premium features
    - Test verification by admin sets verified badge
    - Test non-admin cannot verify businesses
    - Test premium upgrade flow
    - Test premium expiration check
    - Test premium businesses rank higher in search

- [x] 12. Checkpoint - Verify search and premium features
  - Ensure search returns ranked results
  - Verify location-based filtering works with PostGIS
  - Test premium upgrade flow
  - Verify verified badge displays correctly
  - Ask the user if questions arise.

- [x] 13. Implement business profile JSON serialization
  - [x] 13.1 Create business profile serializer
    - Create lib/serializers/business-profile-serializer.ts
    - Implement serializeBusinessProfile() function
    - Convert BusinessProfile object to JSON with all nested fields
    - Handle arrays (products, services, reviews)
    - Preserve data types (numbers, strings, booleans, dates)
    - _Requirements: 23.1, 23.5, 23.6_

  - [x] 13.2 Create business profile deserializer
    - Create lib/serializers/business-profile-deserializer.ts
    - Implement deserializeBusinessProfile() function
    - Parse JSON to BusinessProfile object
    - Validate field types during parsing
    - Return validation errors for invalid data with field-specific messages
    - _Requirements: 23.3, 23.2_

  - [ ]* 13.3 Write property test for JSON round-trip preservation
    - **Property 5: Business profile JSON round-trip preservation**
    - **Validates: Requirement 23.4**
    - Generate arbitrary business profiles with nested data
    - Verify: serialize → deserialize → serialize produces equivalent JSON
    - Test with 100+ iterations including edge cases

  - [ ]* 13.4 Write property test for JSON validation errors
    - **Property 6: Business profile JSON validation**
    - **Validates: Requirement 23.2**
    - Generate invalid business profile data (missing fields, wrong types, etc.)
    - Verify deserializer returns field-specific error messages
    - Ensure errors identify which fields failed validation

- [x] 14. Implement category-specific fields
  - [x] 14.1 Create category-specific field schemas
    - Create lib/schemas/category-fields.ts
    - Define Zod schemas for FoodBeverageFields, HealthMedicalFields, RealEstateFields, AutomotiveFields
    - Include validation rules for each category type
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [x] 14.2 Add category-specific fields to business profile creation
    - Extend POST /api/business-profiles endpoint
    - Accept category_specific_fields in request body
    - Validate fields based on primary_category_id
    - Store in business_profiles.category_specific_fields JSONB column (add in migration if not exists)
    - _Requirements: 18.5_

  - [x] 14.3 Display category-specific fields on business profile page
    - Extend GET /api/business-profiles/[id] response
    - Include category_specific_fields in response
    - Parse based on primary_category_id
    - Display appropriate fields for category type
    - _Requirements: 18.6_

  - [ ]* 14.4 Write unit tests for category-specific fields
    - Test Food & Beverage fields validation
    - Test Health & Medical fields validation
    - Test Real Estate fields validation
    - Test Automotive fields validation
    - Test fields are stored and retrieved correctly

- [x] 15. Implement category analytics (admin)
  - [x] 15.1 Create category analytics aggregation function
    - Create lib/utils/category-analytics.ts
    - Implement aggregateCategoryAnalytics() function
    - Count businesses per category
    - Count searches per category (track in search endpoint)
    - Count views per category
    - Store daily aggregates in category_analytics table
    - _Requirements: 20.1, 20.2, 20.3_

  - [x] 15.2 Create scheduled job for analytics aggregation
    - Create scheduled function to run daily at midnight UTC
    - Call aggregateCategoryAnalytics() to update metrics
    - Store results with period_date and period_type='daily'
    - _Requirements: 20.7_

  - [x] 15.3 Create GET /api/admin/analytics/categories endpoint
    - Create app/api/admin/analytics/categories/route.ts (GET)
    - Require admin authentication
    - Accept query params: start_date, end_date, period_type
    - Query category_analytics table
    - Return top categories by business_count and search_count
    - Return empty categories (categories with 0 businesses)
    - Calculate trending categories (growth percentage)
    - _Requirements: 20.4, 20.5, 20.6_

  - [x] 15.4 Create GET /api/admin/analytics/businesses endpoint
    - Create app/api/admin/analytics/businesses/route.ts (GET)
    - Require admin authentication
    - Calculate total_businesses, verified_businesses, premium_businesses
    - Calculate average_completeness across all businesses
    - Group businesses by category and state
    - Return business analytics summary
    - _Requirements: 20.1_

  - [x]* 15.5 Write unit tests for analytics endpoints
    - Test category analytics aggregation
    - Test top categories calculation
    - Test empty categories identification
    - Test business analytics summary
    - Test admin authorization

- [x] 16. Implement bulk category operations (admin)
  - [ ] 16.1 Extend category import to handle updates
    - Update app/api/admin/categories/import/route.ts
    - Support updating existing categories (match by name)
    - Support merging duplicate categories
    - Track which categories were created vs updated
    - _Requirements: 19.1, 19.4_

  - [ ] 16.2 Create category hide/unhide endpoint
    - Create app/api/admin/categories/[id]/hide/route.ts (PATCH)
    - Set is_hidden flag without deleting
    - Prevent new businesses from selecting hidden categories
    - Preserve existing business assignments
    - _Requirements: 19.5, 19.6_

  - [ ]* 16.3 Write unit tests for bulk operations
    - Test CSV import creates new categories
    - Test CSV import updates existing categories
    - Test category merging reassigns businesses
    - Test hiding categories prevents new assignments
    - Test hidden categories preserve existing assignments

- [x] 17. Checkpoint - Verify analytics and admin features
  - Ensure category analytics aggregate correctly
  - Verify admin endpoints require authentication
  - Test bulk category operations
  - Verify hidden categories work as expected
  - Ask the user if questions arise.

- [x] 18. Implement React UI components for category browsing
  - [ ] 18.1 Create CategoryGrid component
    - Create components/categories/CategoryGrid.tsx
    - Display all 23 main categories in responsive grid
    - Show category icon, name, and business count
    - Support language selection for translations
    - Make categories clickable to navigate to subcategories
    - _Requirements: 3.1, 3.4, 21.5_

  - [ ] 18.2 Create SubcategoryList component
    - Create components/categories/SubcategoryList.tsx
    - Display subcategories for selected main category
    - Show subcategory name and business count
    - Navigate to business list when subcategory clicked
    - Support keyboard navigation
    - _Requirements: 3.2, 3.4, 3.6_

  - [ ] 18.3 Create CategoryBusinessList component
    - Create components/categories/CategoryBusinessList.tsx
    - Display businesses for selected category/subcategory
    - Show business cards with primary photo, name, rating, price range
    - Support pagination
    - Support sorting (rating, review_count, name)
    - Display zero results message when appropriate
    - _Requirements: 3.3, 3.7_

  - [ ] 18.4 Create category browse pages
    - Create app/(main)/categories/page.tsx for main category grid
    - Create app/(main)/categories/[id]/page.tsx for subcategory list
    - Create app/(main)/categories/[id]/businesses/page.tsx for business list
    - Wire up components with API calls
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 18.5 Write unit tests for category UI components
    - Test CategoryGrid displays all categories
    - Test SubcategoryList displays correct subcategories
    - Test business count displays for each category
    - Test language switcher changes category names
    - Test navigation to category detail pages

- [x] 19. Implement business profile UI components
  - [x] 19.1 Create BusinessProfileForm component
    - Create components/business/BusinessProfileForm.tsx
    - Form fields for all business profile data
    - Multi-select for primary and secondary categories
    - Subcategory selector based on selected categories
    - Location input with geocoding support
    - Business hours editor
    - Service attributes checkboxes
    - Price range selector
    - Category-specific fields based on primary category
    - Real-time completeness percentage display
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 17.3, 18.1, 18.2, 18.3, 18.4_

  - [x] 19.2 Create PhotoUploader component
    - Create components/business/PhotoUploader.tsx
    - Drag-and-drop photo upload
    - File format validation (JPEG, PNG, WebP)
    - File size validation (max 5MB)
    - Image preview gallery
    - Set primary photo selector
    - Display upload progress
    - Max 50 photos limit
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 19.3 Create ProductListingForm component
    - Create components/business/ProductListingForm.tsx
    - Product type selector (physical/digital)
    - Price input with validation
    - Stock quantity input (for physical products)
    - Image uploader (1-10 images)
    - Featured checkbox
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 19.4 Create ServiceListingForm component
    - Create components/business/ServiceListingForm.tsx
    - Pricing model selector (fixed/hourly/custom)
    - Price input (conditional on pricing model)
    - Duration text input
    - Image uploader (1-5 images)
    - Featured checkbox
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 19.5 Create BusinessProfileView component
    - Create components/business/BusinessProfileView.tsx
    - Display all business profile information
    - Photo gallery with lightbox
    - Primary category badge and secondary category tags
    - Verified badge if is_verified=true
    - Premium badge if is_premium=true
    - Average rating with star display
    - Rating breakdown chart
    - Review list
    - Products grid
    - Services grid
    - Category-specific fields display
    - _Requirements: 2.7, 12.1, 12.2, 12.3, 12.4, 12.5, 13.5, 14.1, 14.6, 14.7, 15.2, 18.6_

  - [x] 19.6 Create business profile pages
    - Create app/(main)/business-profiles/create/page.tsx for profile creation
    - Create app/(main)/business-profiles/[id]/page.tsx for viewing profiles
    - Create app/(main)/business-profiles/[id]/edit/page.tsx for editing
    - Create app/(main)/business-profiles/[id]/products/page.tsx for managing products
    - Create app/(main)/business-profiles/[id]/services/page.tsx for managing services
    - _Requirements: 2.1, 2.7, 9.5, 10.5_

  - [x]* 19.7 Write unit tests for business profile UI components
    - Test profile form validation
    - Test category selection updates subcategory options
    - Test completeness percentage updates on field changes
    - Test photo upload validation
    - Test product/service form validation

- [x] 20. Implement search and filter UI components
  - [x] 20.1 Create BusinessSearchBar component
    - Create components/search/BusinessSearchBar.tsx
    - Search input with autocomplete
    - Call GET /api/search/autocomplete on input change
    - Display suggestions with type icons (business, category, location)
    - Navigate to search results on submit
    - _Requirements: 4.4, 4.5_

  - [x] 20.2 Create SearchFilters component
    - Create components/search/SearchFilters.tsx
    - Location filter with radius selector (5km, 10km, 25km, 50km, 80km)
    - Geolocation permission request for current location
    - Rating filter with options (3.0+, 3.5+, 4.0+, 4.5+, 5.0)
    - Price range filter (Budget, Moderate, Premium, Luxury)
    - Service attributes checkboxes (delivery, online, in-person, 24/7, emergency)
    - Sort by selector (relevance, rating, review_count, distance, name)
    - Verified businesses only checkbox
    - Premium businesses only checkbox
    - _Requirements: 6.1, 6.2, 6.6, 7.1, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 20.3 Create SearchResults component
    - Create components/search/SearchResults.tsx
    - Display business cards in grid layout
    - Show distance from user location if location filter applied
    - Highlight premium businesses
    - Highlight verified businesses
    - Display matched search terms (highlighted)
    - Pagination controls
    - Zero results message
    - Display search metadata (query time, total results)
    - _Requirements: 4.3, 4.5, 6.5, 7.6_

  - [x] 20.4 Create search results page
    - Create app/(main)/search/page.tsx
    - Wire up BusinessSearchBar, SearchFilters, and SearchResults
    - Call GET /api/search/businesses with filter params
    - Update URL query params as filters change
    - Support deep linking with query params
    - _Requirements: 4.1, 4.3, 6.1, 7.1, 8.1_

  - [ ]* 20.5 Write unit tests for search UI components
    - Test autocomplete displays suggestions
    - Test filters update search query params
    - Test search results display business cards
    - Test premium and verified badges display
    - Test distance display when location filter applied

- [x] 21. Implement review UI components
  - [x] 21.1 Create ReviewForm component
    - Create components/reviews/ReviewForm.tsx
    - Star rating selector (1-5 stars)
    - Comment textarea (10-1000 characters)
    - Character count display
    - Submit button
    - Display validation errors
    - _Requirements: 11.1, 11.2_

  - [x] 21.2 Create ReviewList component
    - Create components/reviews/ReviewList.tsx
    - Display reviews in reverse chronological order
    - Show reviewer name, rating, comment, timestamp
    - Show business owner response if present
    - Pagination controls
    - Sort by selector (recent, rating_high, rating_low)
    - _Requirements: 11.5, 11.6_

  - [x] 21.3 Create RatingBreakdown component
    - Create components/reviews/RatingBreakdown.tsx
    - Display average rating with stars
    - Display total review count
    - Display bar chart showing 5-star, 4-star, 3-star, 2-star, 1-star counts
    - Show "No reviews yet" message when review_count=0
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 21.4 Add review functionality to business profile page
    - Integrate ReviewForm into business profile view
    - Show ReviewForm only for authenticated users who aren't the owner
    - Integrate ReviewList below business details
    - Integrate RatingBreakdown above review list
    - Display success message on review submission
    - Update displayed rating immediately after submission
    - _Requirements: 11.1, 11.3, 11.5, 12.6_

  - [ ]* 21.5 Write unit tests for review UI components
    - Test rating selector updates state
    - Test comment validation (length constraints)
    - Test review list displays reviews
    - Test rating breakdown chart renders correctly
    - Test owner response displays when present

- [x] 22. Implement premium and verification UI
  - [x] 22.1 Create VerifiedBadge component
    - Create components/badges/VerifiedBadge.tsx
    - Display checkmark icon with distinctive color
    - Show tooltip on hover explaining verification
    - _Requirements: 14.6, 14.7_

  - [x] 22.2 Create PremiumBadge component
    - Create components/badges/PremiumBadge.tsx
    - Display distinctive premium badge
    - Different styles for basic, pro, enterprise tiers
    - _Requirements: 15.2_

  - [x] 22.3 Create PremiumUpgradeModal component
    - Create components/premium/PremiumUpgradeModal.tsx
    - Display pricing tiers (basic, pro, enterprise)
    - Duration options (1, 3, 6, 12 months)
    - Feature comparison table
    - Call POST /api/business-profiles/[id]/premium on submit
    - Redirect to payment URL
    - _Requirements: 15.1, 15.3, 15.6_

  - [x] 22.4 Create PremiumAnalyticsDashboard component
    - Create components/premium/PremiumAnalyticsDashboard.tsx
    - Display view count chart
    - Display engagement metrics
    - Only accessible for premium businesses
    - Call GET /api/business-profiles/[id]/analytics
    - _Requirements: 15.4_

  - [ ]* 22.5 Write unit tests for premium and verification UI
    - Test verified badge displays with tooltip
    - Test premium badge displays for different tiers
    - Test premium upgrade modal shows pricing
    - Test analytics dashboard requires premium status

- [x] 23. Implement admin UI for category management
  - [x] 23.1 Create CategoryImportForm component
    - Create components/admin/CategoryImportForm.tsx
    - CSV file upload input
    - Parse and validate CSV client-side
    - Display preview of categories to import
    - Call POST /api/admin/categories/import
    - Display import results (success count, errors)
    - _Requirements: 19.1, 19.2_

  - [x] 23.2 Create CategoryManagementTable component
    - Create components/admin/CategoryManagementTable.tsx
    - Display all categories in table with subcategories
    - Reorder controls for display_order
    - Hide/unhide toggle for each category
    - Merge categories button
    - Call reorder and hide endpoints
    - _Requirements: 19.3, 19.4, 19.5, 19.6_

  - [x] 23.3 Create CategoryAnalyticsDashboard component
    - Create components/admin/CategoryAnalyticsDashboard.tsx
    - Display top 10 categories by business count
    - Display top 10 categories by search count
    - Display empty categories list
    - Display trending categories with growth percentage
    - Call GET /api/admin/analytics/categories
    - _Requirements: 20.4, 20.5, 20.6_

  - [x] 23.4 Create BusinessAnalyticsDashboard component
    - Create components/admin/BusinessAnalyticsDashboard.tsx
    - Display total businesses, verified, premium counts
    - Display average completeness percentage
    - Display businesses by category chart
    - Display businesses by state chart
    - Call GET /api/admin/analytics/businesses
    - _Requirements: 20.1_

  - [x] 23.5 Create admin pages
    - Create app/(admin)/admin/categories/page.tsx for category management
    - Create app/(admin)/admin/categories/import/page.tsx for CSV import
    - Create app/(admin)/admin/analytics/page.tsx for analytics dashboards
    - Require admin authentication for all pages
    - _Requirements: 19.1, 20.4, 20.5_

  - [ ]* 23.6 Write unit tests for admin UI components
    - Test CSV import form validates file format
    - Test category table displays all categories
    - Test reorder functionality updates display_order
    - Test analytics dashboard displays correct metrics
    - Test admin pages require authentication

- [x] 24. Final checkpoint and integration testing
  - Ensure all database migrations run successfully
  - Verify all API endpoints return correct responses
  - Test complete user workflows (business creation, search, reviews)
  - Test admin workflows (category import, verification, analytics)
  - Verify all property-based tests pass
  - Run integration tests for database operations
  - Test performance (search < 2 seconds, rating update < 5 seconds)
  - Verify accessibility compliance for UI components
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements from the requirements document for traceability
- Property-based tests validate universal correctness properties defined in the design document
- Unit tests validate specific examples and edge cases
- Database triggers handle rating aggregation and search vector updates automatically
- The implementation uses TypeScript with Next.js 14 App Router, React 18+, PostgreSQL with PostGIS, and Supabase
- Premium and verification features require payment provider integration (not included in core implementation)
- Vector search (pgvector) is optional and can be added as an enhancement
- Multi-language support stores translations in JSONB columns for flexibility
- Category-specific fields are validated based on the business's primary category
- All API endpoints require appropriate authentication and authorization checks
- Performance requirements: search < 2 seconds, rating update < 5 seconds
- Accessibility: All UI components should follow WCAG 2.1 AA guidelines

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2", "1.3", "1.5"]
    },
    {
      "id": 1,
      "tasks": ["1.4", "1.6", "1.7", "1.8", "3.1"]
    },
    {
      "id": 2,
      "tasks": ["3.2", "3.3", "3.5", "5.1"]
    },
    {
      "id": 3,
      "tasks": ["3.4", "3.6", "4.1", "4.2", "5.2", "5.3"]
    },
    {
      "id": 4,
      "tasks": ["4.3", "4.4", "4.5", "5.4", "5.5"]
    },
    {
      "id": 5,
      "tasks": ["5.6", "5.7", "7.1", "7.4", "10.1"]
    },
    {
      "id": 6,
      "tasks": ["7.2", "7.3", "7.5", "7.6", "7.7", "8.1"]
    },
    {
      "id": 7,
      "tasks": ["8.2", "8.3", "8.4", "8.5", "8.6"]
    },
    {
      "id": 8,
      "tasks": ["10.2", "10.7", "13.1"]
    },
    {
      "id": 9,
      "tasks": ["10.3", "10.4", "10.5", "10.6", "10.8", "13.2"]
    },
    {
      "id": 10,
      "tasks": ["11.1", "11.2", "11.4", "13.3", "13.4", "14.1"]
    },
    {
      "id": 11,
      "tasks": ["11.3", "11.5", "14.2", "14.3", "15.1"]
    },
    {
      "id": 12,
      "tasks": ["14.4", "15.2", "15.3", "15.4"]
    },
    {
      "id": 13,
      "tasks": ["15.5", "16.1", "16.2"]
    },
    {
      "id": 14,
      "tasks": ["16.3", "18.1", "18.2"]
    },
    {
      "id": 15,
      "tasks": ["18.3", "18.4", "18.5", "19.1"]
    },
    {
      "id": 16,
      "tasks": ["19.2", "19.3", "19.4", "19.5"]
    },
    {
      "id": 17,
      "tasks": ["19.6", "19.7", "20.1", "20.2"]
    },
    {
      "id": 18,
      "tasks": ["20.3", "20.4", "20.5", "21.1", "21.2", "21.3"]
    },
    {
      "id": 19,
      "tasks": ["21.4", "21.5", "22.1", "22.2", "22.3"]
    },
    {
      "id": 20,
      "tasks": ["22.4", "22.5", "23.1", "23.2"]
    },
    {
      "id": 21,
      "tasks": ["23.3", "23.4", "23.5", "23.6"]
    }
  ]
}
```
