import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("listings")
      .select(
        `
      *,
      user:users(*),
      category:categories(*),
      subcategory:subcategories(*),
      media:listing_media(*)
    `,
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Listing not found" },
          { status: 404 },
        );
      }
      throw error;
    }

    // Increment view count
    await supabase
      .from("listings")
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq("id", id);

    return NextResponse.json(data as unknown as Listing);
  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 },
    );
  }
}
