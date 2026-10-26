/**
 * ComparisonCard Component
 * Individual product card in comparison view
 * Requirements: 3.3, 3.4, 3.5, 3.9
 * Tasks: 22.2, 22.5
 */

"use client";

import { motion } from "framer-motion";
import { MapPin, Star, Clock, CheckCircle, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/types";

interface ComparisonCardProps {
  listing: Listing;
  onRemove: (id: string) => void;
  highlights: {
    price?: boolean;
    condition?: boolean;
    rating?: boolean;
  };
}

export function ComparisonCard({
  listing,
  onRemove,
  highlights,
}: ComparisonCardProps) {
  const sellerRating = listing.user?.trust_score
    ? (listing.user.trust_score / 20).toFixed(1)
    : "N/A";
  const location = listing.lga
    ? `${listing.lga}, ${listing.state}`
    : listing.state;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-card rounded-xl overflow-hidden relative group"
    >
      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(listing.id)}
        className="absolute top-3 right-3 z-10 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500"
        aria-label={`Remove ${listing.title} from comparison`}
      >
        <X className="w-4 h-4 text-white" />
      </button>

      {/* Product Image */}
      <Link href={`/listing/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] bg-dark-bg overflow-hidden">
          {listing.thumbnail_url ? (
            <Image
              src={listing.thumbnail_url}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-gray-600"
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
        </div>
      </Link>

      {/* Product Details */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Link href={`/listing/${listing.id}`}>
          <h3 className="font-semibold text-lg line-clamp-2 hover:text-naija-green transition-colors">
            {listing.title}
          </h3>
        </Link>

        {/* Price - Highlight if best */}
        <div
          className={`flex items-center gap-2 ${
            highlights.price
              ? "bg-naija-green/20 border-2 border-naija-green rounded-lg p-2 -mx-2"
              : ""
          }`}
        >
          {highlights.price && (
            <CheckCircle className="w-5 h-5 text-naija-green flex-shrink-0" />
          )}
          <div>
            <p className="text-xs text-gray-400">Price</p>
            <p className="text-xl font-bold text-naija-green">
              ₦{listing.price?.toLocaleString() || "N/A"}
            </p>
          </div>
        </div>

        {/* Condition - Highlight if best */}
        <div
          className={`flex items-center gap-2 ${
            highlights.condition
              ? "bg-naija-green/20 border-2 border-naija-green rounded-lg p-2 -mx-2"
              : ""
          }`}
        >
          {highlights.condition && (
            <CheckCircle className="w-5 h-5 text-naija-green flex-shrink-0" />
          )}
          <div>
            <p className="text-xs text-gray-400">Condition</p>
            <p className="text-sm font-medium capitalize">
              {listing.condition || "Not specified"}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Location</p>
            <p className="text-sm">{location}</p>
          </div>
        </div>

        {/* Seller Rating - Highlight if best */}
        <div
          className={`flex items-center gap-2 ${
            highlights.rating
              ? "bg-naija-green/20 border-2 border-naija-green rounded-lg p-2 -mx-2"
              : ""
          }`}
        >
          {highlights.rating && (
            <CheckCircle className="w-5 h-5 text-naija-green flex-shrink-0" />
          )}
          <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-400">Seller Rating</p>
            <p className="text-sm font-medium">{sellerRating} / 5.0</p>
          </div>
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
          {listing.user?.avatar_url ? (
            <Image
              src={listing.user.avatar_url}
              alt={listing.user.username}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-dark-bg flex items-center justify-center">
              <span className="text-xs font-medium">
                {listing.user?.username?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {listing.user?.username || "Unknown"}
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>Usually responds quickly</span>
            </div>
          </div>
        </div>

        {/* View Details Button */}
        <Link
          href={`/listing/${listing.id}`}
          className="block w-full py-2 text-center text-sm font-medium text-naija-green border border-naija-green rounded-lg hover:bg-naija-green hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-naija-green"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  );
}
