/**
 * Meetup Reschedule API
 * POST /api/meetups/[id]/reschedule - Reschedule a meetup
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
    const body = await request.json();
    const { scheduled_time } = body;

    if (!scheduled_time) {
      return NextResponse.json(
        { error: "Missing scheduled_time" },
        { status: 400 },
      );
    }

    // Reschedule the meetup
    const meetup = await MeetupService.rescheduleMeetup(
      meetupId,
      user.id,
      new Date(scheduled_time),
    );

    return NextResponse.json({ meetup });
  } catch (error) {
    console.error("Error rescheduling meetup:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to reschedule meetup",
      },
      { status: 500 },
    );
  }
}
