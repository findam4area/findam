/**
 * End Live Session API Route
 *
 * POST /api/live-sessions/:id/end - End a live session
 *
 * Requirements: 2.1, 2.8
 * Task: 19.1, 19.8
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { liveStreamService } from "@/lib/services/live-stream";

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * POST /api/live-sessions/:id/end
 * End a live streaming session
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse optional recording URL from request body
    const body = await request.json().catch(() => ({}));
    const { recording_url } = body;

    // End session using service
    const session = await liveStreamService.endSession(
      sessionId,
      user.id,
      recording_url,
    );

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to end session",
      },
      { status: 500 },
    );
  }
}
