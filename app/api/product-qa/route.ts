/**
 * Product Q&A API Routes
 * GET /api/product-qa - Get questions for a listing
 * POST /api/product-qa - Post a new question
 */

import { NextRequest, NextResponse } from "next/server";
import { ProductQAService } from "@/lib/services/product-qa";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const listingId = searchParams.get("listing_id");

    if (!listingId) {
      return NextResponse.json(
        { error: "listing_id is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const questions = await ProductQAService.getQuestions(listingId, user?.id);

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch questions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { listing_id, question } = body;

    if (!listing_id || !question) {
      return NextResponse.json(
        { error: "listing_id and question are required" },
        { status: 400 },
      );
    }

    const newQuestion = await ProductQAService.postQuestion({
      listingId: listing_id,
      userId: user.id,
      question,
    });

    return NextResponse.json({ question: newQuestion }, { status: 201 });
  } catch (error: any) {
    console.error("Error posting question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to post question" },
      { status: 500 },
    );
  }
}
