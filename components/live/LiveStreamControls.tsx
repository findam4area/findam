"use client";

/**
 * Live Stream Controls Component
 *
 * Provides controls for hosts to manage live sessions including
 * ending stream, pinning products, and viewing analytics.
 *
 * Requirements: 2.1, 2.4, 2.9
 * Tasks: 19.1, 19.4, 19.9
 */

import { useState } from "react";
import { StopCircle, Pin, Clock, Eye, AlertCircle } from "lucide-react";

interface LiveStreamControlsProps {
  sessionId: string;
  viewerCount: number;
  duration: number; // in minutes
  pinnedProductsCount: number;
  onEndStream: () => void;
  onPinProduct: () => void;
  className?: string;
}

export function LiveStreamControls({
  sessionId,
  viewerCount,
  duration,
  pinnedProductsCount,
  onEndStream,
  onPinProduct,
  className = "",
}: LiveStreamControlsProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Check if approaching duration limit (120 minutes)
  const isApproachingLimit = duration >= 110;
  const isAtLimit = duration >= 120;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleEndStream = () => {
    setShowEndConfirm(true);
  };

  const confirmEndStream = () => {
    onEndStream();
    setShowEndConfirm(false);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 ${className}`}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Viewers</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {viewerCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock
            className={`w-5 h-5 ${
              isApproachingLimit
                ? "text-amber-600 dark:text-amber-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
            <p
              className={`text-lg font-bold ${
                isApproachingLimit
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {formatDuration(duration)}
            </p>
          </div>
        </div>
      </div>

      {/* Duration Warning */}
      {isApproachingLimit && !isAtLimit && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Approaching Time Limit
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Your stream will automatically end at 120 minutes
              </p>
            </div>
          </div>
        </div>
      )}

      {isAtLimit && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Time Limit Reached
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                Your stream will end automatically
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-2">
        <button
          onClick={onPinProduct}
          disabled={pinnedProductsCount >= 5}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Pin className="w-4 h-4" />
          <span>Pin Product ({pinnedProductsCount}/5)</span>
        </button>

        <button
          onClick={handleEndStream}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <StopCircle className="w-4 h-4" />
          <span>End Stream</span>
        </button>
      </div>

      {/* End Stream Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              End Live Stream?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to end this live stream? This action cannot
              be undone. The recording will be available for 24 hours.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEndStream}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                End Stream
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
