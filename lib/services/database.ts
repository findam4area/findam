/**
 * Database Service for FindAm Directory Platform
 * 
 * This module provides database operations for:
 * - Categories (with subcategories)
 * - Listings (with filtering, pagination, and mutations)
 * - Featured listings
 * - User listings management
 * 
 * All functions use server-side Supabase client and include comprehensive error handling.
 * 
 * Requirements: 1.1, 5.1, 5.2, 5.3, 6.1-6.11, 15.2, 15.9
 */

import { createClient } from '@/lib/supabase/server';
import type { 
  Category, 
  Listing, 
  ListingWithRelations,
  BrowseFilters,
  PaginatedResult,
  VendorApplicationWithUser
} from '@/lib/types/core';
// ============================================================================
// Type Helpers (Avoid TypeScript deep instantiation errors)
// ============================================================================

/**
 * Helper type for Supabase query results to avoid deep type instantiation
 */
type SupabaseQueryResult<T = any> = {
  data: T | null;
  error: any | null;
  count?: number | null;
};


// ============================================================================
// Type Transformers (Handle database <-> TypeScript type mapping)
// ============================================================================

/**
 * Transform database category record to Category type
 * Maps database fields to expected TypeScript interface
 */
function transformCategory(dbRecord: any): Category {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    slug: dbRecord.slug || dbRecord.name.toLowerCase().replace(/\s+/g, '-'),
    parent_id: dbRecord.parent_id,
    description: dbRecord.description,
    // Database has 'icon' field (text/emoji or icon name), not image_url
    // Don't pass icon strings as image_url - they need to be mapped to actual icons or images
    image_url: (dbRecord.image_url && typeof dbRecord.image_url === 'string' && dbRecord.image_url.startsWith('http')) 
      ? dbRecord.image_url 
      : null,
    display_order: dbRecord.display_order,
    listing_count: dbRecord.listing_count || 0,
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at
  };
}

/**
 * Transform database listing record to Listing type
 * Maps database fields (state/lga/ward) to expected fields (location_state/location_city)
 */
function transformListing(dbRecord: any): Listing {
  return {
    id: dbRecord.id,
    title: dbRecord.title,
    description: dbRecord.description,
    price: dbRecord.price,
    category_id: dbRecord.category_id,
    user_id: dbRecord.user_id,
    location_state: dbRecord.location_state || dbRecord.state || '',
    location_city: dbRecord.location_city || dbRecord.lga || '',
    images: dbRecord.images || [],
    primary_image_index: dbRecord.primary_image_index || 0,
    is_featured: dbRecord.is_featured || false,
    status: dbRecord.status || 'approved',
    rejection_reason: dbRecord.rejection_reason,
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at
  };
}

/**
 * Transform database listing with relations to ListingWithRelations type
 */
function transformListingWithRelations(dbRecord: any): ListingWithRelations {
  const baseListing = transformListing(dbRecord);
  
  // Ensure category and user are present (required by ListingWithRelations)
  if (!dbRecord.category || !dbRecord.user) {
    throw new Error('Listing query must include category and user relations');
  }
  
 
  // Extract vendor from nested user.approved_vendors array (if exists)
  const vendor = dbRecord.user.approved_vendors?.[0] || dbRecord.vendor || null;
  
  return {
    ...baseListing,
    category: transformCategory(dbRecord.category),
    user: dbRecord.user,
    vendor: vendor
  };
}

// ============================================================================
// Error Handling Helper
// ============================================================================

/**
 * Maps database errors to user-friendly messages
 */
function getDatabaseErrorMessage(error: any): string {
  // Network and connection errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Supabase specific error codes
  if (error.code) {
    switch (error.code) {
      case 'PGRST116':
        return 'No results found.';
      case 'PGRST301':
        return 'Database query error. Please try again.';
      default:
        console.error('Unhandled database error code:', error.code, error);
    }
  }

  // Generic fallback
  console.error('Database error:', error);
  return 'An unexpected database error occurred. Please try again.';
}

// ============================================================================
// Category Operations
// ============================================================================

/**
 * Fetch all categories ordered by display_order
 * 
 * Returns categories suitable for homepage category grid display.
 * Includes listing counts for each category.
 * 
 * Requirements: 1.1, 15.2, 15.9
 * 
 * @returns Array of categories or null on error
 * @throws Never throws - returns null and logs error instead
 */
