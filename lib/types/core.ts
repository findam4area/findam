/**
 * Core TypeScript type definitions for FindAm curated directory platform
 * 
 * This module defines the foundational types for:
 * - Users and authentication
 * - Categories and listings
 * - Vendor applications and approvals
 * - Multi-image upload and management
 * - Server Action responses
 * 
 * Requirements: 13.1, 13.2, 14.4, 14.5, 14.8
 */

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  phone: string | null;
  username: string;
  full_name: string;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Category Types
// ============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  image_url: string | null;
  display_order: number;
  listing_count: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Listing Types (with Multi-Image Support)
// ============================================================================

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  category_id: string;
  user_id: string;
  location_state: string;
  location_city: string;
  
  // Multi-image fields (Requirements 13.1, 13.2)
  images: string[];              // Array of 3-5 image URLs
  primary_image_index: number;   // Index of primary image (default: 0)
  
  is_featured: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when joined)
  category?: Category;
  user?: User;
  vendor?: ApprovedVendor | null;
}

// ============================================================================
// Vendor Types
// ============================================================================

export interface VendorApplication {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string;
  contact_email: string;
  contact_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when joined)
  user?: User;
}

export interface ApprovedVendor {
  user_id: string;
  business_name: string;
  approved_at: string;
  approved_badge_enabled: boolean;
}

// ============================================================================
// Image Upload and Gallery Types (Requirements 13.3, 13.4, 13.5, 13.8)
// ============================================================================

/**
 * Result returned from successful image upload
 */
export interface ImageUploadResult {
  url: string;        // Public URL for accessing the image
  path: string;       // Storage path for deletion/management
  size: number;       // File size in bytes
}

/**
 * Image data for gallery display
 */
export interface ImageGalleryImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

// ============================================================================
// Authentication Types (Requirements 2.1, 2.4, 2.5, 2.8)
// ============================================================================

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
}

export interface PasswordResetInput {
  email: string;
}

export interface PasswordResetConfirmInput {
  token: string;
  password: string;
}

// ============================================================================
// Filter and Input Types (Requirements 6.1-6.11)
// ============================================================================

export interface BrowseFilters {
  category_id?: string;
  location_city?: string;
  search_query?: string;
  sort_by?: 'newest' | 'featured';
  limit?: number;
  offset?: number;
}

export interface CreateListingInput {
  title: string;
  description: string;
  price: number | null;
  category_id: string;
  location_state: string;
  location_city: string;
  images: string[];              // Array of 1-5 image URLs
  primary_image_index: number;   // Index of primary image (0-4)
}

export interface UpdateListingImagesInput {
  images: string[];              // Array of 1-5 image URLs
  primary_image_index: number;   // Must be < images.length
}

export interface VendorApplicationInput {
  business_name: string;
  business_description: string;
  contact_email: string;
  contact_phone: string;
}

// ============================================================================
// Server Action Response Types (Requirement 14.4)
// ============================================================================

/**
 * Generic response type for Server Actions
 * Provides consistent error handling and type safety
 */
export interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

// Specific action result types for common operations

export interface AuthActionResult extends ActionResult<User> {
  user?: User;
}

export interface ListingActionResult extends ActionResult<string> {
  listingId?: string;
}

export interface ImageUploadActionResult extends ActionResult<ImageUploadResult> {
  result?: ImageUploadResult;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type for pagination metadata
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Type for paginated results
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Type for listing with all relations populated
 */
export interface ListingWithRelations extends Listing {
  category: Category;
  user: User;
  vendor: ApprovedVendor | null;
}

/**
 * Type for vendor application with user relation
 */
export interface VendorApplicationWithUser extends VendorApplication {
  user: User;
}

// ============================================================================
// Storage Bucket Types
// ============================================================================

export type StorageBucket = 'avatars' | 'listings';

/**
 * Configuration for storage buckets
 */
export interface StorageBucketConfig {
  name: StorageBucket;
  public: boolean;
  fileSizeLimit: number;        // In bytes
  allowedMimeTypes: string[];
}

// ============================================================================
// Validation Error Types
// ============================================================================

/**
 * Field-level validation error
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Validation result with field errors
 */
export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
}

// ============================================================================
// Image Upload State Types (for UI components)
// ============================================================================

/**
 * State for individual image being uploaded
 */
export interface ImageUploadState {
  file: File;
  preview: string;
  uploading: boolean;
  progress: number;
  url?: string;
  error?: string;
}
