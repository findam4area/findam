/**
 * Pricing Suggestion Service
 * Provides AI-powered pricing suggestions based on market analysis
 */

import { createClient } from "@/lib/supabase/client";

export interface PricingSuggestion {
  id: string;
  listing_id: string;
  user_id: string;
  suggested_price: number;
  min_price: number;
  max_price: number;
  confidence_score: number;
  market_average: number | null;
  similar_items_count: number;
  avg_selling_time_days: number | null;
  factors_considered: Record<string, any>;
  seasonal_adjustment: number;
  price_history: Array<{
    date: string;
    avg_price: number;
    min_price: number;
    max_price: number;
  }>;
  suggestion_accepted: boolean;
  actual_price_set: number | null;
  price_deviation_percentage: number | null;
  created_at: string;
  updated_at: string;
}

export interface PricingFactors {
  condition?: string;
  age_months?: number;
  brand?: string;
  location?: string;
  category?: string;
  subcategory?: string;
}

export interface PriceAnalysis {
  suggested_price: number;
  min_price: number;
  max_price: number;
  confidence_score: number;
  market_average: number;
  similar_items_count: number;
  avg_selling_time_days: number;
  price_at_different_points: Array<{
    price: number;
    avg_days_to_sell: number;
  }>;
  seasonal_adjustment: number;
  price_history: Array<{
    date: string;
    avg_price: number;
    min_price: number;
    max_price: number;
  }>;
  deviation_alert?: {
    type: "above" | "below";
    percentage: number;
    message: string;
  };
}

export class PricingSuggestionService {
  private supabase = createClient();

  // Seasonal adjustment factors (percentage)
  private readonly SEASONAL_FACTORS: Record<number, number> = {
    0: 0, // January - Post-holiday slowdown
    1: 5, // February - Valentine's boost
    2: 0, // March
    3: 0, // April
    4: 0, // May
    5: 0, // June
    6: 0, // July
    7: 0, // August
    8: 5, // September - Back to school
    9: 0, // October
    10: 10, // November - Black Friday prep
    11: 15, // December - Holiday season
  };

  /**
   * Generate pricing suggestion for a listing
   */
  async generatePricingSuggestion(
    listingId: string,
    userId: string,
    factors: PricingFactors,
  ): Promise<PriceAnalysis> {
    // Analyze similar items
    const similarItems = await this.findSimilarItems(factors);

    // Calculate base statistics
    const stats = this.calculatePriceStatistics(similarItems);

    // Apply seasonal adjustment
    const seasonalAdjustment = this.getSeasonalAdjustment();

    // Calculate suggested price with adjustments
    const suggestedPrice = this.calculateSuggestedPrice(
      stats.average,
      factors,
      seasonalAdjustment,
    );

    // Calculate price range
    const priceRange = this.calculatePriceRange(suggestedPrice, stats.stdDev);

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(
      similarItems.length,
      stats.stdDev,
      stats.average,
    );

    // Get price history
    const priceHistory = await this.getPriceHistory(factors);

    // Calculate selling time at different price points
    const pricePoints = this.calculateSellingTimeByPrice(
      similarItems,
      suggestedPrice,
    );

    // Check for price deviation
    const deviationAlert = this.checkPriceDeviation(
      suggestedPrice,
      stats.average,
    );

    // Save suggestion to database
    await this.savePricingSuggestion({
      listing_id: listingId,
      user_id: userId,
      suggested_price: suggestedPrice,
      min_price: priceRange.min,
      max_price: priceRange.max,
      confidence_score: confidenceScore,
      market_average: stats.average,
      similar_items_count: similarItems.length,
      avg_selling_time_days: stats.avgSellingTime,
      factors_considered: factors,
      seasonal_adjustment: seasonalAdjustment,
      price_history: priceHistory,
    });

    return {
      suggested_price: suggestedPrice,
      min_price: priceRange.min,
      max_price: priceRange.max,
      confidence_score: confidenceScore,
      market_average: stats.average,
      similar_items_count: similarItems.length,
      avg_selling_time_days: stats.avgSellingTime,
      price_at_different_points: pricePoints,
      seasonal_adjustment: seasonalAdjustment,
      price_history: priceHistory,
      deviation_alert: deviationAlert,
    };
  }

