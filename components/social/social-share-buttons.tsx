"use client";

import React, { useState } from "react";
import {
  Share2,
  MessageCircle,
  Twitter,
  Facebook,
  Instagram,
  Copy,
  Check,
} from "lucide-react";
import { socialShareService } from "@/lib/services/social-share";
import { toast } from "sonner";

interface SocialShareButtonsProps {
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingImage: string;
  userId: string;
  referralCode?: string;
  category?: string;
  condition?: string;
  className?: string;
}

export function SocialShareButtons({
  listingId,
  listingTitle,
  listingPrice,
  listingImage,
  userId,
  referralCode,
  category,
  condition,
  className = "",
}: SocialShareButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");

  const handleShare = async (
    platform: "whatsapp" | "twitter" | "facebook" | "instagram",
  ) => {
    try {
      // Generate share link with tracking
      const url = await socialShareService.generateShareLink({
        listingId,
        userId,
        platform,
        referralCode,
      });

      setShareUrl(url);

      // Generate share text
      const shareText = socialShareService.generateShareText({
        title: listingTitle,
        price: listingPrice,
        category,
        condition,
      });

      // Get platform-specific URL
      const platformUrl = socialShareService.getPlatformShareUrl(
        platform,
        url,
        shareText,
      );

      // Track the share click
      await socialShareService.trackShareClick(url);

      // Open share dialog
      if (platform === "instagram") {
        // For Instagram, copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
        toast.success("Link copied! Share it on Instagram");
      } else {
        window.open(platformUrl, "_blank", "width=600,height=400");
        toast.success(`Shared on ${platform}!`);
      }
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share. Please try again.");
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = await socialShareService.generateShareLink({
        listingId,
        userId,
        platform: "whatsapp", // Default platform for copy
        referralCode,
      });

      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Share Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl"
        aria-label="Share listing"
      >
        <Share2 className="w-5 h-5" />
        <span className="font-medium">Share</span>
      </button>

      {/* Share Options Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Share this listing
              </p>
            </div>

            <div className="p-2 space-y-1">
              {/* WhatsApp */}
              <button
                onClick={() => handleShare("whatsapp")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    WhatsApp
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Share via WhatsApp
                  </p>
                </div>
              </button>

              {/* Twitter */}
              <button
                onClick={() => handleShare("twitter")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Twitter className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Twitter
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tweet this listing
                  </p>
                </div>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleShare("facebook")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Facebook className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Facebook
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Share on Facebook
                  </p>
                </div>
              </button>

              {/* Instagram */}
              <button
                onClick={() => handleShare("instagram")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Instagram
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Copy link for Instagram
                  </p>
                </div>
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {copied ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Copy className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {copied ? "Copied!" : "Copy Link"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Copy to clipboard
                  </p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Compact version for listing cards
 */
export function ShareButton({
  listingId,
  listingTitle,
  listingPrice,
  listingImage,
  userId,
  referralCode,
  category,
  condition,
  className = "",
}: SocialShareButtonsProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleQuickShare = async () => {
    setIsSharing(true);
    try {
      const url = await socialShareService.generateShareLink({
        listingId,
        userId,
        platform: "whatsapp",
        referralCode,
      });

      const shareText = socialShareService.generateShareText({
        title: listingTitle,
        price: listingPrice,
        category,
        condition,
      });

      // Use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: listingTitle,
          text: shareText,
          url: url,
        });
      } else {
        // Fallback to WhatsApp
        const platformUrl = socialShareService.getPlatformShareUrl(
          "whatsapp",
          url,
          shareText,
        );
        window.open(platformUrl, "_blank", "width=600,height=400");
      }

      await socialShareService.trackShareClick(url);
      toast.success("Shared successfully!");
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Share error:", error);
        toast.error("Failed to share");
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleQuickShare}
      disabled={isSharing}
      className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      aria-label="Share listing"
    >
      <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    </button>
  );
}

/**
 * Share count display component
 */
interface ShareCountProps {
  listingId: string;
  className?: string;
}

export function ShareCount({ listingId, className = "" }: ShareCountProps) {
  const [shareCount, setShareCount] = useState(0);

  React.useEffect(() => {
    const fetchShareCount = async () => {
      const metrics =
        await socialShareService.getListingShareMetrics(listingId);
      setShareCount(metrics.total_shares);
    };

    fetchShareCount();
  }, [listingId]);

  if (shareCount === 0) return null;

  return (
    <div
      className={`flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 ${className}`}
    >
      <Share2 className="w-4 h-4" />
      <span>
        {shareCount} {shareCount === 1 ? "share" : "shares"}
      </span>
    </div>
  );
}
