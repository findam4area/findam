import { z } from "zod";
import { sanitizeUserContent } from "@/lib/utils/sanitization";

// Review submission validation schema
export const createReviewSchema = z.object({
  reviewed_user_id: z.string().uuid("Invalid user ID"),
  listing_id: z.string().uuid("Invalid listing ID").optional().nullable(),
  vendor_id: z.string().uuid("Invalid vendor ID").optional().nullable(),
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string()
    .max(1000, "Comment must be at most 1000 characters")
    .transform((val) => (val ? sanitizeUserContent(val) : val))
    .optional()
    .nullable(),
  images: z
    .array(z.string().url("Invalid image URL"))
    .max(5, "Maximum 5 images allowed")
    .optional()
    .nullable(),
});

// Review update validation schema
export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5")
    .optional(),
  comment: z
    .string()
    .max(1000, "Comment must be at most 1000 characters")
    .transform((val) => (val ? sanitizeUserContent(val) : val))
    .optional()
    .nullable(),
  images: z
    .array(z.string().url("Invalid image URL"))
    .max(5, "Maximum 5 images allowed")
    .optional()
    .nullable(),
});

// Vendor response validation schema
export const vendorResponseSchema = z.object({
  vendor_response: z
    .string()
    .max(500, "Response must be at most 500 characters")
    .transform((val) => (val ? sanitizeUserContent(val) : val)),
});

// Business owner response validation schema (for business_reviews table)
export const businessOwnerResponseSchema = z.object({
  response: z
    .string()
    .min(1, "Response cannot be empty")
    .max(1000, "Response must be at most 1000 characters")
    .transform((val) => (val ? sanitizeUserContent(val) : val)),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type VendorResponseInput = z.infer<typeof vendorResponseSchema>;
export type BusinessOwnerResponseInput = z.infer<typeof businessOwnerResponseSchema>;
