/**
 * GDPR Data Deletion Functionality
 * Implements Right to be Forgotten
 * Requirements: 31.8
 */

import { createClient } from '@/lib/supabase/server';

export interface DataDeletionResult {
  success: boolean;
  deletedTables: string[];
  errors: string[];
  timestamp: string;
}

/**
 * Delete all user data (Right to be Forgotten)
 * Requirements: 31.8 (GDPR Right to be Forgotten)
 * 
 * @param userId - User ID to delete data for
 * @param keepAnonymized - Whether to keep anonymized data for analytics
 * @returns Deletion result
 */
export async function deleteUserData(
  userId: string,
  keepAnonymized: boolean = false
): Promise<DataDeletionResult> {
  const supabase = await createClient();
  const deletedTables: string[] = [];
  const errors: string[] = [];

  try {
    // Delete user interactions
    const { error: interactionsError } = await supabase
      .from('user_interactions')
      .delete()
      .eq('user_id', userId);

    if (interactionsError) {
      errors.push(`user_interactions: ${interactionsError.message}`);
    } else {
      deletedTables.push('user_interactions');
    }

    // Delete saved listings
    const { error: savedError } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', userId);

    if (savedError) {
      errors.push(`saved_listings: ${savedError.message}`);
    } else {
      deletedTables.push('saved_listings');
    }

    // Delete messages
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

    if (messagesError) {
      errors.push(`messages: ${messagesError.message}`);
    } else {
      deletedTables.push('messages');
    }

    // Handle reviews - anonymize or delete based on preference
    if (keepAnonymized) {
      // Anonymize reviews instead of deleting
      const { error: reviewsError } = await supabase
        .from('reviews')
        .update({
          reviewer_id: null,
          comment: '[User deleted their account]',
        })
        .eq('reviewer_id', userId);

      if (reviewsError) {
        errors.push(`reviews: ${reviewsError.message}`);
      } else {
        deletedTables.push('reviews (anonymized)');
      }
    } else {
      // Completely delete reviews
      const { error: reviewsError } = await supabase
        .from('reviews')
        .delete()
        .eq('reviewer_id', userId);

      if (reviewsError) {
        errors.push(`reviews: ${reviewsError.message}`);
      } else {
        deletedTables.push('reviews');
      }
    }

    // Soft delete listings (mark as deleted)
    const { error: listingsError } = await supabase
      .from('listings')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
      })
      .eq('vendor_id', userId);

    if (listingsError) {
      errors.push(`listings: ${listingsError.message}`);
    } else {
      deletedTables.push('listings (soft deleted)');
    }

    // Delete subscriptions
    const { error: subscriptionsError } = await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);

    if (subscriptionsError) {
      errors.push(`subscriptions: ${subscriptionsError.message}`);
    } else {
      deletedTables.push('subscriptions');
    }

    // Finally, delete or anonymize profile
    if (keepAnonymized) {
      // Anonymize profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: 'Deleted User',
          email: null,
          avatar: null,
          bio: null,
          phone: null,
          phone_verified: false,
          nin_verified: false,
          video_verified: false,
        })
        .eq('id', userId);

      if (profileError) {
        errors.push(`profiles: ${profileError.message}`);
      } else {
        deletedTables.push('profiles (anonymized)');
      }
    } else {
      // Delete auth user (this will cascade to profile due to foreign key)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        errors.push(`auth_users: ${authError.message}`);
      } else {
        deletedTables.push('auth_users', 'profiles');
      }
    }

    return {
      success: errors.length === 0,
      deletedTables,
      errors,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      deletedTables,
      errors: [...errors, `Unexpected error: ${error}`],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Schedule user data deletion (with grace period)
 * Requirements: 31.8
 * 
 * @param userId - User ID to schedule deletion for
 * @param gracePeriodDays - Days before permanent deletion (default: 30)
 * @returns Success status
 */
export async function scheduleDataDeletion(
  userId: string,
  gracePeriodDays: number = 30
): Promise<{ success: boolean; scheduledDate: string }> {
  const supabase = await createClient();

  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + gracePeriodDays);

  // Mark profile for deletion
  const { error } = await supabase
    .from('profiles')
    .update({
      deletion_scheduled_at: scheduledDate.toISOString(),
      status: 'deletion_scheduled',
    })
    .eq('id', userId);

  if (error) {
    return {
      success: false,
      scheduledDate: scheduledDate.toISOString(),
    };
  }

  return {
    success: true,
    scheduledDate: scheduledDate.toISOString(),
  };
}

/**
 * Cancel scheduled data deletion
 * Requirements: 31.8
 * 
 * @param userId - User ID to cancel deletion for
 * @returns Success status
 */
export async function cancelDataDeletion(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      deletion_scheduled_at: null,
      status: 'active',
    })
    .eq('id', userId);

  return !error;
}
