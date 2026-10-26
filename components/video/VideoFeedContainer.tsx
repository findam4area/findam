/**
 * VideoFeedContainer Component
 * Requirements: 1.2, 1.3
 *
 * Implements TikTok-style vertical video feed with:
 * - Auto-play on scroll into view using Intersection Observer
 * - Audio mute/unmute on tap
 * - Vertical scroll detection
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { VideoListing } from "@/lib/types/video";
import { VideoPlayer } from "./VideoPlayer";
import { VideoOverlay } from "./VideoOverlay";
import { videoPreloadQueue } from "@/lib/video/preloadQueue";

interface VideoFeedContainerProps {
  videos: VideoListing[];
  onVideoView?: (videoId: string, duration: number) => void;
  onLoadMore?: () => void;
}

export function VideoFeedContainer({
  videos,
  onVideoView,
  onLoadMore,
}: VideoFeedContainerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [mutedStates, setMutedStates] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Initialize all videos as muted by default (Requirement 1.2)
  useEffect(() => {
    const initialMutedStates: Record<string, boolean> = {};
    videos.forEach((video) => {
      initialMutedStates[video.id] = true;
    });
    setMutedStates(initialMutedStates);
  }, [videos]);

  // Handle audio toggle on tap (Requirement 1.3)
  const handleAudioToggle = useCallback((videoId: string) => {
    setMutedStates((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  }, []);

  // Set up Intersection Observer for auto-play detection
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = entry.target.getAttribute("data-video-id");
          if (!videoId) return;

          const videoIndex = videos.findIndex((v) => v.id === videoId);

          // Auto-play when video is >50% visible (Requirement 1.2)
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setCurrentVideoIndex(videoIndex);
          }
        });
      },
      {
        root: null,
        threshold: [0.5, 0.75, 1.0],
      },
    );

    // Observe all video elements
    videoRefs.current.forEach((element) => {
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [videos]);

  // Load more videos when approaching the end
  useEffect(() => {
    if (currentVideoIndex >= videos.length - 2 && onLoadMore) {
      onLoadMore();
    }
  }, [currentVideoIndex, videos.length, onLoadMore]);

  // Preload next 2 videos when current video changes (Requirement 1.6)
  useEffect(() => {
    if (videos.length > 0) {
      videoPreloadQueue.preloadVideos(videos, currentVideoIndex);
    }
  }, [currentVideoIndex, videos]);

  // Cleanup preload queue on unmount
  useEffect(() => {
    return () => {
      videoPreloadQueue.destroy();
    };
  }, []);

  // Set video ref for intersection observer
  const setVideoRef = useCallback(
    (videoId: string, element: HTMLDivElement | null) => {
      if (element) {
        videoRefs.current.set(videoId, element);
      } else {
        videoRefs.current.delete(videoId);
      }
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      style={{ scrollSnapType: "y mandatory" }}
    >
      {videos.map((video, index) => (
        <div
          key={video.id}
          ref={(el) => setVideoRef(video.id, el)}
          data-video-id={video.id}
          className="relative h-screen w-full snap-start snap-always flex items-center justify-center bg-black"
        >
          <VideoPlayer
            video={video}
            isActive={index === currentVideoIndex}
            isMuted={mutedStates[video.id] ?? true}
            onAudioToggle={() => handleAudioToggle(video.id)}
            onVideoView={onVideoView}
          />
          <VideoOverlay video={video} />
        </div>
      ))}
    </div>
  );
}