  /**
   * Find similar sold items based on factors
   */
  private async findSimilarItems(factors: PricingFactors): Promise<
    Array<{
      price: number;
      sold_at: string;
      days_to_sell: number;
      condition: string;
    }>
  > {
    try {
      let query = this.supabase
        .from("listings")
        .select("price, created_at, sold_at, condition, metadata")
        .eq("status", "sold")
        .not("price", "is", null)
        .not("sold_at", "is", null);

      // Filter by category if provided
      if (factors.category) {
        query = query.eq("category_id", factors.category);
      }

      // Filter by location if provided
      if (factors.location) {
        query = query.eq("location", factors.location);
      }

      // Get items from last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      query = query.gte("sold_at", sixMonthsAgo.toISOString());

      const { data, error } = await query.limit(100);

      if (error) {
        console.error("Failed to find similar items:", error);
        return [];
      }

      return (data || []).map((item: any) => {
        const createdAt = new Date(item.created_at);
        const soldAt = new Date(item.sold_at);
        const daysToSell = Math.ceil(
          (soldAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
        );

        return {
          price: item.price,
          sold_at: item.sold_at,
          days_to_sell: daysToSell,
          condition: item.condition || "used",
        };
      });
    } catch (error) {
      console.error("Error finding similar items:", error);
      return [];
    }
  }

  /**
   * Calculate price statistics from similar items
   */
  private calculatePriceStatistics(
    items: Array<{ price: number; days_to_sell: number }>,
  ): {
    average: number;
    median: number;
    stdDev: number;
    avgSellingTime: number;
  } {
    if (items.length === 0) {
      return { average: 0, median: 0, stdDev: 0, avgSellingTime: 0 };
    }

    const prices = items.map((item) => item.price);
    const sellingTimes = items.map((item) => item.days_to_sell);

    // Calculate average
    const average =
      prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // Calculate median
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const median =
      sortedPrices.length % 2 === 0
        ? (sortedPrices[sortedPrices.length / 2 - 1] +
            sortedPrices[sortedPrices.length / 2]) /
          2
        : sortedPrices[Math.floor(sortedPrices.length / 2)];

    // Calculate standard deviation
    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - average, 2), 0) /
      prices.length;
    const stdDev = Math.sqrt(variance);

    // Calculate average selling time
    const avgSellingTime =
      sellingTimes.reduce((sum, time) => sum + time, 0) / sellingTimes.length;

