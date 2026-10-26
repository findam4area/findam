/**
 * Input sanitization utilities for XSS prevention
 */

/**
 * Sanitize HTML content by removing potentially dangerous tags and attributes
 * This is a basic implementation - for production, consider using DOMPurify
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  // Remove script tags and their content
  let sanitized = input.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, "");

  // Remove iframe tags
  sanitized = sanitized.replace(
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    "",
  );

  // Remove object and embed tags
  sanitized = sanitized.replace(
    /<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi,
    "",
  );

  return sanitized;
}

/**
 * Sanitize plain text by escaping HTML entities
 */
export function escapeHtml(input: string): string {
  if (!input) return "";

  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Sanitize user input for database storage
 * Trims whitespace and removes null bytes
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  // Remove null bytes
  let sanitized = input.replace(/\0/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  // Normalize whitespace (replace multiple spaces with single space)
  sanitized = sanitized.replace(/\s+/g, " ");

  return sanitized;
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return "";
    }
  }

  return url.trim();
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "";

  // Remove path separators
  let sanitized = filename.replace(/[/\\]/g, "");

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, "");

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split(".").pop() || "";
    const name = sanitized.substring(0, 255 - ext.length - 1);
    sanitized = `${name}.${ext}`;
  }

  return sanitized;
}

/**
 * Sanitize phone number to standard format
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return "";

  // Remove all non-digit characters except +
  let sanitized = phone.replace(/[^\d+]/g, "");

  // Ensure it starts with +234 for Nigerian numbers
  if (sanitized.startsWith("0")) {
    sanitized = "+234" + sanitized.substring(1);
  } else if (!sanitized.startsWith("+")) {
    sanitized = "+" + sanitized;
  }

  return sanitized;
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return "";

  // Convert to lowercase and trim
  let sanitized = email.toLowerCase().trim();

  // Remove any whitespace
  sanitized = sanitized.replace(/\s/g, "");

  return sanitized;
}

/**
 * Check if string contains SQL injection patterns
 * This is a basic check - parameterized queries are the primary defense
 */
export function containsSqlInjection(input: string): boolean {
  if (!input) return false;

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b.*\b(FROM|INTO|TABLE|WHERE)\b)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /('|")\s*(OR|AND)\s*('|")/i,
    /UNION.*SELECT/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check if string contains XSS patterns
 */
export function containsXss(input: string): boolean {
  if (!input) return false;

  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Comprehensive sanitization for user-generated content
 */
export function sanitizeUserContent(content: string): string {
  if (!content) return "";

  // First, sanitize basic input
  let sanitized = sanitizeInput(content);

  // Then escape HTML entities
  sanitized = escapeHtml(sanitized);

  return sanitized;
}

/**
 * Sanitize object by applying sanitization to all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    const value = sanitized[key];

    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value) as any;
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: any) =>
        typeof item === "string" ? sanitizeInput(item) : item,
      ) as any;
    }
  }

  return sanitized;
}
