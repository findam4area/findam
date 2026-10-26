/**
 * Comprehensive Input Sanitization Middleware
 * Sanitizes all user inputs to prevent XSS and injection attacks
 * Requirements: 31.3
 */

import { NextRequest, NextResponse } from "next/server";
import {
  sanitizeObject,
  containsSqlInjection,
  containsXss,
  sanitizeInput,
  escapeHtml,
} from "@/lib/utils/sanitization";

/**
 * Sanitization configuration options
 */
export interface SanitizationOptions {
  /**
   * Whether to check for SQL injection patterns
   * @default true
   */
  checkSqlInjection?: boolean;

  /**
   * Whether to check for XSS patterns
   * @default true
   */
  checkXss?: boolean;

  /**
   * Whether to escape HTML entities
   * @default false
   */
  escapeHtml?: boolean;

  /**
   * Fields to exclude from sanitization
   * @default []
   */
  excludeFields?: string[];

  /**
   * Maximum string length allowed
   * @default 10000
   */
  maxLength?: number;
}

const DEFAULT_OPTIONS: Required<SanitizationOptions> = {
  checkSqlInjection: true,
  checkXss: true,
  escapeHtml: false,
  excludeFields: [],
  maxLength: 10000,
};

/**
 * Sanitize request body
 * Returns sanitized data or error response
 */
export async function sanitizeRequestBody(
  request: NextRequest,
  options: SanitizationOptions = {},
): Promise<{ data: any } | NextResponse> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Parse request body
    const body = await request.json();

    // Sanitize the object
    const sanitized = sanitizeObject(body);

    // Validate sanitized data
    const validation = validateSanitizedData(sanitized, opts);
    if (validation.error) {
      return NextResponse.json(
        {
          error: "Invalid input",
          message: validation.message,
          field: validation.field,
        },
        { status: 400 },
      );
    }

    return { data: sanitized };
  } catch (error) {
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
        error: "Sanitization error",
        message: "Failed to sanitize request body",
      },
      { status: 400 },
    );
  }
}

/**
 * Sanitize query parameters
 */
export function sanitizeQueryParams(
  request: NextRequest,
  options: SanitizationOptions = {},
): { data: Record<string, any> } | NextResponse {
  const opts = { ...DEFAULT_OPTIONS, ...options };

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
    const validation = validateSanitizedData(sanitized, opts);
    if (validation.error) {
      return NextResponse.json(
        {
          error: "Invalid input",
          message: validation.message,
          field: validation.field,
        },
        { status: 400 },
      );
    }

    return { data: sanitized };
  } catch (error) {
    return NextResponse.json(
      {
        error: "Sanitization error",
        message: "Failed to sanitize query parameters",
      },
      { status: 400 },
    );
  }
}

/**
 * Validate sanitized data for dangerous patterns
 */
function validateSanitizedData(
  data: any,
  options: Required<SanitizationOptions>,
): { error: boolean; message?: string; field?: string } {
  const errors = checkForDangerousPatterns(data, options, "");

  if (errors.length > 0) {
    return {
      error: true,
      message: errors[0].message,
      field: errors[0].field,
    };
  }

  return { error: false };
}

/**
 * Recursively check for dangerous patterns in data
 */
function checkForDangerousPatterns(
  data: any,
  options: Required<SanitizationOptions>,
  path: string,
): Array<{ field: string; message: string }> {
  const errors: Array<{ field: string; message: string }> = [];

  if (typeof data === "string") {
    // Check if field should be excluded
    if (options.excludeFields.includes(path)) {
      return errors;
    }

    // Check length
    if (data.length > options.maxLength) {
      errors.push({
        field: path,
        message: `Input exceeds maximum length of ${options.maxLength} characters`,
      });
      return errors;
    }

    // Check for SQL injection
    if (options.checkSqlInjection && containsSqlInjection(data)) {
      errors.push({
        field: path,
        message: "Input contains potentially dangerous SQL patterns",
      });
      return errors;
    }

    // Check for XSS
    if (options.checkXss && containsXss(data)) {
      errors.push({
        field: path,
        message: "Input contains potentially dangerous XSS patterns",
      });
      return errors;
    }
  } else if (Array.isArray(data)) {
    // Check array items
    data.forEach((item, index) => {
      const itemPath = path ? `${path}[${index}]` : `[${index}]`;
      errors.push(...checkForDangerousPatterns(item, options, itemPath));
    });
  } else if (typeof data === "object" && data !== null) {
    // Check object properties
    for (const [key, value] of Object.entries(data)) {
      const fieldPath = path ? `${path}.${key}` : key;
      errors.push(...checkForDangerousPatterns(value, options, fieldPath));
    }
  }

  return errors;
}

/**
 * Sanitize form data (multipart/form-data)
 */
export async function sanitizeFormData(
  request: NextRequest,
  options: SanitizationOptions = {},
): Promise<{ data: FormData } | NextResponse> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const formData = await request.formData();
    const sanitizedFormData = new FormData();

    // Sanitize each field
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        // Skip excluded fields
        if (opts.excludeFields.includes(key)) {
          sanitizedFormData.append(key, value);
          continue;
        }

        // Sanitize string value
        let sanitized = sanitizeInput(value);

        if (opts.escapeHtml) {
          sanitized = escapeHtml(sanitized);
        }

        // Check for dangerous patterns
        if (opts.checkSqlInjection && containsSqlInjection(sanitized)) {
          return NextResponse.json(
            {
              error: "Invalid input",
              message: "Input contains potentially dangerous SQL patterns",
              field: key,
            },
            { status: 400 },
          );
        }

        if (opts.checkXss && containsXss(sanitized)) {
          return NextResponse.json(
            {
              error: "Invalid input",
              message: "Input contains potentially dangerous XSS patterns",
              field: key,
            },
            { status: 400 },
          );
        }

        // Check length
        if (sanitized.length > opts.maxLength) {
          return NextResponse.json(
            {
              error: "Invalid input",
              message: `Input exceeds maximum length of ${opts.maxLength} characters`,
              field: key,
            },
            { status: 400 },
          );
        }

        sanitizedFormData.append(key, sanitized);
      } else {
        // File or Blob - pass through
        sanitizedFormData.append(key, value);
      }
    }

    return { data: sanitizedFormData };
  } catch (error) {
    return NextResponse.json(
      {
        error: "Sanitization error",
        message: "Failed to sanitize form data",
      },
      { status: 400 },
    );
  }
}

/**
 * Combined middleware for input sanitization
 * Automatically detects content type and applies appropriate sanitization
 */
export async function inputSanitizationMiddleware(
  request: NextRequest,
  options: SanitizationOptions = {},
): Promise<{ data: any } | NextResponse> {
  const contentType = request.headers.get("content-type") || "";

  // Handle different content types
  if (contentType.includes("application/json")) {
    return sanitizeRequestBody(request, options);
  } else if (contentType.includes("multipart/form-data")) {
    return sanitizeFormData(request, options);
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    return sanitizeRequestBody(request, options);
  }

  // For GET requests or requests without body, sanitize query params
  if (request.method === "GET" || !contentType) {
    return sanitizeQueryParams(request, options);
  }

  // Unsupported content type
  return NextResponse.json(
    {
      error: "Unsupported content type",
      message: `Content type ${contentType} is not supported`,
    },
    { status: 415 },
  );
}
