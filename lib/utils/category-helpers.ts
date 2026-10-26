import { createClient } from "@/lib/supabase/server";
import type { Category, Subcategory } from "@/lib/types";

/**
 * Validates that a subcategory belongs to the specified parent category
 * @param categoryId - The parent category ID
 * @param subcategoryId - The subcategory ID to validate
 * @returns true if the subcategory belongs to the category, false otherwise
 */
export async function validateSubcategoryBelongsToCategory(
  categoryId: string,
  subcategoryId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subcategories")
    .select("category_id")
    .eq("id", subcategoryId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.category_id === categoryId;
}

/**
 * Ensures category hierarchy integrity by validating that all subcategories
 * reference valid parent categories
 * @param subcategoryId - The subcategory ID to validate
 * @returns The parent category if valid, null otherwise
 */
export async function getCategoryForSubcategory(
  subcategoryId: string,
): Promise<Category | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subcategories")
    .select(
      `
      category_id,
      category:categories(*)
    `,
    )
    .eq("id", subcategoryId)
    .single();

  if (error || !data || !data.category) {
    return null;
  }

  return data.category as unknown as Category;
}

/**
 * Gets all subcategories for a given parent category
 * @param categoryId - The parent category ID
 * @returns Array of subcategories belonging to the category
 */
export async function getSubcategoriesByCategory(
  categoryId: string,
): Promise<Subcategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subcategories")
    .select("*")
    .eq("category_id", categoryId)
    .order("display_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as Subcategory[];
}

/**
 * Validates that both category and subcategory exist and are properly related
 * @param categoryId - The category ID
 * @param subcategoryId - The subcategory ID
 * @returns Object with validation result and error message if invalid
 */
export async function validateCategoryHierarchy(
  categoryId: string,
  subcategoryId: string,
): Promise<{ valid: boolean; error?: string }> {
  const supabase = await createClient();

  // Check if category exists
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .single();

  if (categoryError || !category) {
    return { valid: false, error: "Invalid category" };
  }

  // Check if subcategory exists and belongs to the category
  const { data: subcategory, error: subcategoryError } = await supabase
    .from("subcategories")
    .select("id, category_id")
    .eq("id", subcategoryId)
    .single();

  if (subcategoryError || !subcategory) {
    return { valid: false, error: "Invalid subcategory" };
  }

  if (subcategory.category_id !== categoryId) {
    return {
      valid: false,
      error: "Subcategory does not belong to the specified category",
    };
  }

  return { valid: true };
}

/**
 * Gets all categories with their subcategories
 * @returns Array of categories with nested subcategories
 */
export async function getAllCategoriesWithSubcategories(): Promise<
  (Category & { subcategories: Subcategory[] })[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(
      `
      *,
      subcategories:subcategories(*)
    `,
    )
    .order("display_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  // Sort subcategories within each category
  return data.map((category) => ({
    ...category,
    subcategories: (category.subcategories || []).sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
    ),
  })) as unknown as (Category & { subcategories: Subcategory[] })[];
}

/**
 * Validates listing category requirements
 * Ensures both category and subcategory are provided and valid
 * @param categoryId - The category ID
 * @param subcategoryId - The subcategory ID
 * @returns Validation result
 */
export async function validateListingCategories(
  categoryId: string | undefined,
  subcategoryId: string | undefined,
): Promise<{ valid: boolean; error?: string }> {
  if (!categoryId || !subcategoryId) {
    return {
      valid: false,
      error: "Both category and subcategory are required",
    };
  }

  return validateCategoryHierarchy(categoryId, subcategoryId);
}
