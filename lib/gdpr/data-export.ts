/**
 * GDPR Data Export Functionality
 * Implements Right to Data Portability
 * Requirements: 31.7
 */

import { createClient } from '@/lib/supabase/server';

export interface UserDataExport {
  profile: any;
  listings: any[];
  reviews: any[];
  interactions: any[];
  savedItems: any[];
  messages: any[];
  exportDate: string;
  format: 'json' | 'csv';
}

/**
 * Export all user data in machine-readable format
 * Requirements: 31.7 (GDPR Right to Data Portability)
 * 
 * @param userId - User ID to export data for
 * @returns Complete user data export
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  const supabase = await createClient();

  // Fetch all user data
  const [profile, listings, reviews, interactions, savedItems, messages] =
    await Promise.all([
      // Profile data
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),

      // User's listings
      supabase
        .from('listings')
        .select('*')
        .eq('vendor_id', userId),

      // User's reviews
      supabase
        .from('reviews')
        .select('*')
        .eq('reviewer_id', userId),

      // User's interactions (views, likes, saves)
      supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', userId),

      // Saved/liked items
      supabase
        .from('saved_listings')
        .select('*, listing:listings(*)')
        .eq('user_id', userId),

      // User's messages
      supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`),
    ]);

  return {
    profile: profile.data,
    listings: listings.data || [],
    reviews: reviews.data || [],
    interactions: interactions.data || [],
    savedItems: savedItems.data || [],
    messages: messages.data || [],
    exportDate: new Date().toISOString(),
    format: 'json',
  };
}

/**
 * Generate downloadable JSON file for user data export
 * Requirements: 31.7
 * 
 * @param userId - User ID to export data for
 * @returns JSON string of user data
 */
export async function generateDataExportJSON(userId: string): Promise<string> {
  const data = await exportUserData(userId);
  return JSON.stringify(data, null, 2);
}

/**
 * Convert user data to CSV format
 * Requirements: 31.7
 * 
 * @param data - User data export
 * @returns CSV string
 */
export function convertDataExportToCSV(data: UserDataExport): string {
  const sections: string[] = [];

  // Profile section
  if (data.profile) {
    sections.push('PROFILE');
    sections.push(objectToCSV([data.profile]));
    sections.push('');
  }

  // Listings section
  if (data.listings.length > 0) {
    sections.push('LISTINGS');
    sections.push(objectToCSV(data.listings));
    sections.push('');
  }

  // Reviews section
  if (data.reviews.length > 0) {
    sections.push('REVIEWS');
    sections.push(objectToCSV(data.reviews));
    sections.push('');
  }

  // Interactions section
  if (data.interactions.length > 0) {
    sections.push('INTERACTIONS');
    sections.push(objectToCSV(data.interactions));
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Convert array of objects to CSV string
 */
function objectToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers.map((header) => {
      const value = item[header];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
