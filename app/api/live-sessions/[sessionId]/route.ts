/**
 * Live Session Detail API Routes
 *
 * GET /api/live-sessions/:id - Get session details
 * PATCH /api/live-sessions/:id - Update session
 * DELETE /api/live-sessions/:id - Delete session
 *
 * Requirements: 2.2
 * Task: 20.2
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * GET /api/live-sessions/:id
 * Get session details and viewer count
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const supabase = await createClient();

    const { data: session, error } = await supabase
      .from("live_sessions")
      .select(
        `
        *,
        seller:profiles!user_id(username, avatar_url, trust_score)
      `,
      )
      .eq("id", sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error in GET /api/live-sessions/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/live-sessions/:id
 * Update session details
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    // Verify session ownership
    const { data: session } = await supabase
      .from("live_sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single();

    if (!session || session.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { title, description, thumbnail_url } = body;

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from("live_sessions")
      .update({
        title: title?.trim(),
        description: description?.trim(),
        thumbnail_url: thumbnail_url?.trim(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating session:", updateError);
      return NextResponse.json(
        { error: "Failed to update session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("Error in PATCH /api/live-sessions/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/live-sessions/:id
 * Delete session (only if not started)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    // Verify session ownership and status
    const { data: session } = await supabase
      .from("live_sessions")
      .select("user_id, stream_status")
      .eq("id", sessionId)
      .single();

    if (!session || session.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (session.stream_status !== "scheduled") {
      return NextResponse.json(
        { error: "Cannot delete a session that has started" },
        { status: 400 },
      );
    }

    // Delete session
    const { error: deleteError } = await supabase
      .from("live_sessions")
      .delete()
      .eq("id", sessionId);

    if (deleteError) {
      console.error("Error deleting session:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/live-sessions/:id:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
