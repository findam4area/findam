/**
 * Meetups API
 * POST /api/meetups - Schedule a new meetup
 * Requirements: 21.3
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MeetupService } from "@/lib/services/meetup";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      transaction_id,
      buyer_id,
      seller_id,
      location_name,
      location_address,
      location_latitude,
      location_longitude,
      scheduled_time,
    } = body;

    // Validate required fields
    if (
      !transaction_id ||
      !buyer_id ||
      !seller_id ||
      !location_name ||
      !location_address ||
      !location_latitude ||
      !location_longitude ||
      !scheduled_time
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify user is part of the transaction
    if (user.id !== buyer_id && user.id !== seller_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Schedule the meetup
    const meetup = await MeetupService.scheduleMeetup({
      transaction_id,
      buyer_id,
      seller_id,
      location_name,
      location_address,
      location_latitude,
      location_longitude,
      scheduled_time: new Date(scheduled_time),
    });

    return NextResponse.json({ meetup });
  } catch (error) {
    console.error("Error scheduling meetup:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to schedule meetup",
      },
      { status: 500 },
    );
  }
}
