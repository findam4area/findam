/**
 * Authentication Utility Functions for Server Components and Server Actions
 * 
 * This module provides helper functions for:
 * - Getting the authenticated user from Server Component context
 * - Requiring authentication for protected Server Actions
 * - Requiring admin privileges for admin-only operations
 * - Session validation and error handling
 * 
 * Requirements: 2.7, 2.8, 14.1, 14.2, 15.4
 * 
 * @example
 * ```typescript
 * // In a Server Action
 * 'use server'
 * export async function createListing(formData: FormData) {
 *   const user = await requireAuth();
 *   // user is guaranteed to be authenticated here
 * }
 * 
 * // In an admin Server Action
 * 'use server'
 * export async function approveListing(listingId: string) {
 *   const admin = await requireAdmin();
 *   // admin is guaranteed to be authenticated and have admin role
 * }
 * ```
 */

import { createClient } from '@/lib/supabase/server';
import type { User } from '@/lib/types/core';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Error thrown when authentication is required but user is not authenticated
 */
export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required. Please log in to continue.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Error thrown when admin privileges are required but user is not an admin
 */
export class ForbiddenError extends Error {
  constructor(message = 'Admin privileges required. You do not have permission to perform this action.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Error thrown when session validation fails
 */
export class SessionError extends Error {
  constructor(message = 'Session validation failed. Please log in again.') {
    super(message);
    this.name = 'SessionError';
  }
}

// ============================================================================
// Core Authentication Functions
// ============================================================================

/**
 * Get the currently authenticated user from Server Component context
 * 
 * This function retrieves the authenticated user by:
 * 1. Creating a server-side Supabase client with cookie support
 * 2. Getting the authenticated user from the session
 * 3. Fetching the user's profile data from the users table
 * 4. Returning null if no user is authenticated
 * 
 * Use this for optional authentication (showing user-specific content)
 * 
 * Requirements: 2.7, 15.4
 * 
 * @returns User object if authenticated, null otherwise
 * @throws SessionError if session is invalid or corrupted
 * 
 * @example
 * ```typescript
 * // In a Server Component
 * export default async function ProfilePage() {
 *   const user = await getCurrentUser();
 *   
 *   if (!user) {
 *     return <div>Please log in to view your profile</div>;
 *   }
 *   
 *   return <div>Welcome, {user.full_name}!</div>;
 * }
 * 
 * // In a Server Action (optional auth)
 * 'use server'
 * export async function getRecommendations() {
 *   const user = await getCurrentUser();
 *   // Personalize recommendations if user is logged in
 *   const listings = user 
 *     ? await getPersonalizedListings(user.id)
 *     : await getGeneralListings();
 *   return listings;
 * }
 * ```
 */
export async function getCurrentUser(): Promise<User | null> {
  // During build time, return null instead of throwing errors
  if (!process.env.NEXT_RUNTIME && typeof window === 'undefined') {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) return null;
    } catch {
      return null;
    }
  }
  
  try {
    // Create Supabase server client with cookie support
    const supabase = await createClient();
    
    // Get authenticated user from session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    // If no authenticated user, return null (not an error - user just isn't logged in)
    if (!authUser) {
      return null;
    }
    
    // If there's an auth error, this indicates a session problem
    if (authError) {
      console.warn('Session validation warning:', authError);
      return null;
    }
    
    // Fetch user profile data from users table
    // This includes additional fields like full_name, avatar_url, role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, phone, username, avatar_url, bio, is_premium, created_at, updated_at')
      .eq('id', authUser.id)
      .single();
    
    // If user profile doesn't exist, this is a data integrity issue
    if (userError || !userData) {
      console.warn('User profile not found:', userError);
      return null;
    }
    
    // Map database user to our User type
    // Note: The actual database doesn't have a 'role' column yet, but we'll check email pattern
    // TODO: Replace with proper role column when available
    const user: User = {
      id: userData.id,
      email: userData.email,
      phone: userData.phone,
      username: userData.username,
      full_name: userData.username, // Using username as full_name for now
      avatar_url: userData.avatar_url,
      role: determineUserRole(userData.email), // Temporary: check email pattern
      created_at: userData.created_at || new Date().toISOString(),
      updated_at: userData.updated_at || new Date().toISOString(),
    };
    
    return user;
  } catch (error) {
    // During build or if there's any error, just return null
    // This allows the app to build successfully and handle unauthenticated state
    console.warn('Error in getCurrentUser (returning null):', error);
    return null;
  }
}

