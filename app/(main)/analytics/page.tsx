"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Eye,
  TrendingUp,
  Crown,
  Loader2,
  MessageSquare,
  ShoppingCart,
  Clock,
  MapPin,
  Download,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Target,
  Globe,
  Search,
  Share2,
  ExternalLink,
} from "lucide-react";
import type { AnalyticsDashboardData } from "@/lib/types";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    overview: true,
    listings: true,
    geographic: false,
    traffic: false,
    comparison: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/analytics/dashboard");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch analytics");
        }

        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load analytics",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/analytics/export");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to export analytics");
      }

      // Download the CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `findam-analytics-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export analytics");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-naija-orange animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <Crown className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <a
            href="/premium"
            className="inline-block px-6 py-3 bg-gradient-to-r from-naija-orange to-neon-pink rounded-lg text-white font-semibold hover:opacity-90"
          >
            Upgrade to Premium
          </a>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-bg py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-6 h-6 text-naija-orange" />
                <span className="text-sm font-medium text-naija-orange">
                  Seller Analytics Dashboard
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Performance Insights
              </h1>
              <p className="text-gray-400">
                Track your sales metrics, conversions, and customer engagement
              </p>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-naija-orange hover:bg-naija-orange/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export CSV
            </button>
          </div>
        </motion.div>

        {/* Overview Metrics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Overview Metrics</h2>
            <button
              onClick={() => toggleSection("overview")}
              className="text-gray-400 hover:text-white"
            >
              {expandedSections.overview ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>

          {expandedSections.overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-neon-cyan" />
                  <span className="text-xs text-gray-400">Total Views</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {data.overview.totalViews.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.overview.totalImpressions.toLocaleString()} impressions
                </p>
              </div>

              <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-naija-orange" />
                  <span className="text-xs text-gray-400">CTR</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {data.overview.clickThroughRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Click-through rate</p>
              </div>

              <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-naija-green" />
                  <span className="text-xs text-gray-400">Conversion</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {data.overview.conversionRate.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Views to sales</p>
              </div>

              <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-neon-pink" />
                  <span className="text-xs text-gray-400">Revenue</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ₦{data.overview.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ₦{data.overview.averageOrderValue.toFixed(0)} avg order
                </p>
              </div>

              <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400">Response Time</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {data.overview.averageResponseTime < 60
                    ? `${Math.round(data.overview.averageResponseTime)}m`
                    : `${(data.overview.averageResponseTime / 60).toFixed(1)}h`}
                </p>
                <p className="text-xs text-gray-500 mt-1">Average response</p>
              </div>

              <div className="bg-dark-card border border-dark-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">Response Rate</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {data.overview.responseRate.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Messages answered</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Listing Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-card border border-dark-border rounded-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              Top Performing Listings
            </h2>
            <button
              onClick={() => toggleSection("listings")}
              className="text-gray-400 hover:text-white"
            >
              {expandedSections.listings ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>

          {expandedSections.listings && (
            <div className="overflow-x-auto">
              {data.listingPerformance.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No listings yet. Create your first listing to see analytics!
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-border">
                      <th className="text-left text-xs text-gray-400 font-medium pb-3">
                        Listing
                      </th>
                      <th className="text-right text-xs text-gray-400 font-medium pb-3">
                        Views
                      </th>
                      <th className="text-right text-xs text-gray-400 font-medium pb-3">
                        CTR
                      </th>
                      <th className="text-right text-xs text-gray-400 font-medium pb-3">
                        Messages
                      </th>
                      <th className="text-right text-xs text-gray-400 font-medium pb-3">
                        Sales
                      </th>
                      <th className="text-right text-xs text-gray-400 font-medium pb-3">
                        Conv. Rate
                      </th>
                      <th className="text-right text-xs text-gray-400 font-medium pb-3">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.listingPerformance.slice(0, 10).map((listing) => (
                      <tr
                        key={listing.listingId}
                        className="border-b border-dark-border/50 hover:bg-dark-bg/50"
                      >
                        <td className="py-3 text-white text-sm max-w-xs truncate">
                          {listing.title}
                        </td>
                        <td className="py-3 text-right text-gray-300 text-sm">
                          {listing.views.toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-gray-300 text-sm">
                          {listing.ctr.toFixed(1)}%
                        </td>
                        <td className="py-3 text-right text-gray-300 text-sm">
                          {listing.messages}
                        </td>
                        <td className="py-3 text-right text-gray-300 text-sm">
                          {listing.sales}
                        </td>
                        <td className="py-3 text-right text-gray-300 text-sm">
                          {listing.conversionRate.toFixed(2)}%
                        </td>
                        <td className="py-3 text-right text-gray-300 text-sm">
                          ₦{listing.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </motion.div>

        {/* Geographic Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-dark-card border border-dark-border rounded-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-naija-orange" />
              <h2 className="text-xl font-bold text-white">
                Geographic Breakdown
              </h2>
            </div>
            <button
              onClick={() => toggleSection("geographic")}
              className="text-gray-400 hover:text-white"
            >
              {expandedSections.geographic ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>

          {expandedSections.geographic && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">
                  By State
                </h3>
                <div className="space-y-2">
                  {Object.entries(data.geographic.state)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([state, count]) => (
                      <div key={state} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-white">{state}</span>
                            <span className="text-sm text-gray-400">
                              {count}
                            </span>
                          </div>
                          <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-naija-orange to-neon-pink"
                              style={{
                                width: `${(count / Math.max(...Object.values(data.geographic.state))) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  {Object.keys(data.geographic.state).length === 0 && (
                    <p className="text-gray-400 text-sm">
                      No geographic data yet
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">
                  By City
                </h3>
                <div className="space-y-2">
                  {Object.entries(data.geographic.city)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([city, count]) => (
                      <div key={city} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-white">{city}</span>
                            <span className="text-sm text-gray-400">
                              {count}
                            </span>
                          </div>
                          <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-neon-cyan to-neon-pink"
                              style={{
                                width: `${(count / Math.max(...Object.values(data.geographic.city))) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  {Object.keys(data.geographic.city).length === 0 && (
                    <p className="text-gray-400 text-sm">
                      No geographic data yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Traffic Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-dark-card border border-dark-border rounded-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-neon-cyan" />
              <h2 className="text-xl font-bold text-white">Traffic Sources</h2>
            </div>
            <button
              onClick={() => toggleSection("traffic")}
              className="text-gray-400 hover:text-white"
            >
              {expandedSections.traffic ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>

          {expandedSections.traffic && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400">Direct</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {data.trafficSources.direct.toLocaleString()}
                </p>
              </div>

              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400">Search</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {data.trafficSources.search.toLocaleString()}
                </p>
              </div>

              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400">Social</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {data.trafficSources.social.toLocaleString()}
                </p>
              </div>

              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-400">Referral</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {data.trafficSources.referral.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Category Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-dark-card border border-dark-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-naija-green" />
              <h2 className="text-xl font-bold text-white">
                Category Averages
              </h2>
            </div>
            <button
              onClick={() => toggleSection("comparison")}
              className="text-gray-400 hover:text-white"
            >
              {expandedSections.comparison ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>

          {expandedSections.comparison && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Average Price</p>
                <p className="text-2xl font-bold text-white">
                  ₦{data.categoryAverages.averagePrice.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">In your category</p>
              </div>

              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Average Views</p>
                <p className="text-2xl font-bold text-white">
                  {Math.round(data.categoryAverages.averageViews)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per listing</p>
              </div>

              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Average Sales</p>
                <p className="text-2xl font-bold text-white">
                  {data.categoryAverages.averageSales.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Per listing</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Time Series Chart Placeholder */}
        {data.timeSeries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-dark-card border border-dark-border rounded-xl p-6 mt-8"
          >
            <h2 className="text-xl font-bold text-white mb-4">
              Performance Over Time (Last 30 Days)
            </h2>
            <div className="h-64 flex items-center justify-center border border-dashed border-dark-border rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  Time series chart visualization
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Install a charting library to visualize trends
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
