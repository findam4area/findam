/**
 * Admin Authentication and Authorization Utilities
 *
 * This module provides utilities for checking admin permissions.
 *
 * PRODUCTION NOTE: This implementation uses email-based admin detection
 * as a temporary solution. In production, you should:
 *
 * 1. Add an 'role' column to the users table (e.g., 'admin', 'moderator', 'user')
 * 2. Update the checkAdminAuth function to check user.role === 'admin'
 * 3. Implement proper role-based access control (RBAC) with Supabase RLS policies
 * 4. Add admin role assignment through a secure admin panel or database migration
 *
 * Example production implementation:
 * ```sql
 * ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));
 * CREATE INDEX idx_users_role ON users(role);
 * ```
 *
 * Then update checkAdminAuth to:
 * ```typescript
 * const { data: user } = await supabase
 *   .from('users')
 *   .select('role')
 *   .eq('id', authUser.id)
 *   .single();
 *
 * const isAdmin = user?.role === 'admin';
 * ```
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface AdminAuthResult {
  isAdmin: boolean;
  user?: any;
  error?: string;
}

/**
 * Check if the current authenticated user has admin privileges
 *
 * @param supabase - Supabase client instance
 * @returns AdminAuthResult with isAdmin flag and optional user/error
 *
 * @example
 * ```typescript
 * const supabase = await createClient();
 * const authCheck = await checkAdminAuth(supabase);
 *
 * if (!authCheck.isAdmin) {
 *   return NextResponse.json(
 *     { error: authCheck.error },
 *     { status: authCheck.error === "Unauthorized" ? 401 : 403 }
 *   );
 * }
 * ```
 */
export async function checkAdminAuth(
  supabase: SupabaseClient,
): Promise<AdminAuthResult> {
  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { isAdmin: false, error: "Unauthorized" };
    }

    // TEMPORARY: Check if user email indicates admin status
    // TODO: Replace with proper role-based check from users table
    const isAdmin =
      user.email?.includes("admin") || user.email?.endsWith("@findam.admin");

    if (!isAdmin) {
      return { isAdmin: false, error: "Forbidden" };
    }

    return { isAdmin: true, user };
  } catch (error) {
    console.error("Error checking admin auth:", error);
    return { isAdmin: false, error: "Internal server error" };
  }
}

/**
 * Middleware helper to require admin authentication
 * Returns a NextResponse with error if not admin, otherwise returns null
 *
 * @param supabase - Supabase client instance
 * @returns NextResponse with error or null if admin
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const supabase = await createClient();
 *   const authError = await requireAdmin(supabase);
 *   if (authError) return authError;
 *
 *   // Continue with admin-only logic
 * }
 * ```
 */
export async function requireAdmin(supabase: SupabaseClient) {
  const authCheck = await checkAdminAuth(supabase);

  if (!authCheck.isAdmin) {
    const { NextResponse } = await import("next/server");
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.error === "Unauthorized" ? 401 : 403 },
    );
  }

  return null;
}

/**
 * Check if a user ID has admin privileges
 * Useful for client-side checks or when you already have a user ID
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to check
 * @returns boolean indicating if user is admin
 */
export async function isUserAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  try {
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (!user) return false;

    // TEMPORARY: Check email-based admin status
    // TODO: Replace with role-based check
    return (
      user.email?.includes("admin") || user.email?.endsWith("@findam.admin")
    );
  } catch (error) {
    console.error("Error checking user admin status:", error);
    return false;
  }
}