    return {
      average,
      median,
      stdDev,
      avgSellingTime: Math.round(avgSellingTime),
    };
  }

  /**
   * Calculate suggested price with adjustments
   */
  private calculateSuggestedPrice(
    basePrice: number,
    factors: PricingFactors,
    seasonalAdjustment: number,
  ): number {
    let price = basePrice;

    // Adjust for condition
    if (factors.condition === "new") {
      price *= 1.2; // 20% premium for new items
    } else if (factors.condition === "refurbished") {
      price *= 1.1; // 10% premium for refurbished
    } else if (factors.condition === "poor") {
      price *= 0.7; // 30% discount for poor condition
    }

    // Adjust for age
    if (factors.age_months) {
      const ageDiscount = Math.min(factors.age_months * 0.01, 0.5); // Max 50% discount
      price *= 1 - ageDiscount;
    }

    // Apply seasonal adjustment
    price *= 1 + seasonalAdjustment / 100;

    return Math.round(price);
  }

  /**
   * Calculate price range (min/max)
   */
  private calculatePriceRange(
    suggestedPrice: number,
    stdDev: number,
  ): { min: number; max: number } {
    // Use standard deviation or 15% range, whichever is larger
    const range = Math.max(stdDev, suggestedPrice * 0.15);

    return {
      min: Math.round(suggestedPrice - range),
      max: Math.round(suggestedPrice + range),
    };
  }

  /**
   * Calculate confidence score (0-100)
   */
  private calculateConfidenceScore(
    sampleSize: number,
    stdDev: number,
    average: number,
  ): number {
    // Base confidence on sample size
    let confidence = Math.min((sampleSize / 50) * 50, 50);

    // Adjust for price consistency (coefficient of variation)
    if (average > 0) {
      const cv = stdDev / average;
      const consistencyScore = Math.max(0, 50 - cv * 100);
      confidence += consistencyScore;
    }

    return Math.min(Math.round(confidence), 100);
  }

  /**
   * Get seasonal adjustment for current month
   */
  private getSeasonalAdjustment(): number {
    const currentMonth = new Date().getMonth();
    return this.SEASONAL_FACTORS[currentMonth] || 0;
  }

  /**
   * Get price history for similar items
   */
  private async getPriceHistory(factors: PricingFactors): Promise<
    Array<{
      date: string;
      avg_price: number;
      min_price: number;
      max_price: number;
    }>
  > {
    try {
      // Get monthly aggregates for last 6 months
      const history: Array<{
        date: string;
        avg_price: number;
        min_price: number;
        max_price: number;
      }> = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        let query = this.supabase
          .from("listings")
          .select("price")
          .eq("status", "sold")
          .not("price", "is", null)
          .gte("sold_at", monthStart.toISOString())
          .lte("sold_at", monthEnd.toISOString());

        if (factors.category) {
          query = query.eq("category_id", factors.category);
        }

        const { data } = await query;

        if (data && data.length > 0) {
          const prices = data.map((item: any) => item.price);
          const avgPrice =
            prices.reduce((sum: number, p: number) => sum + p, 0) /
            prices.length;
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);

          history.push({
            date: monthStart.toISOString().split("T")[0],
            avg_price: Math.round(avgPrice),
            min_price: minPrice,
            max_price: maxPrice,
          });
        }
      }

      return history;
    } catch (error) {
      console.error("Error getting price history:", error);
      return [];
    }
  }

  /**
   * Calculate average selling time at different price points
   */
  private calculateSellingTimeByPrice(
    items: Array<{ price: number; days_to_sell: number }>,
    suggestedPrice: number,
  ): Array<{ price: number; avg_days_to_sell: number }> {
    if (items.length === 0) return [];

    // Create price buckets
    const buckets = [
      { price: Math.round(suggestedPrice * 0.8), items: [] as number[] },
      { price: Math.round(suggestedPrice * 0.9), items: [] as number[] },
      { price: suggestedPrice, items: [] as number[] },
      { price: Math.round(suggestedPrice * 1.1), items: [] as number[] },
      { price: Math.round(suggestedPrice * 1.2), items: [] as number[] },
    ];

    // Assign items to buckets
    items.forEach((item) => {
      const closestBucket = buckets.reduce((prev, curr) =>
        Math.abs(curr.price - item.price) < Math.abs(prev.price - item.price)
          ? curr
          : prev,
      );
      closestBucket.items.push(item.days_to_sell);
    });

    // Calculate averages
    return buckets
      .filter((bucket) => bucket.items.length > 0)
      .map((bucket) => ({
        price: bucket.price,
        avg_days_to_sell: Math.round(
          bucket.items.reduce((sum, days) => sum + days, 0) /
            bucket.items.length,
        ),
      }));
  }

  /**
   * Check if price deviates significantly from market average
   */
  private checkPriceDeviation(
    suggestedPrice: number,
    marketAverage: number,
  ):
    | { type: "above" | "below"; percentage: number; message: string }
    | undefined {
    if (marketAverage === 0) return undefined;

    const deviation = ((suggestedPrice - marketAverage) / marketAverage) * 100;

    if (Math.abs(deviation) > 20) {
      return {
        type: deviation > 0 ? "above" : "below",
        percentage: Math.abs(Math.round(deviation)),
        message:
          deviation > 0
            ? `This price is ${Math.abs(Math.round(deviation))}% above market average. Consider lowering for faster sale.`
            : `This price is ${Math.abs(Math.round(deviation))}% below market average. You may be underpricing.`,
      };
    }

    return undefined;
  }

  /**
   * Save pricing suggestion to database
   */
  private async savePricingSuggestion(data: {
    listing_id: string;
    user_id: string;
    suggested_price: number;
    min_price: number;
    max_price: number;
    confidence_score: number;
    market_average: number;
    similar_items_count: number;
    avg_selling_time_days: number;
    factors_considered: Record<string, any>;
    seasonal_adjustment: number;
    price_history: any[];
  }): Promise<void> {
    const { error } = await (this.supabase.from as any)(
      "pricing_suggestions",
    ).upsert(data, {
      onConflict: "listing_id",
    });

    if (error) {
      console.error("Failed to save pricing suggestion:", error);
    }
  }

  /**
   * Get pricing suggestion for a listing
   */
  async getPricingSuggestion(
    listingId: string,
  ): Promise<PricingSuggestion | null> {
    const { data, error } = await (this.supabase.from as any)(
      "pricing_suggestions",
    )
      .select("*")
      .eq("listing_id", listingId)
      .single();

    if (error) {
      console.error("Failed to get pricing suggestion:", error);
      return null;
    }

    return data;
  }

  /**
   * Accept pricing suggestion and update listing price
   */
  async acceptPricingSuggestion(
    suggestionId: string,
    userId: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase.rpc(
      "accept_pricing_suggestion" as any,
      {
        p_suggestion_id: suggestionId,
        p_user_id: userId,
      },
    );

    if (error) {
      console.error("Failed to accept pricing suggestion:", error);
      return false;
    }

    return data === true;
  }

  /**
   * Check if listing needs price reduction (no views after 48 hours)
   */
  async checkPriceReductionNeeded(listingId: string): Promise<{
    needed: boolean;
    suggested_reduction: number;
    message: string;
  }> {
    try {
      const { data: listing } = await (this.supabase as any)
        .from("listings")
        .select("created_at, views_count, price")
        .eq("id", listingId)
        .single();

      if (!listing) {
        return { needed: false, suggested_reduction: 0, message: "" };
      }

      const createdAt = new Date(
        listing.created_at ?? new Date().toISOString(),
      );
      const now = new Date();
      const hoursSinceCreation =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceCreation >= 48 && (listing.views_count ?? 0) === 0) {
        const suggestedReduction = Math.round((listing.price ?? 0) * 0.1); // 10% reduction

        return {
          needed: true,
          suggested_reduction: suggestedReduction,
          message: `Your listing has received no views in 48 hours. Consider reducing the price by ₦${suggestedReduction.toLocaleString()} (10%) to attract more buyers.`,
        };
      }

      return { needed: false, suggested_reduction: 0, message: "" };
    } catch (error) {
      console.error("Error checking price reduction:", error);
      return { needed: false, suggested_reduction: 0, message: "" };
    }
  }

  /**
   * Update pricing suggestion based on listing performance
   */
  async updateDynamicRecommendation(
    listingId: string,
  ): Promise<PriceAnalysis | null> {
    try {
      const { data: listing } = await (this.supabase as any)
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .single();

      if (!listing) return null;

      const { data: suggestion } = await (this.supabase.from as any)(
        "pricing_suggestions",
      )
        .select("*")
        .eq("listing_id", listingId)
        .single();

      if (!suggestion) return null;

      // Adjust based on performance
      let adjustedPrice = suggestion.suggested_price;

      // If low views, suggest lower price
      const daysSinceListing = Math.ceil(
        (Date.now() -
          new Date(listing.created_at ?? new Date().toISOString()).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysSinceListing > 7 && (listing.views_count ?? 0) < 10) {
        adjustedPrice = Math.round(adjustedPrice * 0.95); // 5% reduction
      }

      // If high views but low engagement, suggest lower price
      // Note: inquiries_count field doesn't exist in schema, so we only check views
      if ((listing.views_count ?? 0) > 50) {
        adjustedPrice = Math.round(adjustedPrice * 0.9); // 10% reduction
      }

      // Update suggestion
      await (this.supabase.from as any)("pricing_suggestions")
        .update({
          suggested_price: adjustedPrice,
          updated_at: new Date().toISOString(),
        })
        .eq("listing_id", listingId);

      return {
        suggested_price: adjustedPrice,
        min_price: suggestion.min_price,
        max_price: suggestion.max_price,
        confidence_score: suggestion.confidence_score,
        market_average: suggestion.market_average,
        similar_items_count: suggestion.similar_items_count,
        avg_selling_time_days: suggestion.avg_selling_time_days,
        price_at_different_points: [],
        seasonal_adjustment: suggestion.seasonal_adjustment,
        price_history: suggestion.price_history,
      };
    } catch (error) {
      console.error("Error updating dynamic recommendation:", error);
      return null;
    }
  }
}

export const pricingSuggestionService = new PricingSuggestionService();
