/**
 * Meetup Report API
 * POST /api/meetups/[id]/report - Report unsafe meetup experience
 * Requirements: 21.9
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
    const { reason, details } = body;

    if (!reason || !details) {
      return NextResponse.json(
        { error: "Missing reason or details" },
        { status: 400 },
      );
    }

    // Report unsafe meetup
    await MeetupService.reportUnsafeMeetup(meetupId, user.id, reason, details);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reporting meetup:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to report meetup",
      },
      { status: 500 },
    );
  }
}
