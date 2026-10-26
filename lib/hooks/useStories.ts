import { useState, useEffect, useCallback } from "react";
import type { Story } from "@/lib/types";

interface UserStories {
  userId: string;
  user: {
    id: string;
    username: string;
    avatar_url?: string;
    is_premium: boolean;
  };
  stories: Story[];
}

export function useStories() {
  const [stories, setStories] = useState<UserStories[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/stories");
      if (!response.ok) {
        throw new Error("Failed to fetch stories");
      }

      const { data } = await response.json();
      setStories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const createStory = useCallback(
    async (videoFile: File, thumbnailFile?: File) => {
      try {
        // Upload video and thumbnail
        const formData = new FormData();
        formData.append("video", videoFile);
        if (thumbnailFile) {
          formData.append("thumbnail", thumbnailFile);
        }

        const uploadResponse = await fetch("/api/stories/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || "Failed to upload video");
        }

        const { data: uploadData } = await uploadResponse.json();

        // Create story record
        const createResponse = await fetch("/api/stories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            video_url: uploadData.video_url,
            thumbnail_url: uploadData.thumbnail_url,
          }),
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          throw new Error(error.error || "Failed to create story");
        }

        const { data: newStory } = await createResponse.json();

        // Refresh stories list
        await fetchStories();

        return newStory;
      } catch (err) {
        throw err instanceof Error ? err : new Error("Failed to create story");
      }
    },
    [fetchStories],
  );

  const incrementViews = useCallback(async (storyId: string) => {
    try {
      const response = await fetch(`/api/stories/${storyId}/view`, {
        method: "POST",
      });

      if (!response.ok) {
        console.error("Failed to increment story views");
      }
    } catch (err) {
      console.error("Error incrementing story views:", err);
    }
  }, []);

  return {
    stories,
    isLoading,
    error,
    fetchStories,
    createStory,
    incrementViews,
  };
}
