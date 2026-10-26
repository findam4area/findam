/**
 * Purchase History Service
 * Handles purchase history retrieval, filtering, and reordering
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7
 */

import { createClient } from "@/lib/supabase/server";
import { searchListings } from "@/lib/typesense/queries";

export interface PurchaseRecord {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  amount: number;
  quantity: number;
  delivery_status: string;
  delivery_address?: any;
  tracking_number?: string;
  warranty_period_days?: number;
  warranty_expires_at?: Date;
  warranty_terms?: string;
  payment_method?: string;
  purchased_at: Date;
  delivered_at?: Date;
  created_at: Date;
  updated_at: Date;
  // Joined data
  listing?: any;
  seller?: any;
}

export interface PurchaseHistoryFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  deliveryStatus?: string;
}

export interface SpendingAnalytics {
  totalSpending: number;
  monthlySpending: Record<string, number>; // "YYYY-MM" -> amount
  yearlySpending: Record<string, number>; // "YYYY" -> amount
  categorySpending: Record<string, number>; // category -> amount
  averageOrderValue: number;
  totalOrders: number;
}

export interface ReorderResult {
  available: boolean;
  listing?: any;
  reason?: string;
  suggestions?: any[];
}

export class PurchaseHistoryService {
  /**
   * Get purchase history for a user
   * Requirement: 20.1, 20.2
   */
  static async getPurchaseHistory(
    userId: string,
    filters?: PurchaseHistoryFilters,
    limit: number = 50,
    offset: number = 0,
  ): Promise<PurchaseRecord[]> {
    const supabase = await createClient();

    let query = (supabase.from as any)("purchase_records")
      .select(
        `
        *,
        listing:listings(id, title, price, thumbnail_url, category_id, is_active),
        seller:users!seller_id(id, username, avatar_url)
      `,
      )
      .eq("buyer_id", userId)
      .order("purchased_at", { ascending: false });

    // Apply filters
    if (filters?.startDate) {
      query = query.gte("purchased_at", filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte("purchased_at", filters.endDate.toISOString());
    }

    if (filters?.minPrice) {
      query = query.gte("amount", filters.minPrice);
    }

    if (filters?.maxPrice) {
      query = query.lte("amount", filters.maxPrice);
    }

    if (filters?.deliveryStatus) {
      query = query.eq("delivery_status", filters.deliveryStatus);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch purchase history: ${error.message}`);
    }

    return (data || []).map((record: any) => ({
      ...record,
      purchased_at: new Date(record.purchased_at),
      delivered_at: record.delivered_at
        ? new Date(record.delivered_at)
        : undefined,
      warranty_expires_at: record.warranty_expires_at
        ? new Date(record.warranty_expires_at)
        : undefined,
      created_at: new Date(record.created_at),
      updated_at: new Date(record.updated_at),
    }));
  }

  /**
   * Calculate spending analytics
   * Requirement: 20.4
   */
  static async getSpendingAnalytics(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SpendingAnalytics> {
    const supabase = await createClient();

    let query = (supabase.from as any)("purchase_records")
      .select(
        `
        amount,
        purchased_at,
        listing:listings(category_id)
      `,
      )
      .eq("buyer_id", userId);

    if (startDate) {
      query = query.gte("purchased_at", startDate.toISOString());
    }

    if (endDate) {
      query = query.lte("purchased_at", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch spending analytics: ${error.message}`);
    }

    const records = data || [];
    const totalSpending = records.reduce(
      (sum: number, r: any) => sum + parseFloat(r.amount ?? "0"),
      0,
    );
    const totalOrders = records.length;

    // Calculate monthly spending
    const monthlySpending: Record<string, number> = {};
    const yearlySpending: Record<string, number> = {};
    const categorySpending: Record<string, number> = {};

    records.forEach((record: any) => {
      const date = new Date(record.purchased_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const yearKey = String(date.getFullYear());
      const amount = parseFloat(record.amount ?? "0");

      // Monthly
      monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + amount;

      // Yearly
      yearlySpending[yearKey] = (yearlySpending[yearKey] || 0) + amount;

      // Category
      if (record.listing?.category_id) {
        const categoryId = record.listing.category_id;
        categorySpending[categoryId] =
          (categorySpending[categoryId] || 0) + amount;
      }
    });

    return {
      totalSpending,
      monthlySpending,
      yearlySpending,
      categorySpending,
      averageOrderValue: totalOrders > 0 ? totalSpending / totalOrders : 0,
      totalOrders,
    };
  }

  /**
   * Reorder an item
   * Requirement: 20.5, 20.6, 20.7
   */
  static async reorderItem(
    userId: string,
    purchaseRecordId: string,
  ): Promise<ReorderResult> {
    const supabase = await createClient();

    // Get the original purchase record
    const { data: purchaseRecord, error: purchaseError } = await (
      supabase.from as any
    )("purchase_records")
      .select(
        `
        *,
        listing:listings(*)
      `,
      )
      .eq("id", purchaseRecordId)
      .eq("buyer_id", userId)
      .single();

    if (purchaseError || !purchaseRecord) {
      throw new Error("Purchase record not found");
    }

    const originalListing = purchaseRecord.listing;

    if (!originalListing) {
      return {
        available: false,
        reason: "Original listing no longer exists",
        suggestions: await this.findSimilarItems(
          purchaseRecord.listing_id,
          userId,
        ),
      };
    }

    // Check if the listing is still available from the same seller
    if (
      originalListing.is_active &&
      originalListing.user_id === purchaseRecord.seller_id
    ) {
      return {
        available: true,
        listing: originalListing,
      };
    }

    // Listing not available, find similar items
    const suggestions = await this.findSimilarItems(
      purchaseRecord.listing_id,
      userId,
    );

    return {
      available: false,
      reason: originalListing.is_active
        ? "Item no longer available from original seller"
        : "Item is no longer active",
      suggestions,
    };
  }

  /**
   * Find similar items for reorder fallback
   * Requirement: 20.7
   */
  private static async findSimilarItems(
    originalListingId: string,
    userId: string,
  ): Promise<any[]> {
    const supabase = await createClient();

    // Get the original listing details
    const { data: originalListing } = await supabase
      .from("listings")
      .select("title, category_id, subcategory_id, price")
      .eq("id", originalListingId)
      .single();

    if (!originalListing) {
      return [];
    }

    // Search for similar items using Typesense
    try {
      const searchResults = await searchListings({
        query: originalListing.title,
        filters: {
          category_id: originalListing.category_id ?? undefined,
          subcategory_id: originalListing.subcategory_id ?? undefined,
          min_price: (originalListing.price ?? 0) * 0.8, // 20% below
          max_price: (originalListing.price ?? 0) * 1.2, // 20% above
        },
        limit: 5,
      });

      // Filter out the original listing
      return searchResults.hits.filter(
        (hit: any) => hit.id !== originalListingId,
      );
    } catch (error) {
      console.error("Error finding similar items:", error);
      return [];
    }
  }

  /**
   * Get purchase record by ID
   */
  static async getPurchaseRecord(
    userId: string,
    purchaseRecordId: string,
  ): Promise<PurchaseRecord | null> {
    const supabase = await createClient();

    const { data, error } = await (supabase.from as any)("purchase_records")
      .select(
        `
        *,
        listing:listings(id, title, price, thumbnail_url, category_id, is_active),
        seller:users!seller_id(id, username, avatar_url)
      `,
      )
      .eq("id", purchaseRecordId)
      .eq("buyer_id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      ...data,
      purchased_at: new Date(data.purchased_at),
      delivered_at: data.delivered_at ? new Date(data.delivered_at) : undefined,
      warranty_expires_at: data.warranty_expires_at
        ? new Date(data.warranty_expires_at)
        : undefined,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  }

  /**
   * Update delivery status
   */
  static async updateDeliveryStatus(
    userId: string,
    purchaseRecordId: string,
    status: string,
  ): Promise<void> {
    const supabase = await createClient();

    const updateData: any = {
      delivery_status: status,
    };

    // If status is delivered, set delivered_at
    if (status === "delivered") {
      updateData.delivered_at = new Date().toISOString();
    }

    const { error } = await (supabase.from as any)("purchase_records")
      .update(updateData)
      .eq("id", purchaseRecordId)
      .eq("buyer_id", userId);

    if (error) {
      throw new Error(`Failed to update delivery status: ${error.message}`);
    }
  }
}
