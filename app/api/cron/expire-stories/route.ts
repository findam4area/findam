import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS } from "@/lib/supabase/helpers";

/**
 * GET /api/cron/expire-stories - Delete expired stories (cron job)
 * This endpoint should be called by a cron service (e.g., Vercel Cron)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get expired stories
    const { data: expiredStories, error: fetchError } = await supabase
      .from("stories")
      .select("id, video_url, thumbnail_url, user_id")
      .lt("expires_at", new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching expired stories:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch expired stories" },
        { status: 500 },
      );
    }

    if (!expiredStories || expiredStories.length === 0) {
      return NextResponse.json({
        message: "No expired stories to delete",
        deleted: 0,
      });
    }

    // Delete video files from storage
    const filesToDelete: string[] = [];

    for (const story of expiredStories) {
      // Extract file path from URL
      const videoPath = extractStoragePath(
        story.video_url,
        story.user_id ?? "",
      );
      if (videoPath) filesToDelete.push(videoPath);

      if (story.thumbnail_url) {
        const thumbnailPath = extractStoragePath(
          story.thumbnail_url,
          story.user_id ?? "",
        );
        if (thumbnailPath) filesToDelete.push(thumbnailPath);
      }
    }

    // Delete files in batch
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKETS.STORY_VIDEOS)
        .remove(filesToDelete);

      if (storageError) {
        console.error("Error deleting story files:", storageError);
      }
    }

    // Delete story records
    const { error: deleteError } = await supabase
      .from("stories")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (deleteError) {
      console.error("Error deleting story records:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete story records" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Expired stories deleted successfully",
      deleted: expiredStories.length,
    });
  } catch (error) {
    console.error("Error in GET /api/cron/expire-stories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Helper function to extract storage path from public URL
 */
function extractStoragePath(url: string, _userId: string): string | null {
  try {
    // URL format: https://.../storage/v1/object/public/story-videos/{userId}/{filename}
    const parts = url.split("/");
    const bucketIndex = parts.indexOf(STORAGE_BUCKETS.STORY_VIDEOS);
    if (bucketIndex === -1) return null;

    // Get path after bucket name
    const pathParts = parts.slice(bucketIndex + 1);
    return pathParts.join("/");
  } catch (error) {
    console.error("Error extracting storage path:", error);
    return null;
  }
}
