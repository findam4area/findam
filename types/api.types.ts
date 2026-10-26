/**
 * API Request/Response Type Definitions
 * 
 * This module defines TypeScript interfaces for API request and response contracts
 * in the FindAm marketplace platform.
 * 
 * Requirements: 14.3 (API request/response types)
 * Task: 1.3.2 Create types/api.types.ts for API contracts
 */

import type {
  ListingStatusType,
  TransactionStatusType,
  VendorApplicationStatusType,
  BrowseSortByType,
} from './enums';

// ============================================================================
// Generic API Response Types
// ============================================================================

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiSuccess<T = void> {
  success: true;
  data: T;
  message?: string;
}

// ============================================================================
// Authentication API Types
// ============================================================================

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: 'user' | 'admin';
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  message: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}

export interface PasswordResetConfirmResponse {
  message: string;
}

// ============================================================================
// Listing API Types
// ============================================================================

export interface CreateListingRequest {
  title: string;
  description: string;
  price: number | null;
  category_id: string;
  location_state: string;
  location_city: string;
  images: string[];              // Array of 1-5 image URLs
  primary_image_index?: number;  // Default: 0
}

export interface CreateListingResponse {
  listing: {
    id: string;
    title: string;
    status: ListingStatusType;
    created_at: string;
  };
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  price?: number | null;
  category_id?: string;
  location_state?: string;
  location_city?: string;
  images?: string[];
  primary_image_index?: number;
}

export interface UpdateListingResponse {
  listing: {
    id: string;
    title: string;
    updated_at: string;
  };
}

export interface GetListingResponse {
  listing: {
    id: string;
    title: string;
    description: string;
    price: number | null;
    category_id: string;
    user_id: string;
    location_state: string;
    location_city: string;
    images: string[];
    primary_image_index: number;
    is_featured: boolean;
    status: ListingStatusType;
    created_at: string;
    updated_at: string;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
    user?: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
    vendor?: {
      user_id: string;
      business_name: string;
      approved_badge_enabled: boolean;
    };
  };
}

export interface BrowseListingsRequest {
  category_id?: string;
  location_city?: string;
  search_query?: string;
  sort_by?: BrowseSortByType;
  limit?: number;
  offset?: number;
}

export interface BrowseListingsResponse {
  listings: Array<{
    id: string;
    title: string;
    description: string;
    price: number | null;
    location_city: string;
    location_state: string;
    images: string[];
    primary_image_index: number;
    is_featured: boolean;
    created_at: string;
    category: {
      id: string;
      name: string;
    };
    user: {
      id: string;
      full_name: string;
    };
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface DeleteListingResponse {
  message: string;
}

// ============================================================================
// Image Upload API Types
// ============================================================================

export interface UploadImageRequest {
  file: File;
  bucket: 'avatars' | 'listings';
}

export interface UploadImageResponse {
  url: string;
  path: string;
  size: number;
}

export interface DeleteImageRequest {
  path: string;
  bucket: 'avatars' | 'listings';
}

export interface DeleteImageResponse {
  message: string;
}

// ============================================================================
// Vendor Application API Types
// ============================================================================

export interface CreateVendorApplicationRequest {
  business_name: string;
  business_description: string;
  contact_email: string;
  contact_phone: string;
}

export interface CreateVendorApplicationResponse {
  application: {
    id: string;
    business_name: string;
    status: VendorApplicationStatusType;
    created_at: string;
  };
}

export interface GetVendorApplicationResponse {
  application: {
    id: string;
    user_id: string;
    business_name: string;
    business_description: string;
    contact_email: string;
    contact_phone: string;
    status: VendorApplicationStatusType;
    rejection_reason: string | null;
    created_at: string;
  };
}

// ============================================================================
// Admin API Types
// ============================================================================

export interface ApproveListingRequest {
  listing_id: string;
}

export interface ApproveListingResponse {
  listing: {
    id: string;
    title: string;
    status: 'approved';
    updated_at: string;
  };
}

export interface RejectListingRequest {
  listing_id: string;
  rejection_reason: string;
}

export interface RejectListingResponse {
  listing: {
    id: string;
    title: string;
    status: 'rejected';
    rejection_reason: string;
    updated_at: string;
  };
}

export interface GetPendingListingsResponse {
  listings: Array<{
    id: string;
    title: string;
    description: string;
    price: number | null;
    images: string[];
    primary_image_index: number;
    status: 'pending';
    created_at: string;
    user: {
      id: string;
      full_name: string;
      email: string;
    };
    category: {
      id: string;
      name: string;
    };
  }>;
}

export interface ApproveVendorApplicationRequest {
  application_id: string;
}

export interface ApproveVendorApplicationResponse {
  application: {
    id: string;
    business_name: string;
    status: 'approved';
  };
  vendor: {
    user_id: string;
    business_name: string;
    approved_at: string;
  };
}

export interface RejectVendorApplicationRequest {
  application_id: string;
  rejection_reason: string;
}

export interface RejectVendorApplicationResponse {
  application: {
    id: string;
    business_name: string;
    status: 'rejected';
    rejection_reason: string;
  };
}

export interface GetPendingVendorApplicationsResponse {
  applications: Array<{
    id: string;
    user_id: string;
    business_name: string;
    business_description: string;
    contact_email: string;
    contact_phone: string;
    status: 'pending';
    created_at: string;
    user: {
      id: string;
      full_name: string;
      email: string;
    };
  }>;
}

// ============================================================================
// Category API Types
// ============================================================================

export interface GetCategoriesResponse {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    description: string | null;
    image_url: string | null;
    display_order: number;
    listing_count: number;
  }>;
}

export interface GetCategoryBySlugRequest {
  slug: string;
}

export interface GetCategoryBySlugResponse {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    listing_count: number;
  };
}

