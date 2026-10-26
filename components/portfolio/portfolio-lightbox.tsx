"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { PortfolioItem } from "@/lib/types";
import Image from "next/image";

interface PortfolioLightboxProps {
  items: PortfolioItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PortfolioLightbox({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: PortfolioLightboxProps) {
  const currentItem = items[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < items.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, items.length, onClose, onNavigate]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!currentItem) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50"
          />

          {/* Lightbox Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close lightbox"
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation Buttons */}
            {currentIndex > 0 && (
              <button
                onClick={() => onNavigate(currentIndex - 1)}
                aria-label="Previous item"
                className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
              >
                <ChevronLeft className="w-12 h-12" />
              </button>
            )}

            {currentIndex < items.length - 1 && (
              <button
                onClick={() => onNavigate(currentIndex + 1)}
                aria-label="Next item"
                className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10"
              >
                <ChevronRight className="w-12 h-12" />
              </button>
            )}

            {/* Media Display */}
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="max-w-6xl max-h-[90vh] w-full"
            >
              <div className="relative w-full h-full flex flex-col">
                {/* Media */}
                <div className="relative flex-1 flex items-center justify-center">
                  {currentItem.media_type === "image" ? (
                    <div className="relative w-full h-full max-h-[70vh]">
                      <Image
                        src={currentItem.media_url}
                        alt={currentItem.title}
                        fill
                        className="object-contain"
                        sizes="100vw"
                        priority
                      />
                    </div>
                  ) : (
                    <video
                      src={currentItem.media_url}
                      controls
                      autoPlay
                      className="max-w-full max-h-[70vh] rounded-lg"
                    />
                  )}
                </div>

                {/* Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 text-center"
                >
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {currentItem.title}
                  </h2>
                  {currentItem.description && (
                    <p className="text-gray-300 max-w-2xl mx-auto">
                      {currentItem.description}
                    </p>
                  )}

                  {/* Counter */}
                  <p className="text-gray-400 text-sm mt-4">
                    {currentIndex + 1} / {items.length}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
