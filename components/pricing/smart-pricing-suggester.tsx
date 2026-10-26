"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Check,
  Clock,
  BarChart3,
} from "lucide-react";
import { PriceAnalysis } from "@/lib/services/pricing-suggestion";

interface SmartPricingSuggesterProps {
  listingId?: string;
  factors: {
    condition?: string;
    age_months?: number;
    brand?: string;
    location?: string;
    category?: string;
    subcategory?: string;
  };
  onPriceSelect: (price: number) => void;
  currentPrice?: number;
}

export function SmartPricingSuggester({
  listingId,
  factors,
  onPriceSelect,
  currentPrice,
}: SmartPricingSuggesterProps) {
  const [analysis, setAnalysis] = useState<PriceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (factors.category) {
      fetchPricingSuggestion();
    }
  }, [factors.category, factors.condition, factors.location]);

  const fetchPricingSuggestion = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pricing-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          factors,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
        setSelectedPrice(data.analysis.suggested_price);
      }
    } catch (error) {
      console.error("Failed to fetch pricing suggestion:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (analysis) {
      onPriceSelect(analysis.suggested_price);
      setSelectedPrice(analysis.suggested_price);
    }
  };

  const handlePriceChange = (price: number) => {
    setSelectedPrice(price);
    onPriceSelect(price);
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center space-x-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-600">Analyzing market prices...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const confidenceColor =
    analysis.confidence_score >= 70
      ? "text-green-600"
      : analysis.confidence_score >= 40
        ? "text-yellow-600"
        : "text-red-600";

  const confidenceBg =
    analysis.confidence_score >= 70
      ? "bg-green-50"
      : analysis.confidence_score >= 40
        ? "bg-yellow-50"
        : "bg-red-50";

  return (
    <div className="space-y-4">
      {/* Main Suggestion Card */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Smart Pricing Suggestion
            </h3>
            <p className="text-sm text-gray-600">
              Based on {analysis.similar_items_count} similar items
            </p>
          </div>
          <div className={`rounded-lg px-3 py-1 ${confidenceBg}`}>
            <p className={`text-sm font-medium ${confidenceColor}`}>
              {analysis.confidence_score}% confident
            </p>
          </div>
        </div>

        {/* Suggested Price */}
        <div className="mb-6">
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-gray-900">
              ₦{analysis.suggested_price.toLocaleString()}
            </span>
            {analysis.seasonal_adjustment !== 0 && (
              <span className="text-sm text-gray-600">
                ({analysis.seasonal_adjustment > 0 ? "+" : ""}
                {analysis.seasonal_adjustment}% seasonal)
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
            <span>
              Range: ₦{analysis.min_price.toLocaleString()} - ₦
              {analysis.max_price.toLocaleString()}
            </span>
            {analysis.market_average > 0 && (
              <span>
                Market avg: ₦{analysis.market_average.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Price Range Slider */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Adjust Price
          </label>
          <input
            type="range"
            min={analysis.min_price}
            max={analysis.max_price}
            value={selectedPrice || analysis.suggested_price}
            onChange={(e) => handlePriceChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gradient-to-r from-green-200 via-blue-200 to-red-200"
            style={{
              background: `linear-gradient(to right, #86efac 0%, #93c5fd 50%, #fca5a5 100%)`,
            }}
          />
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>₦{analysis.min_price.toLocaleString()}</span>
            <span className="font-medium text-gray-900">
              ₦{(selectedPrice || analysis.suggested_price).toLocaleString()}
            </span>
            <span>₦{analysis.max_price.toLocaleString()}</span>
          </div>
        </div>

        {/* Accept Button */}
        <button
          onClick={handleAcceptSuggestion}
          className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-3 text-white transition-colors hover:bg-blue-700"
        >
          <Check className="h-5 w-5" />
          <span>Accept Suggested Price</span>
        </button>
      </div>

      {/* Deviation Alert */}
      {analysis.deviation_alert && (
        <div
          className={`flex items-start space-x-3 rounded-lg border p-4 ${
            analysis.deviation_alert.type === "above"
              ? "border-orange-200 bg-orange-50"
              : "border-blue-200 bg-blue-50"
          }`}
        >
          <AlertCircle
            className={`h-5 w-5 flex-shrink-0 ${
              analysis.deviation_alert.type === "above"
                ? "text-orange-600"
                : "text-blue-600"
            }`}
          />
          <div>
            <p
              className={`text-sm font-medium ${
                analysis.deviation_alert.type === "above"
                  ? "text-orange-900"
                  : "text-blue-900"
              }`}
            >
              Price Deviation Alert
            </p>
            <p
              className={`mt-1 text-sm ${
                analysis.deviation_alert.type === "above"
                  ? "text-orange-700"
                  : "text-blue-700"
              }`}
            >
              {analysis.deviation_alert.message}
            </p>
          </div>
        </div>
      )}

      {/* Selling Time Estimates */}
      {analysis.avg_selling_time_days > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <h4 className="font-medium text-gray-900">Average Selling Time</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {analysis.avg_selling_time_days} days
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Based on similar items at this price range
          </p>

          {analysis.price_at_different_points.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Selling time at different prices:
              </p>
              {analysis.price_at_different_points.map((point, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">
                    ₦{point.price.toLocaleString()}
                  </span>
                  <span className="font-medium text-gray-900">
                    ~{point.avg_days_to_sell} days
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Price History */}
      {analysis.price_history.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">
                Price History (6 months)
              </h4>
            </div>
            <span className="text-sm text-gray-600">
              {showHistory ? "Hide" : "Show"}
            </span>
          </button>

          {showHistory && (
            <div className="mt-4 space-y-3">
              {analysis.price_history.map((entry, index) => {
                const date = new Date(entry.date);
                const monthName = date.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                });

                const trend =
                  index > 0
                    ? entry.avg_price -
                      analysis.price_history[index - 1].avg_price
                    : 0;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0"
                  >
                    <span className="text-sm text-gray-600">{monthName}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        ₦{entry.avg_price.toLocaleString()}
                      </span>
                      {trend !== 0 && (
                        <span
                          className={`flex items-center text-xs ${
                            trend > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {trend > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(trend).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Market Insights */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h4 className="mb-3 font-medium text-gray-900">Market Insights</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            • {analysis.similar_items_count} similar items sold in the last 6
            months
          </p>
          {analysis.market_average > 0 && (
            <p>
              • Average market price: ₦
              {analysis.market_average.toLocaleString()}
            </p>
          )}
          {analysis.seasonal_adjustment !== 0 && (
            <p>
              • Seasonal adjustment:{" "}
              {analysis.seasonal_adjustment > 0 ? "+" : ""}
              {analysis.seasonal_adjustment}% (
              {analysis.seasonal_adjustment > 0 ? "high" : "low"} demand period)
            </p>
          )}
          <p>
            • Confidence level: {analysis.confidence_score}%
            {analysis.confidence_score >= 70
              ? " (High - Strong market data)"
              : analysis.confidence_score >= 40
                ? " (Medium - Moderate market data)"
                : " (Low - Limited market data)"}
          </p>
        </div>
      </div>
    </div>
  );
}
