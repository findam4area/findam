"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Play, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GalleryMedia {
  id: string;
  url: string;
  type: "image" | "video";
  duration?: number;
  thumbnail?: string;
}

interface ImageGalleryProps {
  media: GalleryMedia[];
  className?: string;
}

export function ImageGallery({ media, className = "" }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const selectedMedia = media[selectedIndex];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const nextImage = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % media.length);
  }, [media.length]);

  const prevImage = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + media.length) % media.length);
  }, [media.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, nextImage, prevImage]);

  if (media.length === 0) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-400">No media available</p>
      </div>
    );
  }

  return (
    <>
      <div className={className}>
        {/* Main Image/Video Display */}
        <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 mb-4 group">
          {selectedMedia.type === "video" ? (
            <video
              src={selectedMedia.url}
              controls
              className="w-full h-full object-contain"
              poster={selectedMedia.thumbnail}
            />
          ) : (
            <Image
              src={selectedMedia.url}
              alt={`Gallery image ${selectedIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              className="object-contain"
              priority={selectedIndex === 0}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg=="
            />
          )}

          {/* Expand Button */}
          <button
            onClick={() => openLightbox(selectedIndex)}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Open lightbox"
          >
            <Maximize2 className="w-5 h-5" />
          </button>

          {/* Navigation Arrows (if multiple media) */}
          {media.length > 1 && (
            <>
              <button
                onClick={() => setSelectedIndex((prev) => (prev - 1 + media.length) % media.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setSelectedIndex((prev) => (prev + 1) % media.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Media Counter */}
          {media.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
              {selectedIndex + 1} / {media.length}
            </div>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {media.length > 1 && (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {media.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                  index === selectedIndex
                    ? "ring-2 ring-naija-green ring-offset-2 dark:ring-offset-gray-900"
                    : "opacity-60 hover:opacity-100"
                }`}
                aria-label={`View ${item.type} ${index + 1}`}
              >
                {item.type === "video" ? (
                  <div className="relative w-full h-full bg-gray-200 dark:bg-gray-800">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={`Video thumbnail ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 15vw, 10vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <Image
                    src={item.url}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 15vw, 10vw"
                    className="object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-10"
              aria-label="Close lightbox"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation Arrows */}
            {media.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2 z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-10 h-10" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2 z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-10 h-10" />
                </button>
              </>
            )}

            {/* Media Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-lg font-medium z-10">
              {lightboxIndex + 1} / {media.length}
            </div>

            {/* Main Media Display */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {media[lightboxIndex].type === "video" ? (
                <video
                  src={media[lightboxIndex].url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded-lg"
                  poster={media[lightboxIndex].thumbnail}
                />
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={media[lightboxIndex].url}
                    alt={`Lightbox image ${lightboxIndex + 1}`}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg=="
                  />
                </div>
              )}
            </motion.div>

            {/* Thumbnail Strip */}
            {media.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-4xl w-full px-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  {media.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(index);
                      }}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                        index === lightboxIndex
                          ? "ring-2 ring-white ring-offset-2 ring-offset-black"
                          : "opacity-50 hover:opacity-100"
                      }`}
                    >
                      {item.type === "video" ? (
                        <div className="relative w-full h-full bg-gray-800">
                          {item.thumbnail ? (
                            <Image
                              src={item.thumbnail}
                              alt={`Video thumbnail ${index + 1}`}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <Image
                          src={item.url}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
