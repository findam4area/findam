import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const revealSchema = z.object({
  listing_id: z.string().uuid(),
});

// In-memory rate limiting (in production, use Redis or database)
const revealHistory = new Map<
  string,
  { count: number; reset_at: number; listings: Set<string> }
>();

const MAX_REVEALS_PER_HOUR = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

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
    const validation = revealSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: "Invalid listing ID" },
        { status: 400 },
      );
    }

    const { listing_id } = validation.data;

    // Check rate limit
    const now = Date.now();
    const key = `phone_reveal_${user.id}`;
    const history = revealHistory.get(key);

    if (!history || now > history.reset_at) {
      revealHistory.set(key, {
        count: 1,
        reset_at: now + RATE_LIMIT_WINDOW,
        listings: new Set([listing_id]),
      });
    } else {
      if (history.count >= MAX_REVEALS_PER_HOUR) {
        return NextResponse.json(
          {
            message:
              "You've reached the maximum number of phone reveals for this hour. Please try again later.",
          },
          { status: 429 },
        );
      }

      // Don't count if already revealed this listing
      if (!history.listings.has(listing_id)) {
        history.count++;
        history.listings.add(listing_id);
      }
    }

    // Fetch listing to verify it exists
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, user_id")
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { message: "Listing not found" },
        { status: 404 },
      );
    }

    // Log the reveal action (for analytics and abuse prevention)
    // In production, store this in a database table
    console.log(
      `User ${user.id} revealed phone for listing ${listing_id} at ${new Date().toISOString()}`,
    );

    return NextResponse.json({
      success: true,
      message: "Phone number revealed",
    });
  } catch (error) {
    console.error("Error revealing phone:", error);
    return NextResponse.json(
      { message: "Failed to reveal phone number" },
      { status: 500 },
    );
  }
}
