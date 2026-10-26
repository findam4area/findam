import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStoryExpirationDate } from "@/lib/supabase/helpers";

/**
 * GET /api/stories - Get active stories
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user (optional - stories are public)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get active stories with user information
    const { data: stories, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        user:users(id, username, avatar_url, is_premium)
      `,
      )
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stories:", error);
      return NextResponse.json(
        { error: "Failed to fetch stories" },
        { status: 500 },
      );
    }

    // Group stories by user and prioritize premium users
    const storiesByUser = stories.reduce(
      (acc, story) => {
        const userId = story.user_id;
        if (userId && !acc[userId]) {
          acc[userId] = [];
        }
        if (userId) {
          acc[userId].push(story);
        }
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Sort users: premium first, then by most recent story
    const sortedUserStories = Object.entries(storiesByUser)
      .sort(([, storiesA], [, storiesB]) => {
        const isPremiumA = storiesA[0]?.user?.is_premium || false;
        const isPremiumB = storiesB[0]?.user?.is_premium || false;

        if (isPremiumA && !isPremiumB) return -1;
        if (!isPremiumA && isPremiumB) return 1;

        // If both premium or both not premium, sort by most recent
        return (
          new Date(storiesB[0].created_at).getTime() -
          new Date(storiesA[0].created_at).getTime()
        );
      })
      .map(([userId, userStories]) => ({
        userId,
        user: userStories[0].user,
        stories: userStories,
      }));

    return NextResponse.json({ data: sortedUserStories });
  } catch (error) {
    console.error("Error in GET /api/stories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/stories - Create a new story
 * Note: Video upload is handled client-side, this endpoint receives the video URL
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { video_url, thumbnail_url } = body;

    if (!video_url) {
      return NextResponse.json(
        { error: "Video URL is required" },
        { status: 400 },
      );
    }

    // Create story record
    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        user_id: user.id,
        video_url,
        thumbnail_url,
        expires_at: getStoryExpirationDate().toISOString(),
      })
      .select(
        `
        *,
        user:users(id, username, avatar_url, is_premium)
      `,
      )
      .single();

    if (error) {
      console.error("Error creating story:", error);
      return NextResponse.json(
        { error: "Failed to create story" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: story }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/stories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
