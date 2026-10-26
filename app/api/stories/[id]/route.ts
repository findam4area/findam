import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/stories/[id] - Get a single story
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: story, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        user:users(id, username, avatar_url, is_premium)
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching story:", error);
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Check if story is expired
    if (new Date(story.expires_at) < new Date()) {
      return NextResponse.json({ error: "Story has expired" }, { status: 410 });
    }

    return NextResponse.json({ data: story });
  } catch (error) {
    console.error("Error in GET /api/stories/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
