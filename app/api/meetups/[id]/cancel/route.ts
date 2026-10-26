/**
 * Meetup Cancel API
 * POST /api/meetups/[id]/cancel - Cancel a meetup
 * Requirements: 21.7
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

    // Cancel the meetup
    await MeetupService.cancelMeetup(meetupId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling meetup:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to cancel meetup",
      },
      { status: 500 },
    );
  }
}
