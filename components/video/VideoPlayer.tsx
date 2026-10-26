/**
 * VideoPlayer Component
 * Requirements: 1.2, 1.7
 *
 * Implements video playback with:
 * - Auto-play and loop functionality
 * - Tap-to-toggle audio
 * - Loading states
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { VideoListing } from "@/lib/types/video";
import { Volume2, VolumeX, Loader2 } from "lucide-react";

interface VideoPlayerProps {
  video: VideoListing;
  isActive: boolean;
  isMuted: boolean;
  onAudioToggle: () => void;
  onVideoView?: (videoId: string, duration: number) => void;
}

export function VideoPlayer({
  video,
  isActive,
  isMuted,
  onAudioToggle,
  onVideoView,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const viewStartTimeRef = useRef<number>(0);
  const viewDurationRef = useRef<number>(0);

  // Handle video playback based on active state (Requirement 1.2)
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      // Start tracking view time
      viewStartTimeRef.current = Date.now();

      videoElement.play().catch((err) => {
        console.error("Error playing video:", err);
        setHasError(true);
      });
    } else {
      // Pause and track view duration (Requirement 1.8)
      videoElement.pause();

      if (viewStartTimeRef.current > 0) {
        const duration = (Date.now() - viewStartTimeRef.current) / 1000;
        viewDurationRef.current += duration;

        // Report view if watched for at least 1 second
        if (viewDurationRef.current >= 1 && onVideoView) {
          onVideoView(video.id, viewDurationRef.current);
          viewDurationRef.current = 0;
        }
      }

      viewStartTimeRef.current = 0;
    }
  }, [isActive, video.id, onVideoView]);

  // Handle mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Handle loading state
  const handleLoadedData = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handlePlaying = () => {
    setIsLoading(false);
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      onClick={onAudioToggle}
    >
      {/* Video element with loop (Requirement 1.7) */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnailUrl}
        className="w-full h-full object-contain"
        playsInline
        loop
        muted={isMuted}
        preload="metadata"
        onLoadedData={handleLoadedData}
        onError={handleError}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        aria-label={`Video for ${video.product.title}`}
      />

      {/* Loading indicator */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center text-white px-4">
            <p className="text-lg font-medium">Failed to load video</p>
            <p className="text-sm text-gray-300 mt-2">Please try again later</p>
          </div>
        </div>
      )}

      {/* Audio indicator (Requirement 1.3) */}
      {!isLoading && !hasError && (
        <div className="absolute bottom-20 right-4 p-3 bg-black/50 rounded-full backdrop-blur-sm">
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-white" aria-label="Unmute" />
          ) : (
            <Volume2 className="w-6 h-6 text-white" aria-label="Mute" />
          )}
        </div>
      )}
    </div>
  );
}
