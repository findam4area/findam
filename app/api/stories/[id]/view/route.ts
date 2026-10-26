import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/stories/[id]/view - Increment story view count
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get the story to verify it exists and is not expired
    const { data: story, error: fetchError } = await supabase
      .from("stories")
      .select("id, expires_at, views_count")
      .eq("id", id)
      .single();

    if (fetchError || !story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Check if story is expired
    if (new Date(story.expires_at) < new Date()) {
      return NextResponse.json({ error: "Story has expired" }, { status: 410 });
    }

    // Increment view count - fetch current count and increment
    const currentViewCount = story.views_count || 0;
    const { error: updateError } = await supabase
      .from("stories")
      .update({ views_count: currentViewCount + 1 })
      .eq("id", id);

    if (updateError) {
      console.error("Error incrementing view count:", updateError);
      return NextResponse.json(
        { error: "Failed to update view count" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/stories/[id]/view:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
