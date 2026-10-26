"use client";

import { useState } from "react";
import { LikeButton } from "@/components/listing/like-button";
import { SaveButton } from "@/components/listing/save-button";
import { ShareModal } from "@/components/listing/share-modal";
import { motion } from "framer-motion";
import type { Listing } from "@/lib/types";

interface ListingInteractionsProps {
  listing: Listing;
  initialLiked?: boolean;
  initialSaved?: boolean;
}

export function ListingInteractions({
  listing,
  initialLiked = false,
  initialSaved = false,
}: ListingInteractionsProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <>
      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center justify-around gap-4">
          <LikeButton
            listingId={listing.id}
            initialLiked={initialLiked}
            initialCount={listing.likes_count || 0}
            size="lg"
            showCount={true}
          />

          <SaveButton
            listingId={listing.id}
            initialSaved={initialSaved}
            size="lg"
            showLabel={true}
          />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsShareModalOpen(true)}
            aria-label="Share listing"
            className="flex items-center gap-2 px-4 py-2.5 min-w-[44px] min-h-[44px] rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-naija-green focus:ring-offset-2 focus:ring-offset-dark-bg transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span className="font-medium">Share</span>
          </motion.button>
        </div>
      </div>

      <ShareModal
        listing={listing}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
}