export async function getCategories(): Promise<Category[] | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return null;
    }

    return data ? data.map(transformCategory) : [];
  } catch (error) {
    console.error('Unexpected error in getCategories:', error);
    return null;
  }
}

/**
 * Fetch a single category by slug with optional subcategories
 * 
 * Used for category-specific pages to display category details
 * and optionally fetch subcategories for navigation.
 * 
 * Requirements: 1.1, 1.2, 15.2, 15.9
 * 
 * @param slug - Category slug (URL-friendly identifier)
 * @param includeSubcategories - Whether to fetch child categories
 * @returns Category object with optional subcategories array, or null if not found
 */
export async function getCategoryBySlug(
  slug: string,
  includeSubcategories: boolean = false
): Promise<(Category & { subcategories?: Category[] }) | null> {
  try {
    const supabase = await createClient();

    // Fetch main category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (categoryError) {
      if (categoryError.code === 'PGRST116') {
        // Not found - this is okay, return null
        return null;
      }
      console.error('Error fetching category by slug:', categoryError);
      return null;
    }

    if (!category) {
      return null;
    }

    const transformedCategory = transformCategory(category);

    // Fetch subcategories if requested
    if (includeSubcategories) {
      const { data: subcategories, error: subError } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', category.id)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (subError) {
        console.error('Error fetching subcategories:', subError);
        // Continue without subcategories rather than failing completely
      } else {
        return {
          ...transformedCategory,
          subcategories: subcategories ? subcategories.map(transformCategory) : []
        };
      }
    }

    return transformedCategory;
  } catch (error) {
    console.error('Unexpected error in getCategoryBySlug:', error);
    return null;
  }
}

/**
 * Fetch all top-level categories (parent_id is null)
 * 
 * Used for navigation menus and category selection dropdowns.
 * 
 * @returns Array of top-level categories or null on error
 */
export async function getTopLevelCategories(): Promise<Category[] | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching top-level categories:', error);
      return null;
    }

    return data ? data.map(transformCategory) : [];
  } catch (error) {
    console.error('Unexpected error in getTopLevelCategories:', error);
    return null;
  }
}

// ============================================================================
// Featured Listings Operations
// ============================================================================

/**
 * Fetch featured listings for homepage display
 * 
 * Returns approved listings marked as featured, with full relations populated.
 * Results include category, user, and vendor information.
 * 
 * Requirements: 5.1, 5.2, 5.3
 * 
 * @param limit - Maximum number of listings to return (default: 6)
 * @returns Array of listings with relations or null on error
 */
export async function getFeaturedListings(
  limit: number = 6
): Promise<ListingWithRelations[] | null> {
  try {
    const supabase = await createClient();

    // @ts-expect-error - Supabase type inference is too deep for TypeScript
    const result = await supabase.from('listings')
      .select(`
        *,
        category:categories(*),
        user:users!user_id(id, email, username, avatar_url, approved_vendors(user_id, business_name, approved_at, approved_badge_enabled))
      `)
      .eq('status', 'approved')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    const { data, error } = result as { data: any[] | null; error: any };

    if (error) {
      console.error('Error fetching featured listings:', error?.message || 'Unknown error', {
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        fullError: JSON.stringify(error, null, 2),
      });
      return null;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(transformListingWithRelations);
  } catch (error) {
    console.error('Unexpected error in getFeaturedListings:', error);
    return null;
  }
}

// ============================================================================
// Listing Operations with Filtering
// ============================================================================

/**
 * Fetch listings with filtering, sorting, and pagination
 * 
 * Supports various filters for browse/search functionality.
 * Returns paginated results with metadata.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11
 * 
 * @param filters - Filter criteria (category, location, search, sort, pagination)
 * @returns Paginated listing results with relations or null on error
 */
export async function getListings(
  filters: BrowseFilters = {}
): Promise<PaginatedResult<ListingWithRelations> | null> {
  try {
    const supabase = await createClient();

    // Extract pagination parameters
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    // Build query
    let query = (supabase
      .from('listings')
      .select(`
        *,
        category:categories(*),
        user:users!user_id(id, email, username, avatar_url, approved_vendors(user_id, business_name, approved_at, approved_badge_enabled))
      `, { count: 'exact' })
      .eq('status', 'approved')) as any;

    // Apply filters
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.location_city) {
      // Try both new field (location_city) and old field (lga)
      query = query.or(`location_city.ilike.%${filters.location_city}%,lga.ilike.%${filters.location_city}%`);
    }

    if (filters.search_query) {
      // Search in title and description
      query = query.or(`title.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`);
    }

    // Apply sorting
    if (filters.sort_by === 'featured') {
      query = query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });
    } else {
      // Default: newest first
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching listings:', error);
      return null;
    }

    if (!data) {
      return {
        data: [],
        meta: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      };
    }

    return {
      data: data.map(transformListingWithRelations),
      meta: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    };
  } catch (error) {
    console.error('Unexpected error in getListings:', error);
    return null;
  }
}