// ============================================================================
// Vehicle API Types (for marketplace enhancement)
// ============================================================================

export interface CreateVehicleRequest {
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
}

export interface CreateVehicleResponse {
  vehicle: {
    id: string;
    listing_id: string;
    make: string;
    model: string;
    year: number;
    created_at: string;
  };
}

export interface UpdateVehicleRequest {
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
}

export interface UpdateVehicleResponse {
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    updated_at: string;
  };
}

export interface GetVehicleResponse {
  vehicle: {
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
  };
}

// ============================================================================
// Transaction API Types (for marketplace enhancement)
// ============================================================================

export interface CreateTransactionRequest {
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  fee?: number;
  payment_method?: 'paystack' | 'wallet' | 'cash';
  notes?: string;
}

export interface CreateTransactionResponse {
  transaction: {
    id: string;
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    amount: number;
    fee: number;
    status: TransactionStatusType;
    created_at: string;
  };
}

export interface UpdateTransactionStatusRequest {
  transaction_id: string;
  status: TransactionStatusType;
  payment_reference?: string;
  notes?: string;
}

export interface UpdateTransactionStatusResponse {
  transaction: {
    id: string;
    status: TransactionStatusType;
    updated_at: string;
  };
}

export interface GetTransactionResponse {
  transaction: {
    id: string;
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    amount: number;
    fee: number;
    status: TransactionStatusType;
    payment_method: 'paystack' | 'wallet' | 'cash' | null;
    payment_reference: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    listing: {
      id: string;
      title: string;
    };
    buyer: {
      id: string;
      full_name: string;
    };
    seller: {
      id: string;
      full_name: string;
    };
  };
}

export interface GetUserTransactionsRequest {
  user_id: string;
  status?: TransactionStatusType;
  limit?: number;
  offset?: number;
}

export interface GetUserTransactionsResponse {
  transactions: Array<{
    id: string;
    listing_id: string;
    amount: number;
    status: TransactionStatusType;
    created_at: string;
    listing: {
      id: string;
      title: string;
    };
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ============================================================================
// Search API Types
// ============================================================================

export interface SearchRequest {
  query: string;
  category_id?: string;
  location_state?: string;
  location_city?: string;
  min_price?: number;
  max_price?: number;
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  listings: Array<{
    id: string;
    title: string;
    description: string;
    price: number | null;
    images: string[];
    primary_image_index: number;
    location_city: string;
    location_state: string;
    category: {
      id: string;
      name: string;
    };
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  facets?: {
    categories: Array<{ id: string; name: string; count: number }>;
    states: Array<{ state: string; count: number }>;
    priceRanges: Array<{ min: number; max: number; count: number }>;
  };
}

// ============================================================================
// User Profile API Types
// ============================================================================

export interface UpdateUserProfileRequest {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface UpdateUserProfileResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    updated_at: string;
  };
}

export interface GetUserProfileResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    role: 'user' | 'admin';
    created_at: string;
  };
  stats?: {
    total_listings: number;
    active_listings: number;
    pending_listings: number;
  };
  vendor?: {
    user_id: string;
    business_name: string;
    approved_badge_enabled: boolean;
  };
}

// ============================================================================
// Type Guards
// ============================================================================

export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false &&
    'error' in response
  );
}

export function isApiSuccess<T>(response: unknown): response is ApiSuccess<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === true
  );
}
