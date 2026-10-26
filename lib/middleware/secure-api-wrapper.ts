/**
 * Secure API Route Wrapper
 * Combines input sanitization, CSRF protection, and validation
 * Requirements: 31.3, 31.4
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import {
  inputSanitizationMiddleware,
  SanitizationOptions,
} from "./input-sanitization-middleware";
import { validateCsrfToken } from "./csrf-middleware";

export interface SecureApiOptions<T = any> {
  /**
   * Zod schema for request validation
   */
  schema?: ZodSchema<T>;

  /**
   * Sanitization options
   */
  sanitization?: SanitizationOptions;

  /**
   * Whether to require CSRF token validation
   * @default true for POST, PUT, PATCH, DELETE
   */
  requireCsrf?: boolean;

  /**
   * Whether to require authentication
   * @default false
   */
  requireAuth?: boolean;
}

/**
 * Secure API route handler type
 */
export type SecureApiHandler<T = any> = (
  request: NextRequest,
  context: {
    data: T;
    userId?: string;
  },
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap an API route with security middleware
 * Automatically applies input sanitization, CSRF protection, and validation
 *
 * @example
 * ```ts
 * export const POST = secureApiRoute(
 *   async (request, { data }) => {
 *     // data is already sanitized and validated
 *     return NextResponse.json({ success: true });
 *   },
 *   {
 *     schema: z.object({
 *       name: z.string(),
 *       email: z.string().email(),
 *     }),
 *   }
 * );
 * ```
 */
export function secureApiRoute<T = any>(
  handler: SecureApiHandler<T>,
  options: SecureApiOptions<T> = {},
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 1. CSRF Protection (Requirement 31.4)
      const requireCsrf =
        options.requireCsrf ??
        ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);

      if (requireCsrf && !validateCsrfToken(request)) {
        return NextResponse.json(
          {
            error: "CSRF validation failed",
            message: "Invalid or missing CSRF token",
          },
          { status: 403 },
        );
      }

      // 2. Input Sanitization (Requirement 31.3)
      const sanitizationResult = await inputSanitizationMiddleware(
        request,
        options.sanitization,
      );

      if (sanitizationResult instanceof NextResponse) {
        return sanitizationResult;
      }

      let validatedData = sanitizationResult.data;

      // 3. Schema Validation (if provided)
      if (options.schema) {
        try {
          validatedData = options.schema.parse(validatedData);
        } catch (error: any) {
          return NextResponse.json(
            {
              error: "Validation error",
              message: "Invalid request data",
              details: error.errors?.map((e: any) => ({
                field: e.path.join("."),
                message: e.message,
              })),
            },
            { status: 400 },
          );
        }
      }

      // 4. Authentication Check (if required)
      let userId: string | undefined;
      if (options.requireAuth) {
        // Get user ID from session/token
        // This is a placeholder - implement based on your auth system
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
          return NextResponse.json(
            {
              error: "Unauthorized",
              message: "Authentication required",
            },
            { status: 401 },
          );
        }
        // Extract userId from auth token
        // userId = extractUserIdFromToken(authHeader);
      }

      // 5. Call the actual handler
      return await handler(request, {
        data: validatedData,
        userId,
      });
    } catch (error: any) {
      console.error("Secure API route error:", error);

      return NextResponse.json(
        {
          error: "Internal server error",
          message:
            process.env.NODE_ENV === "development"
              ? error.message
              : "An unexpected error occurred",
        },
        { status: 500 },
      );
    }
  };
}

/**
 * Secure API route for GET requests (no CSRF required)
 */
export function secureGetRoute<T = any>(
  handler: SecureApiHandler<T>,
  options: Omit<SecureApiOptions<T>, "requireCsrf"> = {},
): (request: NextRequest) => Promise<NextResponse> {
  return secureApiRoute(handler, {
    ...options,
    requireCsrf: false,
  });
}

/**
 * Secure API route for POST requests (CSRF required)
 */
export function securePostRoute<T = any>(
  handler: SecureApiHandler<T>,
  options: Omit<SecureApiOptions<T>, "requireCsrf"> = {},
): (request: NextRequest) => Promise<NextResponse> {
  return secureApiRoute(handler, {
    ...options,
    requireCsrf: true,
  });
}

/**
 * Secure API route for PUT requests (CSRF required)
 */
export function securePutRoute<T = any>(
  handler: SecureApiHandler<T>,
  options: Omit<SecureApiOptions<T>, "requireCsrf"> = {},
): (request: NextRequest) => Promise<NextResponse> {
  return secureApiRoute(handler, {
    ...options,
    requireCsrf: true,
  });
}

/**
 * Secure API route for DELETE requests (CSRF required)
 */
export function secureDeleteRoute<T = any>(
  handler: SecureApiHandler<T>,
  options: Omit<SecureApiOptions<T>, "requireCsrf"> = {},
): (request: NextRequest) => Promise<NextResponse> {
  return secureApiRoute(handler, {
    ...options,
    requireCsrf: true,
  });
}