/**
 * Fetch a single listing by ID with all relations
 * 
 * Used for listing detail pages. Fetches listings with all statuses but RLS policies
 * ensure users can only see their own pending/rejected listings or approved listings.
 * 
 * Requirements: 15.2, 15.9
 * 
 * @param id - Listing UUID
 * @returns Listing with relations or null if not found/unauthorized
 */
export async function getListingById(
  id: string
): Promise<ListingWithRelations | null> {
  try {
    const supabase = await createClient();

    // @ts-expect-error - Supabase type inference is too deep for TypeScript
    const result = await supabase.from('listings')
      .select(`
        *,
        category:categories(*),
        user:users!user_id(id, email, username, avatar_url, approved_vendors(user_id, business_name, approved_at, approved_badge_enabled))
      `).eq('id', id)
      .single();

    const { data, error } = result as { data: any | null; error: any };

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found or unauthorized
        return null;
      }
      const errorMsg = getDatabaseErrorMessage(error);
      console.error('Error fetching listing by ID:', error, 'User message:', errorMsg);
      throw new Error(errorMsg);
    }

    if (!data) {
      return null;
    }

    return transformListingWithRelations(data);
  } catch (error) {
    console.error('Unexpected error in getListingById:', error);
    throw error;
  }
}

/**
 * Fetch listings for a specific user
 * 
 * Returns all listings (including pending/rejected) for the authenticated user.
 * Used in "My Listings" page.
 * 
 * Requirements: 15.2, 15.9
 * 
 * @param userId - User UUID
 * @returns Array of user's listings with relations or null on error
 */
export async function getUserListings(
  userId: string
): Promise<ListingWithRelations[] | null> {
  try {
    const supabase = await createClient();

    // @ts-expect-error - Supabase type inference is too deep for TypeScript
    const result = await supabase.from('listings')
      .select(`
        *,
        category:categories(*),
        user:users!user_id(id, email, username, avatar_url, approved_vendors(user_id, business_name, approved_at, approved_badge_enabled))
      `).eq('user_id', userId)
      .order('created_at', { ascending: false });

    const { data, error } = result as { data: any[] | null; error: any };

    if (error) {
      const errorMsg = getDatabaseErrorMessage(error);
      console.error('Error fetching user listings:', error, 'User message:', errorMsg);
      throw new Error(errorMsg);
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(transformListingWithRelations);
  } catch (error) {
    console.error('Unexpected error in getUserListings:', error);
    throw error;
  }
}

// ============================================================================
// Listing Mutations
// ============================================================================

/**
 * Create a new listing
 * 
 * Inserts a new listing record. For databases with migration applied, uses
 * images array. For legacy databases, falls back to existing fields.
 * 
 * Requirements: 15.2, 15.9
 * 
 * @param data - Listing creation data
 * @returns Created listing ID or throws error
 */
export async function createListing(
  data: {
    title: string;
    description: string;
    price: number | null;
    category_id: string;
    user_id: string;
    location_state: string;
    location_city: string;
    images?: string[];
    primary_image_index?: number;
  }
): Promise<string> {
  try {
    const supabase = await createClient();

    // Prepare insert data
    const insertData: any = {
      title: data.title,
      description: data.description,
      price: data.price,
      category_id: data.category_id,
      user_id: data.user_id,
      location_state: data.location_state,
      location_city: data.location_city,
      status: 'pending',
      is_featured: false,
    };

    if (data.images && data.images.length > 0) {
      insertData.images = data.images;
      insertData.primary_image_index = data.primary_image_index ?? 0;
    }


    const { data: listing, error } = await supabase
      .from('listings')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      const errorMsg = getDatabaseErrorMessage(error);
      console.error('Error creating listing:', error, 'User message:', errorMsg);
      throw new Error(errorMsg);
    }

    if (!listing || !listing.id) {
      throw new Error('Failed to create listing. Please try again.');
    }

    return listing.id;
  } catch (error) {
    console.error('Unexpected error in createListing:', error);
    throw error;
  }
}