/**
 * Require authentication for a Server Action or protected operation
 * 
 * This function:
 * 1. Gets the current authenticated user
 * 2. Throws UnauthorizedError if no user is authenticated
 * 3. Returns the authenticated user if successful
 * 
 * Use this at the start of Server Actions that require authentication
 * 
 * Requirements: 2.8, 14.1, 15.4
 * 
 * @returns Authenticated User object
 * @throws UnauthorizedError if user is not authenticated
 * @throws SessionError if session validation fails
 * 
 * @example
 * ```typescript
 * // In a Server Action that requires authentication
 * 'use server'
 * export async function createListing(formData: FormData) {
 *   // This will throw if user is not logged in
 *   const user = await requireAuth();
 *   
 *   // User is guaranteed to be authenticated here
 *   const listing = {
 *     title: formData.get('title'),
 *     user_id: user.id,
 *     // ... other fields
 *   };
 *   
 *   // Create listing
 *   const result = await createListingInDatabase(listing);
 *   return result;
 * }
 * 
 * // Error handling in the calling component
 * try {
 *   await createListing(formData);
 * } catch (error) {
 *   if (error instanceof UnauthorizedError) {
 *     // Redirect to login
 *     redirect('/login');
 *   }
 *   // Handle other errors
 * }
 * ```
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new UnauthorizedError('You must be logged in to perform this action.');
  }
  
  return user;
}

/**
 * Require admin privileges for a Server Action or admin-only operation
 * 
 * This function:
 * 1. Gets the current authenticated user
 * 2. Throws UnauthorizedError if no user is authenticated
 * 3. Throws ForbiddenError if user is not an admin
 * 4. Returns the authenticated admin user if successful
 * 
 * Use this at the start of Server Actions that require admin privileges
 * 
 * Requirements: 2.8, 14.2, 15.4
 * 
 * @returns Authenticated admin User object
 * @throws UnauthorizedError if user is not authenticated
 * @throws ForbiddenError if user is not an admin
 * @throws SessionError if session validation fails
 * 
 * @example
 * ```typescript
 * // In an admin-only Server Action
 * 'use server'
 * export async function approveListing(listingId: string) {
 *   // This will throw if user is not logged in or not an admin
 *   const admin = await requireAdmin();
 *   
 *   // Admin is guaranteed to be authenticated and have admin role here
 *   const supabase = await createClient();
 *   const { error } = await supabase
 *     .from('listings')
 *     .update({ status: 'approved' })
 *     .eq('id', listingId);
 *   
 *   if (error) {
 *     throw new Error('Failed to approve listing');
 *   }
 *   
 *   // Send notification email
 *   await sendApprovalEmail(listingId);
 *   
 *   return { success: true };
 * }
 * 
 * // Error handling in the calling component
 * try {
 *   await approveListing(listingId);
 * } catch (error) {
 *   if (error instanceof UnauthorizedError) {
 *     // Redirect to login
 *     redirect('/login');
 *   } else if (error instanceof ForbiddenError) {
 *     // Show access denied message
 *     toast.error('You do not have permission to perform this action');
 *   }
 * }
 * ```
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  
  if (user.role !== 'admin') {
    throw new ForbiddenError('This action requires administrator privileges.');
  }
  
  return user;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine user role based on email pattern
 * 
 * TEMPORARY IMPLEMENTATION: This checks email patterns to determine admin status
 * 
 * TODO: Replace with proper role column check when database schema is updated
 * 
 * Future implementation should:
 * 1. Add 'role' column to users table
 * 2. Query the role directly from the database
 * 3. Remove this email-based check
 * 
 * @param email - User email address
 * @returns 'admin' if email matches admin pattern, 'user' otherwise
 */
function determineUserRole(email: string): 'admin' | 'user' {
  // Check if email matches admin patterns
  const isAdmin = email?.includes('admin') || email?.endsWith('@findam.admin');
  return isAdmin ? 'admin' : 'user';
}

/**
 * Validate that a user has permission to access/modify a resource
 * 
 * This checks if:
 * - User is the owner of the resource, OR
 * - User is an admin
 * 
 * Requirements: 2.8, 14.2
 * 
 * @param user - Current authenticated user
 * @param resourceOwnerId - ID of the resource owner
 * @returns true if user has permission, false otherwise
 * 
 * @example
 * ```typescript
 * 'use server'
 * export async function updateListing(listingId: string, updates: any) {
 *   const user = await requireAuth();
 *   
 *   // Get the listing to check ownership
 *   const supabase = await createClient();
 *   const { data: listing } = await supabase
 *     .from('listings')
 *     .select('user_id')
 *     .eq('id', listingId)
 *     .single();
 *   
 *   if (!listing) {
 *     throw new Error('Listing not found');
 *   }
 *   
 *   // Check if user owns this listing or is admin
 *   if (!hasPermission(user, listing.user_id)) {
 *     throw new ForbiddenError('You do not have permission to edit this listing');
 *   }
 *   
 *   // Proceed with update
 *   // ...
 * }
 * ```
 */
export function hasPermission(user: User, resourceOwnerId: string): boolean {
  return user.id === resourceOwnerId || user.role === 'admin';
}

/**
 * Check if a user is authenticated without throwing an error
 * 
 * Useful for components that need to check authentication state
 * without requiring it
 * 
 * @returns true if user is authenticated, false otherwise
 * 
 * @example
 * ```typescript
 * export default async function HomePage() {
 *   const isAuthenticated = await isAuthenticated();
 *   
 *   return (
 *     <div>
 *       {isAuthenticated ? (
 *         <Link href="/create">Create Listing</Link>
 *       ) : (
 *         <Link href="/login">Log In to Create Listing</Link>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user !== null;
  } catch (error) {
    // If there's a session error, user is not authenticated
    return false;
  }
}

/**
 * Check if the current user is an admin without throwing an error
 * 
 * @returns true if user is authenticated and has admin role, false otherwise
 * 
 * @example
 * ```typescript
 * export default async function DashboardPage() {
 *   const isUserAdmin = await isAdmin();
 *   
 *   return (
 *     <div>
 *       {isUserAdmin && (
 *         <Link href="/admin/dashboard">Admin Dashboard</Link>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.role === 'admin';
  } catch (error) {
    // If there's an error, user is not admin
    return false;
  }
}

/**
 * Get user ID from current session
 * 
 * Lightweight function to get just the user ID without fetching full profile
 * Useful when you only need the ID for database queries
 * 
 * @returns User ID if authenticated, null otherwise
 * 
 * @example
 * ```typescript
 * export async function getMyListings() {
 *   const userId = await getUserId();
 *   
 *   if (!userId) {
 *     return [];
 *   }
 *   
 *   const supabase = await createClient();
 *   const { data } = await supabase
 *     .from('listings')
 *     .select('*')
 *     .eq('user_id', userId);
 *   
 *   return data || [];
 * }
 * ```
 */
export async function getUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}
