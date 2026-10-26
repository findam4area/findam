/**
 * Meetup Check-In API
 * POST /api/meetups/[id]/check-in - Check in to a meetup
 * Requirements: 21.5, 21.10
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MeetupService } from "@/lib/services/meetup";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: meetupId } = await params;
    const body = await request.json();
    const { userType } = body;

    if (!userType || (userType !== "buyer" && userType !== "seller")) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
    }

    // Check in
    const result = await MeetupService.checkIn(meetupId, user.id, userType);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking in:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check in",
      },
      { status: 500 },
    );
  }
}
