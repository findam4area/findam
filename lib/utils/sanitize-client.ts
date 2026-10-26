/**
 * Client-side sanitization utilities
 * Uses DOMPurify with browser's native window object
 * This file is safe to import in client components
 */

"use client";

import DOMPurify from "dompurify";

/**
 * Sanitize HTML content on the client
 * Uses browser's native window object
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") {
    // If somehow called on server, just return the content
    // (should not happen in client components)
    return html;
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
  });
}

/**
 * Sanitize message content (strips all HTML)
 */
export function sanitizeMessage(content: string): string {
  if (typeof window === "undefined") {
    return content;
  }

  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
