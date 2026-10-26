/**
 * Product Q&A Upvote API Route
 * POST /api/product-qa/[id]/upvote - Toggle upvote on a question
 */

import { NextRequest, NextResponse } from "next/server";
import { ProductQAService } from "@/lib/services/product-qa";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: questionId } = await params;

    await ProductQAService.upvoteQuestion(questionId, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error upvoting question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upvote question" },
      { status: 500 },
    );
  }
}
