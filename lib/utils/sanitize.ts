/**
 * Server-side sanitization utilities
 * Re-exports from sanitize-server for backward compatibility
 */

export {
  sanitizeText as sanitizeText,
  sanitizeHTML,
  sanitizeMessage,
} from "./sanitize-server";

// For backward compatibility
export { sanitizeText as default } from "./sanitize-server";
