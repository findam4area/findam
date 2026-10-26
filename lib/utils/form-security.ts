/**
 * Form Security Utilities
 * Provides helpers for secure form handling with input sanitization and CSRF protection
 * Requirements: 31.3, 31.4
 */

import { sanitizeInput, sanitizeUserContent } from "./sanitization";
import { getCsrfHeaders } from "@/lib/hooks/use-csrf-token";

/**
 * Sanitize form data object
 * Applies appropriate sanitization to all string fields
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  options: {
    /** Fields that should have HTML content sanitized (user-generated content) */
    contentFields?: (keyof T)[];
    /** Fields that should be left unsanitized (e.g., passwords) */
    skipFields?: (keyof T)[];
  } = {},
): T {
  const { contentFields = [], skipFields = [] } = options;
  const sanitized = { ...data };

  for (const key in sanitized) {
    // Skip fields that shouldn't be sanitized
    if (skipFields.includes(key)) {
      continue;
    }

    const value = sanitized[key];

    if (typeof value === "string") {
      // Apply content sanitization for user-generated content fields
      if (contentFields.includes(key)) {
        sanitized[key] = sanitizeUserContent(value) as any;
      } else {
        // Apply basic input sanitization for other fields
        sanitized[key] = sanitizeInput(value) as any;
      }
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeFormData(value, options);
    } else if (Array.isArray(value)) {
      // Sanitize array items
      sanitized[key] = value.map((item: any) =>
        typeof item === "string"
          ? contentFields.includes(key)
            ? sanitizeUserContent(item)
            : sanitizeInput(item)
          : item,
      ) as any;
    }
  }

  return sanitized;
}

/**
 * Submit form data with CSRF protection and input sanitization
 * @param url - API endpoint URL
 * @param data - Form data to submit
 * @param options - Configuration options
 * @returns Response from the API
 */
export async function submitSecureForm<T extends Record<string, any>>(
  url: string,
  data: T,
  options: {
    method?: "POST" | "PUT" | "PATCH" | "DELETE";
    /** Fields that should have HTML content sanitized */
    contentFields?: (keyof T)[];
    /** Fields that should be left unsanitized */
    skipFields?: (keyof T)[];
    /** Additional headers */
    headers?: Record<string, string>;
    /** Whether to sanitize the data (default: true) */
    sanitize?: boolean;
  } = {},
): Promise<Response> {
  const {
    method = "POST",
    contentFields = [],
    skipFields = [],
    headers = {},
    sanitize = true,
  } = options;

  // Sanitize form data
  const sanitizedData = sanitize
    ? sanitizeFormData(data, { contentFields, skipFields })
    : data;

  // Get CSRF headers
  const csrfHeaders = getCsrfHeaders();

  // Combine headers
  const allHeaders = {
    "Content-Type": "application/json",
    ...csrfHeaders,
    ...headers,
  };

  // Submit form
  return fetch(url, {
    method,
    headers: allHeaders,
    body: JSON.stringify(sanitizedData),
    credentials: "same-origin", // Include cookies for CSRF token
  });
}

/**
 * Validate form data before submission
 * Checks for common security issues
 */
export function validateFormSecurity<T extends Record<string, any>>(
  data: T,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for suspiciously long inputs (potential DoS)
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string" && value.length > 100000) {
      errors.push(`Field "${key}" exceeds maximum length`);
    }
  }

  // Check for null bytes
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string" && value.includes("\0")) {
      errors.push(`Field "${key}" contains null bytes`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create secure form submission handler
 * Returns a function that handles form submission with security measures
 */
export function createSecureFormHandler<T extends Record<string, any>>(
  url: string,
  options: {
    method?: "POST" | "PUT" | "PATCH" | "DELETE";
    contentFields?: (keyof T)[];
    skipFields?: (keyof T)[];
    onSuccess?: (response: Response) => void | Promise<void>;
    onError?: (error: Error) => void | Promise<void>;
    validate?: (data: T) => { valid: boolean; errors: string[] };
  } = {},
) {
  return async (data: T) => {
    try {
      // Custom validation
      if (options.validate) {
        const validation = options.validate(data);
        if (!validation.valid) {
          throw new Error(validation.errors.join(", "));
        }
      }

      // Security validation
      const securityValidation = validateFormSecurity(data);
      if (!securityValidation.valid) {
        throw new Error(securityValidation.errors.join(", "));
      }

      // Submit form
      const response = await submitSecureForm(url, data, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Request failed with status ${response.status}`,
        );
      }

      // Call success handler
      if (options.onSuccess) {
        await options.onSuccess(response);
      }

      return response;
    } catch (error) {
      // Call error handler
      if (options.onError) {
        await options.onError(
          error instanceof Error ? error : new Error(String(error)),
        );
      }
      throw error;
    }
  };
}

/**
 * Example usage:
 *
 * ```typescript
 * // In a React component
 * const handleSubmit = createSecureFormHandler<FormData>(
 *   '/api/listings',
 *   {
 *     method: 'POST',
 *     contentFields: ['description', 'bio'], // Fields with user-generated content
 *     skipFields: ['password'], // Fields to skip sanitization
 *     onSuccess: async (response) => {
 *       const data = await response.json();
 *       console.log('Success:', data);
 *     },
 *     onError: (error) => {
 *       console.error('Error:', error.message);
 *     },
 *   }
 * );
 *
 * // In form submit handler
 * await handleSubmit(formData);
 * ```
 */
