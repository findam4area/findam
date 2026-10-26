/**
 * Live Sessions API Routes
 *
 * POST /api/live-sessions - Create a new live session
 * GET /api/live-sessions - Get active live sessions
 *
 * Requirements: 2.1
 * Task: 20.1
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moderateSessionContent } from "@/lib/services/live-moderation";

/**
 * POST /api/live-sessions
 * Create a new live session
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is verified (using any type for non-existent fields)
    const { data: profile } = await (supabase.from as any)("profiles")
      .select("nin_verified, video_verified")
      .eq("id", user.id)
      .single();

    if (!profile?.nin_verified && !profile?.video_verified) {
      return NextResponse.json(
        { error: "Verification required to start live sessions" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, description, thumbnail_url, scheduled_start_at } = body;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: "Title must be 100 characters or less" },
        { status: 400 },
      );
    }

    // Moderate session content (Requirement 2.10)
    const moderationResult = await moderateSessionContent(
      title,
      description || "",
    );

    if (!moderationResult.approved) {
      return NextResponse.json(
        {
          error: "Session content violates guidelines",
          reason: moderationResult.reason,
        },
        { status: 400 },
      );
    }

    // Create session
    const { data: session, error: createError } = await supabase
      .from("live_sessions")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        thumbnail_url: thumbnail_url?.trim() || null,
        scheduled_start_at: scheduled_start_at || null,
        stream_status: "scheduled",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating session:", createError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/live-sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/live-sessions
 * Get active live sessions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "live";
    const limit = parseInt(searchParams.get("limit") || "20");

    // Fetch sessions
    let query = supabase
      .from("live_sessions")
      .select(
        `
        *,
        seller:profiles!user_id(username, avatar_url, trust_score)
      `,
      )
      .order("started_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("stream_status", status);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error("Error fetching sessions:", error);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 },
      );
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error("Error in GET /api/live-sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
