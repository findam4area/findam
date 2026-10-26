"use client";

import { useState } from "react";
import { Music, X, Upload } from "lucide-react";
import { TrendingSound } from "@/lib/services/trending-sounds";
import { TrendingSoundsLibrary } from "./trending-sounds-library";

interface TrendingSoundsSelectorProps {
  listingId?: string;
  selectedSound?: TrendingSound | null;
  onSoundSelect: (sound: TrendingSound | null) => void;
  onUploadCustom?: () => void;
}

export function TrendingSoundsSelector({
  listingId,
  selectedSound,
  onSoundSelect,
  onUploadCustom,
}: TrendingSoundsSelectorProps) {
  const [showLibrary, setShowLibrary] = useState(false);

  const handleSelectSound = (sound: TrendingSound) => {
    onSoundSelect(sound);
    setShowLibrary(false);
  };

  const handleRemoveSound = () => {
    onSoundSelect(null);
  };

  return (
    <div className="space-y-4">
      {/* Selected Sound Display */}
      {selectedSound ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Music className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {selectedSound.title}
                </h4>
                {selectedSound.artist && (
                  <p className="text-sm text-gray-600">
                    {selectedSound.artist}
                  </p>
                )}
                <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                  {selectedSound.category && (
                    <span className="rounded bg-white px-2 py-0.5">
                      {selectedSound.category}
                    </span>
                  )}
                  <span>{selectedSound.usage_count} uses</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveSound}
              className="text-gray-400 hover:text-red-600"
              aria-label="Remove sound"
              title="Remove sound"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <Music className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            No sound selected for this video
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Browse Sounds Library
        </button>
        {onUploadCustom && (
          <button
            type="button"
            onClick={onUploadCustom}
            className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Custom</span>
          </button>
        )}
      </div>

      {/* Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Select a Sound
              </h3>
              <button
                type="button"
                onClick={() => setShowLibrary(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close library"
                title="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <TrendingSoundsLibrary
              onSelectSound={handleSelectSound}
              selectedSoundId={selectedSound?.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
