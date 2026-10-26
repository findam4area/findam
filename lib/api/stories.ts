// Stories API functions
import { createClient } from "@/lib/supabase/client";
import type { Story } from "@/lib/types";
import {
  getStoryExpirationDate,
  STORAGE_BUCKETS,
  FILE_SIZE_LIMITS,
} from "@/lib/supabase/helpers";

/**
 * Create a new story with video upload
 */
export async function createStory(videoFile: File): Promise<Story> {
  const supabase = createClient();

  // Validate video duration (max 30 seconds)
  const duration = await getVideoDuration(videoFile);
  if (duration > 30) {
    throw new Error("Video duration must not exceed 30 seconds");
  }

  // Validate file size
  if (videoFile.size > FILE_SIZE_LIMITS.STORY_VIDEO) {
    throw new Error(
      `Video size must not exceed ${FILE_SIZE_LIMITS.STORY_VIDEO / (1024 * 1024)}MB`,
    );
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Generate unique filename
  const fileExt = videoFile.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  // Upload video to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.STORY_VIDEOS)
    .upload(filePath, videoFile, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage
    .from(STORAGE_BUCKETS.STORY_VIDEOS)
    .getPublicUrl(filePath);

  // Generate thumbnail
  const thumbnailBlob = await generateVideoThumbnail(videoFile);
  const thumbnailFileName = `${crypto.randomUUID()}.jpg`;
  const thumbnailPath = `${user.id}/${thumbnailFileName}`;

  const { error: thumbnailError } = await supabase.storage
    .from(STORAGE_BUCKETS.STORY_VIDEOS)
    .upload(thumbnailPath, thumbnailBlob, {
      cacheControl: "3600",
      upsert: false,
    });

  if (thumbnailError)
    console.error("Failed to upload thumbnail:", thumbnailError);

  const {
    data: { publicUrl: thumbnailUrl },
  } = supabase.storage
    .from(STORAGE_BUCKETS.STORY_VIDEOS)
    .getPublicUrl(thumbnailPath);

  // Create story record
  const { data, error } = await supabase
    .from("stories")
    .insert({
      user_id: user.id,
      video_url: publicUrl,
      thumbnail_url: thumbnailUrl,
      expires_at: getStoryExpirationDate().toISOString(),
    })
    .select("*, user:users(*)")
    .single();

  if (error) throw error;

  return data as Story;
}

/**
 * Get active stories (not expired)
 */
export async function getActiveStories(): Promise<Story[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("stories")
    .select("*, user:users(*)")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as Story[];
}

/**
 * Get stories by user ID
 */
export async function getStoriesByUser(userId: string): Promise<Story[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("stories")
    .select("*, user:users(*)")
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as Story[];
}

/**
 * Get a single story by ID
 */
export async function getStoryById(storyId: string): Promise<Story> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("stories")
    .select("*, user:users(*)")
    .eq("id", storyId)
    .single();

  if (error) throw error;

  return data as Story;
}

/**
 * Increment story view count
 */
export async function incrementStoryViews(storyId: string): Promise<void> {
  const supabase = createClient();

  // Get current view count and increment it
  const { data: story, error: fetchError } = await supabase
    .from("stories")
    .select("views_count")
    .eq("id", storyId)
    .single();

  if (fetchError) throw fetchError;

  const { error: updateError } = await supabase
    .from("stories")
    .update({ views_count: (story.views_count || 0) + 1 })
    .eq("id", storyId);

  if (updateError) throw updateError;
}

/**
 * Delete expired stories (for cron job)
 */
export async function deleteExpiredStories(): Promise<number> {
  const supabase = createClient();

  // Get expired stories
  const { data: expiredStories, error: fetchError } = await supabase
    .from("stories")
    .select("id, video_url, thumbnail_url")
    .lt("expires_at", new Date().toISOString());

  if (fetchError) throw fetchError;

  if (!expiredStories || expiredStories.length === 0) {
    return 0;
  }

  // Delete video files from storage
  for (const story of expiredStories) {
    const videoPath = story.video_url.split("/").slice(-2).join("/");
    await supabase.storage
      .from(STORAGE_BUCKETS.STORY_VIDEOS)
      .remove([videoPath]);

    if (story.thumbnail_url) {
      const thumbnailPath = story.thumbnail_url.split("/").slice(-2).join("/");
      await supabase.storage
        .from(STORAGE_BUCKETS.STORY_VIDEOS)
        .remove([thumbnailPath]);
    }
  }

  // Delete story records
  const { error: deleteError } = await supabase
    .from("stories")
    .delete()
    .lt("expires_at", new Date().toISOString());

  if (deleteError) throw deleteError;

  return expiredStories.length;
}

/**
 * Helper function to get video duration
 */
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      reject(new Error("Failed to load video metadata"));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Helper function to generate video thumbnail
 */
function generateVideoThumbnail(videoFile: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(videoFile);
    video.currentTime = 1; // Capture at 1 second

    video.onloadeddata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(video.src);
          if (blob) resolve(blob);
          else reject(new Error("Failed to generate thumbnail"));
        },
        "image/jpeg",
        0.8,
      );
    };

    video.onerror = () => {
      reject(new Error("Failed to load video"));
    };
  });
}
