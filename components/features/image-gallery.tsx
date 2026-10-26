"use client";

/**
 * ImageGallery Client Component with fullscreen viewer
 * 
 * Displays listing images with:
 * - Main image prominently displayed (primary image by default)
 * - Thumbnail strip showing all 3-5 images
 * - Highlighted current image thumbnail with ring border
 * - "Primary" badge on primary image thumbnail
 * - Smooth image switching on thumbnail click
 * - Fullscreen modal viewer on main image click
 * - Navigation arrows (Previous/Next) in fullscreen mode
 * - Keyboard navigation: Arrow keys for prev/next, Escape to close
 * - Touch gestures on mobile: swipe for prev/next
 * - Next.js 16 Image component with proper sizes and fill
 * - Blur placeholder for better UX during loading
 * - Mobile-first responsive layout
 * 
 * Requirements: 13.11, 17.2, 17.3, 17.4, 17.5, 17.8, 17.11
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageGalleryImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

interface ImageGalleryProps {
  images: ImageGalleryImage[];
  primaryIndex?: number;
  alt: string;
  className?: string;
}

export function ImageGallery({
  images,
  primaryIndex = 0,
  alt,
  className = "",
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(primaryIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 50;

  // Navigate to previous image
  const goToPrevious = useCallback(() => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images]);

  // Navigate to next image
  const goToNext = useCallback(() => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images]);

  // Open fullscreen viewer
  const openFullscreen = () => {
    setIsFullscreen(true);
    // Prevent body scroll when fullscreen is open
    document.body.style.overflow = "hidden";
  };

  // Close fullscreen viewer
  const closeFullscreen = () => {
    setIsFullscreen(false);
    // Restore body scroll
    document.body.style.overflow = "";
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeFullscreen();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, goToPrevious, goToNext]);

  // Touch handlers for swipe gestures
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Handle empty images array - check AFTER all hooks
  if (!images || images.length === 0) {
    return (
      <div className={cn("bg-gray-800 rounded-lg flex items-center justify-center min-h-[400px]", className)}>
        <p className="text-gray-400">No images available</p>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <>
      {/* Main Gallery Container */}
      <div className={cn("w-full", className)}>
        {/* Main Image Display */}
        <div className="relative w-full aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden mb-4 group">
          <button
            onClick={openFullscreen}
            className="relative w-full h-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-950"
            aria-label={`View ${currentImage.alt} in fullscreen`}
          >
            <Image
              src={currentImage.url}
              alt={currentImage.alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
              className="object-contain"
              priority={currentIndex === primaryIndex}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA5AAAAAAAA/9k="
            />
          </button>

          {/* Navigation arrows (show only if more than 1 image) */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs sm:text-sm px-2 py-1 rounded-md">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-950",
                  index === currentIndex
                    ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-gray-950 scale-95"
                    : "opacity-60 hover:opacity-100 hover:scale-105"
                )}
                aria-label={`View image ${index + 1}`}
                aria-current={index === currentIndex ? "true" : "false"}
              >
                <Image
                  src={image.url}
                  alt={`${alt} thumbnail ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                  className="object-cover"
                />
                
                {/* Primary badge */}
                {index === primaryIndex && (
                  <div className="absolute top-1 left-1 bg-primary-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-semibold">
                    Primary
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal Viewer */}
      {isFullscreen && (
        <div
          ref={fullscreenRef}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeFullscreen}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Close fullscreen viewer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/70 text-white text-sm px-3 py-1.5 rounded-md">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Main fullscreen image */}
          <div
            className="relative w-full h-full max-w-7xl max-h-[90vh] mx-auto px-4 py-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentImage.url}
              alt={currentImage.alt}
              fill
              sizes="100vw"
              className="object-contain"
              priority
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA5AAAAAAAA/9k="
            />
          </div>

          {/* Thumbnail strip in fullscreen */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 max-w-2xl w-full px-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(index);
                    }}
                    className={cn(
                      "relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-primary-500",
                      index === currentIndex
                        ? "ring-2 ring-white ring-offset-2 ring-offset-black"
                        : "opacity-50 hover:opacity-100"
                    )}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image
                      src={image.url}
                      alt={`${alt} thumbnail ${index + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}