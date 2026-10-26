/**
 * Product Q&A Answer API Route
 * POST /api/product-qa/[id]/answer - Post an answer to a question
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

    const body = await request.json();
    const { answer } = body;

    if (!answer) {
      return NextResponse.json(
        { error: "answer is required" },
        { status: 400 },
      );
    }

    const { id: questionId } = await params;

    await ProductQAService.postAnswer({
      questionId,
      userId: user.id,
      answer,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error posting answer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to post answer" },
      { status: 500 },
    );
  }
}
