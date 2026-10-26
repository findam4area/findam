/**
 * Zod Validation Schemas
 * 
 * This file contains all Zod validation schemas for the FindAm directory platform,
 * including schemas for authentication, listings with multi-image support, vendor
 * applications, browse filters, and admin actions.
 * 
 * Requirements: 2.4, 2.5, 13.4, 13.5, 14.4
 */

import { z } from "zod";

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

/**
 * Register schema with RFC 5322 email validation and password requirements
 * Requirements: 2.4, 2.5
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
});

/**
 * Login schema
 * Requirements: 2.4
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required"),
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ============================================================================
// LISTING SCHEMAS WITH MULTI-IMAGE SUPPORT
// ============================================================================

/**
 * Create listing schema with multi-image support (1-5 images)
 * Requirements: 13.1, 13.2, 13.4, 13.5, 14.4
 */
export const createListingSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be at most 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be at most 2000 characters"),
  price: z
    .number()
    .positive("Price must be positive")
    .nullable()
    .optional(),
  category_id: z
    .string()
    .uuid("Invalid category ID"),
  location_state: z
    .string()
    .min(2, "State is required")
    .max(100, "State name too long"),
  location_city: z
    .string()
    .min(2, "City is required")
    .max(100, "City name too long"),
  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .min(1, "At least 1 image is required")
    .max(5, "Maximum 5 images allowed"),
  primary_image_index: z
    .number()
    .int("Primary image index must be an integer")
    .min(0, "Primary image index must be at least 0")
    .max(4, "Primary image index must be at most 4")
    .default(0),
}).refine(
  (data) => data.primary_image_index < data.images.length,
  {
    message: "Primary image index must be within the images array bounds",
    path: ["primary_image_index"],
  }
);

/**
 * Update listing images schema
 * Requirements: 13.4, 13.9, 13.10
 */
export const updateListingImagesSchema = z.object({
  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .min(1, "At least 1 image is required")
    .max(5, "Maximum 5 images allowed"),
  primary_image_index: z
    .number()
    .int("Primary image index must be an integer")
    .min(0, "Primary image index must be at least 0")
    .max(4, "Primary image index must be at most 4"),
}).refine(
  (data) => data.primary_image_index < data.images.length,
  {
    message: "Primary image index must be less than the number of images",
    path: ["primary_image_index"],
  }
);

/**
 * Update listing schema (for editing existing listings)
 */
export const updateListingSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be at most 100 characters")
    .optional(),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be at most 2000 characters")
    .optional(),
  price: z
    .number()
    .positive("Price must be positive")
    .nullable()
    .optional(),
  category_id: z
    .string()
    .uuid("Invalid category ID")
    .optional(),
  location_state: z
    .string()
    .min(2, "State is required")
    .max(100, "State name too long")
    .optional(),
  location_city: z
    .string()
    .min(2, "City is required")
    .max(100, "City name too long")
    .optional(),
});

// ============================================================================
// IMAGE UPLOAD SCHEMAS
// ============================================================================

/**
 * Image upload schema with file type and size validation
 * Requirements: 13.5, 13.6
 */
export const imageUploadSchema = z.object({
  file: z.instanceof(File, { message: "A valid file is required" }),
  bucket: z.enum(["avatars", "listings"], {
    errorMap: () => ({ message: "Bucket must be either 'avatars' or 'listings'" }),
  }),
}).refine(
  (data) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    return validTypes.includes(data.file.type);
  },
  {
    message: "Invalid file type. Only JPEG, PNG, and WebP images are allowed",
  }
).refine(
  (data) => {
    const maxSize = data.bucket === "avatars" 
      ? 2 * 1024 * 1024  // 2MB for avatars
      : 5 * 1024 * 1024; // 5MB for listings
    return data.file.size <= maxSize;
  },
  (data) => ({
    message: `File size exceeds ${data.bucket === "avatars" ? "2" : "5"}MB limit`,
  })
);

/**
 * Client-side image validation (before upload)
 * Requirements: 13.5, 13.6
 */
export const clientImageValidationSchema = z.object({
  name: z.string(),
  type: z.string().refine(
    (type) => ["image/jpeg", "image/png", "image/webp"].includes(type),
    "Only JPEG, PNG, and WebP images are allowed"
  ),
  size: z.number().refine(
    (size) => size <= 5 * 1024 * 1024,
    "Image size must be less than 5MB"
  ),
});

/**
 * Avatar upload validation
 * Requirement: 13.13
 */
export const avatarUploadSchema = z.object({
  file: z.instanceof(File, { message: "A valid file is required" }),
}).refine(
  (data) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    return validTypes.includes(data.file.type);
  },
  {
    message: "Invalid file type. Only JPEG, PNG, and WebP images are allowed",
  }
).refine(
  (data) => data.file.size <= 2 * 1024 * 1024,
  {
    message: "Avatar size must be less than 2MB",
  }
);

