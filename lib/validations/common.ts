import { z } from "zod";
import {
  sanitizeInput,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeUrl,
} from "@/lib/utils/sanitization";

/**
 * Common validation schemas with built-in sanitization
 */

// Sanitized string schema
export const sanitizedString = (options?: {
  min?: number;
  max?: number;
  message?: string;
}) =>
  z
    .string()
    .transform((val) => sanitizeInput(val))
    .pipe(
      z
        .string()
        .min(options?.min || 0, options?.message)
        .max(options?.max || 10000, options?.message),
    );

// Email with sanitization
export const sanitizedEmail = z
  .string()
  .transform((val) => sanitizeEmail(val))
  .pipe(z.string().email("Invalid email address"));

// Phone number with sanitization
export const sanitizedPhone = z
  .string()
  .transform((val) => sanitizePhoneNumber(val))
  .pipe(
    z
      .string()
      .regex(
        /^\+234[0-9]{10}$/,
        "Phone number must be in format +234XXXXXXXXXX",
      ),
  );

// URL with sanitization
export const sanitizedUrl = z
  .string()
  .transform((val) => sanitizeUrl(val))
  .pipe(z.string().url("Invalid URL"));

// UUID validation
export const uuidSchema = z.string().uuid("Invalid ID format");

// Pagination schema
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
});

// Date range schema
export const dateRangeSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

// Sort schema
export const sortSchema = z.object({
  sort_by: z.string().optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
});

// Search schema
export const searchSchema = z.object({
  query: sanitizedString({ min: 1, max: 200 }).optional(),
});

// ID parameter schema
export const idParamSchema = z.object({
  id: uuidSchema,
});

/**
 * File upload validation
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.string(),
  size: z
    .number()
    .positive()
    .max(50 * 1024 * 1024), // 50MB max
});

export const imageUploadSchema = fileUploadSchema.extend({
  mimetype: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  size: z
    .number()
    .positive()
    .max(5 * 1024 * 1024), // 5MB max for images
});

export const videoUploadSchema = fileUploadSchema.extend({
  mimetype: z.enum(["video/mp4", "video/webm"]),
  size: z
    .number()
    .positive()
    .max(50 * 1024 * 1024), // 50MB max for videos
  duration: z.number().positive().max(30), // 30 seconds max
});

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
  REQUIRED: "This field is required",
  INVALID_EMAIL: "Invalid email address",
  INVALID_PHONE: "Invalid phone number format",
  INVALID_URL: "Invalid URL format",
  INVALID_UUID: "Invalid ID format",
  TOO_SHORT: (min: number) => `Must be at least ${min} characters`,
  TOO_LONG: (max: number) => `Must be at most ${max} characters`,
  INVALID_FORMAT: "Invalid format",
  UNAUTHORIZED: "You are not authorized to perform this action",
  NOT_FOUND: "Resource not found",
  SERVER_ERROR: "An error occurred. Please try again later",
} as const;
