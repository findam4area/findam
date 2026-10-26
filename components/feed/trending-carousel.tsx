"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { CldImage } from "next-cloudinary";
import type { Listing } from "@/lib/types";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TrendingCarouselProps {
  listings: Listing[];
  className?: string;
}

export function TrendingCarousel({
  listings,
  className,
}: TrendingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    if (listings.length === 0) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % listings.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [listings.length]);

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % listings.length);
  };

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + listings.length) % listings.length);
  };

  if (listings.length === 0) return null;

  const currentListing = listings[currentIndex];

  // Extract Cloudinary public ID from URL if it's a Cloudinary URL
  const getCloudinaryPublicId = (url?: string) => {
    if (!url) return null;
    if (url.includes("cloudinary.com")) {
      const parts = url.split("/upload/");
      if (parts.length > 1) {
        const pathParts = parts[1].split("/");
        return pathParts.slice(1).join("/").split(".")[0];
      }
    }
    return null;
  };

  const cloudinaryPublicId = getCloudinaryPublicId(
    currentListing.thumbnail_url,
  );

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-naija-green/20 via-transparent to-neon-cyan/20" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-2 px-6 py-4 border-b border-gray-800/50">
        <TrendingUp className="h-5 w-5 text-naija-green" />
        <h2 className="text-lg font-semibold text-white">Trending Now</h2>
      </div>

      {/* Carousel */}
      <div className="relative h-64 md:h-80">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            <div className="relative h-full w-full">
              {/* Image */}
              {cloudinaryPublicId ? (
                <CldImage
                  src={cloudinaryPublicId}
                  alt={currentListing.title}
                  width={800}
                  height={600}
                  crop="fill"
                  gravity="auto"
                  quality="auto"
                  format="auto"
                  className="w-full h-full object-cover"
                />
              ) : currentListing.thumbnail_url ? (
                <Image
                  src={currentListing.thumbnail_url}
                  alt={currentListing.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <span className="text-6xl">📦</span>
                </div>
              )}

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                      {currentListing.title}
                    </h3>
                    <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                      {currentListing.description}
                    </p>
                    {currentListing.price && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-naija-green/20 border border-naija-green/50">
                        <span className="text-naija-green font-bold">
                          ₦{currentListing.price.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User info */}
                  {currentListing.user && (
                    <div className="flex items-center gap-2">
                      {currentListing.user.avatar_url ? (
                        <Image
                          src={currentListing.user.avatar_url}
                          alt={currentListing.user.username}
                          width={40}
                          height={40}
                          className="rounded-full border-2 border-naija-green/50"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-naija-green to-neon-cyan flex items-center justify-center text-white font-bold">
                          {currentListing.user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Boosted badge */}
              {currentListing.is_boosted && (
                <div className="absolute top-4 right-4">
                  <div className="px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/50 backdrop-blur-sm">
                    <span className="text-yellow-400 text-xs font-semibold">
                      ⚡ Boosted
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <button
          type="button"
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm border border-gray-700 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm border border-gray-700 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {listings.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentIndex
                  ? "w-8 bg-naija-green"
                  : "w-2 bg-gray-500 hover:bg-gray-400",
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
