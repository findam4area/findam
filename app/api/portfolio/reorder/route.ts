import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// Validation schema for reordering
const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      display_order: z.number().int().min(0),
    }),
  ),
});

/**
 * POST /api/portfolio/reorder
 * Reorder portfolio items
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = reorderSchema.parse(body);

    // Verify all items belong to the user
    const { data: items } = await supabase
      .from("portfolio_items")
      .select("id, user_id")
      .in(
        "id",
        validated.items.map((item) => item.id),
      );

    if (!items || items.some((item) => item.user_id !== user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update each item's display order
    const updates = validated.items.map((item) =>
      supabase
        .from("portfolio_items")
        .update({ display_order: item.display_order })
        .eq("id", item.id),
    );

    const results = await Promise.all(updates);

    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors[0].error?.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error reordering portfolio items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
