"use client";

import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Package } from "lucide-react";
import type { CategoryStats, ConversionStats } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function AnalyticsView() {
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [conversionStats, setConversionStats] =
    useState<ConversionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics");
      if (response.ok) {
        const data = await response.json();
        setCategoryStats(data.categoryStats);
        setConversionStats(data.conversionStats);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-white">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Conversion Stats */}
      {conversionStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card rounded-lg border border-dark-border bg-dark-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-naija-green" />
              <h3 className="text-sm font-medium text-gray-400">
                Total Boosts
              </h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {conversionStats.total_boosts.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {formatPrice(conversionStats.boost_revenue)} revenue
            </p>
          </div>

          <div className="glass-card rounded-lg border border-dark-border bg-dark-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-purple-500" />
              <h3 className="text-sm font-medium text-gray-400">
                Premium Subscriptions
              </h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {conversionStats.total_premium_subscriptions.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {formatPrice(conversionStats.premium_revenue)} revenue
            </p>
          </div>

          <div className="glass-card rounded-lg border border-dark-border bg-dark-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <h3 className="text-sm font-medium text-gray-400">
                Total Revenue
              </h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatPrice(
                conversionStats.boost_revenue + conversionStats.premium_revenue,
              )}
            </p>
            <p className="text-sm text-gray-500 mt-1">All time</p>
          </div>

          <div className="glass-card rounded-lg border border-dark-border bg-dark-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-cyan-500" />
              <h3 className="text-sm font-medium text-gray-400">
                Conversion Rate
              </h3>
            </div>
            <p className="text-2xl font-bold text-white">
              {conversionStats.conversion_rate.toFixed(2)}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Users to premium</p>
          </div>
        </div>
      )}

      {/* Category Stats */}
      <div className="glass-card rounded-lg border border-dark-border bg-dark-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Popular Categories
        </h3>
        <div className="space-y-4">
          {categoryStats.slice(0, 10).map((category) => {
            const widthPercentage = Math.min(category.percentage, 100);
            return (
              <div key={category.category_id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {category.category_name}
                  </span>
                  <span className="text-sm text-gray-400">
                    {category.listing_count} listings (
                    {category.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-dark-bg rounded-full h-2 overflow-hidden">
                  {/* 
                    Note: Inline style is intentionally used here for dynamic width.
                    This is the correct approach for percentage-based progress bars.
                    The linter warning can be safely ignored in this case.
                  */}
                  <div
                    className="bg-gradient-to-r from-naija-green to-neon-cyan h-2 rounded-full transition-all"
                    data-width={widthPercentage}
                    style={{ width: `${widthPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engagement Trends - Placeholder */}
      <div className="glass-card rounded-lg border border-dark-border bg-dark-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Engagement Trends
        </h3>
        <p className="text-gray-400 text-sm">
          Detailed engagement charts will be available with Recharts
          integration.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-dark-bg rounded-lg">
            <p className="text-sm text-gray-400">New Users (30d)</p>
            <p className="text-2xl font-bold text-white mt-2">Coming soon</p>
          </div>
          <div className="p-4 bg-dark-bg rounded-lg">
            <p className="text-sm text-gray-400">New Listings (30d)</p>
            <p className="text-2xl font-bold text-white mt-2">Coming soon</p>
          </div>
          <div className="p-4 bg-dark-bg rounded-lg">
            <p className="text-sm text-gray-400">Messages Sent (30d)</p>
            <p className="text-2xl font-bold text-white mt-2">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
