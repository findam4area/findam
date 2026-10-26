/**
 * CSRF Protection Middleware
 * Implements CSRF token validation for form submissions
 * Requirements: 31.4
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const CSRF_TOKEN_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Validate CSRF token from request
 * Compares token from header/body with token from cookie
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // GET, HEAD, OPTIONS requests don't need CSRF protection
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  // Get CSRF token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // Get CSRF token from cookie
  const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value;

  // Both tokens must exist and match
  if (!headerToken || !cookieToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(headerToken, cookieToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Add CSRF token to response
 * Sets both cookie and header for client access
 */
export function addCsrfTokenToResponse(response: NextResponse): NextResponse {
  const token = generateCsrfToken();

  // Set cookie with secure flags
  response.cookies.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Also set as header so client can read it
  response.headers.set(CSRF_HEADER_NAME, token);

  return response;
}

/**
 * CSRF protection middleware for API routes
 * Returns error response if CSRF validation fails
 */
export async function csrfProtection(
  request: NextRequest,
): Promise<NextResponse | null> {
  // Skip CSRF check for safe methods
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return null;
  }

  // Validate CSRF token
  if (!validateCsrfToken(request)) {
    return NextResponse.json(
      {
        error: "CSRF validation failed",
        message: "Invalid or missing CSRF token",
      },
      { status: 403 },
    );
  }

  return null;
}

/**
 * Get CSRF token from cookies (server-side)
 * Used in Server Components and Server Actions
 */
export async function getCsrfToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_TOKEN_NAME)?.value;
}

/**
 * Set CSRF token in cookies (server-side)
 * Used in Server Components and Server Actions
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();

  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}
