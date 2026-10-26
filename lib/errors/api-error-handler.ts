import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  isAppError,
  ValidationError,
  getErrorStatusCode,
  getUserFriendlyMessage,
} from "./custom-errors";
import { trackError } from "./error-tracker";

/**
 * API error response format
 */
interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
    errors?: Record<string, string[]>;
  };
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // Track the error
  if (error instanceof Error) {
    trackError(error, {
      tags: { context: "api" },
    });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors: Record<string, string[]> = {};
    error.errors.forEach((err) => {
      const path = err.path.join(".");
      if (!validationErrors[path]) {
        validationErrors[path] = [];
      }
      validationErrors[path].push(err.message);
    });

    return NextResponse.json(
      {
        error: {
          message: "Validation failed",
          statusCode: 400,
          errors: validationErrors,
        },
      },
      { status: 400 },
    );
  }

  // Handle custom app errors
  if (isAppError(error)) {
    const response: ErrorResponse = {
      error: {
        message: error.message,
        statusCode: error.statusCode,
      },
    };

    if (error instanceof ValidationError) {
      response.error.errors = error.errors;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle generic errors
  const statusCode = getErrorStatusCode(error);
  const message = getUserFriendlyMessage(error);

  return NextResponse.json(
    {
      error: {
        message,
        statusCode,
      },
    },
    { status: statusCode },
  );
}

/**
 * Wrap API route handler with error handling
 */
export function withErrorHandling<T = any>(
  handler: (request: Request, context?: any) => Promise<NextResponse<T>>,
) {
  return async (
    request: Request,
    context?: any,
  ): Promise<NextResponse<T | ErrorResponse>> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Create success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
): NextResponse<{ data: T }> {
  return NextResponse.json({ data }, { status });
}

/**
 * Create error response
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        message,
        statusCode,
      },
    },
    { status: statusCode },
  );
}
