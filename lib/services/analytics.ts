/**
 * Analytics Service
 * Handles seller analytics operations including metrics calculation, geographic breakdowns, and data aggregation
 * Requirements: 10.1, 10.2, 10.3, 10.6, 10.7, 10.8, 10.9, 10.10
 */

import { createClient } from "@/lib/supabase/server";
import type {
  AnalyticsDashboardData,
  ListingMetrics,
  TimeSeriesData,
  AnalyticsFilters,
} from "@/lib/types";

export class AnalyticsService {
  /**
   * Get comprehensive analytics dashboard data for a seller
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9
   */
  async getDashboardData(
    userId: string,
    filters?: AnalyticsFilters,
  ): Promise<AnalyticsDashboardData> {
    const supabase = await createClient();

    // Default to last 30 days if no date range provided
    const endDate = filters?.end_date || new Date().toISOString().split("T")[0];
    const startDate =
      filters?.start_date ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    // Get all seller's listings
    const { data: listings, error: listingsError } = await (supabase as any)
      .from("listings")
      .select("id, title, category_id, price, views_count, created_at")
      .eq("user_id", userId);

    if (listingsError) {
      throw new Error(`Failed to fetch listings: ${listingsError.message}`);
    }

    if (!listings || listings.length === 0) {
      // Return empty dashboard data
      return this.getEmptyDashboardData();
    }

    const listingIds = listings.map((l: any) => l.id);

    // Get analytics data from seller_analytics table
    const { data: analyticsRecords, error: analyticsError } = await (
      supabase as any
    )
      .from("seller_analytics")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (analyticsError) {
      console.error("Analytics fetch error:", analyticsError);
      // Continue with empty analytics if table doesn't have data yet
    }

    // Calculate overview metrics
    const overview = await this.calculateOverviewMetrics(
      userId,
      listingIds,
      analyticsRecords || [],
    );

    // Get listing performance metrics
    const listingPerformance = await this.calculateListingMetrics(
      userId,
      listings,
      supabase,
    );

    // Get geographic breakdown
    const geographic = this.calculateGeographicBreakdown(
      analyticsRecords || [],
    );

    // Get time series data
    const timeSeries = this.calculateTimeSeriesData(analyticsRecords || []);

    // Get traffic sources
    const trafficSources = this.calculateTrafficSources(analyticsRecords || []);

    // Get category averages for comparison
    const categoryAverages = await this.calculateCategoryAverages(
      listings[0]?.category_id,
      supabase,
    );

    return {
      overview,
      listingPerformance,
      geographic,
      timeSeries,
      trafficSources,
      categoryAverages,
    };
  }

