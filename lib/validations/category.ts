import { z } from "zod";

/**
 * Category validation schema
 * Ensures category hierarchy integrity
 */
export const categorySchema = z.object({
  id: z.string().uuid("Invalid category ID"),
  name: z.string().min(1, "Category name is required"),
  icon: z.string().min(1, "Category icon is required"),
  display_order: z.number().int().nonnegative(),
});

/**
 * Subcategory validation schema
 * Ensures subcategory references a valid parent category
 */
export const subcategorySchema = z.object({
  id: z.string().uuid("Invalid subcategory ID"),
  category_id: z.string().uuid("Invalid parent category ID"),
  name: z.string().min(1, "Subcategory name is required"),
  display_order: z.number().int().nonnegative(),
});

/**
 * Category selection validation for listings
 * Requires both main category and subcategory
 */
export const categorySelectionSchema = z.object({
  category_id: z.string().uuid("Main category is required"),
  subcategory_id: z.string().uuid("Subcategory is required"),
});

/**
 * Subcategory filter validation
 * Ensures subcategory belongs to the specified parent category
 */
export const subcategoryFilterSchema = z.object({
  category_id: z.string().uuid("Category ID is required"),
  subcategory_ids: z
    .array(z.string().uuid())
    .optional()
    .describe("Optional list of subcategory IDs to filter by"),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type SubcategoryInput = z.infer<typeof subcategorySchema>;
export type CategorySelectionInput = z.infer<typeof categorySelectionSchema>;
export type SubcategoryFilterInput = z.infer<typeof subcategoryFilterSchema>;