/**
 * Update listing images and primary image index
 * 
 * Updates the images array and primary_image_index for an existing listing.
 * Only works if migrations have been applied.
 * 
 * Requirements: 15.2, 15.9
 * 
 * @param listingId - Listing UUID
 * @param images - Array of image URLs (1-5 images)
 * @param primaryIndex - Index of primary image (0-4)
 * @returns void or throws error
 */
export async function updateListingImages(
  listingId: string,
  images: string[],
  primaryIndex: number
): Promise<void> {
  try {
    const supabase = await createClient();

    // Validate images array
    if (!images || images.length === 0) {
      throw new Error('At least one image is required for a listing.');
    }

    if (images.length > 5) {
      throw new Error('Maximum 5 images allowed per listing.');
    }

    // Validate primary image index
    if (primaryIndex < 0 || primaryIndex >= images.length) {
      throw new Error('Primary image index must be within the images array bounds.');
    }

    // Update listing images
    const { error } = await supabase
      .from('listings')
      .update({
        images: images,
        primary_image_index: primaryIndex,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId);

    if (error) {
      const errorMsg = getDatabaseErrorMessage(error);
      console.error('Error updating listing images:', error, 'User message:', errorMsg);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('Unexpected error in updateListingImages:', error);
    throw error;
  }
}

// ============================================================================
// Admin Operations
// ============================================================================

/**
 * Fetch pending listings for admin approval
 * 
 * Returns all listings with status='pending' including user and category information.
 * Used in admin dashboard to review and approve/reject listings.
 * 
 * Requirements: 3.2, 3.3
 * 
 * @returns Array of pending listings with relations or null on error
 */
export async function getPendingListings(): Promise<ListingWithRelations[] | null> {
  try {
    const supabase = await createClient();

    // @ts-expect-error - Supabase type inference is too deep for TypeScript
    const result = await supabase.from('listings')
      .select(`
        *,
        category:categories(*),
        user:users!user_id(id, email, username, avatar_url, approved_vendors(user_id, business_name, approved_at, approved_badge_enabled))
      `).eq('status', 'pending')
      .order('created_at', { ascending: true });

    const { data, error } = result as { data: any[] | null; error: any }; // Oldest first for FIFO processing

    if (error) {
      const errorMsg = getDatabaseErrorMessage(error);
      console.error('Error fetching pending listings:', error, 'User message:', errorMsg);
      return null;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(transformListingWithRelations);
  } catch (error) {
    console.error('Unexpected error in getPendingListings:', error);
    return null;
  }
}

/**
 * Fetch pending vendor applications for admin approval
 * 
 * Returns all vendor applications with status='pending' including user information.
 * Used in admin dashboard to review and approve/reject vendor applications.
 * 
 * Requirements: 4.3
 * 
 * @returns Array of pending vendor applications with user data or null on error
 */
export async function getPendingVendorApplications(): Promise<VendorApplicationWithUser[] | null> {
  try {
    const supabase = await createClient();

    const result = await (supabase as any)
      .from('vendor_applications')
      .select(`
        *,
        user:users!user_id(id, email, username, avatar_url, full_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }); // Oldest first for FIFO processing

    const data = result.data as any[] | null;
    const error = result.error;

    if (error) {
      const errorMsg = getDatabaseErrorMessage(error);
      console.error('Error fetching pending vendor applications:', error, 'User message:', errorMsg);
      return null;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data as VendorApplicationWithUser[];
  } catch (error) {
    console.error('Unexpected error in getPendingVendorApplications:', error);
    return null;
  }
}

// ============================================================================
// Admin Dashboard Stats
// ============================================================================

/**
 * Get dashboard statistics for admin home page
 * 
 * Returns counts for:
 * - Total listings (approved)
 * - Pending listings
 * - Total vendors (approved)
 * - Pending vendors
 * - Total users
 * 
 * Requirements: 3.2, 4.3
 * 
 * @returns Dashboard stats object or null on error
 */
export async function getDashboardStats(): Promise<{
  totalListings: number;
  pendingListings: number;
  totalVendors: number;
  pendingVendors: number;
  totalUsers: number;
} | null> {
  try {
    const supabase = await createClient();

    // Fetch all counts in parallel
    const [
      { count: totalListings },
      { count: pendingListings },
      { count: totalVendors },
      { count: pendingVendors },
      { count: totalUsers },
    ] = await Promise.all([
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      (supabase as any).from('approved_vendors').select('*', { count: 'exact', head: true }),
      (supabase as any).from('vendor_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('users').select('*', { count: 'exact', head: true }),
    ]);

    return {
      totalListings: totalListings || 0,
      pendingListings: pendingListings || 0,
      totalVendors: totalVendors || 0,
      pendingVendors: pendingVendors || 0,
      totalUsers: totalUsers || 0,
    };
  } catch (error) {
    console.error('Unexpected error in getDashboardStats:', error);
    return null;
  }
}

/**
 * Get recent listings for admin dashboard
 * 
 * Returns the most recently created listings with full relations.
 * Used to show recent activity on admin dashboard.
 * 
 * Requirements: 3.2
 * 
 * @param limit - Number of recent listings to fetch (default: 5)
 * @returns Array of recent listings with relations or null on error
 */
export async function getRecentListings(limit: number = 5): Promise<ListingWithRelations[] | null> {
  try {
    const supabase = await createClient();

    // @ts-expect-error - Supabase type inference is too deep for TypeScript
    const result = await supabase.from('listings')
      .select(`
        *,
        category:categories(*),
        user:users!user_id(id, email, username, avatar_url, approved_vendors(user_id, business_name, approved_at, approved_badge_enabled))
      `).order('created_at', { ascending: false })
      .limit(limit);

    const { data, error } = result as { data: any[] | null; error: any };

    if (error) {
      const errorMsg = getDatabaseErrorMessage(error);
      console.error('Error fetching recent listings:', error, 'User message:', errorMsg);
      return null;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(transformListingWithRelations);
  } catch (error) {
    console.error('Unexpected error in getRecentListings:', error);
    return null;
  }
}

/**
 * Get recent vendor applications for admin dashboard
 * 
 * Returns the most recently submitted vendor applications with user info.
 * Used to show recent activity on admin dashboard.
 * 
 * Requirements: 4.3
 * 
 * @param limit - Number of recent applications to fetch (default: 5)
 * @returns Array of recent vendor applications or null on error
 */
export async function getRecentVendorApplications(limit: number = 5): Promise<VendorApplicationWithUser[] | null> {
  try {
    const supabase = await createClient();

    const result = await (supabase as any)
      .from('vendor_applications')
      .select(`
        *,
        user:users!user_id(id, email, username, avatar_url, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    const data = result.data as any[] | null;
    const error = result.error;

    if (error) {
      const errorMsg = getDatabaseErrorMessage(error);
      console.error('Error fetching recent vendor applications:', error, 'User message:', errorMsg);
      return null;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data as VendorApplicationWithUser[];
  } catch (error) {
    console.error('Unexpected error in getRecentVendorApplications:', error);
    return null;
  }
}


/**
 * Get vendor status for a specific user
 * 
 * Returns the approved vendor information if the user is an approved vendor.
 * Used to display vendor badge and status on user profile.
 * 
 * Requirements: 4.5
 * 
 * @param userId - User UUID
 * @returns ApprovedVendor object or null if user is not an approved vendor
 */
export async function getVendorStatus(userId: string): Promise<any | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from('approved_vendors')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching vendor status:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getVendorStatus:', error);
    return null;
  }
}

/**
 * Get vendor application for a specific user
 * 
 * Returns the most recent vendor application for the user.
 * Used to display application status (pending/approved/rejected) on user profile.
 * 
 * Requirements: 4.1, 4.2
 * 
 * @param userId - User UUID
 * @returns VendorApplication object or null if no application exists
 */
export async function getUserVendorApplication(userId: string): Promise<any | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from('vendor_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user vendor application:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getUserVendorApplication:', error);
    return null;
  }
}
