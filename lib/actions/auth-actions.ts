/**
 * Authentication Server Actions for Next.js 16
 * 
 * This module provides Server Actions for user authentication including:
 * - User registration with email/password
 * - Login with session management
 * - Logout with session cleanup
 * - Password reset flow (request and confirm)
 * 
 * All actions use Zod validation and return ActionResult for type safety.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.6, 2.8, 2.9
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} from '@/lib/validation/schemas';
import type { ActionResult, User } from '@/lib/types/core';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Maps Supabase auth errors to user-friendly messages
 * Requirement 2.6: Specific error messages for validation failures
 */
function getAuthErrorMessage(error: any): string {
  // Network and connection errors
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Supabase specific error codes
  if (error.code) {
    switch (error.code) {
      case 'user_already_exists':
      case '23505': // PostgreSQL unique violation
        return 'This email is already registered. Please log in instead.';
      
      case 'invalid_credentials':
      case 'invalid_grant':
        return 'Invalid email or password. Please try again.';
      
      case 'email_not_confirmed':
        return 'Please verify your email address before logging in.';
      
      case 'weak_password':
        return 'Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.';
      
      case 'rate_limit':
        return 'Too many attempts. Please wait a few minutes and try again.';
      
      case 'over_email_send_rate_limit':
        return 'Too many password reset emails sent. Please wait before requesting another.';
      
      case 'invalid_token':
      case 'expired_token':
        return 'Password reset link has expired. Please request a new one.';
      
      default:
        console.error('Unhandled Supabase error code:', error.code, error);
    }
  }

  // Check for specific error messages
  const errorMsg = error.message?.toLowerCase() || '';
  
  if (errorMsg.includes('email') && errorMsg.includes('already')) {
    return 'This email is already registered. Please log in instead.';
  }
  
  if (errorMsg.includes('invalid') && (errorMsg.includes('email') || errorMsg.includes('password'))) {
    return 'Invalid email or password. Please try again.';
  }
  
  if (errorMsg.includes('password') && errorMsg.includes('weak')) {
    return 'Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.';
  }

  // Generic fallback
  console.error('Authentication error:', error);
  return 'An unexpected error occurred. Please try again.';
}

// ============================================================================
// Registration Action
// ============================================================================

/**
 * Registers a new user with email and password
 * Creates user in Supabase Auth and users table
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.5, 2.9
 * 
 * @param formData - Form data containing email, password, and full_name
 * @returns ActionResult with user data or error message
 * 
 * @example
 * ```tsx
 * // In a Client Component form
 * async function handleSubmit(formData: FormData) {
 *   const result = await registerAction(formData);
 *   if (!result.success) {
 *     setError(result.error);
 *   }
 * }
 * ```
 */
export async function registerAction(formData: FormData): Promise<ActionResult<User>> {
  try {
    // Extract form data
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
      full_name: formData.get('full_name'),
    };

    // Validate with Zod schema (Requirement 2.4, 2.5)
    const validation = registerSchema.safeParse(rawData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    const { email, password, full_name } = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Create user in Supabase Auth (Requirement 2.2)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
        },
      },
    });

    if (authError) {
      return {
        success: false,
        error: getAuthErrorMessage(authError),
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user account. Please try again.',
      };
    }

    // Create user record in users table (Requirement 2.2)
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        full_name,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      // If database insert fails but auth user was created, we should clean up
      // For now, log the error and let the user try to login
      console.error('Failed to create user record in database:', dbError);
      
      // Check if error is due to duplicate (user might exist from previous failed attempt)
      if (dbError.code === '23505') {
        // User already exists in database, this is okay
        console.log('User record already exists, continuing with registration');
      } else {
        return {
          success: false,
          error: 'Account created but profile setup failed. Please try logging in.',
        };
      }
    }

    // Prepare user object for response
    const user: User = {
      id: authData.user.id,
      email: authData.user.email!,
      full_name,
      phone: null,
      avatar_url: null,
      role: 'user',
      created_at: authData.user.created_at,
      updated_at: authData.user.created_at,
    };

    // Revalidate pages that depend on auth state (Requirement 2.8)
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: user,
    };

  } catch (error: any) {
    console.error('Unexpected error during registration:', error);
    return {
      success: false,
      error: getAuthErrorMessage(error),
    };
  }
}

// ============================================================================
// Login Action
// ============================================================================

/**
 * Authenticates user with email and password
 * Creates session with HTTP-only cookies
 * 
 * Requirements: 2.3, 2.6, 2.7, 2.8
 * 
 * @param formData - Form data containing email and password
 * @returns ActionResult indicating success or error
 * 
 * @example
 * ```tsx
 * // In a Client Component form
 * async function handleLogin(formData: FormData) {
 *   const result = await loginAction(formData);
 *   if (result.success) {
 *     router.push('/');
 *   } else {
 *     setError(result.error);
 *   }
 * }
 * ```
 */
