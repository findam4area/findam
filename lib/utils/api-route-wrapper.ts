import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import {
  validateRequest,
  validateQueryParams,
} from "@/lib/middleware/validation-middleware";
import { requireAuth, applyRateLimit } from "./api-helpers";
import { RateLimitConfig } from "./rate-limit";

/**
 * Options for API route wrapper
 */
interface ApiRouteOptions<TBody = any, TQuery = any> {
  // Authentication
  requireAuth?: boolean;

  // Rate limiting
  rateLimit?: RateLimitConfig;

  // Validation schemas
  bodySchema?: ZodSchema<TBody>;
  querySchema?: ZodSchema<TQuery>;

  // CORS
  allowedOrigins?: string[];
  allowedMethods?: string[];
}

/**
 * Context passed to API route handler
 */
interface ApiRouteContext<TBody = any, TQuery = any> {
  user?: any;
  body?: TBody;
  query?: TQuery;
  request: NextRequest;
}

/**
 * API route handler function type
 */
type ApiRouteHandler<TBody = any, TQuery = any> = (
  context: ApiRouteContext<TBody, TQuery>,
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap API route with security measures
 * Handles authentication, rate limiting, validation, CORS, and error handling
 */
export function createApiRoute<TBody = any, TQuery = any>(
  handler: ApiRouteHandler<TBody, TQuery>,
  options: ApiRouteOptions<TBody, TQuery> = {},
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // CORS preflight
      if (request.method === "OPTIONS") {
        return handleCors(request, options);
      }

      // Rate limiting
      if (options.rateLimit) {
        const rateLimitResponse = applyRateLimit(request, options.rateLimit);
        if (rateLimitResponse) {
          return rateLimitResponse;
        }
      }

      // Authentication
      let user: any = undefined;
      if (options.requireAuth) {
        const authResult = await requireAuth(request);
        if (authResult instanceof NextResponse) {
          return authResult;
        }
        user = authResult.user;
      }

      // Validate request body
      let body: TBody | undefined;
      if (options.bodySchema && request.method !== "GET") {
        const validationResult = await validateRequest(
          request,
          options.bodySchema,
        );
        if (validationResult instanceof NextResponse) {
          return validationResult;
        }
        body = validationResult.data;
      }

      // Validate query parameters
      let query: TQuery | undefined;
      if (options.querySchema) {
        const validationResult = validateQueryParams(
          request,
          options.querySchema,
        );
        if (validationResult instanceof NextResponse) {
          return validationResult;
        }
        query = validationResult.data;
      }

      // Call handler
      const response = await handler({
        user,
        body,
        query,
        request,
      });

      // Add CORS headers
      return addCorsHeaders(response, options);
    } catch (error) {
      console.error("API route error:", error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes("Unauthorized")) {
          return NextResponse.json(
            { error: "Unauthorized", message: error.message },
            { status: 401 },
          );
        }

        if (error.message.includes("Not found")) {
          return NextResponse.json(
            { error: "Not found", message: error.message },
            { status: 404 },
          );
        }

        if (error.message.includes("Forbidden")) {
          return NextResponse.json(
            { error: "Forbidden", message: error.message },
            { status: 403 },
          );
        }
      }

      // Generic error response
      return NextResponse.json(
        {
          error: "Internal server error",
          message: "An unexpected error occurred",
        },
        { status: 500 },
      );
    }
  };
}

/**
 * Handle CORS preflight requests
 */
function handleCors(
  request: NextRequest,
  options: ApiRouteOptions,
): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response, options);
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(
  response: NextResponse,
  options: ApiRouteOptions,
): NextResponse {
  const origin = options.allowedOrigins?.[0] || "*";
  const methods =
    options.allowedMethods?.join(", ") || "GET, POST, PUT, DELETE, OPTIONS";

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", methods);
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-CSRF-Token",
  );
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  status = 400,
  details?: any,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    { status },
  );
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: (page + 1) * limit < total,
    },
  });
}
