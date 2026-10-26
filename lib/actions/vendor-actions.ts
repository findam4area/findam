/**
 * Vendor Application Server Actions for Next.js 16
 * 
 * This module provides Server Actions for vendor applications including:
 * - Vendor application submission with validation
 * - Authentication and authorization checks
 * - Duplicate application prevention
 * 
 * All actions use Zod validation and return ActionResult for type safety.
 * 
 * Requirements: 4.1, 4.2
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { vendorApplicationSchema } from '@/lib/validation/schemas';
import type { ActionResult } from '@/lib/types/core';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps database and validation errors to user-friendly messages
 * Requirement 4.1, 4.2: Structured error handling
 */
function getVendorApplicationErrorMessage(error: any): string {
  // Network and connection errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Database specific error codes
  if (error.code) {
    switch (error.code) {
      case '23505': // PostgreSQL unique violation
        return 'You have already submitted a vendor application. Please wait for admin review.';
      
      case '23503': // Foreign key violation
        return 'Invalid user account. Please log out and log back in.';
      
      case 'PGRST116': // PostgREST row not found
        return 'User account not found. Please log out and log back in.';
      
      default:
        console.error('Unhandled database error code:', error.code, error);
    }
  }

  // Check for specific error messages
  const errorMsg = error.message?.toLowerCase() || '';
  
  if (errorMsg.includes('duplicate') || errorMsg.includes('already exists')) {
    return 'You have already submitted a vendor application. Please wait for admin review.';
  }
  
  if (errorMsg.includes('permission') || errorMsg.includes('unauthorized')) {
    return 'You do not have permission to perform this action. Please log in and try again.';
  }

  // Generic fallback
  console.error('Vendor application error:', error);
  return 'Failed to submit vendor application. Please try again.';
}

// ============================================================================
// Vendor Application Submission Action
// ============================================================================

/**
 * Submits a vendor application with validation and duplicate checks
 * 
 * Requirements: 4.1, 4.2
 * 
 * @param formData - Form data containing business_name, business_description, contact_email, contact_phone
 * @returns ActionResult indicating success or error
 * 
 * @example
 * ```tsx
 * // In a Client Component form
 * async function handleSubmit(formData: FormData) {
 *   const result = await submitVendorApplicationAction(formData);
 *   if (result.success) {
 *     router.push('/vendor/application-submitted');
 *   } else {
 *     setError(result.error);
 *   }
 * }
 * ```
 */
export async function submitVendorApplicationAction(
  formData: FormData
): Promise<ActionResult<void>> {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // 1. Authentication check (Requirement 4.1)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to apply as a vendor. Please log in and try again.',
      };
    }

    // 2. Extract and validate form data (Requirement 4.1, 4.2)
    const rawData = {
      business_name: formData.get('business_name'),
      business_description: formData.get('business_description'),
      contact_email: formData.get('contact_email'),
      contact_phone: formData.get('contact_phone'),
    };

    // Validate with Zod schema (includes Nigerian phone format validation)
    const validation = vendorApplicationSchema.safeParse(rawData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    const { business_name, business_description, contact_email, contact_phone } = validation.data;

    // 3. Duplicate application check (Requirement 4.2)
    // Check if user already has a pending or approved application
    const { data: existingApplications, error: checkError } = await supabase
      .from('vendor_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'approved']);

    if (checkError) {
      console.error('Error checking for existing applications:', checkError);
      return {
        success: false,
        error: getVendorApplicationErrorMessage(checkError),
      };
    }

    // If user already has a pending or approved application, reject
    if (existingApplications && existingApplications.length > 0) {
      const status = existingApplications[0].status;
      if (status === 'approved') {
        return {
          success: false,
          error: 'You are already an approved vendor. You cannot submit another application.',
        };
      } else if (status === 'pending') {
        return {
          success: false,
          error: 'You have already submitted a vendor application. Please wait for admin review.',
        };
      }
    }

    // 4. Insert vendor application (Requirement 4.1, 4.2)
    const { error: insertError } = await supabase
      .from('vendor_applications')
      .insert({
        user_id: user.id,
        business_name,
        business_description,
        contact_email,
        contact_phone,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      return {
        success: false,
        error: getVendorApplicationErrorMessage(insertError),
      };
    }

    // 5. Revalidate admin dashboard to show new pending application
    revalidatePath('/admin/vendors');
    
    // Also revalidate vendor application page (in case user goes back)
    revalidatePath('/vendor/apply');

    return {
      success: true,
    };

  } catch (error: any) {
    console.error('Unexpected error during vendor application submission:', error);
    return {
      success: false,
      error: getVendorApplicationErrorMessage(error),
    };
  }
}
