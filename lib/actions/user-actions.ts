/**
 * User Profile Server Actions
 * 
 * This module provides Server Actions for user profile management:
 * - Update profile (name, phone, avatar)
 * - Avatar upload handling
 * - Profile validation
 * 
 * Requirements: 2.7, 13.13
 * Task: 10.6 Create user profile edit functionality
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/services/auth';
import type { ActionResult } from '@/lib/types/core';

/**
 * Update user profile information
 * 
 * Updates the user's profile with new name, phone, and/or avatar.
 * Requires authentication.
 * 
 * Requirements: 2.7, 13.13
 * 
 * @param formData - Form data containing full_name, phone, avatar_url
 * @returns ActionResult with success status and optional error message
 */
export async function updateProfileAction(
  formData: FormData
): Promise<ActionResult> {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required. Please log in to continue.',
      };
    }

    // Extract form data
    const fullName = formData.get('full_name') as string;
    const phone = formData.get('phone') as string;
    const avatarUrl = formData.get('avatar_url') as string | null;

    // Validate full name
    if (!fullName || fullName.trim().length < 2) {
      return {
        success: false,
        error: 'Full name must be at least 2 characters long.',
      };
    }

    // Validate phone if provided (Nigerian format)
    if (phone && phone.trim()) {
      const nigerianPhoneRegex = /^(\+?234|0)[789]\d{9}$/;
      const cleanPhone = phone.replace(/\s/g, '');
      if (!nigerianPhoneRegex.test(cleanPhone)) {
        return {
          success: false,
          error: 'Please enter a valid Nigerian phone number.',
        };
      }
    }

    // Prepare update data
    const updateData: {
      full_name: string;
      phone: string | null;
      avatar_url?: string | null;
      updated_at: string;
    } = {
      full_name: fullName.trim(),
      phone: phone && phone.trim() ? phone.trim() : null,
      updated_at: new Date().toISOString(),
    };

    // Include avatar URL if provided
    if (avatarUrl !== null) {
      updateData.avatar_url = avatarUrl;
    }

    // Update user profile in database
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return {
        success: false,
        error: 'Failed to update profile. Please try again.',
      };
    }

    // Revalidate profile page to show updated data
    revalidatePath('/profile');
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Unexpected error in updateProfileAction:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
