import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKETS, FILE_SIZE_LIMITS } from "@/lib/supabase/helpers";

/**
 * POST /api/stories/upload - Upload story video
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

    const formData = await request.formData();
    const videoFile = formData.get("video") as File;
    const thumbnailFile = formData.get("thumbnail") as File | null;

    if (!videoFile) {
      return NextResponse.json(
        { error: "Video file is required" },
        { status: 400 },
      );
    }

    // Validate file size
    if (videoFile.size > FILE_SIZE_LIMITS.STORY_VIDEO) {
      return NextResponse.json(
        {
          error: `Video size must not exceed ${FILE_SIZE_LIMITS.STORY_VIDEO / (1024 * 1024)}MB`,
        },
        { status: 400 },
      );
    }

    // Generate unique filename
    const fileExt = videoFile.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload video to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.STORY_VIDEOS)
      .upload(filePath, videoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading video:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload video" },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl: videoUrl },
    } = supabase.storage
      .from(STORAGE_BUCKETS.STORY_VIDEOS)
      .getPublicUrl(filePath);

    let thumbnailUrl: string | null = null;

    // Upload thumbnail if provided
    if (thumbnailFile) {
      const thumbnailExt = thumbnailFile.name.split(".").pop();
      const thumbnailFileName = `${crypto.randomUUID()}.${thumbnailExt}`;
      const thumbnailPath = `${user.id}/${thumbnailFileName}`;

      const { error: thumbnailError } = await supabase.storage
        .from(STORAGE_BUCKETS.STORY_VIDEOS)
        .upload(thumbnailPath, thumbnailFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (thumbnailError) {
        console.error("Error uploading thumbnail:", thumbnailError);
      } else {
        const {
          data: { publicUrl },
        } = supabase.storage
          .from(STORAGE_BUCKETS.STORY_VIDEOS)
          .getPublicUrl(thumbnailPath);
        thumbnailUrl = publicUrl;
      }
    }

    return NextResponse.json({
      data: {
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/stories/upload:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
