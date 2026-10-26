/**
 * Server-side sanitization utilities
 * Uses jsdom for DOMPurify on the server
 * This file should only be imported in server-side code
 */

import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Create a DOMPurify instance for server-side use
const window = new JSDOM("").window;
export const purify = DOMPurify(window as any);

/**
 * Sanitizes user-generated text to prevent XSS attacks
 * @param text - The text to sanitize
 * @returns Sanitized text safe for storage and display
 */
export function sanitizeText(text: string): string {
  if (!text) return "";

  // Configure DOMPurify to strip all HTML tags and only keep plain text
  return purify.sanitize(text, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
  });
}

/**
 * Sanitizes HTML content while allowing safe tags
 * @param html - The HTML to sanitize
 * @returns Sanitized HTML safe for display
 */
export function sanitizeHTML(html: string): string {
  if (!html) return "";

  return purify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href"],
  });
}

/**
 * Sanitize message content (strips all HTML)
 */
export function sanitizeMessage(content: string): string {
  return purify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
