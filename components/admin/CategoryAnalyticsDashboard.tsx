"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, Search, AlertCircle, Loader2, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface CategoryAnalytics {
  category_id: string;
  category_name: string;
  business_count: number;
  search_count: number;
  view_count: number;
}

interface TrendingCategory extends CategoryAnalytics {
  growth_percentage: number;
  previous_business_count: number;
}

interface EmptyCategory {
  category_id: string;
  category_name: string;
  parent_id: string | null;
}

interface AnalyticsData {
  date_range: {
    start: string;
    end: string;
  };
  period_type: string;
  top_by_business_count: CategoryAnalytics[];
  top_by_search_count: CategoryAnalytics[];
  empty_categories: EmptyCategory[];
  trending_categories: TrendingCategory[];
  total_categories: number;
}

/**
 * CategoryAnalyticsDashboard Component
 * Task 23.3: Create CategoryAnalyticsDashboard component
 * Requirements: 20.4, 20.5, 20.6
 * 
 * Features:
 * - Display top 10 categories by business count
 * - Display top 10 categories by search count
 * - Display empty categories list
 * - Display trending categories with growth percentage
 * - Call GET /api/admin/analytics/categories
 */
export function CategoryAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/analytics/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch category analytics");
      }
      const data: AnalyticsData = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load category analytics"
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

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Categories</CardDescription>
            <CardTitle className="text-3xl">{analytics.total_categories}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Categories with Businesses</CardDescription>
            <CardTitle className="text-3xl">
              {analytics.total_categories - analytics.empty_categories.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Empty Categories</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {analytics.empty_categories.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories by Business Count - Requirement 20.4 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Categories by Business Count
            </CardTitle>
            <CardDescription>
              Categories with the most registered businesses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.top_by_business_count.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data available
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.top_by_business_count.map((category, index) => (
                  <div key={category.category_id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
                            index === 0 && "bg-yellow-500 text-white",
                            index === 1 && "bg-gray-400 text-white",
                            index === 2 && "bg-orange-600 text-white",
                            index > 2 && "bg-muted text-muted-foreground"
                          )}
                        >
                          {index + 1}
                        </span>
                        <span className="font-medium">{category.category_name}</span>
                      </span>
                      <span className="font-semibold text-naija-green">
                        {category.business_count}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-naija-green rounded-full transition-all"
                        style={{
                          width: `${(category.business_count / analytics.top_by_business_count[0].business_count) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Categories by Search Count - Requirement 20.5 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Top Categories by Search Count
            </CardTitle>
            <CardDescription>
              Most searched categories by users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.top_by_search_count.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data available
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.top_by_search_count.map((category, index) => (
                  <div key={category.category_id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
                            index === 0 && "bg-yellow-500 text-white",
                            index === 1 && "bg-gray-400 text-white",
                            index === 2 && "bg-orange-600 text-white",
                            index > 2 && "bg-muted text-muted-foreground"
                          )}
                        >
                          {index + 1}
                        </span>
                        <span className="font-medium">{category.category_name}</span>
                      </span>
                      <span className="font-semibold text-blue-600">
                        {category.search_count}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{
                          width: `${(category.search_count / analytics.top_by_search_count[0].search_count) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trending Categories - Requirement 20.6 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Trending Categories
            </CardTitle>
            <CardDescription>
              Categories with highest growth in businesses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.trending_categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No trending data available
              </p>
            ) : (
              <div className="space-y-2">
                {analytics.trending_categories.map((category) => (
                  <div
                    key={category.category_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {category.category_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.previous_business_count} → {category.business_count}{" "}
                        businesses
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
                        category.growth_percentage > 50
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      )}
                    >
                      <TrendingUp className="w-3 h-3" />
                      +{category.growth_percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Empty Categories - Requirement 20.6 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Empty Categories
            </CardTitle>
            <CardDescription>
              Categories with no businesses assigned
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.empty_categories.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✓ All categories have businesses!
                </p>
              </div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {analytics.empty_categories.map((category) => (
                  <div
                    key={category.category_id}
                    className="p-2 rounded bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800"
                  >
                    <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      {category.category_name}
                    </div>
                    {category.parent_id && (
                      <div className="text-xs text-yellow-600 dark:text-yellow-400">
                        Subcategory
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Date Range Info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground text-center">
            Analytics period: {analytics.date_range.start} to{" "}
            {analytics.date_range.end} ({analytics.period_type})
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
