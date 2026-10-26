/**
 * Database TypeScript Type Definitions
 * 
 * This module defines TypeScript interfaces for all database tables
 * in the FindAm marketplace platform.
 * 
 * Requirements: 14.3 (TypeScript interfaces for Supabase tables)
 * Task: 1.3.1 Create types/database.types.ts for database schema
 */

// ============================================================================
// Users Table Types
// ============================================================================

export interface DbUser {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface DbUserInsert {
  id?: string;
  email: string;
  phone?: string | null;
  full_name: string;
  avatar_url?: string | null;
  role?: 'user' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface DbUserUpdate {
  email?: string;
  phone?: string | null;
  full_name?: string;
  avatar_url?: string | null;
  role?: 'user' | 'admin';
  updated_at?: string;
}

// ============================================================================
// Categories Table Types
// ============================================================================

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  image_url: string | null;
  display_order: number;
  listing_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbCategoryInsert {
  id?: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string | null;
  image_url?: string | null;
  display_order?: number;
  listing_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DbCategoryUpdate {
  name?: string;
  slug?: string;
  parent_id?: string | null;
  description?: string | null;
  image_url?: string | null;
  display_order?: number;
  listing_count?: number;
  updated_at?: string;
}

// ============================================================================
// Listings Table Types (with Multi-Image Support)
// ============================================================================

export interface DbListing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  category_id: string;
  user_id: string;
  location_state: string;
  location_city: string;
  // Multi-image fields (Requirements 13.1, 13.2)
  images: string[];              // Array of 1-5 image URLs
  primary_image_index: number;   // Index of primary image (default: 0)
  is_featured: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbListingInsert {
  id?: string;
  title: string;
  description: string;
  price?: number | null;
  category_id: string;
  user_id: string;
  location_state: string;
  location_city: string;
  images: string[];              // Array of 1-5 image URLs
  primary_image_index?: number;  // Default: 0
  is_featured?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbListingUpdate {
  title?: string;
  description?: string;
  price?: number | null;
  category_id?: string;
  location_state?: string;
  location_city?: string;
  images?: string[];
  primary_image_index?: number;
  is_featured?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  updated_at?: string;
}

// ============================================================================
// Vendor Applications Table Types
// ============================================================================

export interface DbVendorApplication {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string;
  contact_email: string;
  contact_phone: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbVendorApplicationInsert {
  id?: string;
  user_id: string;
  business_name: string;
  business_description: string;
  contact_email: string;
  contact_phone: string;
  status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbVendorApplicationUpdate {
  business_name?: string;
  business_description?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  updated_at?: string;
}

// ============================================================================
// Approved Vendors Table Types
// ============================================================================

export interface DbApprovedVendor {
  user_id: string;
  business_name: string;
  approved_at: string;
  approved_badge_enabled: boolean;
}

export interface DbApprovedVendorInsert {
  user_id: string;
  business_name: string;
  approved_at?: string;
  approved_badge_enabled?: boolean;
}

export interface DbApprovedVendorUpdate {
  business_name?: string;
  approved_badge_enabled?: boolean;
}

// ============================================================================
// Vehicles Table Types (for marketplace enhancement)
// ============================================================================

export interface DbVehicle {
  id: string;
  listing_id: string;
  make: string;
  model: string;
  year: number;
  mileage: number | null;
  fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid' | null;
  transmission: 'automatic' | 'manual' | null;
  body_type: string | null;
  color: string | null;
  condition: 'new' | 'used' | 'refurbished';
  vin: string | null;
  engine_size: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbVehicleInsert {
  id?: string;
  listing_id: string;
  make: string;
  model: string;
  year: number;
  mileage?: number | null;
  fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | null;
  transmission?: 'automatic' | 'manual' | null;
  body_type?: string | null;
  color?: string | null;
  condition: 'new' | 'used' | 'refurbished';
  vin?: string | null;
  engine_size?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbVehicleUpdate {
  make?: string;
  model?: string;
  year?: number;
  mileage?: number | null;
  fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | null;
  transmission?: 'automatic' | 'manual' | null;
  body_type?: string | null;
  color?: string | null;
  condition?: 'new' | 'used' | 'refurbished';
  vin?: string | null;
  engine_size?: string | null;
  updated_at?: string;
}

// ============================================================================
// Transactions Table Types (for marketplace enhancement)
// ============================================================================

export interface DbTransaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  fee: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  payment_method: 'paystack' | 'wallet' | 'cash' | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface DbTransactionInsert {
  id?: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  fee?: number;
  status?: 'pending' | 'completed' | 'cancelled' | 'refunded';
  payment_method?: 'paystack' | 'wallet' | 'cash' | null;
  payment_reference?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
}

export interface DbTransactionUpdate {
  amount?: number;
  fee?: number;
  status?: 'pending' | 'completed' | 'cancelled' | 'refunded';
  payment_method?: 'paystack' | 'wallet' | 'cash' | null;
  payment_reference?: string | null;
  notes?: string | null;
  updated_at?: string;
  completed_at?: string | null;
}

// ============================================================================
// Database Relationships (with relations populated)
// ============================================================================

export interface DbListingWithRelations extends DbListing {
  category: DbCategory;
  user: DbUser;
  vendor: DbApprovedVendor | null;
  vehicle?: DbVehicle | null;
}

export interface DbVendorApplicationWithUser extends DbVendorApplication {
  user: DbUser;
}

export interface DbTransactionWithRelations extends DbTransaction {
  listing: DbListing;
  buyer: DbUser;
  seller: DbUser;
}

// ============================================================================
// Database Query Filter Types
// ============================================================================

export interface DbListingFilters {
  category_id?: string;
  user_id?: string;
  location_city?: string;
  location_state?: string;
  status?: 'pending' | 'approved' | 'rejected';
  is_featured?: boolean;
  min_price?: number;
  max_price?: number;
  search_query?: string;
}

export interface DbVendorApplicationFilters {
  status?: 'pending' | 'approved' | 'rejected';
  user_id?: string;
}

export interface DbTransactionFilters {
  buyer_id?: string;
  seller_id?: string;
  listing_id?: string;
  status?: 'pending' | 'completed' | 'cancelled' | 'refunded';
  payment_method?: 'paystack' | 'wallet' | 'cash';
}

export interface DbVehicleFilters {
  make?: string;
  model?: string;
  min_year?: number;
  max_year?: number;
  fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  transmission?: 'automatic' | 'manual';
  condition?: 'new' | 'used' | 'refurbished';
}

// ============================================================================
// Database Pagination Types
// ============================================================================

export interface DbPaginationParams {
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DbPaginatedResult<T> {
  data: T[];
  count: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isDbListing(obj: unknown): obj is DbListing {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'user_id' in obj &&
    'category_id' in obj &&
    Array.isArray((obj as DbListing).images)
  );
}

export function isDbUser(obj: unknown): obj is DbUser {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'full_name' in obj
  );
}

export function isDbVehicle(obj: unknown): obj is DbVehicle {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'listing_id' in obj &&
    'make' in obj &&
    'model' in obj
  );
}
