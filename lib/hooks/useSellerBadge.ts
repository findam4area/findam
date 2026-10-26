import { useState, useEffect } from "react";
import type { BadgeTier } from "@/components/verification";

interface SellerBadge {
  tier: BadgeTier;
  phoneVerified: boolean;
  ninVerified: boolean;
  videoVerified: boolean;
  transactionCount: number;
  averageRating: number | null;
}

/**
 * Hook to fetch seller badge information
 * Requirements: 15.1
 * Tasks: 28.1
 */
export function useSellerBadge(userId: string | undefined) {
  const [badge, setBadge] = useState<SellerBadge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchBadge() {
      try {
        const response = await fetch(
          `/api/verification/badge?userId=${userId}`,
        );
        if (response.ok) {
          const data = await response.json();
          setBadge({
            tier: data.tier,
            phoneVerified: data.phone_verified,
            ninVerified: data.nin_verified,
            videoVerified: data.video_verified,
            transactionCount: data.transaction_count,
            averageRating: data.average_rating,
          });
        }
      } catch (error) {
        console.error("Error fetching badge:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBadge();
  }, [userId]);

  return { badge, loading };
}
