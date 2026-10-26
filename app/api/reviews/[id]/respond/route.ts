import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { vendorResponseSchema } from "@/lib/validations/review";

/**
 * POST /api/reviews/[id]/respond - Vendor responds to a review
 * Requirements: 25.6, 25.8
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = vendorResponseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const input = validationResult.data;

    // Verify the review exists and the user is the vendor
    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("*, listing:listings(user_id)")
      .eq("id", id)
      .single();

    if (fetchError || !review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 },
      );
    }

    // Check if user is the vendor (either vendor_id or listing owner)
    const isVendor =
      review.vendor_id === user.id ||
      (review.listing as any)?.user_id === user.id;

    if (!isVendor) {
      return NextResponse.json(
        { error: "Only the vendor can respond to this review" },
        { status: 403 },
      );
    }

    // Update the review with vendor response
    const { data: updatedReview, error: updateError } = await supabase
      .from("reviews")
      .update({
        vendor_response: input.vendor_response,
        vendor_responded_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        *,
        reviewer:users!reviewer_id(id, username, avatar_url)
      `,
      )
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create notification for the reviewer
    await supabase.from("notifications").insert({
      user_id: review.reviewer_id,
      type: "vendor_response",
      title: "Vendor Responded",
      message: "The vendor has responded to your review",
      link: `/listing/${review.listing_id}`,
    });

    return NextResponse.json({ data: updatedReview });
  } catch (error) {
    console.error("Error adding vendor response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
