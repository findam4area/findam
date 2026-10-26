"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Video, X, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StoryCreatorProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function StoryCreator({ onClose, onSuccess }: StoryCreatorProps) {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file");
      return;
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      setError("Video size must not exceed 20MB");
      return;
    }

    // Get video duration
    const duration = await getVideoDuration(file);
    if (duration > 30) {
      setError("Video duration must not exceed 30 seconds");
      return;
    }

    setVideoDuration(duration);
    setSelectedVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const generateThumbnail = useCallback(
    async (videoFile: File): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = URL.createObjectURL(videoFile);
        video.currentTime = 1;

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
    },
    [],
  );

  const handlePublish = useCallback(async () => {
    if (!selectedVideo) return;

    setIsUploading(true);
    setError(null);

    try {
      // Generate thumbnail
      const thumbnailBlob = await generateThumbnail(selectedVideo);

      // Upload video and thumbnail
      const formData = new FormData();
      formData.append("video", selectedVideo);
      formData.append("thumbnail", thumbnailBlob, "thumbnail.jpg");

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

      // Success
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish story");
    } finally {
      setIsUploading(false);
    }
  }, [selectedVideo, generateThumbnail, onSuccess, onClose]);

  const handleRemoveVideo = useCallback(() => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setSelectedVideo(null);
    setVideoPreview(null);
    setVideoDuration(0);
    setError(null);
  }, [videoPreview]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-dark-card border border-dark-border rounded-2xl max-w-lg w-full p-6 relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Create Story</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Close story creator"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          {!selectedVideo ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-dark-border rounded-xl p-8 text-center cursor-pointer hover:border-neon-cyan transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="bg-neon-cyan/10 rounded-full p-4">
                  <Video size={48} className="text-neon-cyan" />
                </div>
                <div>
                  <p className="text-white font-semibold mb-2">
                    Upload a video
                  </p>
                  <p className="text-white/60 text-sm">
                    Max 30 seconds, up to 20MB
                  </p>
                  <p className="text-white/40 text-xs mt-2">
                    Drag and drop or click to browse
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                aria-label="Upload video file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Video preview */}
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  src={videoPreview || undefined}
                  className="w-full max-h-96 object-contain"
                  controls
                />
                <button
                  onClick={handleRemoveVideo}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                  aria-label="Remove video"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              {/* Video info */}
              <div className="flex items-center justify-between text-sm text-white/60">
                <span>Duration: {videoDuration.toFixed(1)}s</span>
                <span>
                  Size: {(selectedVideo.size / (1024 * 1024)).toFixed(2)}MB
                </span>
              </div>

              {/* Publish button */}
              <Button
                onClick={handlePublish}
                disabled={isUploading}
                className="w-full bg-gradient-to-r from-neon-cyan to-neon-pink hover:opacity-90 transition-opacity"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Publish Story
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
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
