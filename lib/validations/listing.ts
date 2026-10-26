import { z } from "zod";
import {
  getValidStateNames,
  isValidAreaForState,
} from "@/lib/utils/location-helpers";

// Get valid state names for validation
const validStates = getValidStateNames();

export const listingSchema = z
  .object({
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
      .optional()
      .or(z.string().transform((val) => (val ? parseFloat(val) : undefined))),
    category_id: z.string().uuid("Main category is required"),
    subcategory_id: z.string().uuid("Subcategory is required"),
    condition: z.enum(["new", "used", "refurbished"]).optional(),
    state: z
      .string()
      .min(1, "State is required")
      .refine((state) => validStates.includes(state), {
        message: `State must be one of the valid Nigerian states: ${validStates.join(", ")}`,
      }),
    lga: z.string().min(1, "LGA is required"),
    area: z.string().optional(),
  })
  .refine(
    (data) => {
      // If area is provided, validate it belongs to the selected state
      if (data.area && data.state) {
        return isValidAreaForState(data.state, data.area);
      }
      return true;
    },
    {
      message: "Area must be valid for the selected state",
      path: ["area"],
    },
  );

export const listingMediaSchema = z.object({
  media_type: z.enum(["image", "video"]),
  duration_seconds: z
    .number()
    .max(30, "Video must be at most 30 seconds")
    .optional(),
});

export const listingFilterSchema = z.object({
  category_id: z.string().uuid().optional(),
  subcategory_id: z.string().uuid().optional(),
  min_price: z.number().positive().optional(),
  max_price: z.number().positive().optional(),
  condition: z.enum(["new", "used", "refurbished"]).optional(),
  state: z
    .string()
    .refine((state) => validStates.includes(state), {
      message: `State must be one of the valid Nigerian states`,
    })
    .optional(),
  area: z.string().optional(),
  search_query: z.string().optional(),
  sort_by: z
    .enum(["price_asc", "price_desc", "date_desc", "date_asc", "relevance"])
    .optional(),
});

export type ListingInput = z.infer<typeof listingSchema>;
export type ListingMediaInput = z.infer<typeof listingMediaSchema>;
export type ListingFilterInput = z.infer<typeof listingFilterSchema>;
