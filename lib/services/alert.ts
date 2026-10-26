/**
 * Alert Service
 * Handles smart alerts and saved searches functionality
 * Requirements: 13.1, 13.3, 13.4
 */

import { createClient } from "@/lib/supabase/server";
import { searchListings } from "@/lib/typesense/queries";

export interface SavedSearchQuery {
  keywords?: string;
  category_id?: string;
  priceRange?: { min: number; max: number };
  location?: string[];
  condition?: string[];
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query: SavedSearchQuery;
  notification_frequency: "instant" | "daily" | "weekly";
  is_paused: boolean;
  new_match_count: number;
  last_checked: Date;
  last_activity_at: Date;
  is_active: boolean;
  disabled_at?: Date;
  disabled_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SearchAlert {
  id: string;
  saved_search_id: string;
  listing_id: string;
  user_id: string;
  alert_type: "new_listing" | "price_drop";
  previous_price?: number;
  new_price?: number;
  price_drop_percentage?: number;
  sent_at: Date;
  notification_method: "push" | "email" | "sms" | "digest";
  is_read: boolean;
  read_at?: Date;
  listing_snapshot?: any;
}

export class AlertService {
  /**
   * Create a new saved search
   * Requirement: 13.1
   */
  static async createSavedSearch(params: {
    userId: string;
    name: string;
    query: SavedSearchQuery;
    notificationFrequency?: "instant" | "daily" | "weekly";
  }): Promise<SavedSearch> {
    const supabase = await createClient();

    // Check if user can create more saved searches (tier limits)
    const { data: canCreate, error: checkError } = await (supabase.rpc as any)(
      "can_create_saved_search",
      { p_user_id: params.userId },
    );

    if (checkError) {
      throw new Error(
        `Failed to check saved search limit: ${checkError.message}`,
      );
    }

    if (!canCreate) {
      throw new Error(
        "Saved search limit reached. Upgrade to premium for unlimited saved searches.",
      );
    }

    // Create the saved search
    const { data, error } = await (supabase.from as any)("saved_searches")
      .insert({
        user_id: params.userId,
        name: params.name,
        query: params.query as any,
        notification_frequency: params.notificationFrequency || "instant",
        is_paused: false,
        new_match_count: 0,
        last_checked: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create saved search: ${error.message}`);
    }

    return {
      ...data,
      query: data.query as SavedSearchQuery,
      last_checked: new Date(data.last_checked),
      last_activity_at: new Date(data.last_activity_at),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      disabled_at: data.disabled_at ? new Date(data.disabled_at) : undefined,
    };
  }

  /**
   * Check for new matches for a saved search
   * Requirement: 13.3
   */
  static async checkForMatches(savedSearchId: string): Promise<{
    newMatches: any[];
    priceDrops: any[];
  }> {
    const supabase = await createClient();

    // Get the saved search
    const { data: savedSearch, error: searchError } = await (
      supabase.from as any
    )("saved_searches")
      .select("*")
      .eq("id", savedSearchId)
      .single();

    if (searchError || !savedSearch) {
      throw new Error(`Failed to fetch saved search: ${searchError?.message}`);
    }

    // Skip if paused or inactive
    if (savedSearch.is_paused || !savedSearch.is_active) {
      return { newMatches: [], priceDrops: [] };
    }

    const query = savedSearch.query as SavedSearchQuery;
    const lastChecked = new Date(savedSearch.last_checked);

    // Search for new listings using Typesense
    const searchResults = await searchListings({
      query: query.keywords || "",
      filters: {
        category_id: query.category_id,
        min_price: query.priceRange?.min,
        max_price: query.priceRange?.max,
        state: query.location?.[0],
        condition: query.condition?.[0] as
          | "new"
          | "used"
          | "refurbished"
          | undefined,
      },
      limit: 100,
    });

    // Filter for listings created after last check
    const newMatches = searchResults.hits.filter((listing: any) => {
      const createdAt = new Date(listing.created_at);
      return createdAt > lastChecked;
    });

    // Check for price drops (10% or more)
    const priceDrops = await this.checkPriceDrops(
      searchResults.hits,
      lastChecked,
    );

    // Update last_checked timestamp
    await (supabase.from as any)("saved_searches")
      .update({ last_checked: new Date().toISOString() })
      .eq("id", savedSearchId);

    return { newMatches, priceDrops };
  }

  /**
   * Check for price drops on listings
   * Requirement: 13.4
   */
  private static async checkPriceDrops(
    listings: any[],
    since: Date,
  ): Promise<any[]> {
    const supabase = await createClient();
    const priceDrops: any[] = [];

    for (const listing of listings) {
      // Get price history for this listing
      const { data: priceHistory, error } = await (supabase.from as any)(
        "listing_price_history",
      )
        .select("*")
        .eq("listing_id", listing.id)
        .gte("changed_at", since.toISOString())
        .order("changed_at", { ascending: false })
        .limit(1);

      if (error || !priceHistory || priceHistory.length === 0) {
        continue;
      }

      const latestChange = priceHistory[0];
      const dropPercentage = Math.abs(latestChange.price_change_percentage);

      // Check if price dropped by 10% or more
      if (latestChange.price_change < 0 && dropPercentage >= 10) {
        priceDrops.push({
          listing,
          previousPrice: latestChange.previous_price,
          newPrice: latestChange.new_price,
          dropPercentage,
        });
      }
    }

    return priceDrops;
  }

  /**
   * Send alert notification to user
   * Requirement: 13.3, 13.4
   */
  static async sendAlert(params: {
    savedSearchId: string;
    userId: string;
    listingId: string;
    alertType: "new_listing" | "price_drop";
    previousPrice?: number;
    newPrice?: number;
    priceDropPercentage?: number;
    listingSnapshot?: any;
    notificationMethod?: "push" | "email" | "sms" | "digest";
  }): Promise<SearchAlert> {
    const supabase = await createClient();

    // Create the alert record
    const { data, error } = await (supabase.from as any)("search_alerts")
      .insert({
        saved_search_id: params.savedSearchId,
        listing_id: params.listingId,
        user_id: params.userId,
        alert_type: params.alertType,
        previous_price: params.previousPrice,
        new_price: params.newPrice,
        price_drop_percentage: params.priceDropPercentage,
        notification_method: params.notificationMethod || "push",
        is_read: false,
        listing_snapshot: params.listingSnapshot,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create alert: ${error.message}`);
    }

    // Increment match count for the saved search
    await (supabase.rpc as any)("increment_search_match_count", {
      search_id: params.savedSearchId,
    });

    // Send push notification (integrate with notification service)
    await this.sendPushNotification(params);

    return {
      ...data,
      sent_at: new Date(data.sent_at),
      read_at: data.read_at ? new Date(data.read_at) : undefined,
    };
  }

