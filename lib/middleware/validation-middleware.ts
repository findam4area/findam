import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema } from "zod";
import {
  sanitizeObject,
  containsSqlInjection,
  containsXss,
} from "@/lib/utils/sanitization";

/**
 * Validate and sanitize request body
 * Returns validated data or error response
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
): Promise<{ data: T } | NextResponse> {
  try {
    // Parse request body
    const body = await request.json();

    // Sanitize input
    const sanitized = sanitizeObject(body);

    // Check for SQL injection patterns
    const stringValues = Object.values(sanitized).filter(
      (v) => typeof v === "string",
    ) as string[];

    for (const value of stringValues) {
      if (containsSqlInjection(value)) {
        return NextResponse.json(
          {
            error: "Invalid input",
            message: "Input contains potentially dangerous patterns",
          },
          { status: 400 },
        );
      }

      if (containsXss(value)) {
        return NextResponse.json(
          {
            error: "Invalid input",
            message: "Input contains potentially dangerous content",
          },
          { status: 400 },
        );
      }
    }

    // Validate with Zod schema
    const validated = schema.parse(sanitized);

    return { data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Invalid request data",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid JSON",
          message: "Request body must be valid JSON",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Validation error",
        message: "Failed to validate request",
      },
      { status: 400 },
    );
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
): { data: T } | NextResponse {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, any> = {};

    // Convert URLSearchParams to object
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // Sanitize
    const sanitized = sanitizeObject(params);

    // Validate
    const validated = schema.parse(sanitized);

    return { data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation error",
          message: "Invalid query parameters",
          details: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Validation error",
        message: "Failed to validate query parameters",
      },
      { status: 400 },
    );
  }
}

/**
 * CSRF token validation for custom API routes
 * Next.js Server Actions have built-in CSRF protection
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // Get CSRF token from header
  const csrfToken = request.headers.get("x-csrf-token");

  // Get CSRF token from cookie
  const csrfCookie = request.cookies.get("csrf-token")?.value;

  // For GET requests, CSRF validation is not required
  if (request.method === "GET") {
    return true;
  }

  // Validate token matches
  return csrfToken === csrfCookie && csrfToken !== undefined;
}

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Add CSRF token to response
 */
export function addCsrfToken(response: NextResponse): NextResponse {
  const token = generateCsrfToken();

  response.cookies.set("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  response.headers.set("x-csrf-token", token);

  return response;
}
