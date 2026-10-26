"use client";

/**
 * Live Stream Player Component
 *
 * Displays live video stream with real-time viewer count.
 *
 * Requirements: 2.1, 2.2
 * Task: 19.2
 */

import { useEffect, useRef, useState } from "react";
import { Eye, Wifi, WifiOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface LiveStreamPlayerProps {
  sessionId: string;
  streamUrl: string;
  isHost?: boolean;
  onViewerCountChange?: (count: number) => void;
}

export function LiveStreamPlayer({
  sessionId,
  streamUrl,
  isHost = false,
  onViewerCountChange,
}: LiveStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Subscribe to real-time viewer count updates
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to live_sessions table changes
    const channel = supabase
      .channel(`live-session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newViewerCount = payload.new.viewer_count;
          setViewerCount(newViewerCount);
          onViewerCountChange?.(newViewerCount);

          // Check if stream has ended
          if (
            payload.new.stream_status === "ended" ||
            payload.new.stream_status === "terminated"
          ) {
            setIsLive(false);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    // Fetch initial viewer count
    const fetchViewerCount = async () => {
      const { data } = await supabase
        .from("live_sessions")
        .select("viewer_count, stream_status")
        .eq("id", sessionId)
        .single();

      if (data) {
        setViewerCount(data.viewer_count);
        setIsLive(data.stream_status === "live");
      }
    };

    fetchViewerCount();

    // Increment viewer count when joining (if not host)
    if (!isHost) {
      supabase
        .rpc("increment_viewer_count", {
          session_id_param: sessionId,
        })
        .then(({ error }) => {
          if (error) {
            console.error("Failed to increment viewer count:", error);
          }
        });
    }

    // Cleanup: Decrement viewer count when leaving
    return () => {
      if (!isHost) {
        supabase
          .rpc("decrement_viewer_count", {
            session_id_param: sessionId,
          })
          .then(({ error }) => {
            if (error) {
              console.error("Failed to decrement viewer count:", error);
            }
          });
      }

      channel.unsubscribe();
    };
  }, [sessionId, isHost, onViewerCountChange]);

  // Initialize video player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleError = () => {
      setIsLoading(false);
      setError("Failed to load video stream");
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleError);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    // Auto-play video
    video.play().catch((err) => {
      console.error("Auto-play failed:", err);
      setError("Click to play video");
    });

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
    };
  }, [streamUrl]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {/* Video Player */}
      <video
        ref={videoRef}
        src={streamUrl}
        className="w-full h-full object-contain"
        controls
        playsInline
        autoPlay
        muted={isHost} // Mute for host to prevent feedback
        aria-label="Live video stream"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white text-sm">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center px-4">
            <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="text-white text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Live Indicator and Viewer Count */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        {/* Live Badge */}
        {isLive && (
          <div className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
            <Wifi className="w-4 h-4" aria-hidden="true" />
            <span>LIVE</span>
          </div>
        )}

        {/* Viewer Count */}
        <div
          className="flex items-center gap-1.5 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium"
          role="status"
          aria-live="polite"
          aria-label={`${viewerCount} viewers watching`}
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
          <span>{viewerCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Stream Ended Overlay */}
      {!isLive && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center px-4">
            <WifiOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">
              Stream Ended
            </h3>
            <p className="text-gray-300 text-sm">
              This live session has ended. Check back later for replays.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