  /**
   * Send push notification for alert
   * This integrates with the existing notification system
   */
  private static async sendPushNotification(params: {
    userId: string;
    alertType: "new_listing" | "price_drop";
    listingSnapshot?: any;
    priceDropPercentage?: number;
  }): Promise<void> {
    const supabase = await createClient();

    let title = "";
    let body = "";

    if (params.alertType === "new_listing") {
      title = "New Match Found!";
      body = `A new listing matches your saved search: ${params.listingSnapshot?.title || "Check it out"}`;
    } else if (params.alertType === "price_drop") {
      title = "Price Drop Alert!";
      body = `Price dropped by ${params.priceDropPercentage}% on ${params.listingSnapshot?.title || "a listing you're watching"}`;
    }

    // Create notification using existing notifications table
    await supabase.from("notifications").insert({
      user_id: params.userId,
      type:
        params.alertType === "new_listing"
          ? "saved_search_match"
          : "price_drop",
      title,
      message: body,
      data: params.listingSnapshot,
      is_read: false,
    });
  }

  /**
   * Get all saved searches for a user
   */
  static async getUserSavedSearches(userId: string): Promise<SavedSearch[]> {
    const supabase = await createClient();

    const { data, error } = await (supabase.from as any)("saved_searches")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch saved searches: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      ...item,
      query: item.query as SavedSearchQuery,
      last_checked: new Date(item.last_checked),
      last_activity_at: new Date(item.last_activity_at),
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at),
      disabled_at: item.disabled_at ? new Date(item.disabled_at) : undefined,
    }));
  }

  /**
   * Update saved search
   */
  static async updateSavedSearch(
    searchId: string,
    updates: Partial<{
      name: string;
      query: SavedSearchQuery;
      notification_frequency: "instant" | "daily" | "weekly";
      is_paused: boolean;
    }>,
  ): Promise<SavedSearch> {
    const supabase = await createClient();

    const { data, error } = await (supabase.from as any)("saved_searches")
      .update({
        ...updates,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", searchId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update saved search: ${error.message}`);
    }

    return {
      ...data,
      query: data.query as SavedSearchQuery,
      last_checked: new Date(data.last_checked),
      last_activity_at: new Date(data.last_activity_at),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      disabled_at: data.disabled_at ? new Date(data.disabled_at) : undefined,
    };
  }

  /**
   * Delete saved search
   */
  static async deleteSavedSearch(searchId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await (supabase.from as any)("saved_searches")
      .delete()
      .eq("id", searchId);

    if (error) {
      throw new Error(`Failed to delete saved search: ${error.message}`);
    }
  }

  /**
   * Get alerts for a user
   */
  static async getUserAlerts(params: {
    userId: string;
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<SearchAlert[]> {
    const supabase = await createClient();

    let query = (supabase.from as any)("search_alerts")
      .select("*")
      .eq("user_id", params.userId)
      .order("sent_at", { ascending: false });

    if (params.unreadOnly) {
      query = query.eq("is_read", false);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(
        params.offset,
        params.offset + (params.limit || 10) - 1,
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch alerts: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      ...item,
      sent_at: new Date(item.sent_at),
      read_at: item.read_at ? new Date(item.read_at) : undefined,
    }));
  }

  /**
   * Mark alert as read
   */
  static async markAlertRead(alertId: string): Promise<void> {
    const supabase = await createClient();

    await (supabase.rpc as any)("mark_alert_read", { alert_id: alertId });
  }

  /**
   * Reset new match count (when user views matches)
   */
  static async resetMatchCount(searchId: string): Promise<void> {
    const supabase = await createClient();

    await (supabase.rpc as any)("reset_search_match_count", {
      search_id: searchId,
    });
  }
}
