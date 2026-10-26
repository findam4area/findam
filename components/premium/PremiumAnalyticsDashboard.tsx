"use client";

/**
 * PremiumAnalyticsDashboard Component
 * Displays enhanced analytics for premium business profiles
 * Requirements: 15.4
 * Tasks: 22.4
 */

import { useEffect, useState } from "react";
import {
  Eye,
  MousePointerClick,
  TrendingUp,
  Users,
  Calendar,
  Loader2,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface PremiumAnalyticsDashboardProps {
  businessProfileId: string;
  className?: string;
}

interface AnalyticsData {
  view_count: number;
  click_through_rate: number;
  engagement_metrics: {
    profile_views_last_7_days: number;
    profile_views_last_30_days: number;
    product_clicks: number;
    service_clicks: number;
    contact_clicks: number;
    website_clicks: number;
  };
  trending_products?: Array<{
    id: string;
    title: string;
    views: number;
    clicks: number;
  }>;
  trending_services?: Array<{
    id: string;
    title: string;
    views: number;
    clicks: number;
  }>;
  visitor_demographics?: {
    cities: Array<{ name: string; count: number }>;
    states: Array<{ name: string; count: number }>;
  };
}

export function PremiumAnalyticsDashboard({
  businessProfileId,
  className,
}: PremiumAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/business-profiles/${businessProfileId}/analytics?timeRange=${timeRange}`,
        );

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Premium subscription required to access analytics");
          }
          throw new Error("Failed to fetch analytics data");
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [businessProfileId, timeRange]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-semibold mb-2">Unable to Load Analytics</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    description,
  }: {
    title: string;
    value: string | number;
    icon: typeof Eye;
    trend?: string;
    description?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            {trend}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList>
            <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
            <TabsTrigger value="90d">Last 90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Views"
          value={analytics.view_count.toLocaleString()}
          icon={Eye}
          description="Profile page views"
        />
        <MetricCard
          title="Click-Through Rate"
          value={`${analytics.click_through_rate.toFixed(2)}%`}
          icon={MousePointerClick}
          description="Visitors who clicked your content"
        />
        <MetricCard
          title="Engagement Score"
          value={
            (
              (analytics.engagement_metrics.product_clicks +
                analytics.engagement_metrics.service_clicks +
                analytics.engagement_metrics.contact_clicks) /
              Math.max(analytics.view_count, 1)
            ).toFixed(2)
          }
          icon={TrendingUp}
          description="Average actions per visitor"
        />
        <MetricCard
          title="Recent Activity"
          value={analytics.engagement_metrics.profile_views_last_7_days}
          icon={Calendar}
          trend="Last 7 days"
        />
      </div>

      {/* Detailed Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Engagement Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Product Clicks</p>
              <p className="text-2xl font-bold">
                {analytics.engagement_metrics.product_clicks}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Service Clicks</p>
              <p className="text-2xl font-bold">
                {analytics.engagement_metrics.service_clicks}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Contact Clicks</p>
              <p className="text-2xl font-bold">
                {analytics.engagement_metrics.contact_clicks}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Website Visits</p>
              <p className="text-2xl font-bold">
                {analytics.engagement_metrics.website_clicks}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Views (7 Days)</p>
              <p className="text-2xl font-bold">
                {analytics.engagement_metrics.profile_views_last_7_days}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Views (30 Days)</p>
              <p className="text-2xl font-bold">
                {analytics.engagement_metrics.profile_views_last_30_days}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trending Products/Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analytics.trending_products && analytics.trending_products.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Trending Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.trending_products.slice(0, 5).map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.views} views · {product.clicks} clicks
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {analytics.trending_services && analytics.trending_services.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Trending Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.trending_services.slice(0, 5).map((service, index) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{service.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.views} views · {service.clicks} clicks
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Visitor Demographics */}
      {analytics.visitor_demographics && (
        <Card>
          <CardHeader>
            <CardTitle>Visitor Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analytics.visitor_demographics.cities &&
                analytics.visitor_demographics.cities.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Top Cities</h4>
                    <div className="space-y-2">
                      {analytics.visitor_demographics.cities
                        .slice(0, 5)
                        .map((city) => (
                          <div
                            key={city.name}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">{city.name}</span>
                            <span className="text-sm font-medium">
                              {city.count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {analytics.visitor_demographics.states &&
                analytics.visitor_demographics.states.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Top States</h4>
                    <div className="space-y-2">
                      {analytics.visitor_demographics.states
                        .slice(0, 5)
                        .map((state) => (
                          <div
                            key={state.name}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">{state.name}</span>
                            <span className="text-sm font-medium">
                              {state.count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
