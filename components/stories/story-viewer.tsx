"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { Story } from "@/lib/types";
import Image from "next/image";

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onStoryView?: (storyId: string) => void;
}

export function StoryViewer({
  stories,
  initialIndex = 0,
  onClose,
  onNext,
  onPrevious,
  onStoryView,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentIndex];
  const STORY_DURATION = 30000; // 30 seconds max

  // Track story view
  useEffect(() => {
    if (currentStory && onStoryView) {
      onStoryView(currentStory.id);
    }
  }, [currentStory, onStoryView]);

  // Handle progress bar
  useEffect(() => {
    if (isPaused) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    setProgress(0);
    const startTime = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        handleNext();
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentIndex, isPaused]);

  // Handle video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPaused) {
      video.pause();
    } else {
      video.play().catch((err) => console.error("Error playing video:", err));
    }
  }, [isPaused, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else if (onNext) {
      onNext();
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onNext, onClose]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    } else if (onPrevious) {
      onPrevious();
    }
  }, [currentIndex, onPrevious]);

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;

      if (x < width / 3) {
        handlePrevious();
      } else if (x > (width * 2) / 3) {
        handleNext();
      } else {
        setIsPaused((prev) => !prev);
      }
    },
    [handleNext, handlePrevious],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrevious, onClose]);

  if (!currentStory) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-white"
                initial={{ width: "0%" }}
                animate={{
                  width:
                    index < currentIndex
                      ? "100%"
                      : index === currentIndex
                        ? `${progress}%`
                        : "0%",
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-3">
            {currentStory.user?.avatar_url && (
              <Image
                src={currentStory.user.avatar_url}
                alt={currentStory.user.username || "User"}
                width={40}
                height={40}
                className="rounded-full border-2 border-white"
              />
            )}
            <div>
              <p className="text-white font-semibold">
                {currentStory.user?.username || "Unknown"}
              </p>
              <p className="text-white/70 text-sm">
                {new Date(currentStory.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            aria-label="Close story viewer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Video content */}
        <div
          onClick={handleTap}
          className="relative w-full h-full flex items-center justify-center cursor-pointer"
        >
          <video
            ref={videoRef}
            src={currentStory.video_url}
            className="max-w-full max-h-full object-contain"
            playsInline
            loop={false}
            onEnded={handleNext}
          />

          {/* Pause indicator */}
          {isPaused && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-black/50 rounded-full p-4">
                <Pause size={48} className="text-white" />
              </div>
            </motion.div>
          )}

          {/* Navigation hints */}
          <div className="absolute inset-y-0 left-0 w-1/3 flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity">
            {(currentIndex > 0 || onPrevious) && (
              <div className="bg-black/30 rounded-full p-2">
                <ChevronLeft size={32} className="text-white" />
              </div>
            )}
          </div>
          <div className="absolute inset-y-0 right-0 w-1/3 flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity">
            {(currentIndex < stories.length - 1 || onNext) && (
              <div className="bg-black/30 rounded-full p-2">
                <ChevronRight size={32} className="text-white" />
              </div>
            )}
          </div>
        </div>

        {/* View count */}
        <div className="absolute bottom-4 left-4 text-white/70 text-sm">
          {currentStory.views_count} views
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
