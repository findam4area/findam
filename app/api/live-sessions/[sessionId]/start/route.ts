/**
 * Start Live Session API Route
 *
 * POST /api/live-sessions/:id/start - Start a live session
 *
 * Requirements: 2.1, 2.7
 * Task: 19.1, 19.7
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
 * POST /api/live-sessions/:id/start
 * Start a live streaming session
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

    // Start session using service
    const result = await liveStreamService.startSession(sessionId, user.id);

    return NextResponse.json({
      session: result.session,
      credentials: result.credentials,
    });
  } catch (error) {
    console.error("Error starting session:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to start session",
      },
      { status: 500 },
    );
  }
}
