/**
 * GET /api/admin/analytics/businesses
 * Admin endpoint to retrieve business analytics summary
 * Task 15.4: Create GET /api/admin/analytics/businesses endpoint
 * Requirement: 20.1
 *
 * This endpoint provides:
 * - Total businesses, verified businesses, premium businesses
 * - Average completeness across all businesses
 * - Businesses grouped by category
 * - Businesses grouped by state
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";

interface BusinessAnalyticsSummary {
  total_businesses: number;
  verified_businesses: number;
  premium_businesses: number;
  active_businesses: number;
  average_completeness: number;
  businesses_by_category: CategoryBreakdown[];
  businesses_by_state: StateBreakdown[];
}

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

    console.log("[AdminAnalytics] Fetching business analytics summary");

    // Step 1: Get total businesses count
    const { count: totalBusinesses, error: totalError } = await supabase
      .from("business_profiles")
      .select("*", { count: "exact", head: true });

    if (totalError) {
      console.error("[AdminAnalytics] Error counting total businesses:", totalError);
      return NextResponse.json(
        { error: "Failed to fetch business analytics" },
        { status: 500 },
      );
    }

    // Step 2: Get verified businesses count
    const { count: verifiedBusinesses, error: verifiedError } = await supabase
      .from("business_profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", true);

    if (verifiedError) {
      console.error("[AdminAnalytics] Error counting verified businesses:", verifiedError);
    }

    // Step 3: Get premium businesses count
    const { count: premiumBusinesses, error: premiumError } = await supabase
      .from("business_profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_premium", true);

    if (premiumError) {
      console.error("[AdminAnalytics] Error counting premium businesses:", premiumError);
    }

    // Step 4: Get active businesses count
    const { count: activeBusinesses, error: activeError } = await supabase
      .from("business_profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (activeError) {
      console.error("[AdminAnalytics] Error counting active businesses:", activeError);
    }

    // Step 5: Calculate average completeness
    const { data: completenessData, error: completenessError } = await supabase
      .from("business_profiles")
      .select("completeness_percentage");

    if (completenessError) {
      console.error("[AdminAnalytics] Error fetching completeness data:", completenessError);
    }

    const averageCompleteness =
      completenessData && completenessData.length > 0
        ? completenessData.reduce(
            (sum, profile) => sum + (profile.completeness_percentage || 0),
            0,
          ) / completenessData.length
        : 0;

    // Step 6: Group businesses by category (using primary category)
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name");

    if (categoriesError) {
      console.error("[AdminAnalytics] Error fetching categories:", categoriesError);
    }

    const businessesByCategory: CategoryBreakdown[] = [];

    if (categories) {
      for (const category of categories) {
        const { count: categoryCount, error: categoryCountError } = await supabase
          .from("business_profiles")
          .select("*", { count: "exact", head: true })
          .eq("primary_category_id", category.id);

        if (categoryCountError) {
          console.error(
            `[AdminAnalytics] Error counting businesses for category ${category.id}:`,
            categoryCountError,
          );
          continue;
        }

        const percentage =
          totalBusinesses && totalBusinesses > 0
            ? ((categoryCount || 0) / totalBusinesses) * 100
            : 0;

        businessesByCategory.push({
          category_id: category.id,
          category_name: category.name,
          business_count: categoryCount || 0,
          percentage: Math.round(percentage * 100) / 100,
        });
      }
    }

    // Sort by business count descending
    businessesByCategory.sort((a, b) => b.business_count - a.business_count);

    // Step 7: Group businesses by state
    const { data: statesData, error: statesError } = await supabase
      .from("business_profiles")
      .select("state");

    if (statesError) {
      console.error("[AdminAnalytics] Error fetching states data:", statesError);
    }

    const stateCountMap = new Map<string, number>();
    for (const profile of statesData || []) {
      if (profile.state) {
        const current = stateCountMap.get(profile.state) || 0;
        stateCountMap.set(profile.state, current + 1);
      }
    }

    const businessesByState: StateBreakdown[] = Array.from(stateCountMap.entries())
      .map(([state, count]) => ({
        state,
        business_count: count,
        percentage:
          totalBusinesses && totalBusinesses > 0
            ? Math.round((count / totalBusinesses) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.business_count - a.business_count);

    // Step 8: Compile summary
    const summary: BusinessAnalyticsSummary = {
      total_businesses: totalBusinesses || 0,
      verified_businesses: verifiedBusinesses || 0,
      premium_businesses: premiumBusinesses || 0,
      active_businesses: activeBusinesses || 0,
      average_completeness: Math.round(averageCompleteness * 100) / 100,
      businesses_by_category: businessesByCategory,
      businesses_by_state: businessesByState,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[AdminAnalytics] Error fetching business analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
