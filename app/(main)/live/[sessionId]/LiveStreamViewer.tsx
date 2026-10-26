"use client";

/**
 * Live Stream Viewer Client Component
 *
 * Main component for viewing live streams with all interactive features.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LiveStreamPlayer,
  LiveChatPanel,
  ProductPins,
  LiveStreamControls,
  PurchaseModal,
} from "@/components/live";
import { ArrowLeft, Users } from "lucide-react";
import type { LiveSession } from "@/lib/types";

interface LiveStreamViewerProps {
  session: LiveSession;
  seller: {
    username: string;
    avatar_url: string | null;
    trust_score: number;
  };
  currentUserId?: string;
  isHost: boolean;
}

export function LiveStreamViewer({
  session,
  seller,
  currentUserId,
  isHost,
}: LiveStreamViewerProps) {
  const router = useRouter();
  const [viewerCount, setViewerCount] = useState(session.viewer_count);
  const [duration, setDuration] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const isLive = session.stream_status === "live";
  const streamUrl = isLive
    ? session.stream_url || ""
    : session.recording_url || "";

  // Calculate duration
  useEffect(() => {
    if (!session.started_at) return;

    const updateDuration = () => {
      const startedAt = new Date(session.started_at!);
      const now = new Date();
      const minutes = Math.floor(
        (now.getTime() - startedAt.getTime()) / (1000 * 60),
      );
      setDuration(minutes);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [session.started_at]);

  // Handle end stream
  const handleEndStream = async () => {
    try {
      const response = await fetch(`/api/live-sessions/${session.id}/end`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to end stream");
      }

      router.push("/analytics");
    } catch (error) {
      console.error("Error ending stream:", error);
      alert("Failed to end stream. Please try again.");
    }
  };

  // Handle pin product
  const handlePinProduct = () => {
    // Navigate to product selection page or open modal
    router.push(`/live/${session.id}/pin-product`);
  };

  // Handle purchase
  const handlePurchase = (listingId: string) => {
    setSelectedProductId(listingId);
    setShowPurchaseModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-3">
            {seller.avatar_url ? (
              <img
                src={seller.avatar_url}
                alt={seller.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {seller.username[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">
                {seller.username}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isLive ? "Live now" : "Recorded session"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Users className="w-5 h-5" />
            <span className="font-medium">{viewerCount}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Video and Products */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            <LiveStreamPlayer
              sessionId={session.id}
              streamUrl={streamUrl}
              isHost={isHost}
              onViewerCountChange={setViewerCount}
            />

            {/* Session Info */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {session.title}
              </h2>
              {session.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {session.description}
                </p>
              )}
            </div>

            {/* Pinned Products */}
            {isLive && (
              <ProductPins
                sessionId={session.id}
                isHost={isHost}
                onPurchase={handlePurchase}
              />
            )}

            {/* Host Controls */}
            {isHost && isLive && (
              <LiveStreamControls
                sessionId={session.id}
                viewerCount={viewerCount}
                duration={duration}
                pinnedProductsCount={session.pinned_products?.length || 0}
                onEndStream={handleEndStream}
                onPinProduct={handlePinProduct}
              />
            )}
          </div>

          {/* Right Column: Chat */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 h-[calc(100vh-6rem)]">
              <LiveChatPanel
                sessionId={session.id}
                currentUserId={currentUserId}
                isHost={isHost}
                className="h-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {selectedProductId && (
        <PurchaseModal
          listingId={selectedProductId}
          sessionId={session.id}
          isOpen={showPurchaseModal}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedProductId(null);
          }}
          onSuccess={() => {
            setShowPurchaseModal(false);
            setSelectedProductId(null);
          }}
        />
      )}
    </div>
  );
}
