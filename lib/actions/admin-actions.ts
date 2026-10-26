/**
 * Admin Server Actions for Next.js 16
 * 
 * This module provides Server Actions for admin operations including:
 * - Approving and rejecting listings with notifications
 * - Approving and rejecting vendor applications with notifications
 * - Authorization checks (admin role required)
 * - Cache revalidation after approval/rejection
 * 
 * All actions include:
 * - Admin authentication and authorization checks
 * - Zod validation for input data
 * - Revalidation of cached pages after mutations
 * - Email notifications to users
 * - Structured error responses
 * 
 * Requirements: 3.3, 3.4, 3.5, 3.6, 4.4, 4.6
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/services/auth';
import {
  rejectReasonSchema,
  approveListingSchema,
  rejectListingSchema,
  approveVendorSchema,
  rejectVendorSchema,
} from '@/lib/validation/schemas';
import type { ActionResult } from '@/lib/types/core';
import {
  sendListingApprovedNotification,
  sendListingRejectedNotification,
  sendVendorApprovedNotification,
  sendVendorRejectedNotification,
} from '@/lib/services/notifications';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database errors to user-friendly messages
 * Requirement: 15.7
 */
function getDatabaseErrorMessage(error: any): string {
  // Network and connection errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Not found errors
  if (error.code === 'PGRST116') {
    return 'Record not found.';
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
// Listing Approval Actions
// ============================================================================

/**
 * Approve a listing and make it publicly visible
 * 
 * This action:
 * 1. Verifies admin authentication
 * 2. Validates listing ID
 * 3. Updates listing status to 'approved'
 * 4. Revalidates all relevant cached pages
 * 5. Sends approval notification email to listing creator
 * 
 * Requirements: 3.3, 3.4
 * 
 * @param listingId - UUID of the listing to approve
 * @returns ActionResult indicating success or error
 * 
 * Flow:
 * 1. Check admin authentication and authorization
 * 2. Validate listing ID format
 * 3. Fetch listing to verify it exists and get creator's email
 * 4. Update status to 'approved'
 * 5. Revalidate browse pages, category pages, listing detail page
 * 6. Send email notification to listing creator
 * 7. Return success
 * 
 * @example
 * ```tsx
 * // In an admin Client Component
 * async function handleApprove(listingId: string) {
 *   const result = await approveListingAction(listingId);
 *   if (result.success) {
 *     toast.success('Listing approved successfully');
 *     router.refresh();
 *   } else {
 *     toast.error(result.error);
 *   }
 * }
 * ```
 */
export async function approveListingAction(
  listingId: string
): Promise<ActionResult<void>> {
  try {
    // Check admin authentication and authorization (Requirement 3.3)
    const admin = await requireAdmin();
    
    // Validate listing ID format
    const validation = approveListingSchema.safeParse({ listing_id: listingId });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    // Create Supabase client
    const supabase = await createClient();

    // Fetch listing to verify it exists and get user information
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        user_id,
        category_id,
        status,
        users:user_id (
          email,
          username
        )
      `)
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

    if (!listing) {
      return {
        success: false,
        error: 'Listing not found.',
      };
    }

    // Check if listing is already approved
    if (listing.status === 'approved') {
      return {
        success: false,
        error: 'This listing is already approved.',
      };
    }

    // Update listing status to approved (Requirement 3.4)
    const { error: updateError } = await supabase
      .from('listings')
      .update({
        status: 'approved',
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    if (updateError) {
      return {
        success: false,
        error: getDatabaseErrorMessage(updateError),
      };
    }

    // Revalidate all relevant cached pages (Requirement 3.4)
    revalidatePath('/browse');
    revalidatePath('/');
    revalidatePath(`/listings/${listingId}`);
    revalidatePath(`/categories/${listing.category_id}`);
    revalidatePath('/admin/listings');

    // Send approval notification email (Requirement 3.7)
    // Note: Notification failures don't block the approval workflow
    await sendListingApprovedNotification(listing.user_id, listingId);

    return {
      success: true,
    };

  } catch (error: any) {
    console.error('Unexpected error during listing approval:', error);
    
    // Check for authorization errors
    if (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: false,
      error: getDatabaseErrorMessage(error),
    };
  }
}

/**
 * Reject a listing with a reason
 * 
 * This action:
 * 1. Verifies admin authentication
 * 2. Validates listing ID and rejection reason
 * 3. Updates listing status to 'rejected' with reason
 * 4. Revalidates relevant cached pages
 * 5. Sends rejection notification email with reason
 * 
 * Requirements: 3.5, 3.6
 * 
 * @param listingId - UUID of the listing to reject
 * @param reason - Rejection reason (minimum 10 characters)
 * @returns ActionResult indicating success or error
 * 
 * Flow:
 * 1. Check admin authentication and authorization
 * 2. Validate listing ID and reason format
 * 3. Fetch listing to verify it exists
 * 4. Update status to 'rejected' with reason
 * 5. Revalidate admin pages
 * 6. Send email notification with rejection reason
 * 7. Return success
 * 
 * @example
 * ```tsx
 * // In an admin Client Component
 * async function handleReject(listingId: string, reason: string) {
 *   const result = await rejectListingAction(listingId, reason);
 *   if (result.success) {
 *     toast.success('Listing rejected');
 *     router.refresh();
 *   } else {
 *     toast.error(result.error);
 *   }
 * }
 * ```
 */
export async function rejectListingAction(
  listingId: string,
  reason: string
): Promise<ActionResult<void>> {
  try {
    // Check admin authentication and authorization (Requirement 3.5)
    const admin = await requireAdmin();
    
    // Validate listing ID and reason (Requirement 3.6)
    const validation = rejectListingSchema.safeParse({
      listing_id: listingId,
      reason,
    });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    // Create Supabase client
    const supabase = await createClient();

    // Fetch listing to verify it exists and get user information
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        user_id,
        status,
        users:user_id (
          email,
          username
        )
      `)
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

    if (!listing) {
      return {
        success: false,
        error: 'Listing not found.',
      };
    }

    // Update listing status to rejected with reason (Requirement 3.5)
    const { error: updateError } = await supabase
      .from('listings')
      .update({
        status: 'rejected',
        rejection_reason: validation.data.reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    if (updateError) {
      return {
        success: false,
        error: getDatabaseErrorMessage(updateError),
      };
    }

    // Revalidate relevant cached pages
    revalidatePath('/admin/listings');
    revalidatePath(`/listings/${listingId}`);

    // Send rejection notification email (Requirement 3.7)
    // Note: Notification failures don't block the rejection workflow
    await sendListingRejectedNotification(listing.user_id, listingId, validation.data.reason);

    return {
      success: true,
    };

  } catch (error: any) {
    console.error('Unexpected error during listing rejection:', error);
    
    // Check for authorization errors
    if (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: false,
      error: getDatabaseErrorMessage(error),
    };
  }
}

// ============================================================================
// Vendor Application Approval Actions
// ============================================================================

/**
 * Approve a vendor application and create approved vendor record
 * 
 * This action:
 * 1. Verifies admin authentication
 * 2. Validates application ID
 * 3. Updates application status to 'approved'
 * 4. Creates record in approved_vendors table
 * 5. Revalidates relevant cached pages
 * 6. Sends approval notification email
 * 
 * Requirements: 4.4
 * 
 * @param applicationId - UUID of the vendor application to approve
 * @returns ActionResult indicating success or error
 * 
 * Flow:
 * 1. Check admin authentication and authorization
 * 2. Validate application ID
 * 3. Fetch application to verify it exists
 * 4. Update application status to 'approved'
 * 5. Insert record into approved_vendors table
 * 6. Revalidate vendor profile and admin pages
 * 7. Send email notification
 * 8. Return success
 * 
 * @example
 * ```tsx
 * // In an admin Client Component
 * async function handleApproveVendor(applicationId: string) {
 *   const result = await approveVendorAction(applicationId);
 *   if (result.success) {
 *     toast.success('Vendor approved');
 *     router.refresh();
 *   } else {
 *     toast.error(result.error);
 *   }
 * }
 * ```
 */
export async function approveVendorAction(
  applicationId: string
): Promise<ActionResult<void>> {
  try {
    // Check admin authentication and authorization (Requirement 4.4)
    const admin = await requireAdmin();
    
    // Validate application ID format
    const validation = approveVendorSchema.safeParse({
      application_id: applicationId,
    });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    // Create Supabase client
    const supabase = await createClient();

    // Fetch application to verify it exists and get user information
    const { data: application, error: fetchError } = await supabase
      .from('vendor_applications')
      .select(`
        id,
        user_id,
        business_name,
        status,
        users:user_id (
          email,
          username
        )
      `)
      .eq('id', applicationId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return {
          success: false,
          error: 'Vendor application not found.',
        };
      }
      return {
        success: false,
        error: getDatabaseErrorMessage(fetchError),
      };
    }

    if (!application) {
      return {
        success: false,
        error: 'Vendor application not found.',
      };
    }

    // Check if application is already approved
    if (application.status === 'approved') {
      return {
        success: false,
        error: 'This vendor application is already approved.',
      };
    }

    // Update application status to approved (Requirement 4.4)
    const { error: updateError } = await supabase
      .from('vendor_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      return {
        success: false,
        error: getDatabaseErrorMessage(updateError),
      };
    }

    // Create approved vendor record (Requirement 4.4)
    const { error: insertError } = await supabase
      .from('approved_vendors')
      .insert({
        user_id: application.user_id,
        business_name: application.business_name,
        approved_at: new Date().toISOString(),
        approved_badge_enabled: true,
      });

    if (insertError) {
      // If the insert fails, try to rollback the application status update
      await supabase
        .from('vendor_applications')
        .update({
          status: 'pending',
          reviewed_at: null,
          reviewed_by: null,
        })
        .eq('id', applicationId);

      return {
        success: false,
        error: getDatabaseErrorMessage(insertError),
      };
    }

    // Revalidate relevant cached pages (Requirement 4.4)
    revalidatePath('/admin/vendors');
    revalidatePath(`/profile/${application.user_id}`);
    revalidatePath('/browse'); // Vendor badge will show on listings

    // Send approval notification email (Requirement 4.7)
    // Note: Notification failures don't block the approval workflow
    await sendVendorApprovedNotification(application.user_id, applicationId);

    return {
      success: true,
    };

  } catch (error: any) {
    console.error('Unexpected error during vendor approval:', error);
    
    // Check for authorization errors
    if (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: false,
      error: getDatabaseErrorMessage(error),
    };
  }
}

/**
 * Reject a vendor application with a reason
 * 
 * This action:
 * 1. Verifies admin authentication
 * 2. Validates application ID and rejection reason
 * 3. Updates application status to 'rejected' with reason
 * 4. Revalidates relevant cached pages
 * 5. Sends rejection notification email with reason
 * 
 * Requirements: 4.6
 * 
 * @param applicationId - UUID of the vendor application to reject
 * @param reason - Rejection reason (minimum 10 characters)
 * @returns ActionResult indicating success or error
 * 
 * Flow:
 * 1. Check admin authentication and authorization
 * 2. Validate application ID and reason format
 * 3. Fetch application to verify it exists
 * 4. Update status to 'rejected' with reason
 * 5. Revalidate admin pages
 * 6. Send email notification with rejection reason
 * 7. Return success
 * 
 * @example
 * ```tsx
 * // In an admin Client Component
 * async function handleRejectVendor(applicationId: string, reason: string) {
 *   const result = await rejectVendorAction(applicationId, reason);
 *   if (result.success) {
 *     toast.success('Vendor application rejected');
 *     router.refresh();
 *   } else {
 *     toast.error(result.error);
 *   }
 * }
 * ```
 */
export async function rejectVendorAction(
  applicationId: string,
  reason: string
): Promise<ActionResult<void>> {
  try {
    // Check admin authentication and authorization (Requirement 4.6)
    const admin = await requireAdmin();
    
    // Validate application ID and reason (Requirement 4.6)
    const validation = rejectVendorSchema.safeParse({
      application_id: applicationId,
      reason,
    });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    // Create Supabase client
    const supabase = await createClient();

    // Fetch application to verify it exists and get user information
    const { data: application, error: fetchError } = await supabase
      .from('vendor_applications')
      .select(`
        id,
        user_id,
        business_name,
        status,
        users:user_id (
          email,
          username
        )
      `)
      .eq('id', applicationId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return {
          success: false,
          error: 'Vendor application not found.',
        };
      }
      return {
        success: false,
        error: getDatabaseErrorMessage(fetchError),
      };
    }

    if (!application) {
      return {
        success: false,
        error: 'Vendor application not found.',
      };
    }

    // Update application status to rejected with reason (Requirement 4.6)
    const { error: updateError } = await supabase
      .from('vendor_applications')
      .update({
        status: 'rejected',
        rejection_reason: validation.data.reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      return {
        success: false,
        error: getDatabaseErrorMessage(updateError),
      };
    }

    // Revalidate relevant cached pages
    revalidatePath('/admin/vendors');

    // Send rejection notification email (Requirement 4.7)
    // Note: Notification failures don't block the rejection workflow
    await sendVendorRejectedNotification(application.user_id, applicationId, validation.data.reason);

    return {
      success: true,
    };

  } catch (error: any) {
    console.error('Unexpected error during vendor rejection:', error);
    
    // Check for authorization errors
    if (error.name === 'UnauthorizedError' || error.name === 'ForbiddenError') {
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: false,
      error: getDatabaseErrorMessage(error),
    };
  }
}
