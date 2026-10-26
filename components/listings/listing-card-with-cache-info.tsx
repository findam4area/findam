"use client";

import { StaleContentWarning } from "@/components/shared/stale-content-warning";

interface ListingCardWithCacheInfoProps {
  listing: any;
  timestamp?: number;
  children: React.ReactNode;
}

/**
 * ListingCardWithCacheInfo Component
 * Wraps listing cards with stale content warning if cached
 * 
 * Requirements: 17.8, 17.9
 */
export function ListingCardWithCacheInfo({
  listing,
  timestamp,
  children,
}: ListingCardWithCacheInfoProps) {
  return (
    <div className="relative">
      {timestamp && (
        <div className="mb-2">
          <StaleContentWarning timestamp={timestamp} contentType="listing" />
        </div>
      )}
      {children}
    </div>
  );
}
