import Link from "next/link";
import { MapPin, Eye, Heart, Star } from "lucide-react";
import type { Listing } from "@/lib/types";

interface StorefrontListingsProps {
  listings: Listing[];
  featured?: boolean;
}

export function StorefrontListings({
  listings,
  featured = false,
}: StorefrontListingsProps) {
  if (listings.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow-sm">
        <p className="text-gray-600">No listings available</p>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-4 ${
        featured
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      }`}
    >
      {listings.map((listing) => (
        <Link
          key={listing.id}
          href={`/listing/${listing.id}`}
          className="group overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-gray-200">
            <img
              src={listing.thumbnail_url || "/placeholder-listing.jpg"}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            {listing.is_boosted && (
              <div className="absolute left-2 top-2 rounded-full bg-yellow-500 px-2 py-1 text-xs font-semibold text-white">
                <Star className="inline h-3 w-3" /> Boosted
              </div>
            )}
            {featured && (
              <div className="absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white">
                Featured
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3">
            <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-blue-600">
              {listing.title}
            </h3>

            {listing.price && (
              <p className="mb-2 text-lg font-bold text-gray-900">
                ₦{listing.price.toLocaleString()}
              </p>
            )}

            {listing.condition && (
              <span className="mb-2 inline-block rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                {listing.condition}
              </span>
            )}

            <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
              {listing.lga && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {listing.lga}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {listing.views_count}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {listing.likes_count}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
