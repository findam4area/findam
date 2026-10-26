"use client";

/**
 * Optimized Video Component
 * Handles video playback with low-data mode support
 * Requirements: 18.3
 */

import { useState, useEffect, useRef } from "react";
import { Play } from "lucide-react";
import {
  getVideoThumbnailUrl,
  shouldAutoPlayVideo,
} from "@/lib/utils/image-compression";
import { pwaService } from "@/lib/services/pwa";

interface OptimizedVideoProps {
  src: string;
  poster?: string;
  width?: number;
  height?: number;
  className?: string;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export function OptimizedVideo({
  src,
  poster,
  width,
  height,
  className = "",
  controls = true,
  loop = false,
  muted = true,
  onPlay,
  onPause,
  onEnded,
}: OptimizedVideoProps) {
  const [isLowDataMode, setIsLowDataMode] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const lowDataMode = pwaService.isLowDataModeEnabled();
    setIsLowDataMode(lowDataMode);

    // Auto-play only if not in low-data mode
    if (!lowDataMode && shouldAutoPlayVideo()) {
      setShowVideo(true);
    }
  }, []);

  const handlePlayClick = () => {
    setShowVideo(true);
    setIsPlaying(true);

    // Wait for video to load then play
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play();
      }
    }, 100);
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
    onPause?.();
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };

  // Get thumbnail URL
  const thumbnailUrl = poster || getVideoThumbnailUrl(src, { width, height });

  // In low-data mode, show thumbnail with play button
  if (isLowDataMode && !showVideo) {
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        <img
          src={thumbnailUrl}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
          width={width}
          height={height}
        />
        <button
          onClick={handlePlayClick}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          aria-label="Play video"
        >
          <div className="bg-white rounded-full p-4 shadow-lg">
            <Play className="h-8 w-8 text-gray-900" fill="currentColor" />
          </div>
        </button>
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          Low-data mode
        </div>
      </div>
    );
  }

  // Show video player
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <video
        ref={videoRef}
        src={src}
        poster={thumbnailUrl}
        width={width}
        height={height}
        controls={controls}
        loop={loop}
        muted={muted}
        autoPlay={!isLowDataMode && shouldAutoPlayVideo()}
        playsInline
        className="w-full h-full object-cover"
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        onEnded={handleVideoEnded}
      >
        Your browser does not support the video tag.
      </video>
      {isLowDataMode && (
        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
          Low quality
        </div>
      )}
    </div>
  );
}
