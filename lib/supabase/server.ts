import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Validates required Supabase environment variables
 * @throws {Error} If required environment variables are missing
 */
function validateSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please check your .env.local file."
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please check your .env.local file."
    );
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}. Must be a valid URL.`
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Creates a Supabase server client for use in Server Components and Server Actions
 * Implements Requirements 15.1, 15.8, 15.9
 * 
 * @returns Supabase client configured for server-side usage
 * @throws {Error} If environment variables are missing or invalid
 * 
 * @example
 * ```typescript
 * // In a Server Component
 * const supabase = await createClient();
 * const { data, error } = await supabase.from('listings').select('*');
 * 
 * // In a Server Action
 * 'use server'
 * export async function getListings() {
 *   const supabase = await createClient();
 *   const { data, error } = await supabase.from('listings').select('*');
 *   if (error) {
 *     console.error('Database error:', error);
 *     return { error: 'Failed to load listings. Please try again later.' };
 *   }
 *   return { data };
 * }
 * ```
 */
export async function createClient() {
  const { supabaseUrl, supabaseAnonKey } = validateSupabaseEnv();
  
  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

/**
 * Creates a Supabase admin client with service role access
 * Use with caution - bypasses Row Level Security
 * Implements Requirement 15.1
 * 
 * @returns Supabase client with admin privileges
 * @throws {Error} If service role key is missing
 * 
 * @example
 * ```typescript
 * // Only use for admin operations that need to bypass RLS
 * const supabase = await createAdminClient();
 * const { data } = await supabase.from('users').update({ role: 'admin' }).eq('id', userId);
 * ```
 */
export async function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. This is required for admin operations."
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Ignore cookie errors in admin context
          }
        },
      },
    },
  );
}
