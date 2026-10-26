import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types/category";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Query single category by ID
    const { data: category, error: categoryError } = await supabase
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
      .eq("id", id)
      .single();

    if (categoryError) {
      if (categoryError.code === "PGRST116") {
        // No rows returned
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 },
        );
      }
      throw categoryError;
    }

    // Get all subcategories for this category
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
      .eq("parent_id", id)
      .eq("is_hidden", false)
      .order("display_order", { ascending: true });

    if (subcategoriesError) throw subcategoriesError;

    // Calculate business_count for the category and all its subcategories
    const categoryIds = [id, ...(subcategories || []).map((sub) => sub.id)];

    const { data: businessCounts, error: countsError } = await supabase
      .from("business_category_tags")
      .select("category_id")
      .in("category_id", categoryIds);

    if (countsError) throw countsError;

    // Count businesses per category
    const countMap = new Map<string, number>();
    businessCounts?.forEach((tag) => {
      const count = countMap.get(tag.category_id) || 0;
      countMap.set(tag.category_id, count + 1);
    });

    // Build subcategories with business counts
    const subcategoriesWithCounts: Category[] = (subcategories || []).map(
      (sub) => ({
        ...(sub as any),
        business_count: countMap.get(sub.id) || 0,
      }),
    );

    const result: Category = {
      ...(category as any),
      subcategories: subcategoriesWithCounts,
      business_count: countMap.get(id) || 0,
    };

    return NextResponse.json({
      category: result,
      subcategories: subcategoriesWithCounts,
      business_count: countMap.get(id) || 0,
    });
  } catch (error) {
    console.error("Category fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 },
    );
  }
}
