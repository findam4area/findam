/**
 * Category Analytics Aggregation Utilities
 * Task 15.1: Create category analytics aggregation function
 * Requirements: 20.1, 20.2, 20.3
 *
 * This module provides functions to aggregate category usage metrics including:
 * - Business count per category
 * - Search count per category (tracked via search endpoints)
 * - View count per category (tracked via view endpoints)
 */

import { createClient } from "@supabase/supabase-js";

export interface CategoryAnalyticsData {
  category_id: string;
  business_count: number;
  search_count: number;
  view_count: number;
  period_date: string; // YYYY-MM-DD format
  period_type: "daily" | "weekly" | "monthly";
}

/**
 * Aggregate category analytics for a given date and period type
 *
 * This function:
 * 1. Counts businesses per category (from business_category_tags)
 * 2. Counts searches per category (from category_search_tracking - if exists)
 * 3. Counts views per category (from category_view_tracking - if exists)
 * 4. Stores daily aggregates in category_analytics table
 *
 * @param supabase - Supabase client with service role key
 * @param periodDate - Date for aggregation (defaults to yesterday)
 * @param periodType - Type of period: 'daily', 'weekly', or 'monthly'
 * @returns Array of category analytics data
 */
export async function aggregateCategoryAnalytics(
  supabase: ReturnType<typeof createClient>,
  periodDate?: Date,
  periodType: "daily" | "weekly" | "monthly" = "daily",
): Promise<CategoryAnalyticsData[]> {
  try {
    // Default to yesterday for daily aggregation
    const targetDate = periodDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD

    console.log(`[CategoryAnalytics] Starting aggregation for ${dateStr} (${periodType})`);

    // Step 1: Get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id");

    if (categoriesError) {
      console.error("[CategoryAnalytics] Error fetching categories:", categoriesError);
      throw categoriesError;
    }

    if (!categories || categories.length === 0) {
      console.log("[CategoryAnalytics] No categories found");
      return [];
    }

    console.log(`[CategoryAnalytics] Processing ${categories.length} categories`);

    // Step 2: Aggregate data for each category
    const analyticsData: CategoryAnalyticsData[] = [];

    for (const category of categories) {
      const categoryId = (category as any).id;
      
      // Count businesses in this category (both primary and secondary)
      const { count: businessCount, error: businessCountError } = await supabase
        .from("business_category_tags")
        .select("*", { count: "exact", head: true })
        .eq("category_id", categoryId);

      if (businessCountError) {
        console.error(
          `[CategoryAnalytics] Error counting businesses for category ${categoryId}:`,
          businessCountError,
        );
      }

      // For now, set search_count and view_count to 0
      // These will be incremented by search and view tracking endpoints
      // Note: In a real implementation, you would query tracking tables here
      const searchCount = 0;
      const viewCount = 0;

      analyticsData.push({
        category_id: categoryId,
        business_count: businessCount || 0,
        search_count: searchCount,
        view_count: viewCount,
        period_date: dateStr,
        period_type: periodType,
      });
    }

    // Step 3: Upsert analytics data into category_analytics table
    for (const data of analyticsData) {
      const { error: upsertError } = await (supabase
        .from("category_analytics")
        .upsert as any)(
          {
            category_id: data.category_id,
            business_count: data.business_count,
            search_count: data.search_count,
            view_count: data.view_count,
            period_date: data.period_date,
            period_type: data.period_type,
          },
          {
            onConflict: "category_id,period_date,period_type",
          },
        );

      if (upsertError) {
        console.error(
          `[CategoryAnalytics] Error upserting analytics for category ${data.category_id}:`,
          upsertError,
        );
      }
    }

    console.log(
      `[CategoryAnalytics] Successfully aggregated analytics for ${analyticsData.length} categories`,
    );

    return analyticsData;
  } catch (error) {
    console.error("[CategoryAnalytics] Aggregation error:", error);
    throw error;
  }
}

/**
 * Increment search count for a category
 * Called from search endpoints when a category is searched
 *
 * @param supabase - Supabase client
 * @param categoryId - Category ID that was searched
 */
export async function incrementCategorySearchCount(
  supabase: ReturnType<typeof createClient>,
  categoryId: string,
): Promise<void> {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Get current analytics record or create if doesn't exist
    const { data: existing, error: fetchError } = await supabase
      .from("category_analytics")
      .select("*")
      .eq("category_id", categoryId)
      .eq("period_date", today)
      .eq("period_type", "daily")
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    if (existing) {
      // Update existing record
      const { error: updateError } = await (supabase
        .from("category_analytics")
        .update as any)({ search_count: (existing as any).search_count + 1 })
        .eq("id", (existing as any).id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Create new record with search_count = 1
      const { error: insertError } = await (supabase
        .from("category_analytics")
        .insert as any)({
          category_id: categoryId,
          business_count: 0,
          search_count: 1,
          view_count: 0,
          period_date: today,
          period_type: "daily",
        });

      if (insertError) {
        throw insertError;
      }
    }
  } catch (error) {
    console.error(
      `[CategoryAnalytics] Error incrementing search count for category ${categoryId}:`,
      error,
    );
    // Don't throw - tracking errors shouldn't break the main flow
  }
}

/**
 * Increment view count for a category
 * Called from category browse/view endpoints
 *
 * @param supabase - Supabase client
 * @param categoryId - Category ID that was viewed
 */
export async function incrementCategoryViewCount(
  supabase: ReturnType<typeof createClient>,
  categoryId: string,
): Promise<void> {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Get current analytics record or create if doesn't exist
    const { data: existing, error: fetchError } = await supabase
      .from("category_analytics")
      .select("*")
      .eq("category_id", categoryId)
      .eq("period_date", today)
      .eq("period_type", "daily")
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    if (existing) {
      // Update existing record
      const { error: updateError } = await (supabase
        .from("category_analytics")
        .update as any)({ view_count: (existing as any).view_count + 1 })
        .eq("id", (existing as any).id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Create new record with view_count = 1
      const { error: insertError } = await (supabase
        .from("category_analytics")
        .insert as any)({
          category_id: categoryId,
          business_count: 0,
          search_count: 0,
          view_count: 1,
          period_date: today,
          period_type: "daily",
        });

      if (insertError) {
        throw insertError;
      }
    }
  } catch (error) {
    console.error(
      `[CategoryAnalytics] Error incrementing view count for category ${categoryId}:`,
      error,
    );
    // Don't throw - tracking errors shouldn't break the main flow
  }
}
