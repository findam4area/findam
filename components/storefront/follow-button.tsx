"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface FollowButtonProps {
  storefrontId: string;
  themeColor?: string;
}

export function FollowButton({ storefrontId, themeColor }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkFollowStatus() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
        try {
          // Check if following via database query
          const { data } = await supabase
            .from("storefront_followers")
            .select("id")
            .eq("storefront_id", storefrontId)
            .eq("follower_user_id", user.id)
            .single();

          setIsFollowing(!!data);
        } catch (error) {
          console.error("Failed to check follow status:", error);
        }
      }
    }

    checkFollowStatus();
  }, [storefrontId]);

  const handleFollow = async () => {
    if (!currentUserId) {
      // Redirect to login
      window.location.href = "/login";
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        const response = await fetch(
          `/api/storefront/follow?storefront_id=${storefrontId}`,
          {
            method: "DELETE",
          },
        );
        if (!response.ok) throw new Error("Failed to unfollow");
        setIsFollowing(false);
      } else {
        const response = await fetch("/api/storefront/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storefront_id: storefrontId }),
        });
        if (!response.ok) throw new Error("Failed to follow");
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update follow status",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-lg px-6 py-2 font-medium text-white transition-colors disabled:opacity-50"
      style={{
        backgroundColor: isFollowing ? "#6B7280" : themeColor || "#3B82F6",
      }}
    >
      {isFollowing ? (
        <>
          <UserCheck className="h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Follow
        </>
      )}
    </button>
  );
}
