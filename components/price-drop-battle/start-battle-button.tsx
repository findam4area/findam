"use client";

import { useState } from "react";
import { Swords, X } from "lucide-react";
import { PriceDropBattleService } from "@/lib/services/price-drop-battle";

interface StartBattleButtonProps {
  listingId: string;
  listingPrice: number;
  listingTitle: string;
  onBattleStarted?: (battleId: string) => void;
}

const battleService = new PriceDropBattleService();

export function StartBattleButton({
  listingId,
  listingPrice,
  listingTitle,
  onBattleStarted,
}: StartBattleButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [initialOffer, setInitialOffer] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleStartBattle = async () => {
    if (!initialOffer || loading) return;

    const offerAmount = parseFloat(initialOffer);
    if (isNaN(offerAmount) || offerAmount <= 0 || offerAmount >= listingPrice) {
      alert("Please enter a valid offer amount less than the listing price");
      return;
    }

    setLoading(true);
    try {
      const battleId = await battleService.startBattle(listingId, offerAmount);
      setShowModal(false);
      onBattleStarted?.(battleId);
    } catch (error: any) {
      alert(error.message || "Failed to start battle");
    } finally {
      setLoading(false);
    }
  };

  const suggestedOffers = [
    { label: "10% off", amount: listingPrice * 0.9 },
    { label: "20% off", amount: listingPrice * 0.8 },
    { label: "30% off", amount: listingPrice * 0.7 },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white transition-all hover:from-blue-700 hover:to-purple-700"
      >
        <Swords className="h-5 w-5" />
        <span>Start Price Battle</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Swords className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Start Price Battle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close modal"
                title="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Listing Info */}
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Negotiating for:</p>
              <p className="font-semibold text-gray-900">{listingTitle}</p>
              <p className="mt-1 text-lg font-bold text-blue-600">
                ₦{listingPrice.toLocaleString()}
              </p>
            </div>

            {/* Initial Offer Input */}
            <div className="mb-4">
              <label
                htmlFor="initial-offer"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Your Initial Offer (₦)
              </label>
              <input
                id="initial-offer"
                type="number"
                value={initialOffer}
                onChange={(e) => setInitialOffer(e.target.value)}
                placeholder="Enter your offer"
                min="0"
                max={listingPrice}
                step="100"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-600">
                Must be less than ₦{listingPrice.toLocaleString()}
              </p>
            </div>

            {/* Quick Suggestions */}
            <div className="mb-6">
              <p className="mb-2 text-sm font-medium text-gray-700">
                Quick Suggestions:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {suggestedOffers.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() =>
                      setInitialOffer(Math.floor(suggestion.amount).toString())
                    }
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                  >
                    <div className="font-medium text-gray-900">
                      {suggestion.label}
                    </div>
                    <div className="text-xs text-gray-600">
                      ₦{Math.floor(suggestion.amount).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                <strong>How it works:</strong> You and the seller will take
                turns making offers. You have up to 5 rounds and 30 minutes per
                round to reach an agreement.
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartBattle}
                disabled={loading || !initialOffer}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "Starting..." : "Start Battle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
