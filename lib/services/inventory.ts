/**
 * Inventory Service
 * Handles inventory management operations including stock tracking, variant management, and notifications
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10
 */

import { createClient } from "@/lib/supabase/server";
import type {
  InventoryItem,
  InventoryVariant,
  StockHistory,
  CreateInventoryRequest,
  UpdateInventoryRequest,
  BulkStockUpdate,
  InventoryFilters,
  InventorySummary,
} from "@/lib/types";

export class InventoryService {
  /**
   * Set stock quantity for a listing
   * Requirements: 11.1
   */
  async setStock(
    listingId: string,
    userId: string,
    stockQuantity: number,
    unitPrice: number,
    lowStockThreshold: number = 5,
  ): Promise<InventoryItem> {
    const supabase = await createClient();

    // Validate stock quantity
    if (stockQuantity < 0 || !Number.isInteger(stockQuantity)) {
      throw new Error("Stock quantity must be a non-negative integer");
    }

    // Check if inventory item already exists
    const { data: existing } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("listing_id", listingId)
      .single();

    if (existing) {
      // Update existing inventory
      const { data, error } = await supabase
        .from("inventory_items")
        .update({
          stock_quantity: stockQuantity,
          unit_price: unitPrice,
          low_stock_threshold: lowStockThreshold,
          last_stock_update: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("listing_id", listingId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update stock: ${error.message}`);
      }

      // Record stock history
      await this.recordStockHistory(
        data.id,
        listingId,
        userId,
        existing.stock_quantity,
        stockQuantity,
        "adjustment",
        null,
        null,
        "Stock quantity updated",
      );

      return data as unknown as InventoryItem;
    } else {
      // Create new inventory item
      const { data, error } = await supabase
        .from("inventory_items")
        .insert({
          listing_id: listingId,
          user_id: userId,
          stock_quantity: stockQuantity,
          unit_price: unitPrice,
          low_stock_threshold: lowStockThreshold,
          has_variants: false,
          variants: [],
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create inventory: ${error.message}`);
      }

      // Record initial stock history
      await this.recordStockHistory(
        data.id,
        listingId,
        userId,
        0,
        stockQuantity,
        "initial",
        null,
        null,
        "Initial stock set",
      );

      return data as unknown as InventoryItem;
    }
  }

  /**
   * Decrement stock quantity when item is sold
   * Requirements: 11.2, 11.3
   */
  async decrementStock(
    listingId: string,
    userId: string,
    quantity: number = 1,
    variantId?: string,
  ): Promise<InventoryItem> {
    const supabase = await createClient();

    // Get current inventory
    const { data: inventory, error: fetchError } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("listing_id", listingId)
      .single();

    if (fetchError || !inventory) {
      throw new Error("Inventory item not found");
    }

    // Handle variant stock decrement
    if (variantId && inventory.has_variants) {
      const variants = inventory.variants as unknown as InventoryVariant[];
      const variantIndex = variants.findIndex((v) => v.id === variantId);

      if (variantIndex === -1) {
        throw new Error("Variant not found");
      }

      const variant = variants[variantIndex];
      if ((variant.stock ?? 0) < quantity) {
        throw new Error("Insufficient variant stock");
      }

      // Update variant stock
      variants[variantIndex].stock = (variant.stock ?? 0) - quantity;

      const { data, error } = await supabase
        .from("inventory_items")
        .update({
          variants: variants as any,
          last_stock_update: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("listing_id", listingId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to decrement variant stock: ${error.message}`);
      }

      // Record stock history for variant
      await this.recordStockHistory(
        inventory.id,
        listingId,
        userId,
        (variant.stock ?? 0) + quantity,
        variant.stock ?? 0,
        "sale",
        variantId,
        variant.name ?? null,
        `Sale of variant: ${variant.name ?? "Unknown"}`,
      );

      return data as unknown as InventoryItem;
    } else {
      // Handle regular stock decrement
      if (inventory.stock_quantity < quantity) {
        throw new Error("Insufficient stock");
      }

      const newQuantity = inventory.stock_quantity - quantity;

      const { data, error } = await supabase
        .from("inventory_items")
        .update({
          stock_quantity: newQuantity,
          last_stock_update: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("listing_id", listingId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to decrement stock: ${error.message}`);
      }

      // Record stock history
      await this.recordStockHistory(
        inventory.id,
        listingId,
        userId,
        inventory.stock_quantity,
        newQuantity,
        "sale",
        null,
        null,
        "Item sold",
      );

      // Check if sold out and update listing status (Requirement 11.3)
      if (newQuantity === 0) {
        await supabase
          .from("listings")
          .update({ is_active: false })
          .eq("id", listingId);
      }

      return data as unknown as InventoryItem;
    }
  }

  /**
   * Check if stock is below low stock threshold
   * Requirements: 11.4, 11.5
   */
  async checkLowStock(userId: string): Promise<InventoryItem[]> {
    const supabase = await createClient();

    // Get all inventory items where stock is below threshold
    const { data, error } = await (supabase as any)
      .from("inventory_items")
      .select(
        `
        *,
        listing:listings(id, title, thumbnail_url)
      `,
      )
      .eq("user_id", userId)
      .gt("stock_quantity", 0)
      .filter("stock_quantity", "lte", "low_stock_threshold");

    if (error) {
      throw new Error(`Failed to check low stock: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get inventory item by listing ID
   */
  async getInventoryByListing(
    listingId: string,
  ): Promise<InventoryItem | null> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("inventory_items")
      .select(
        `
        *,
        listing:listings(id, title, price, thumbnail_url)
      `,
      )
      .eq("listing_id", listingId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Get all inventory items for a user
   */
  async getUserInventory(
    userId: string,
    filters?: InventoryFilters,
  ): Promise<InventoryItem[]> {
    const supabase = await createClient();

    let query = (supabase as any)
      .from("inventory_items")
      .select(
        `
        *,
        listing:listings(id, title, price, thumbnail_url, is_active)
      `,
      )
      .eq("user_id", userId);

    // Apply filters
    if (filters?.is_sold_out !== undefined) {
      query = query.eq("is_sold_out", filters.is_sold_out);
    }

    if (filters?.is_low_stock) {
      query = query.filter("stock_quantity", "lte", "low_stock_threshold");
    }

    if (filters?.has_variants !== undefined) {
      query = query.eq("has_variants", filters.has_variants);
    }

    if (filters?.min_stock !== undefined) {
      query = query.gte("stock_quantity", filters.min_stock);
    }

    if (filters?.max_stock !== undefined) {
      query = query.lte("stock_quantity", filters.max_stock);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch inventory: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Bulk update stock for multiple listings
   * Requirements: 11.6
   */
  async bulkUpdateStock(
    userId: string,
    updates: BulkStockUpdate[],
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const supabase = await createClient();
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const update of updates) {
      try {
        // Verify listing belongs to user
        const { data: listing } = await supabase
          .from("listings")
          .select("id, user_id")
          .eq("id", update.listing_id)
          .eq("user_id", userId)
          .single();

        if (!listing) {
          errors.push(`Listing ${update.listing_id} not found or unauthorized`);
          failed++;
          continue;
        }

        // Get current inventory
        const { data: inventory } = await supabase
          .from("inventory_items")
          .select("*")
          .eq("listing_id", update.listing_id)
          .single();

        if (!inventory) {
          errors.push(`Inventory for listing ${update.listing_id} not found`);
          failed++;
          continue;
        }

        // Update stock
        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({
            stock_quantity: update.stock_quantity,
            last_stock_update: new Date().toISOString(),
            last_restock_date:
              update.stock_quantity > inventory.stock_quantity
                ? new Date().toISOString()
                : inventory.last_restock_date,
            updated_at: new Date().toISOString(),
          })
          .eq("listing_id", update.listing_id);

        if (updateError) {
          errors.push(
            `Failed to update ${update.listing_id}: ${updateError.message}`,
          );
          failed++;
          continue;
        }

        // Record stock history
        await this.recordStockHistory(
          inventory.id,
          update.listing_id,
          userId,
          inventory.stock_quantity,
          update.stock_quantity,
          update.change_reason || "adjustment",
          null,
          null,
          update.notes || "Bulk stock update",
        );

        success++;
      } catch (error) {
        errors.push(
          `Error updating ${update.listing_id}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        failed++;
      }
    }

    return { success, failed, errors };
  }

  /**
   * Get stock history for a listing
   * Requirements: 11.7
   */
  async getStockHistory(
    listingId: string,
    limit: number = 50,
  ): Promise<StockHistory[]> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("stock_history")
      .select(
        `
        *,
        changed_by_user:users!changed_by(id, username, avatar_url)
      `,
      )
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch stock history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update or create inventory with variants
   * Requirements: 11.8, 11.9
   */
  async updateInventoryWithVariants(
    listingId: string,
    userId: string,
    variants: InventoryVariant[],
    unitPrice: number,
    lowStockThreshold: number = 5,
  ): Promise<InventoryItem> {
    const supabase = await createClient();

    // Validate variants
    if (!variants || variants.length === 0) {
      throw new Error("At least one variant is required");
    }

    // Calculate total stock across all variants
    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

    // Check if inventory exists
    const { data: existing } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("listing_id", listingId)
      .single();

    if (existing) {
      // Update existing inventory
      const { data, error } = await supabase
        .from("inventory_items")
        .update({
          stock_quantity: totalStock,
          unit_price: unitPrice,
          low_stock_threshold: lowStockThreshold,
          variants: variants as any,
          has_variants: true,
          last_stock_update: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("listing_id", listingId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update inventory: ${error.message}`);
      }

      // Record stock history
      await this.recordStockHistory(
        data.id,
        listingId,
        userId,
        existing.stock_quantity,
        totalStock,
        "adjustment",
        null,
        null,
        "Variants updated",
      );

      return data as unknown as InventoryItem;
    } else {
      // Create new inventory with variants
      const { data, error } = await supabase
        .from("inventory_items")
        .insert({
          listing_id: listingId,
          user_id: userId,
          stock_quantity: totalStock,
          unit_price: unitPrice,
          low_stock_threshold: lowStockThreshold,
          variants: variants as any,
          has_variants: true,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create inventory: ${error.message}`);
      }

      // Record initial stock history
      await this.recordStockHistory(
        data.id,
        listingId,
        userId,
        0,
        totalStock,
        "initial",
        null,
        null,
        "Initial inventory with variants",
      );

      return data as unknown as InventoryItem;
    }
  }

  /**
   * Calculate total inventory value for a user
   * Requirements: 11.10
   */
  async calculateInventoryValue(userId: string): Promise<InventorySummary> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to calculate inventory value: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        totalItems: 0,
        totalValue: 0,
        soldOutItems: 0,
        lowStockItems: 0,
        itemsWithVariants: 0,
      };
    }

    const totalItems = data.length;
    const totalValue = data.reduce(
      (sum, item) => sum + (item.total_value ?? 0),
      0,
    );
    const soldOutItems = data.filter((item) => item.is_sold_out).length;
    const lowStockItems = data.filter(
      (item) =>
        item.stock_quantity > 0 &&
        item.stock_quantity <= (item.low_stock_threshold ?? 0),
    ).length;
    const itemsWithVariants = data.filter((item) => item.has_variants).length;

    return {
      totalItems,
      totalValue,
      soldOutItems,
      lowStockItems,
      itemsWithVariants,
    };
  }

  /**
   * Send low stock notification
   * Requirements: 11.5
   */
  async sendLowStockNotification(
    userId: string,
    inventoryItem: InventoryItem,
  ): Promise<void> {
    const supabase = await createClient();

    // Create notification
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "listing_interactions",
      title: "Low Stock Alert",
      message: `Your listing "${inventoryItem.listing?.title || "Unknown"}" is running low on stock (${inventoryItem.stock_quantity} remaining)`,
      link: `/listing/${inventoryItem.listing_id}`,
      is_read: false,
    });
  }

  /**
   * Record stock history entry
   * Private helper method
   */
  private async recordStockHistory(
    inventoryId: string,
    listingId: string,
    userId: string,
    previousQuantity: number,
    newQuantity: number,
    changeReason: "sale" | "restock" | "adjustment" | "return" | "initial",
    variantId: string | null,
    variantName: string | null,
    notes: string | null,
  ): Promise<void> {
    const supabase = await createClient();

    await supabase.from("stock_history").insert({
      inventory_id: inventoryId,
      listing_id: listingId,
      user_id: userId,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      change_reason: changeReason,
      variant_id: variantId,
      variant_name: variantName,
      notes: notes,
      changed_by: userId,
    });
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();
