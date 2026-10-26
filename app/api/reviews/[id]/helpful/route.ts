import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/reviews/[id]/helpful - Mark review as helpful
 * Requirements: 25.9
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already voted on this review
    const { data: existingVote } = await supabase
      .from("review_votes")
      .select("id")
      .eq("review_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted on this review" },
        { status: 409 },
      );
    }

    // Record the vote
    const { error: voteError } = await supabase
      .from("review_votes")
      .insert({
        review_id: id,
        user_id: user.id,
      });

    if (voteError) {
      return NextResponse.json({ error: voteError.message }, { status: 500 });
    }

    // Increment helpfulness_votes
    const { data: currentReview } = await supabase
      .from("reviews")
      .select("helpfulness_votes")
      .eq("id", id)
      .single();

    const newVoteCount = (currentReview?.helpfulness_votes || 0) + 1;

    const { data: review, error: updateError } = await supabase
      .from("reviews")
      .update({
        helpfulness_votes: newVoteCount,
      })
      .eq("id", id)
      .select("helpfulness_votes")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: review });
  } catch (error) {
    console.error("Error marking review as helpful:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
