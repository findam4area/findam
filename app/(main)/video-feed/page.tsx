/**
 * Video Feed Page
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.8, 1.9
 *
 * TikTok-style vertical video feed for product listings
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { VideoFeedContainer } from "@/components/video";
import { VideoListing } from "@/lib/types/video";
import { Loader2 } from "lucide-react";

export default function VideoFeedPage() {
  const [videos, setVideos] = useState<VideoListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch video listings
  const fetchVideos = useCallback(async (pageNum: number) => {
    try {
      const response = await fetch(
        `/api/video-listings?page=${pageNum}&limit=10`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }

      const result = await response.json();

      if (result.success && result.data) {
        setVideos((prev) =>
          pageNum === 1 ? result.data : [...prev, ...result.data],
        );
        setHasMore(result.pagination?.hasMore ?? false);
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchVideos(1);
  }, [fetchVideos]);

  // Load more videos
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVideos(nextPage);
    }
  }, [hasMore, isLoading, page, fetchVideos]);

  // Track video views
  const handleVideoView = useCallback(
    async (videoId: string, duration: number) => {
      try {
        await fetch(`/api/video-listings/${videoId}/view`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ duration }),
        });
      } catch (err) {
        console.error("Error tracking video view:", err);
      }
    },
    [],
  );

  if (isLoading && videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white px-4">
          <p className="text-xl font-semibold mb-2">Failed to load videos</p>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              fetchVideos(1);
            }}
            className="mt-4 px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white px-4">
          <p className="text-xl font-semibold mb-2">No videos available</p>
          <p className="text-gray-400">Check back later for new content</p>
        </div>
      </div>
    );
  }

  return (
    <VideoFeedContainer
      videos={videos}
      onVideoView={handleVideoView}
      onLoadMore={handleLoadMore}
    />
  );
}
