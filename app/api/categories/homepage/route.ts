import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/categories/homepage
 * 
 * Fetch categories with item counts for the homepage showcase.
 * 
 * Requirements:
 * - 2.1: Display minimum 6 categories
 * - 2.3: Display item counts for each category
 * - 2.7: Include accent colors for each category
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch categories with listing counts
    const { data: categories, error } = await supabase
      .from("categories")
      .select(
        `
        id,
        name,
        icon,
        display_order
      `
      )
      .order("display_order", { ascending: true })
      .limit(12); // Fetch up to 12 categories

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }

    // Get listing counts for each category
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category) => {
        const { count, error: countError } = await supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("category_id", category.id)
          .eq("is_active", true);

        if (countError) {
          console.error(
            `Error counting listings for category ${category.id}:`,
            countError
          );
        }

        // Generate slug from name
        const slug = category.name.toLowerCase().replace(/\s+/g, "-");

        // Assign accent colors based on category (you can customize these)
        const accentColors: Record<string, string> = {
          electronics: "#3B82F6", // blue
          fashion: "#EC4899", // pink
          home: "#10B981", // green
          vehicles: "#F59E0B", // amber
          services: "#8B5CF6", // purple
          jobs: "#EF4444", // red
          properties: "#06B6D4", // cyan
          food: "#F97316", // orange
        };

        const accentColor =
          accentColors[slug] ||
          accentColors[category.name.toLowerCase()] ||
          "#6366F1"; // default indigo

        return {
          id: category.id,
          name: category.name,
          slug,
          icon: category.icon || "📦",
          itemCount: count || 0,
          accentColor,
        };
      })
    );

    // Filter out categories with 0 items and ensure we have at least 6
    const activeCategories = categoriesWithCounts.filter(
      (cat) => cat.itemCount > 0
    );

    // If we don't have enough active categories, include some with 0 items
    const finalCategories =
      activeCategories.length >= 6
        ? activeCategories
        : [
            ...activeCategories,
            ...categoriesWithCounts
              .filter((cat) => cat.itemCount === 0)
              .slice(0, 6 - activeCategories.length),
          ];

    return NextResponse.json(finalCategories);
  } catch (error) {
    console.error("Unexpected error in homepage categories API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
