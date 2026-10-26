/**
 * Live Chat API Route
 *
 * POST /api/live-sessions/:id/chat - Send a chat message
 * GET /api/live-sessions/:id/chat - Get chat messages
 *
 * Requirements: 2.3, 2.10
 * Task: 20.3, 19.11
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  moderateChatMessage,
  isUserBannedFromChat,
} from "@/lib/services/live-moderation";

interface RouteContext {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * POST /api/live-sessions/:id/chat
 * Send a chat message (with AI moderation)
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

    // Parse request body
    const body = await request.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Message is too long (max 500 characters)" },
        { status: 400 },
      );
    }

    // Check if session is live
    const { data: session } = await supabase
      .from("live_sessions")
      .select("stream_status")
      .eq("id", sessionId)
      .single();

    if (!session || session.stream_status !== "live") {
      return NextResponse.json(
        { error: "Session is not live" },
        { status: 400 },
      );
    }

    // Check if user is banned from chat
    const isBanned = await isUserBannedFromChat(user.id, sessionId);
    if (isBanned) {
      return NextResponse.json(
        { error: "You are temporarily banned from chat" },
        { status: 403 },
      );
    }

    // Moderate message (Requirement 2.10)
    const moderationResult = await moderateChatMessage(
      message.trim(),
      sessionId,
      user.id,
    );

    if (!moderationResult.approved) {
      return NextResponse.json(
        {
          error: "Message violates guidelines",
          reason: moderationResult.reason,
        },
        { status: 400 },
      );
    }

    // Insert message
    const { data: chatMessage, error: insertError } = await supabase
      .from("live_chat_messages")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        message: message.trim(),
        is_flagged: moderationResult.action === "flag",
      })
      .select(
        `
        *,
        user:profiles(username, avatar_url)
      `,
      )
      .single();

    if (insertError) {
      console.error("Error inserting chat message:", insertError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: chatMessage }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/live-sessions/:id/chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/live-sessions/:id/chat
 * Get chat messages for a session
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const supabase = await createClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "100");
    const before = searchParams.get("before"); // Timestamp for pagination

    // Fetch messages
    let query = supabase
      .from("live_chat_messages")
      .select(
        `
        *,
        user:profiles(username, avatar_url)
      `,
      )
      .eq("session_id", sessionId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching chat messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 },
      );
    }

    // Reverse to get chronological order
    const chronologicalMessages = (messages || []).reverse();

    return NextResponse.json({ messages: chronologicalMessages });
  } catch (error) {
    console.error("Error in GET /api/live-sessions/:id/chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
