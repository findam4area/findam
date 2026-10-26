import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types/category";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all main categories (parent_id IS NULL)
    const { data: mainCategories, error: categoriesError } = await supabase
      .from("categories")
      .select(
        `
        id,
        name,
        description,
        icon,
        display_order,
        is_hidden,
        created_at,
        updated_at
      `,
      )
      .is("parent_id", null)
      .eq("is_hidden", false)
      .order("display_order", { ascending: true });

    if (categoriesError) throw categoriesError;

    // Get all subcategories (parent_id IS NOT NULL)
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from("categories")
      .select(
        `
        id,
        name,
        description,
        icon,
        parent_id,
        display_order,
        is_hidden,
        created_at,
        updated_at
      `,
      )
      .not("parent_id", "is", null)
      .eq("is_hidden", false)
      .order("display_order", { ascending: true });

    if (subcategoriesError) throw subcategoriesError;

    // Calculate business_count for each category
    const { data: businessCounts, error: countsError } = await supabase
      .from("business_category_tags")
      .select("category_id");

    if (countsError) throw countsError;

    // Count businesses per category
    const countMap = new Map<string, number>();
    businessCounts?.forEach((tag) => {
      const count = countMap.get(tag.category_id) || 0;
      countMap.set(tag.category_id, count + 1);
    });

    // Build the category structure with subcategories
    const categories: Category[] = (mainCategories || []).map((category) => {
      // Get subcategories for this main category
      const categorySubcategories = (subcategories || [])
        .filter((sub) => sub.parent_id === category.id)
        .map((sub) => ({
          ...(sub as any),
          business_count: countMap.get(sub.id) || 0,
        }));

      return {
        ...(category as any),
        subcategories: categorySubcategories,
        business_count: countMap.get(category.id) || 0,
      };
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Categories fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
