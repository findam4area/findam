"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { LocationDisplay } from "@/components/location";
import { PriceDisplay } from "@/components/shared";
import Image from "next/image";
import type { Listing } from "@/lib/types";

interface ListingDetailModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onContact?: () => void;
}

export function ListingDetailModal({
  listing,
  isOpen,
  onClose,
  onContact,
}: ListingDetailModalProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });

  // Parallax effect for header
  const headerY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const media = listing.media || [];
  const currentMedia = media[currentMediaIndex];

  const nextMedia = () => {
    setCurrentMediaIndex((prev) => (prev + 1) % media.length);
  };

  const prevMedia = () => {
    setCurrentMediaIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const handleRevealPhone = () => {
    setShowPhoneNumber(true);
    // TODO: Log phone reveal action and check rate limit
  };

  // Handle swipe gestures
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) {
      // Swipe left
      nextMedia();
    }

    if (touchStart - touchEnd < -75) {
      // Swipe right
      prevMedia();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute inset-0 bg-dark-bg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Scrollable Content */}
            <div ref={scrollRef} className="h-full overflow-y-auto">
              {/* Media Gallery with Parallax */}
              <motion.div
                style={{ y: headerY, opacity: headerOpacity }}
                className="relative h-[60vh] bg-black"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {media.length > 0 ? (
                  <>
                    {currentMedia.media_type === "video" ? (
                      <video
                        src={currentMedia.media_url}
                        className="w-full h-full object-contain"
                        controls
                        autoPlay
                        loop
                      />
                    ) : (
                      <Image
                        src={currentMedia.media_url}
                        alt={listing.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 90vw"
                        className="object-contain"
                      />
                    )}

                    {/* Media Navigation */}
                    {media.length > 1 && (
                      <>
                        <button
                          onClick={prevMedia}
                          aria-label="Previous media"
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={nextMedia}
                          aria-label="Next media"
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md"
                        >
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>

                        {/* Media Indicators */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {media.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentMediaIndex(index)}
                              aria-label={`View media ${index + 1}`}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentMediaIndex
                                  ? "bg-white w-8"
                                  : "bg-white/50"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-24 h-24 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </motion.div>

              {/* Content */}
              <div className="relative bg-dark-bg">
                <div className="max-w-4xl mx-auto p-6 space-y-6">
                  {/* Title and Price */}
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
                    {listing.price && (
                      <PriceDisplay amount={listing.price} size="xl" />
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    {listing.condition && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Condition:</span>
                        <span className="capitalize">{listing.condition}</span>
                      </div>
                    )}
                    <LocationDisplay
                      state={listing.state}
                      area={listing.lga}
                      iconClassName="w-4 h-4"
                      textClassName="text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {new Date(listing.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="glass-card p-6 rounded-xl">
                    <h2 className="text-xl font-semibold mb-3">Description</h2>
                    <p className="text-gray-300 whitespace-pre-wrap">
                      {listing.description}
                    </p>
                  </div>

                  {/* Seller Info */}
                  {listing.user && (
                    <div className="glass-card p-6 rounded-xl">
                      <h2 className="text-xl font-semibold mb-4">
                        Seller Information
                      </h2>
                      <div className="flex items-center gap-4">
                        {listing.user.avatar_url ? (
                          <Image
                            src={listing.user.avatar_url}
                            alt={listing.user.username}
                            width={64}
                            height={64}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-dark-card flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-gray-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {listing.user.username}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>
                              Trust Score: {listing.user.trust_score}/100
                            </span>
                            {listing.user.phone_verified && (
                              <span className="text-naija-green">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Safety Tips */}
                  <div className="glass-card p-6 rounded-xl bg-naija-orange/10 border border-naija-orange/30">
                    <h2 className="text-xl font-semibold mb-3 text-naija-orange">
                      Safety Tips
                    </h2>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <svg
                          className="w-5 h-5 text-naija-orange flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Meet in a safe, public location
                      </li>
                      <li className="flex items-start gap-2">
                        <svg
                          className="w-5 h-5 text-naija-orange flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Never send money in advance
                      </li>
                      <li className="flex items-start gap-2">
                        <svg
                          className="w-5 h-5 text-naija-orange flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Inspect the item before paying
                      </li>
                    </ul>
                  </div>

                  {/* Contact Actions */}
                  <div className="sticky bottom-0 bg-dark-bg/95 backdrop-blur-md p-4 border-t border-dark-border">
                    <div className="flex gap-3">
                      <Button
                        onClick={onContact}
                        className="flex-1 bg-gradient-to-r from-naija-green to-neon-cyan"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        Send Message
                      </Button>

                      {listing.user?.phone && (
                        <Button
                          onClick={handleRevealPhone}
                          variant="outline"
                          className="flex-1"
                        >
                          {showPhoneNumber ? (
                            listing.user.phone
                          ) : (
                            <>
                              <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                              Reveal Phone
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
