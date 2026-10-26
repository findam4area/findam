/**
 * Listing Server Actions for Next.js 16
 * 
 * This module provides Server Actions for listing management including:
 * - Creating new listings with multi-image support
 * - Updating listing images and primary image index
 * 
 * All actions include:
 * - Authentication checks (user must be logged in)
 * - Authorization checks (user can only update own listings)
 * - Zod validation for input data
 * - Revalidation of cached pages after mutations
 * - Structured error responses for display
 * 
 * Requirements: 3.1, 13.9, 13.10
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  createListingSchema,
  updateListingImagesSchema,
} from '@/lib/validation/schemas';
import type { ActionResult } from '@/lib/types/core';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the current authenticated user
 * @returns User ID if authenticated, null otherwise
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Maps database errors to user-friendly messages
 * Requirement 15.7: Display specific, actionable error messages
 */
function getDatabaseErrorMessage(error: any): string {
  // Network and connection errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Foreign key violations
  if (error.code === '23503') {
    if (error.message?.includes('category_id')) {
      return 'Invalid category selected. Please choose a valid category.';
    }
    return 'Invalid reference. Please check your input and try again.';
  }

  // Unique constraint violations
  if (error.code === '23505') {
    return 'A listing with this information already exists.';
  }

  // Check constraint violations
  if (error.code === '23514') {
    if (error.message?.includes('valid_images_count')) {
      return 'You must upload between 1 and 5 images for your listing.';
    }
    if (error.message?.includes('primary_within_bounds')) {
      return 'Invalid primary image selection. Please select a valid image.';
    }
    if (error.message?.includes('valid_primary_image')) {
      return 'Primary image index must be a valid number starting from 0.';
    }
    return 'Invalid data format. Please check your input.';
  }

  // Permission errors
  if (error.code === '42501' || error.message?.includes('permission')) {
    return 'You do not have permission to perform this action.';
  }

  // Row Level Security policy violations
  if (error.code === 'PGRST301' || error.message?.includes('policy')) {
    return 'You do not have permission to perform this action.';
  }

  // Generic fallback
  console.error('Database error:', error);
  return 'An unexpected error occurred. Please try again.';
}

// ============================================================================
// Create Listing Action
// ============================================================================

/**
 * Creates a new listing with multi-image support
 * Images must be uploaded separately before calling this action
 * Listing is created with 'pending' status and requires admin approval
 * 
 * Requirements: 3.1, 13.9
 * 
 * @param formData - Form data containing listing details and image URLs
 * @returns ActionResult with listing ID or error message
 * 
 * Flow:
 * 1. Check authentication (user must be logged in)
 * 2. Validate input data with createListingSchema
 * 3. Insert listing with 'pending' status
 * 4. Revalidate browse pages to show user's pending listing
 * 5. Return listing ID for navigation
 * 
 * @example
 * ```tsx
 * // In a Client Component form
 * async function handleSubmit(formData: FormData) {
 *   // First upload images separately
 *   const imageUrls = await uploadImages(files);
 *   
 *   // Add image URLs to form data
 *   formData.set('images', JSON.stringify(imageUrls));
 *   
 *   // Create listing
 *   const result = await createListingAction(formData);
 *   if (result.success) {
 *     router.push(`/listing/${result.listingId}`);
 *   } else {
 *     setError(result.error);
 *   }
 * }
 * ```
 */