  /**
   * Calculate overview metrics
   * Requirements: 10.1, 10.2, 10.6
   */
  private async calculateOverviewMetrics(
    userId: string,
    listingIds: string[],
    analyticsRecords: any[],
  ): Promise<AnalyticsDashboardData["overview"]> {
    const supabase = await createClient();

    // Aggregate from analytics records
    const totalViews = analyticsRecords.reduce(
      (sum, record) => sum + (record.total_views || 0),
      0,
    );
    const totalImpressions = analyticsRecords.reduce(
      (sum, record) => sum + (record.total_impressions || 0),
      0,
    );
    const totalClicks = analyticsRecords.reduce(
      (sum, record) => sum + (record.total_clicks || 0),
      0,
    );

    // Calculate CTR (Requirement 10.1)
    const clickThroughRate =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Get total messages and sales for conversion rate (Requirement 10.2)
    const { count: totalMessages } = await (supabase as any)
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .in("listing_id", listingIds);

    const { count: totalSales } = await (supabase as any)
      .from("escrow_transactions")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", userId)
      .eq("status", "released");

    // Calculate conversion rate (views → sales) (Requirement 10.2)
    const conversionRate =
      totalViews > 0 ? (totalSales! / totalViews) * 100 : 0;

    // Calculate response metrics (Requirement 10.6)
    const { averageResponseTime, responseRate } =
      await this.calculateResponseMetrics(userId, supabase);

    // Calculate revenue metrics
    const { data: transactions } = await (supabase as any)
      .from("escrow_transactions")
      .select("amount")
      .eq("seller_id", userId)
      .eq("status", "released");

    const totalRevenue = transactions
      ? transactions.reduce((sum: number, t: any) => sum + t.amount, 0)
      : 0;

    const averageOrderValue =
      totalSales && totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      totalViews,
      totalImpressions,
      clickThroughRate,
      conversionRate,
      averageResponseTime,
      responseRate,
      totalRevenue,
      averageOrderValue,
    };
  }

  /**
   * Calculate response time and response rate metrics
   * Requirements: 10.6
   */
  private async calculateResponseMetrics(
    userId: string,
    supabase: any,
  ): Promise<{ averageResponseTime: number; responseRate: number }> {
    // Get all conversations where user is the seller
    const { data: conversations } = await supabase
      .from("conversations")
      .select(
        `
        id,
        created_at,
        listing_id,
        listings!inner(user_id)
      `,
      )
      .eq("listings.user_id", userId);

    if (!conversations || conversations.length === 0) {
      return { averageResponseTime: 0, responseRate: 0 };
    }

    let totalResponseTime = 0;
    let responsesCount = 0;
    let conversationsWithResponse = 0;

    // For each conversation, get first message from buyer and first response from seller
    for (const conv of conversations) {
      const { data: messages } = await supabase
        .from("messages")
        .select("sender_id, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true })
        .limit(10);

      if (!messages || messages.length < 2) continue;

      // Find first message from buyer (not the seller)
      const firstBuyerMessage = messages.find(
        (m: any) => m.sender_id !== userId,
      );
      if (!firstBuyerMessage) continue;

      // Find first response from seller after buyer's message
      const firstSellerResponse = messages.find(
        (m: any) =>
          m.sender_id === userId &&
          new Date(m.created_at) > new Date(firstBuyerMessage.created_at),
      );

      if (firstSellerResponse) {
        conversationsWithResponse++;
        const responseTime =
          new Date(firstSellerResponse.created_at).getTime() -
          new Date(firstBuyerMessage.created_at).getTime();
        totalResponseTime += responseTime;
        responsesCount++;
      }
    }

    // Average response time in minutes
    const averageResponseTime =
      responsesCount > 0 ? totalResponseTime / responsesCount / (1000 * 60) : 0;

    // Response rate percentage
    const responseRate =
      conversations.length > 0
        ? (conversationsWithResponse / conversations.length) * 100
        : 0;

    return { averageResponseTime, responseRate };
  }

  /**
   * Calculate per-listing metrics
   * Requirements: 10.1, 10.2
   */
  private async calculateListingMetrics(
    userId: string,
    listings: any[],
    supabase: any,
  ): Promise<ListingMetrics[]> {
    const metrics: ListingMetrics[] = [];

    for (const listing of listings) {
      // Get message count for this listing
      const { count: messageCount } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("listing_id", listing.id);

      // Get sales count for this listing
      const { count: salesCount } = await supabase
        .from("escrow_transactions")
        .select("*", { count: "exact", head: true })
        .eq("listing_id", listing.id)
        .eq("status", "released");

      // Get revenue for this listing
      const { data: transactions } = await supabase
        .from("escrow_transactions")
        .select("amount")
        .eq("listing_id", listing.id)
        .eq("status", "released");

      const revenue = transactions
        ? transactions.reduce((sum: number, t: any) => sum + t.amount, 0)
        : 0;

      // Calculate metrics
      const views = listing.views_count || 0;
      const impressions = views * 1.5; // Estimate: impressions are typically higher than views
      const ctr = impressions > 0 ? (views / impressions) * 100 : 0;
      const conversionRate = views > 0 ? ((salesCount || 0) / views) * 100 : 0;

      metrics.push({
        listingId: listing.id,
        title: listing.title,
        views,
        impressions: Math.round(impressions),
        ctr,
        messages: messageCount || 0,
        sales: salesCount || 0,
        conversionRate,
        revenue,
      });
    }

    // Sort by views descending
    return metrics.sort((a, b) => b.views - a.views);
  }

  /**
   * Calculate geographic breakdown
   * Requirements: 10.3
   */
  private calculateGeographicBreakdown(analyticsRecords: any[]): {
    state: Record<string, number>;
    city: Record<string, number>;
  } {
    const stateData: Record<string, number> = {};
    const cityData: Record<string, number> = {};

    for (const record of analyticsRecords) {
      if (record.geographic_data) {
        // Aggregate geographic data from all records
        for (const [location, count] of Object.entries(
          record.geographic_data,
        )) {
          // Assume format is "State" or "City, State"
          if (location.includes(",")) {
            // City format
            cityData[location] = (cityData[location] || 0) + (count as number);
            const state = location.split(",")[1].trim();
            stateData[state] = (stateData[state] || 0) + (count as number);
          } else {
            // State format
            stateData[location] =
              (stateData[location] || 0) + (count as number);
          }
        }
      }
    }

    return { state: stateData, city: cityData };
  }

  /**
   * Calculate time series data for past 30 days
   * Requirements: 10.4
   */
  private calculateTimeSeriesData(analyticsRecords: any[]): TimeSeriesData[] {
    const timeSeriesMap = new Map<string, TimeSeriesData>();

    // Initialize last 30 days with zero values
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      timeSeriesMap.set(date, {
        date,
        views: 0,
        sales: 0,
        revenue: 0,
      });
    }

    // Aggregate data from analytics records
    for (const record of analyticsRecords) {
      const date = record.date;
      const existing = timeSeriesMap.get(date);
      if (existing) {
        existing.views += record.total_views || 0;
        existing.sales += record.total_sales || 0;
        existing.revenue += record.total_revenue || 0;
      }
    }

    return Array.from(timeSeriesMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }

  /**
   * Calculate traffic sources breakdown
   * Requirements: 10.7
   */
  private calculateTrafficSources(analyticsRecords: any[]): {
    direct: number;
    search: number;
    social: number;
    referral: number;
  } {
    const sources = {
      direct: 0,
      search: 0,
      social: 0,
      referral: 0,
    };

    for (const record of analyticsRecords) {
      if (record.traffic_sources) {
        sources.direct += record.traffic_sources.direct || 0;
        sources.search += record.traffic_sources.search || 0;
        sources.social += record.traffic_sources.social || 0;
        sources.referral += record.traffic_sources.referral || 0;
      }
    }

    return sources;
  }

  /**
   * Calculate category average metrics for comparison
   * Requirements: 10.8, 10.9
   */
  private async calculateCategoryAverages(
    categoryId: string,
    supabase: any,
  ): Promise<{
    averagePrice: number;
    averageViews: number;
    averageSales: number;
  }> {
    if (!categoryId) {
      return { averagePrice: 0, averageViews: 0, averageSales: 0 };
    }

    // Get all listings in the same category
    const { data: categoryListings } = await supabase
      .from("listings")
      .select("id, price, views_count")
      .eq("category_id", categoryId)
      .eq("is_active", true);

    if (!categoryListings || categoryListings.length === 0) {
      return { averagePrice: 0, averageViews: 0, averageSales: 0 };
    }

    // Calculate average price (Requirement 10.8)
    const totalPrice = categoryListings.reduce(
      (sum: number, l: any) => sum + (l.price || 0),
      0,
    );
    const averagePrice = totalPrice / categoryListings.length;

    // Calculate average views
    const totalViews = categoryListings.reduce(
      (sum: number, l: any) => sum + (l.views_count || 0),
      0,
    );
    const averageViews = totalViews / categoryListings.length;

    // Calculate average sales (count of completed transactions per listing)
    const listingIds = categoryListings.map((l: any) => l.id);
    const { count: totalSales } = await supabase
      .from("escrow_transactions")
      .select("*", { count: "exact", head: true })
      .in("listing_id", listingIds)
      .eq("status", "released");

    const averageSales = (totalSales || 0) / categoryListings.length;

    return { averagePrice, averageViews, averageSales };
  }

  /**
   * Export analytics data to CSV format
   * Requirements: 10.10
   */
  async exportToCSV(userId: string): Promise<string> {
    const data = await this.getDashboardData(userId);

    // Build CSV content
    const lines: string[] = [];

    // Header
    lines.push("FindAm Seller Analytics Export");
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push("");

    // Overview section
    lines.push("OVERVIEW METRICS");
    lines.push("Metric,Value");
    lines.push(`Total Views,${data.overview.totalViews}`);
    lines.push(`Total Impressions,${data.overview.totalImpressions}`);
    lines.push(
      `Click-Through Rate,${data.overview.clickThroughRate.toFixed(2)}%`,
    );
    lines.push(`Conversion Rate,${data.overview.conversionRate.toFixed(2)}%`);
    lines.push(
      `Average Response Time,${data.overview.averageResponseTime.toFixed(0)} minutes`,
    );
    lines.push(`Response Rate,${data.overview.responseRate.toFixed(2)}%`);
    lines.push(`Total Revenue,₦${data.overview.totalRevenue.toFixed(2)}`);
    lines.push(
      `Average Order Value,₦${data.overview.averageOrderValue.toFixed(2)}`,
    );
    lines.push("");

    // Listing performance section
    lines.push("LISTING PERFORMANCE");
    lines.push(
      "Listing ID,Title,Views,Impressions,CTR %,Messages,Sales,Conversion Rate %,Revenue",
    );
    for (const listing of data.listingPerformance) {
      lines.push(
        `${listing.listingId},"${listing.title}",${listing.views},${listing.impressions},${listing.ctr.toFixed(2)},${listing.messages},${listing.sales},${listing.conversionRate.toFixed(2)},₦${listing.revenue.toFixed(2)}`,
      );
    }
    lines.push("");

    // Geographic breakdown section
    lines.push("GEOGRAPHIC BREAKDOWN - BY STATE");
    lines.push("State,Views");
    for (const [state, count] of Object.entries(data.geographic.state)) {
      lines.push(`${state},${count}`);
    }
    lines.push("");

    lines.push("GEOGRAPHIC BREAKDOWN - BY CITY");
    lines.push("City,Views");
    for (const [city, count] of Object.entries(data.geographic.city)) {
      lines.push(`"${city}",${count}`);
    }
    lines.push("");

    // Time series section
    lines.push("TIME SERIES DATA");
    lines.push("Date,Views,Sales,Revenue");
    for (const point of data.timeSeries) {
      lines.push(
        `${point.date},${point.views},${point.sales},₦${point.revenue.toFixed(2)}`,
      );
    }
    lines.push("");

    // Traffic sources section
    lines.push("TRAFFIC SOURCES");
    lines.push("Source,Count");
    lines.push(`Direct,${data.trafficSources.direct}`);
    lines.push(`Search,${data.trafficSources.search}`);
    lines.push(`Social,${data.trafficSources.social}`);
    lines.push(`Referral,${data.trafficSources.referral}`);
    lines.push("");

    // Category averages section
    lines.push("CATEGORY AVERAGES");
    lines.push("Metric,Value");
    lines.push(
      `Average Price,₦${data.categoryAverages.averagePrice.toFixed(2)}`,
    );
    lines.push(
      `Average Views,${data.categoryAverages.averageViews.toFixed(0)}`,
    );
    lines.push(
      `Average Sales,${data.categoryAverages.averageSales.toFixed(2)}`,
    );

    return lines.join("\n");
  }

  /**
   * Get empty dashboard data structure
   */
  private getEmptyDashboardData(): AnalyticsDashboardData {
    return {
      overview: {
        totalViews: 0,
        totalImpressions: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        averageResponseTime: 0,
        responseRate: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      },
      listingPerformance: [],
      geographic: {
        state: {},
        city: {},
      },
      timeSeries: [],
      trafficSources: {
        direct: 0,
        search: 0,
        social: 0,
        referral: 0,
      },
      categoryAverages: {
        averagePrice: 0,
        averageViews: 0,
        averageSales: 0,
      },
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