export async function loginAction(formData: FormData): Promise<ActionResult<void>> {
  try {
    // Extract form data
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    // Validate with Zod schema (Requirement 2.4)
    const validation = loginSchema.safeParse(rawData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    const { email, password } = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Attempt to sign in with email and password (Requirement 2.3)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return {
        success: false,
        error: getAuthErrorMessage(authError),
      };
    }

    if (!authData.session) {
      return {
        success: false,
        error: 'Failed to create session. Please try again.',
      };
    }

    // Session cookie is automatically set by Supabase client (Requirement 2.7)
    // The createClient function in lib/supabase/server.ts handles cookie management

    // Revalidate pages that depend on auth state (Requirement 2.8)
    revalidatePath('/', 'layout');

    return {
      success: true,
    };

  } catch (error: any) {
    console.error('Unexpected error during login:', error);
    return {
      success: false,
      error: getAuthErrorMessage(error),
    };
  }
}

// ============================================================================
// Logout Action
// ============================================================================

/**
 * Logs out the current user
 * Clears session cookie and redirects to homepage
 * 
 * Requirements: 2.3, 2.8
 * 
 * @example
 * ```tsx
 * // In a Client Component
 * <button onClick={() => logoutAction()}>
 *   Logout
 * </button>
 * ```
 */
export async function logoutAction(): Promise<void> {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Sign out the user (clears session cookie)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error during logout:', error);
      // Continue with redirect even if sign out had an error
    }

    // Revalidate all pages to update auth state (Requirement 2.8)
    revalidatePath('/', 'layout');

  } catch (error) {
    console.error('Unexpected error during logout:', error);
    // Continue with redirect even if an error occurred
  }

  // Redirect to homepage after logout
  redirect('/');
}

// ============================================================================
// Password Reset Request Action
// ============================================================================

/**
 * Sends password reset email to user
 * 
 * Requirements: 2.8
 * 
 * @param formData - Form data containing email
 * @returns ActionResult indicating success or error
 * 
 * @example
 * ```tsx
 * // In a Client Component form
 * async function handleResetRequest(formData: FormData) {
 *   const result = await requestPasswordResetAction(formData);
 *   if (result.success) {
 *     setMessage('Check your email for reset instructions');
 *   } else {
 *     setError(result.error);
 *   }
 * }
 * ```
 */
export async function requestPasswordResetAction(
  formData: FormData
): Promise<ActionResult<void>> {
  try {
    // Extract form data
    const rawData = {
      email: formData.get('email'),
    };

    // Validate with Zod schema
    const validation = passwordResetRequestSchema.safeParse(rawData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    const { email } = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Send password reset email via Supabase Auth (Requirement 2.8)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password/confirm`,
    });

    if (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }

    // Always return success even if email doesn't exist (security best practice)
    // This prevents email enumeration attacks
    return {
      success: true,
    };

  } catch (error: any) {
    console.error('Unexpected error during password reset request:', error);
    return {
      success: false,
      error: getAuthErrorMessage(error),
    };
  }
}

// ============================================================================
// Password Reset Confirmation Action
// ============================================================================

/**
 * Resets user password with token from email
 * 
 * Requirements: 2.8
 * 
 * @param formData - Form data containing new password
 * @returns ActionResult indicating success or error
 * 
 * @example
 * ```tsx
 * // In a Client Component form
 * async function handlePasswordReset(formData: FormData) {
 *   const result = await resetPasswordAction(formData);
 *   if (result.success) {
 *     router.push('/login');
 *   } else {
 *     setError(result.error);
 *   }
 * }
 * ```
 */
export async function resetPasswordAction(
  formData: FormData
): Promise<ActionResult<void>> {
  try {
    // Extract form data
    const rawData = {
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    };

    // Validate with Zod schema (includes password match check)
    const validation = passwordResetSchema.safeParse(rawData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return {
        success: false,
        error: firstError.message,
      };
    }

    const { password } = validation.data;

    // Create Supabase client
    const supabase = await createClient();

    // Verify user has valid reset token in session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        error: 'Invalid or expired reset link. Please request a new password reset.',
      };
    }

    // Update the user's password (Requirement 2.8)
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      return {
        success: false,
        error: getAuthErrorMessage(updateError),
      };
    }

    // Revalidate pages that depend on auth state
    revalidatePath('/', 'layout');

    return {
      success: true,
    };

  } catch (error: any) {
    console.error('Unexpected error during password reset:', error);
    return {
      success: false,
      error: getAuthErrorMessage(error),
    };
  }
}
