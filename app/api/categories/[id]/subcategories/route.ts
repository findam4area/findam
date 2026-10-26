import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/categories/[id]/subcategories
 * Get all subcategories for a specific category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: categoryId } = await params;

    // Validate category exists
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("id", categoryId)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    // Get subcategories for this category
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from("subcategories")
      .select("*")
      .eq("category_id", categoryId)
      .order("display_order", { ascending: true });

    if (subcategoriesError) throw subcategoriesError;

    return NextResponse.json({
      category,
      subcategories: subcategories || [],
    });
  } catch (error) {
    console.error("Subcategories fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subcategories" },
      { status: 500 },
    );
  }
}
