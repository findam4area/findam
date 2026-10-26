"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Performance monitoring dashboard for admins
 * Requirements: Performance optimization
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: string;
}

interface PerformanceAggregates {
  count: number;
  average: number;
  p50: number;
  p75: number;
  p95: number;
  p99: number;
  good: number;
  needsImprovement: number;
  poor: number;
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [aggregates, setAggregates] = useState<PerformanceAggregates | null>(
    null,
  );
  const [selectedMetric, setSelectedMetric] = useState<string>("LCP");
  const [period, setPeriod] = useState<"1d" | "7d" | "30d">("7d");
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/performance?metric=${selectedMetric}&period=${period}`,
      );
      const data = await response.json();

      setMetrics(data.metrics || []);
      setAggregates(data.aggregates || null);
    } catch (error) {
      console.error("Failed to fetch performance metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMetric, period]);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "good":
        return "text-green-600";
      case "needs-improvement":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getRatingBg = (rating: string) => {
    switch (rating) {
      case "good":
        return "bg-green-100";
      case "needs-improvement":
        return "bg-yellow-100";
      case "poor":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  const formatValue = (value: number, metric: string) => {
    if (metric === "CLS") {
      return value.toFixed(3);
    }
    return `${Math.round(value)}ms`;
  };

  const coreMetrics = ["LCP", "FID", "CLS", "FCP", "TTFB", "INP"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Monitoring</h2>

        <div className="flex gap-4">
          {/* Period selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="rounded-md border border-gray-300 px-3 py-2"
            aria-label="Select time period"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>

          {/* Metric selector */}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2"
            aria-label="Select performance metric"
          >
            {coreMetrics.map((metric) => (
              <option key={metric} value={metric}>
                {metric}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Core Web Vitals Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {coreMetrics.map((metric) => (
          <Card
            key={metric}
            className={`cursor-pointer transition-all ${selectedMetric === metric ? "ring-2 ring-primary" : ""}`}
            onClick={() => setSelectedMetric(metric)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{metric}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading
                  ? "..."
                  : aggregates
                    ? formatValue(aggregates.p75, metric)
                    : "N/A"}
              </div>
              <p className="text-xs text-gray-500">P75</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Metrics */}
      {aggregates && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatValue(aggregates.average, selectedMetric)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">P50 (Median)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatValue(aggregates.p50, selectedMetric)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">P95</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatValue(aggregates.p95, selectedMetric)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">P99</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatValue(aggregates.p99, selectedMetric)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Distribution */}
      {aggregates && (
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Good</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-48 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${Math.min(100, (aggregates.good / aggregates.count) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {aggregates.good} (
                    {Math.round((aggregates.good / aggregates.count) * 100)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Needs Improvement</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-48 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-yellow-500 transition-all"
                      style={{
                        width: `${Math.min(100, (aggregates.needsImprovement / aggregates.count) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {aggregates.needsImprovement} (
                    {Math.round(
                      (aggregates.needsImprovement / aggregates.count) * 100,
                    )}
                    %)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Poor</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-48 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{
                        width: `${Math.min(100, (aggregates.poor / aggregates.count) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {aggregates.poor} (
                    {Math.round((aggregates.poor / aggregates.count) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {loading ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : metrics.length === 0 ? (
              <p className="text-center text-gray-500">No data available</p>
            ) : (
              metrics.slice(0, 10).map((metric, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <span className="font-medium">{metric.name}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(metric.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {formatValue(metric.value, metric.name)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getRatingBg(metric.rating)} ${getRatingColor(metric.rating)}`}
                    >
                      {metric.rating}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
