"use client";

import { useState, useEffect } from "react";
import {
  Swords,
  CheckCircle,
  XCircle,
  Clock,
  TrendingDown,
  Trophy,
} from "lucide-react";
import {
  BattleHistory,
  PriceDropBattleService,
} from "@/lib/services/price-drop-battle";

interface BattleHistoryProps {
  onSelectBattle?: (battleId: string) => void;
}

const battleService = new PriceDropBattleService();

export function BattleHistoryList({ onSelectBattle }: BattleHistoryProps) {
  const [history, setHistory] = useState<BattleHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await battleService.getBattleHistory(50);
      setHistory(data);
    } catch (error) {
      console.error("Failed to load battle history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString()}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejected":
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "expired":
        return <Clock className="h-5 w-5 text-gray-600" />;
      case "active":
        return <Swords className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-50 border-green-200 text-green-700";
      case "rejected":
      case "cancelled":
        return "bg-red-50 border-red-200 text-red-700";
      case "expired":
        return "bg-gray-50 border-gray-200 text-gray-700";
      case "active":
        return "bg-blue-50 border-blue-200 text-blue-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const calculateSavings = (battle: BattleHistory): number => {
    if (!battle.final_price) return 0;
    return battle.original_price - battle.final_price;
  };

  const calculateSavingsPercentage = (battle: BattleHistory): number => {
    const savings = calculateSavings(battle);
    return (savings / battle.original_price) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <Swords className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No Battle History
        </h3>
        <p className="mt-2 text-gray-600">
          Start your first price drop battle to see your negotiation history
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900">Battle History</h3>

      {history.map((battle) => (
        <div
          key={battle.battle_id}
          className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Header */}
              <div className="mb-3 flex items-center space-x-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Swords className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {battle.listing_title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    You were the {battle.role}
                  </p>
                </div>
              </div>

              {/* Price Info */}
              <div className="mb-3 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Original Price</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(battle.original_price)}
                  </p>
                </div>
                {battle.final_price && (
                  <>
                    <div>
                      <p className="text-xs text-gray-600">Final Price</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(battle.final_price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Savings</p>
                      <p className="font-medium text-green-900">
                        {formatCurrency(calculateSavings(battle))}
                      </p>
                      <p className="text-xs text-green-600">
                        {calculateSavingsPercentage(battle).toFixed(1)}% off
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{battle.rounds} rounds</span>
                <span>•</span>
                <span>{new Date(battle.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex flex-col items-end space-y-2">
              <div
                className={`flex items-center space-x-2 rounded-full border px-3 py-1 ${getStatusColor(
                  battle.status,
                )}`}
              >
                {getStatusIcon(battle.status)}
                <span className="text-sm font-medium capitalize">
                  {battle.status}
                </span>
              </div>

              {battle.status === "accepted" && battle.role === "buyer" && (
                <div className="flex items-center space-x-1 text-yellow-600">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xs font-medium">Great Deal!</span>
                </div>
              )}

              {onSelectBattle && battle.status === "active" && (
                <button
                  type="button"
                  onClick={() => onSelectBattle(battle.battle_id)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Battle
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