// ============================================================================
// VENDOR APPLICATION SCHEMA
// ============================================================================

/**
 * Vendor application schema with Nigerian phone format validation
 * Requirements: 4.1, 4.2
 */
export const vendorApplicationSchema = z.object({
  business_name: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be at most 100 characters"),
  business_description: z
    .string()
    .min(20, "Business description must be at least 20 characters")
    .max(500, "Business description must be at most 500 characters"),
  contact_email: z
    .string()
    .min(1, "Contact email is required")
    .email("Invalid email format"),
  contact_phone: z
    .string()
    .regex(
      /^(\+?234|0)[789]\d{9}$/,
      "Invalid Nigerian phone number format. Expected format: +234XXXXXXXXXX or 0XXXXXXXXXX"
    ),
});

// ============================================================================
// BROWSE FILTERS SCHEMA
// ============================================================================

/**
 * Browse filters schema for listing search and filtering
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export const browseFiltersSchema = z.object({
  category_id: z
    .string()
    .uuid("Invalid category ID")
    .optional(),
  location_city: z
    .string()
    .min(1)
    .max(100)
    .optional(),
  search_query: z
    .string()
    .max(100, "Search query must be at most 100 characters")
    .optional(),
  sort_by: z
    .enum(["newest", "featured"], {
      errorMap: () => ({ message: "Sort by must be either 'newest' or 'featured'" }),
    })
    .default("newest"),
  limit: z
    .number()
    .int()
    .positive()
    .max(50, "Maximum 50 results per page")
    .default(20)
    .optional(),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .optional(),
});

/**
 * Browse filters from URL search params (strings that need parsing)
 */
export const browseFiltersFromParamsSchema = z.object({
  category_id: z
    .string()
    .uuid("Invalid category ID")
    .optional(),
  location_city: z
    .string()
    .optional(),
  search_query: z
    .string()
    .optional(),
  sort_by: z
    .enum(["newest", "featured"])
    .optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(50).default(20)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0).default(0)),
});

// ============================================================================
// ADMIN ACTION SCHEMAS
// ============================================================================

/**
 * Reject reason schema for listing/vendor rejections
 * Requirements: 3.6, 4.6
 */
export const rejectReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Rejection reason must be at least 10 characters")
    .max(500, "Rejection reason must be at most 500 characters"),
});

/**
 * Approve listing schema
 */
export const approveListingSchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
});

/**
 * Reject listing schema
 */
export const rejectListingSchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
  reason: z
    .string()
    .min(10, "Rejection reason must be at least 10 characters")
    .max(500, "Rejection reason must be at most 500 characters"),
});

/**
 * Approve vendor schema
 */
export const approveVendorSchema = z.object({
  application_id: z.string().uuid("Invalid application ID"),
});

/**
 * Reject vendor schema
 */
export const rejectVendorSchema = z.object({
  application_id: z.string().uuid("Invalid application ID"),
  reason: z
    .string()
    .min(10, "Rejection reason must be at least 10 characters")
    .max(500, "Rejection reason must be at most 500 characters"),
});

// ============================================================================
// CATEGORY SCHEMAS
// ============================================================================

/**
 * Category filter schema
 */
export const categoryFilterSchema = z.object({
  parent_id: z
    .string()
    .uuid("Invalid parent category ID")
    .nullable()
    .optional(),
  include_subcategories: z
    .boolean()
    .default(true)
    .optional(),
});

// ============================================================================
// COMMON UTILITY SCHEMAS
// ============================================================================

/**
 * UUID parameter schema
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z
    .number()
    .int()
    .min(1, "Page must be at least 1")
    .default(1),
  limit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Maximum 100 items per page")
    .default(20),
});

/**
 * Slug parameter schema
 */
export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Authentication types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

// Listing types
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type UpdateListingImagesInput = z.infer<typeof updateListingImagesSchema>;

// Image upload types
export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
export type ClientImageValidationInput = z.infer<typeof clientImageValidationSchema>;
export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;

// Vendor types
export type VendorApplicationInput = z.infer<typeof vendorApplicationSchema>;

// Browse types
export type BrowseFiltersInput = z.infer<typeof browseFiltersSchema>;
export type BrowseFiltersFromParamsInput = z.infer<typeof browseFiltersFromParamsSchema>;

// Admin types
export type RejectReasonInput = z.infer<typeof rejectReasonSchema>;
export type ApproveListingInput = z.infer<typeof approveListingSchema>;
export type RejectListingInput = z.infer<typeof rejectListingSchema>;
export type ApproveVendorInput = z.infer<typeof approveVendorSchema>;
export type RejectVendorInput = z.infer<typeof rejectVendorSchema>;

// Common types
export type UuidParam = z.infer<typeof uuidParamSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SlugParam = z.infer<typeof slugParamSchema>;
export type CategoryFilterInput = z.infer<typeof categoryFilterSchema>;
