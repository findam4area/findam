"use client";

import { useState, useEffect } from "react";
import {
  Swords,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  Zap,
} from "lucide-react";
import {
  PriceDropBattle,
  BattleOffer,
  PriceDropBattleService,
} from "@/lib/services/price-drop-battle";

interface PriceDropBattleGameProps {
  battle: PriceDropBattle;
  userId: string;
  onBattleUpdate?: (battle: PriceDropBattle) => void;
  onBattleComplete?: (battle: PriceDropBattle) => void;
}

const battleService = new PriceDropBattleService();

export function PriceDropBattleGame({
  battle: initialBattle,
  userId,
  onBattleUpdate,
  onBattleComplete,
}: PriceDropBattleGameProps) {
  const [battle, setBattle] = useState<PriceDropBattle>(initialBattle);
  const [offers, setOffers] = useState<BattleOffer[]>([]);
  const [counterOffer, setCounterOffer] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const userRole = battleService.getUserRole(battle, userId);
  const isUserTurn = battleService.isUserTurn(battle, userId);
  const savings = battleService.calculateSavings(battle);
  const savingsPercentage = battleService.calculateSavingsPercentage(battle);

  useEffect(() => {
    loadOffers();
  }, [battle.id]);

  useEffect(() => {
    // Update time remaining every second
    const interval = setInterval(() => {
      const remaining = battleService.getTimeRemaining(battle);
      setTimeRemaining(remaining);

      if (remaining === 0 && battle.status === "active") {
        // Battle expired, reload
        reloadBattle();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [battle]);

  const loadOffers = async () => {
    try {
      const data = await battleService.getBattleOffers(battle.id);
      setOffers(data);
    } catch (error) {
      console.error("Failed to load offers:", error);
    }
  };

  const reloadBattle = async () => {
    try {
      const updated = await battleService.getBattleById(battle.id);
      if (updated) {
        setBattle(updated);
        onBattleUpdate?.(updated);
      }
    } catch (error) {
      console.error("Failed to reload battle:", error);
    }
  };

  const handleMakeOffer = async () => {
    if (!counterOffer || loading) return;

    const offerAmount = parseFloat(counterOffer);
    if (isNaN(offerAmount) || offerAmount <= 0) return;

    setLoading(true);
    try {
      await battleService.makeCounterOffer(battle.id, offerAmount, message);
      await reloadBattle();
      await loadOffers();
      setCounterOffer("");
      setMessage("");
    } catch (error: any) {
      alert(error.message || "Failed to make offer");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const updated = await battleService.acceptOffer(battle.id);
      setBattle(updated);
      setShowCelebration(true);
      onBattleComplete?.(updated);

      // Trigger celebration effect
      setTimeout(() => setShowCelebration(false), 3000);
    } catch (error: any) {
      alert(error.message || "Failed to accept offer");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectBattle = async () => {
    if (loading) return;
    if (!confirm("Are you sure you want to reject this negotiation?")) return;

    setLoading(true);
    try {
      const updated = await battleService.rejectBattle(battle.id);
      setBattle(updated);
      onBattleComplete?.(updated);
    } catch (error: any) {
      alert(error.message || "Failed to reject battle");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString()}`;
  };

  if (battle.status === "accepted") {
    return (
      <div className="rounded-lg border-2 border-green-500 bg-green-50 p-8 text-center">
        {showCelebration && (
          <div className="mb-4 animate-bounce">
            <Trophy className="mx-auto h-16 w-16 text-yellow-500" />
          </div>
        )}
        <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
        <h3 className="mt-4 text-2xl font-bold text-gray-900">
          Deal Accepted! 🎉
        </h3>
        <p className="mt-2 text-lg text-gray-700">
          Final Price:{" "}
          {formatCurrency(battle.final_price || battle.current_offer)}
        </p>
        <p className="mt-1 text-green-600">
          Saved {formatCurrency(savings)} ({savingsPercentage.toFixed(1)}% off)
        </p>
      </div>
    );
  }

  if (battle.status === "rejected" || battle.status === "cancelled") {
    return (
      <div className="rounded-lg border-2 border-red-500 bg-red-50 p-8 text-center">
        <XCircle className="mx-auto h-12 w-12 text-red-600" />
        <h3 className="mt-4 text-2xl font-bold text-gray-900">Battle Ended</h3>
        <p className="mt-2 text-gray-700">
          This negotiation was {battle.status}
        </p>
      </div>
    );
  }

  if (battle.status === "expired") {
    return (
      <div className="rounded-lg border-2 border-gray-500 bg-gray-50 p-8 text-center">
        <Clock className="mx-auto h-12 w-12 text-gray-600" />
        <h3 className="mt-4 text-2xl font-bold text-gray-900">
          Battle Expired
        </h3>
        <p className="mt-2 text-gray-700">Time ran out for this negotiation</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Battle Header */}
      <div className="rounded-lg border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-blue-600 p-3">
              <Swords className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Price Drop Battle
              </h3>
              <p className="text-sm text-gray-600">
                Round {battle.current_round} of {battle.max_rounds}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-orange-600">
              <Clock className="h-5 w-5" />
              <span className="text-lg font-bold">
                {formatTime(timeRemaining)}
              </span>
            </div>
            <p className="text-xs text-gray-600">Time remaining</p>
          </div>
        </div>
      </div>

      {/* Price Comparison */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">Original Price</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(battle.original_price)}
          </p>
        </div>
        <div className="rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
          <p className="text-sm text-blue-600">Current Offer</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(battle.current_offer)}
          </p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-600">Potential Savings</p>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(savings)}
          </p>
          <p className="text-xs text-green-600">
            {savingsPercentage.toFixed(1)}% off
          </p>
        </div>
      </div>

      {/* Offers History */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h4 className="mb-4 font-semibold text-gray-900">
          Negotiation History
        </h4>
        <div className="space-y-3">
          {offers.map((offer, index) => (
            <div
              key={offer.id}
              className={`flex items-start space-x-3 rounded-lg p-3 ${
                offer.offered_by === userRole ? "bg-blue-50" : "bg-gray-50"
              }`}
            >
              <div
                className={`rounded-full p-2 ${
                  offer.offered_by === "buyer" ? "bg-blue-100" : "bg-purple-100"
                }`}
              >
                {offer.offered_by === "buyer" ? (
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-purple-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {offer.offered_by === userRole ? "You" : "Opponent"} offered
                  </span>
                  <span className="text-sm text-gray-600">
                    Round {offer.round_number}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(offer.offer_amount)}
                </p>
                {offer.message && (
                  <p className="mt-1 text-sm text-gray-600">{offer.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Area */}
      {isUserTurn ? (
        <div className="rounded-lg border-2 border-green-500 bg-green-50 p-6">
          <div className="mb-4 flex items-center space-x-2">
            <Zap className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-green-900">Your Turn!</h4>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="counter-offer"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Counter Offer Amount (₦)
              </label>
              <input
                id="counter-offer"
                type="number"
                value={counterOffer}
                onChange={(e) => setCounterOffer(e.target.value)}
                placeholder={
                  userRole === "buyer"
                    ? "Enter higher offer"
                    : "Enter lower counter"
                }
                min="0"
                step="100"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-600">
                {userRole === "buyer"
                  ? `Must be higher than ${formatCurrency(battle.current_offer)}`
                  : `Must be lower than ${formatCurrency(battle.current_offer)}`}
              </p>
            </div>

            <div>
              <label
                htmlFor="offer-message"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Message (Optional)
              </label>
              <textarea
                id="offer-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message to your offer..."
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleMakeOffer}
                disabled={loading || !counterOffer}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "Sending..." : "Make Counter Offer"}
              </button>
              <button
                type="button"
                onClick={handleAcceptOffer}
                disabled={loading}
                className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
              >
                Accept Current Offer
              </button>
            </div>

            <button
              type="button"
              onClick={handleRejectBattle}
              disabled={loading}
              className="w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              End Negotiation
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <Clock className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 font-medium text-gray-900">
            Waiting for opponent's response...
          </p>
          <p className="mt-1 text-sm text-gray-600">
            They have {formatTime(timeRemaining)} to respond
          </p>
        </div>
      )}
    </div>
  );
}
