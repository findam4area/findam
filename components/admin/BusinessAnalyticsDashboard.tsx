"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  ShieldCheck,
  Crown,
  Activity,
  TrendingUp,
  MapPin,
  AlertCircle,
  Loader2,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  business_count: number;
  percentage: number;
}

interface StateBreakdown {
  state: string;
  business_count: number;
  percentage: number;
}

interface BusinessAnalytics {
  total_businesses: number;
  verified_businesses: number;
  premium_businesses: number;
  active_businesses: number;
  average_completeness: number;
  businesses_by_category: CategoryBreakdown[];
  businesses_by_state: StateBreakdown[];
}

/**
 * BusinessAnalyticsDashboard Component
 * Task 23.4: Create BusinessAnalyticsDashboard component
 * Requirement: 20.1
 * 
 * Features:
 * - Display total businesses, verified, premium counts
 * - Display average completeness percentage
 * - Display businesses by category chart
 * - Display businesses by state chart
 * - Call GET /api/admin/analytics/businesses
 */
export function BusinessAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/analytics/businesses");
      if (!response.ok) {
        throw new Error("Failed to fetch business analytics");
      }
      const data: BusinessAnalytics = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load business analytics"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No analytics data available</AlertDescription>
      </Alert>
    );
  }

  const verificationRate =
    analytics.total_businesses > 0
      ? (analytics.verified_businesses / analytics.total_businesses) * 100
      : 0;

  const premiumRate =
    analytics.total_businesses > 0
      ? (analytics.premium_businesses / analytics.total_businesses) * 100
      : 0;

  const activeRate =
    analytics.total_businesses > 0
      ? (analytics.active_businesses / analytics.total_businesses) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Businesses */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Businesses</CardDescription>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl">
              {analytics.total_businesses.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4" />
              {activeRate.toFixed(1)}% active
            </div>
          </CardContent>
        </Card>

        {/* Verified Businesses */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Verified Businesses</CardDescription>
              <ShieldCheck className="w-4 h-4 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-green-600">
              {analytics.verified_businesses.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all"
                  style={{ width: `${verificationRate}%` }}
                />
              </div>
              <span className="text-muted-foreground">
                {verificationRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Premium Businesses */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Premium Businesses</CardDescription>
              <Crown className="w-4 h-4 text-yellow-600" />
            </div>
            <CardTitle className="text-3xl text-yellow-600">
              {analytics.premium_businesses.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-yellow-600 rounded-full transition-all"
                  style={{ width: `${premiumRate}%` }}
                />
              </div>
              <span className="text-muted-foreground">
                {premiumRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Average Completeness */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Avg. Completeness</CardDescription>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <CardTitle className="text-3xl text-blue-600">
              {analytics.average_completeness.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${analytics.average_completeness}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  analytics.average_completeness >= 80
                    ? "text-green-600"
                    : analytics.average_completeness >= 50
                      ? "text-yellow-600"
                      : "text-red-600"
                )}
              >
                {analytics.average_completeness >= 80
                  ? "Excellent"
                  : analytics.average_completeness >= 50
                    ? "Good"
                    : "Needs Work"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Businesses by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Businesses by Category
            </CardTitle>
            <CardDescription>
              Distribution across top 10 categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.businesses_by_category.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data available
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.businesses_by_category.slice(0, 10).map((category) => (
                  <div key={category.category_id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate flex-1">
                        {category.category_name}
                      </span>
                      <span className="font-semibold text-naija-green ml-2">
                        {category.business_count}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-naija-green rounded-full transition-all"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {category.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Businesses by State */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Businesses by State
            </CardTitle>
            <CardDescription>
              Geographic distribution across top 10 states
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.businesses_by_state.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data available
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.businesses_by_state.slice(0, 10).map((state) => (
                  <div key={state.state} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{state.state}</span>
                      <span className="font-semibold text-blue-600">
                        {state.business_count}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${state.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {state.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {verificationRate.toFixed(1)}%
              </div>
              <div className="text-muted-foreground">Verification Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {premiumRate.toFixed(1)}%
              </div>
              <div className="text-muted-foreground">Premium Adoption</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {activeRate.toFixed(1)}%
              </div>
              <div className="text-muted-foreground">Active Businesses</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
