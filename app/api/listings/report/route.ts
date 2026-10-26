import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const reportSchema = z.object({
  listing_id: z.string().uuid(),
  reason: z.enum([
    "scam",
    "fake",
    "misleading",
    "inappropriate",
    "duplicate",
    "stolen",
    "prohibited",
    "other",
  ]),
  description: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = reportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid report data", errors: validation.error.errors },
        { status: 400 },
      );
    }

    const { listing_id, reason, description } = validation.data;

    // Check if listing exists
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, user_id, is_active")
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { message: "Listing not found" },
        { status: 404 },
      );
    }

    // Prevent users from reporting their own listings
    if (listing.user_id === user.id) {
      return NextResponse.json(
        { message: "You cannot report your own listing" },
        { status: 400 },
      );
    }

    // Check if user has already reported this listing
    const { data: existingReport, error: checkError } = await supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("listing_id", listing_id)
      .single();

    if (existingReport) {
      return NextResponse.json(
        { message: "You have already reported this listing" },
        { status: 400 },
      );
    }

    // Create report
    const { error: insertError } = await supabase.from("reports").insert({
      reporter_id: user.id,
      listing_id,
      reason,
      description: description || null,
      status: "pending",
    });

    if (insertError) {
      console.error("Error creating report:", insertError);
      return NextResponse.json(
        { message: "Failed to submit report" },
        { status: 500 },
      );
    }

    // Immediately hide listing from public view
    await supabase
      .from("listings")
      .update({ is_active: false })
      .eq("id", listing_id);

    // Create notification for listing owner
    await supabase.from("notifications").insert({
      user_id: listing.user_id,
      type: "listing_reported",
      title: "Listing Reported",
      message:
        "One of your listings has been reported and is under review. We'll notify you once the review is complete.",
      link: `/listing/${listing_id}`,
    });

    return NextResponse.json({
      success: true,
      message: "Report submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting report:", error);
    return NextResponse.json(
      { message: "Failed to submit report" },
      { status: 500 },
    );
  }
}

// Get reports for a listing (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role check
    // For now, allow any authenticated user to view reports

    const { searchParams } = new URL(request.url);
    const listing_id = searchParams.get("listing_id");

    let query = supabase
      .from("reports")
      .select(
        `
        *,
        reporter:users!reports_reporter_id_fkey(id, username, avatar_url),
        listing:listings(id, title, user_id)
      `,
      )
      .order("created_at", { ascending: false });

    if (listing_id) {
      query = query.eq("listing_id", listing_id);
    }

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      console.error("Error fetching reports:", reportsError);
      return NextResponse.json(
        { message: "Failed to fetch reports" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { message: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}
