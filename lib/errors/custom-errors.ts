/**
 * Base error class for all custom application errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * API-related errors
 */
export class APIError extends AppError {
  constructor(message: string, statusCode: number = 500) {
    super(message, statusCode);
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, 401);
  }
}

/**
 * Authorization errors
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = "You do not have permission to perform this action",
  ) {
    super(message, 403);
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(
    message: string = "Validation failed",
    errors: Record<string, string[]> = {},
  ) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests. Please try again later.") {
    super(message, 429);
  }
}

/**
 * Payment errors
 */
export class PaymentError extends AppError {
  constructor(message: string = "Payment processing failed") {
    super(message, 402);
  }
}

/**
 * Network errors
 */
export class NetworkError extends AppError {
  constructor(
    message: string = "Network error. Please check your connection.",
  ) {
    super(message, 0, true);
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed") {
    super(message, 500, false);
  }
}

/**
 * File upload errors
 */
export class FileUploadError extends AppError {
  constructor(message: string = "File upload failed") {
    super(message, 400);
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    // Don't expose internal error messages in production
    if (process.env.NODE_ENV === "production") {
      return "An unexpected error occurred. Please try again.";
    }
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Get error status code
 */
export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}
