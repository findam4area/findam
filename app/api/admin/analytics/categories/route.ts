/**
 * GET /api/admin/analytics/categories
 * Admin endpoint to retrieve category analytics
 * Task 15.3: Create GET /api/admin/analytics/categories endpoint
 * Requirements: 20.4, 20.5, 20.6
 *
 * This endpoint provides:
 * - Top categories by business_count and search_count
 * - Empty categories (categories with 0 businesses)
 * - Trending categories (growth percentage)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";

interface CategoryAnalytics {
  category_id: string;
  category_name: string;
  parent_id: string | null;
  business_count: number;
  search_count: number;
  view_count: number;
  previous_business_count?: number;
  growth_percentage?: number;
}

interface EmptyCategory {
  category_id: string;
  category_name: string;
  parent_id: string | null;
}

interface TrendingCategory extends CategoryAnalytics {
  growth_percentage: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const authCheck = await checkAdminAuth(supabase);

    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error === "Unauthorized" ? 401 : 403 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const periodType = searchParams.get("period_type") || "daily";

    // Validate period_type
    if (!["daily", "weekly", "monthly"].includes(periodType)) {
      return NextResponse.json(
        { error: "Invalid period_type. Must be 'daily', 'weekly', or 'monthly'." },
        { status: 400 },
      );
    }

    // Build date filter
    const today = new Date().toISOString().split("T")[0];
    const dateFilter = {
      start: startDate || today,
      end: endDate || today,
    };

    console.log(`[AdminAnalytics] Fetching category analytics from ${dateFilter.start} to ${dateFilter.end}`);

    // Step 1: Get all categories with their names
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, parent_id");

    if (categoriesError) {
      console.error("[AdminAnalytics] Error fetching categories:", categoriesError);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 },
      );
    }

    // Step 2: Get analytics data for the specified date range
    let analyticsQuery = supabase
      .from("category_analytics")
      .select("*")
      .eq("period_type", periodType)
      .gte("period_date", dateFilter.start)
      .lte("period_date", dateFilter.end);

    const { data: analyticsData, error: analyticsError } =
      await analyticsQuery;

    if (analyticsError) {
      console.error("[AdminAnalytics] Error fetching analytics:", analyticsError);
      return NextResponse.json(
        { error: "Failed to fetch analytics data" },
        { status: 500 },
      );
    }

    // Step 3: Aggregate analytics by category (sum across date range)
    const categoryMap = new Map<string, CategoryAnalytics>();

    for (const category of categories || []) {
      categoryMap.set(category.id, {
        category_id: category.id,
        category_name: category.name,
        parent_id: category.parent_id,
        business_count: 0,
        search_count: 0,
        view_count: 0,
      });
    }

    // Sum up analytics across the date range
    for (const analytics of analyticsData || []) {
      const existing = categoryMap.get(analytics.category_id);
      if (existing) {
        existing.business_count += analytics.business_count || 0;
        existing.search_count += analytics.search_count || 0;
        existing.view_count += analytics.view_count || 0;
      }
    }

    const allCategoryAnalytics = Array.from(categoryMap.values());

    // Step 4: Top categories by business_count (Requirement 20.4)
    const topByBusinessCount = [...allCategoryAnalytics]
      .sort((a, b) => b.business_count - a.business_count)
      .slice(0, 10);

    // Step 5: Top categories by search_count (Requirement 20.5)
    const topBySearchCount = [...allCategoryAnalytics]
      .sort((a, b) => b.search_count - a.search_count)
      .slice(0, 10);

    // Step 6: Empty categories (categories with 0 businesses) (Requirement 20.6)
    const emptyCategories: EmptyCategory[] = allCategoryAnalytics
      .filter((cat) => cat.business_count === 0)
      .map((cat) => ({
        category_id: cat.category_id,
        category_name: cat.category_name,
        parent_id: cat.parent_id,
      }));

    // Step 7: Calculate trending categories (growth percentage)
    // Get previous period data for comparison
    const previousPeriodStart = getPreviousPeriodDate(dateFilter.start, periodType);
    const previousPeriodEnd = getPreviousPeriodDate(dateFilter.end, periodType);

    const { data: previousAnalyticsData } = await supabase
      .from("category_analytics")
      .select("*")
      .eq("period_type", periodType)
      .gte("period_date", previousPeriodStart)
      .lte("period_date", previousPeriodEnd);

    // Aggregate previous period data
    const previousCategoryMap = new Map<string, number>();
    for (const analytics of previousAnalyticsData || []) {
      const current = previousCategoryMap.get(analytics.category_id) || 0;
      previousCategoryMap.set(
        analytics.category_id,
        current + (analytics.business_count || 0),
      );
    }

    // Calculate growth percentages
    const trendingCategories: TrendingCategory[] = allCategoryAnalytics
      .map((cat) => {
        const previousCount = previousCategoryMap.get(cat.category_id) || 0;
        const growthPercentage =
          previousCount > 0
            ? ((cat.business_count - previousCount) / previousCount) * 100
            : cat.business_count > 0
              ? 100
              : 0;

        return {
          ...cat,
          previous_business_count: previousCount,
          growth_percentage: Math.round(growthPercentage * 100) / 100, // Round to 2 decimals
        };
      })
      .filter((cat) => cat.growth_percentage > 0) // Only show growing categories
      .sort((a, b) => b.growth_percentage - a.growth_percentage)
      .slice(0, 10);

    return NextResponse.json({
      date_range: dateFilter,
      period_type: periodType,
      top_by_business_count: topByBusinessCount,
      top_by_search_count: topBySearchCount,
      empty_categories: emptyCategories,
      trending_categories: trendingCategories,
      total_categories: allCategoryAnalytics.length,
    });
  } catch (error) {
    console.error("[AdminAnalytics] Error fetching category analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Calculate the previous period date based on period type
 */
function getPreviousPeriodDate(dateStr: string, periodType: string): string {
  const date = new Date(dateStr);

  switch (periodType) {
    case "daily":
      date.setDate(date.getDate() - 1);
      break;
    case "weekly":
      date.setDate(date.getDate() - 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() - 1);
      break;
  }

  return date.toISOString().split("T")[0];
}