export async function createListingAction(
  formData: FormData
): Promise<ActionResult<string>> {
  try {
    // Check authentication (Requirement 3.1)
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return {
        success: false,
        error: 'You must be logged in to create a listing. Please log in and try again.',
      };
    }

    // Extract form data
    const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      price: formData.get('price'),
      category_id: formData.get('category_id'),
      location_state: formData.get('location_state'),
      location_city: formData.get('location_city'),
      images: formData.get('images'),
      primary_image_index: formData.get('primary_image_index'),
    };

    // Parse JSON fields
    let images: string[] = [];
    let primaryImageIndex = 0;

    try {
      // Parse images array from JSON string
      if (typeof rawData.images === 'string') {
        images = JSON.parse(rawData.images);
      } else if (Array.isArray(rawData.images)) {
        images = rawData.images;
      }

      // Parse price (can be null for free listings)
      const priceValue = rawData.price;
      let price: number | null = null;
      if (priceValue && priceValue !== 'null' && priceValue !== '') {
        const parsedPrice = typeof priceValue === 'string' 
          ? parseFloat(priceValue) 
          : Number(priceValue);
        if (!isNaN(parsedPrice)) {
          price = parsedPrice;
        }
      }
      rawData.price = price;

      // Parse primary_image_index
      const primaryIndexValue = rawData.primary_image_index;
      if (primaryIndexValue && primaryIndexValue !== 'null' && primaryIndexValue !== '') {
        const parsedIndex = typeof primaryIndexValue === 'string'
          ? parseInt(primaryIndexValue, 10)
          : Number(primaryIndexValue);
        if (!isNaN(parsedIndex)) {
          primaryImageIndex = parsedIndex;
        }
      }
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid data format. Please check your input and try again.',
      };
    }

    // Prepare validation data
    const validationData = {
      ...rawData,
      price: rawData.price,
      images,
      primary_image_index: primaryImageIndex,
    };

    // Validate with Zod schema (Requirement 13.9)
    const validation = createListingSchema.safeParse(validationData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    const data = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Insert listing with pending status (Requirement 3.1)
    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert({
        title: data.title,
        description: data.description,
        price: data.price,
        category_id: data.category_id,
        user_id: userId,
        location_state: data.location_state,
        location_city: data.location_city,
        images: data.images,
        primary_image_index: data.primary_image_index,
        status: 'pending',
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      return {
        success: false,
        error: getDatabaseErrorMessage(insertError),
      };
    }

    if (!listing) {
      return {
        success: false,
        error: 'Failed to create listing. Please try again.',
      };
    }

    // Revalidate browse pages to show user's pending listing (Requirement 13.10)
    revalidatePath('/browse');
    revalidatePath('/inventory'); // User's listings page
    revalidatePath(`/categories/${data.category_id}`);
    revalidatePath('/'); // Homepage (might show recent listings)

    return {
      success: true,
      data: listing.id,
    };

  } catch (error: any) {
    console.error('Unexpected error during listing creation:', error);
    return {
      success: false,
      error: getDatabaseErrorMessage(error),
    };
  }
}

// ============================================================================
// Update Listing Images Action
// ============================================================================

/**
 * Updates the images and primary image index for an existing listing
 * User can only update their own listings (authorization check)
 * 
 * Requirements: 13.9, 13.10
 * 
 * @param listingId - UUID of the listing to update
 * @param imageUrls - Array of image URLs (1-5 images)
 * @param primaryIndex - Index of primary image (0-4, must be < imageUrls.length)
 * @returns ActionResult indicating success or error
 * 
 * Flow:
 * 1. Check authentication (user must be logged in)
 * 2. Validate input data with updateListingImagesSchema
 * 3. Check authorization (verify listing belongs to user)
 * 4. Update listing images and primary_image_index
 * 5. Revalidate cached pages
 * 6. Return success
 * 
 * @example
 * ```tsx
 * // In a Client Component
 * async function handleUpdateImages(newImages: string[], newPrimaryIndex: number) {
 *   const result = await updateListingImagesAction(
 *     listingId,
 *     newImages,
 *     newPrimaryIndex
 *   );
 *   if (result.success) {
 *     setMessage('Images updated successfully');
 *   } else {
 *     setError(result.error);
 *   }
 * }
 * ```
 */
export async function updateListingImagesAction(
  listingId: string,
  imageUrls: string[],
  primaryIndex: number
): Promise<ActionResult<void>> {
  try {
    // Check authentication (Requirement 13.9)
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return {
        success: false,
        error: 'You must be logged in to update listings. Please log in and try again.',
      };
    }

    // Validate listing ID format
    if (!listingId || typeof listingId !== 'string') {
      return {
        success: false,
        error: 'Invalid listing ID.',
      };
    }

    // Validate with Zod schema (Requirement 13.9)
    const validation = updateListingImagesSchema.safeParse({
      images: imageUrls,
      primary_image_index: primaryIndex,
    });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    const data = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Check authorization: verify listing belongs to user (Requirement 13.10)
    const { data: existingListing, error: fetchError } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return {
          success: false,
          error: 'Listing not found.',
        };
      }
      return {
        success: false,
        error: getDatabaseErrorMessage(fetchError),
      };
    }

    if (!existingListing) {
      return {
        success: false,
        error: 'Listing not found.',
      };
    }

    // Authorization check: user can only update own listings (Requirement 13.10)
    if (existingListing.user_id !== userId) {
      return {
        success: false,
        error: 'You do not have permission to update this listing.',
      };
    }

    // Update listing images
    const { error: updateError } = await supabase
      .from('listings')
      .update({
        images: data.images,
        primary_image_index: data.primary_image_index,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    if (updateError) {
      return {
        success: false,
        error: getDatabaseErrorMessage(updateError),
      };
    }

    // Revalidate cached pages (Requirement 13.10)
    revalidatePath(`/listing/${listingId}`);
    revalidatePath('/inventory'); // User's listings page
    revalidatePath('/browse');
    revalidatePath('/'); // Homepage

    return {
      success: true,
    };

  } catch (error: any) {
    console.error('Unexpected error during listing image update:', error);
    return {
      success: false,
      error: getDatabaseErrorMessage(error),
    };
  }
}
