/**
 * PWA Service
 * Handles Progressive Web App features including low-data mode and offline sync
 * Requirements: 18.1, 18.2, 18.3, 18.9
 */

import { createClient } from "@/lib/supabase/client";

export interface PWASettings {
  id: string;
  user_id: string;
  low_data_mode: boolean;
  offline_cache_enabled: boolean;
  auto_sync_enabled: boolean;
  data_usage_mb: number;
  data_usage_reset_at: string;
  last_sync_at: string | null;
  cache_size_mb: number;
  max_cache_size_mb: number;
  created_at: string;
  updated_at: string;
}

export interface OfflineAction {
  id: string;
  user_id: string;
  action_type: string;
  action_data: Record<string, any>;
  sync_status: "pending" | "syncing" | "synced" | "failed";
  sync_attempts: number;
  last_sync_attempt_at: string | null;
  synced_at: string | null;
  error_message: string | null;
  error_code: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface CachedListing {
  id: string;
  user_id: string;
  listing_id: string;
  listing_data: Record<string, any>;
  cache_size_kb: number;
  last_accessed_at: string;
  cached_at: string;
  expires_at: string;
}

export interface SyncResult {
  success: boolean;
  synced_count: number;
  failed_count: number;
  errors: Array<{ action_id: string; error: string }>;
}

export class PWAService {
  private supabase = createClient();

  /**
   * Get PWA settings for the current user
   */
  async getSettings(userId: string): Promise<PWASettings | null> {
    const { data, error } = await (this.supabase as any)
      .from("pwa_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No settings found, create default
        return this.createDefaultSettings(userId);
      }
      throw new Error(`Failed to get PWA settings: ${error.message}`);
    }

    return data as PWASettings;
  }

  /**
   * Create default PWA settings for a user
   */
  async createDefaultSettings(userId: string): Promise<PWASettings> {
    const { data, error } = await (this.supabase as any)
      .from("pwa_settings")
      .insert({
        user_id: userId,
        low_data_mode: false,
        offline_cache_enabled: true,
        auto_sync_enabled: true,
        data_usage_mb: 0,
        cache_size_mb: 0,
        max_cache_size_mb: 100,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create PWA settings: ${error.message}`);
    }

    return data as PWASettings;
  }

  /**
   * Toggle low-data mode for the current user
   * Requirements: 18.1
   */
  async toggleLowDataMode(
    userId: string,
    enabled: boolean,
  ): Promise<PWASettings> {
    const { data, error } = await (this.supabase as any)
      .from("pwa_settings")
      .update({ low_data_mode: enabled })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to toggle low-data mode: ${error.message}`);
    }

    // Store preference in localStorage for immediate access
    if (typeof window !== "undefined") {
      localStorage.setItem("low_data_mode", enabled.toString());
    }

    return data as PWASettings;
  }

  /**
   * Check if low-data mode is enabled
   * Requirements: 18.1
   */
  isLowDataModeEnabled(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("low_data_mode") === "true";
  }

  /**
   * Toggle offline cache
   */
  async toggleOfflineCache(
    userId: string,
    enabled: boolean,
  ): Promise<PWASettings> {
    const { data, error } = await (this.supabase as any)
      .from("pwa_settings")
      .update({ offline_cache_enabled: enabled })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to toggle offline cache: ${error.message}`);
    }

    return data as PWASettings;
  }

  /**
   * Queue an action to be performed when online
   * Requirements: 18.5, 18.9
   */
  async queueOfflineAction(
    userId: string,
    actionType: string,
    actionData: Record<string, any>,
    priority: number = 0,
  ): Promise<OfflineAction> {
    const { data, error } = await (this.supabase as any)
      .from("offline_actions")
      .insert({
        user_id: userId,
        action_type: actionType,
        action_data: actionData,
        priority,
        sync_status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to queue offline action: ${error.message}`);
    }

    return data as OfflineAction;
  }

  /**
   * Get pending offline actions for a user
   */
  async getPendingActions(userId: string): Promise<OfflineAction[]> {
    const { data, error } = await (this.supabase as any).rpc(
      "get_pending_offline_actions",
      {
        p_user_id: userId,
      },
    );

    if (error) {
      throw new Error(`Failed to get pending actions: ${error.message}`);
    }

    return (data || []) as OfflineAction[];
  }

  /**
   * Sync offline actions with the server
   * Requirements: 18.9
   */
  async syncOfflineActions(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced_count: 0,
      failed_count: 0,
      errors: [],
    };

    try {
      // Get pending actions
      const actions = await this.getPendingActions(userId);

      if (actions.length === 0) {
        return result;
      }

      // Process each action
      for (const action of actions) {
        try {
          // Mark as syncing
          await this.updateActionStatus(action.id, "syncing");

          // Execute the action based on type
          await this.executeAction(action);

          // Mark as synced
          await (this.supabase as any).rpc("mark_action_synced", {
            p_action_id: action.id,
          });

          result.synced_count++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          // Mark as failed
          await (this.supabase as any).rpc("mark_action_failed", {
            p_action_id: action.id,
            p_error_message: errorMessage,
          });

          result.failed_count++;
          result.errors.push({
            action_id: action.id,
            error: errorMessage,
          });
        }
      }

      // Update last sync timestamp
      await this.updateLastSync(userId);

      result.success = result.failed_count === 0;
    } catch (error) {
      result.success = false;
      throw error;
    }

    return result;
  }

  /**
   * Execute a specific offline action
   */
  private async executeAction(action: OfflineAction): Promise<void> {
    switch (action.action_type) {
      case "create_listing":
        await this.executeCreateListing(action.action_data);
        break;
      case "update_listing":
        await this.executeUpdateListing(action.action_data);
        break;
      case "delete_listing":
        await this.executeDeleteListing(action.action_data);
        break;
      case "send_message":
        await this.executeSendMessage(action.action_data);
        break;
      case "like_listing":
        await this.executeLikeListing(action.action_data);
        break;
      case "unlike_listing":
        await this.executeUnlikeListing(action.action_data);
        break;
      case "save_listing":
        await this.executeSaveListing(action.action_data);
        break;
      case "unsave_listing":
        await this.executeUnsaveListing(action.action_data);
        break;
      default:
        throw new Error(`Unknown action type: ${action.action_type}`);
    }
  }

  private async executeCreateListing(data: Record<string, any>): Promise<void> {
    const { error } = await this.supabase.from("listings").insert(data as any);
    if (error) throw error;
  }

  private async executeUpdateListing(data: Record<string, any>): Promise<void> {
    const { id, ...updates } = data;
    const { error } = await this.supabase
      .from("listings")
      .update(updates as any)
      .eq("id", id);
    if (error) throw error;
  }

  private async executeDeleteListing(data: Record<string, any>): Promise<void> {
    const { error } = await this.supabase
      .from("listings")
      .update({ is_active: false })
      .eq("id", data.id);
    if (error) throw error;
  }

  private async executeSendMessage(data: Record<string, any>): Promise<void> {
    const { error } = await this.supabase.from("messages").insert(data as any);
    if (error) throw error;
  }

  private async executeLikeListing(data: Record<string, any>): Promise<void> {
    const { error } = await this.supabase
      .from("user_likes")
      .insert(data as any);
    if (error) throw error;
  }

  private async executeUnlikeListing(data: Record<string, any>): Promise<void> {
    const { error } = await this.supabase
      .from("user_likes")
      .delete()
      .eq("user_id", data.user_id ?? "")
      .eq("listing_id", data.listing_id ?? "");
    if (error) throw error;
  }

  private async executeSaveListing(data: Record<string, any>): Promise<void> {
    const { error } = await this.supabase
      .from("user_saves")
      .insert(data as any);
    if (error) throw error;
  }

  private async executeUnsaveListing(data: Record<string, any>): Promise<void> {
    const { error } = await this.supabase
      .from("user_saves")
      .delete()
      .eq("user_id", data.user_id ?? "")
      .eq("listing_id", data.listing_id ?? "");
    if (error) throw error;
  }

  /**
   * Update action status
   */
  private async updateActionStatus(
    actionId: string,
    status: "pending" | "syncing" | "synced" | "failed",
  ): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("offline_actions")
      .update({ sync_status: status })
      .eq("id", actionId);

    if (error) {
      throw new Error(`Failed to update action status: ${error.message}`);
    }
  }

  /**
   * Update last sync timestamp
   */
  private async updateLastSync(userId: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("pwa_settings")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to update last sync: ${error.message}`);
    }
  }

  /**
   * Cache a listing for offline access
   * Requirements: 18.4
   */
  async cacheListing(
    userId: string,
    listingId: string,
    listingData: Record<string, any>,
  ): Promise<CachedListing> {
    // Calculate cache size (rough estimate)
    const cacheSize = Math.ceil(JSON.stringify(listingData).length / 1024);

    const { data, error } = await (this.supabase as any)
      .from("cached_listings")
      .upsert(
        {
          user_id: userId,
          listing_id: listingId,
          listing_data: listingData,
          cache_size_kb: cacheSize,
          last_accessed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,listing_id",
        },
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cache listing: ${error.message}`);
    }

    // Update cache size in settings
    await this.updateCacheSize(userId);

    return data as CachedListing;
  }

  /**
   * Get cached listing
   */
  async getCachedListing(
    userId: string,
    listingId: string,
  ): Promise<CachedListing | null> {
    const { data, error } = await (this.supabase as any)
      .from("cached_listings")
      .select("*")
      .eq("user_id", userId)
      .eq("listing_id", listingId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get cached listing: ${error.message}`);
    }

    // Update last accessed
    await (this.supabase as any)
      .from("cached_listings")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("id", data.id);

    return data as CachedListing;
  }

  /**
   * Get all cached listings for a user
   */
  async getCachedListings(userId: string): Promise<CachedListing[]> {
    const { data, error } = await (this.supabase as any)
      .from("cached_listings")
      .select("*")
      .eq("user_id", userId)
      .order("last_accessed_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get cached listings: ${error.message}`);
    }

    return (data || []) as CachedListing[];
  }

  /**
   * Clear cached listing
   */
  async clearCachedListing(userId: string, listingId: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("cached_listings")
      .delete()
      .eq("user_id", userId)
      .eq("listing_id", listingId);

    if (error) {
      throw new Error(`Failed to clear cached listing: ${error.message}`);
    }

    await this.updateCacheSize(userId);
  }

  /**
   * Clear all cached listings for a user
   */
  async clearAllCache(userId: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("cached_listings")
      .delete()
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to clear cache: ${error.message}`);
    }

    await this.updateCacheSize(userId);
  }

  /**
   * Update cache size in settings
   */
  private async updateCacheSize(userId: string): Promise<void> {
    const { data } = await (this.supabase as any).rpc("get_user_cache_usage", {
      p_user_id: userId,
    });

    if (data && Array.isArray(data) && data.length > 0) {
      const cacheSize = (data[0] as any)?.total_cache_size_mb || 0;
      await (this.supabase as any)
        .from("pwa_settings")
        .update({ cache_size_mb: cacheSize })
        .eq("user_id", userId);
    }
  }

  /**
   * Track data usage
   */
  async trackDataUsage(userId: string, dataMB: number): Promise<void> {
    await (this.supabase as any).rpc("update_data_usage", {
      p_user_id: userId,
      p_data_mb: dataMB,
    });
  }

  /**
   * Get data usage statistics
   */
  async getDataUsage(userId: string): Promise<{
    usage_mb: number;
    reset_at: string;
  } | null> {
    const settings = await this.getSettings(userId);
    if (!settings) return null;

    return {
      usage_mb: settings.data_usage_mb,
      reset_at: settings.data_usage_reset_at,
    };
  }

  /**
   * Reset data usage
   */
  async resetDataUsage(userId: string): Promise<void> {
    await (this.supabase as any).rpc("reset_data_usage", {
      p_user_id: userId,
    });
  }

  /**
   * Clean up expired data
   */
  async cleanupExpiredData(): Promise<{
    actions_deleted: number;
    cache_deleted: number;
  }> {
    const [actionsResult, cacheResult] = await Promise.all([
      (this.supabase as any).rpc("cleanup_expired_offline_actions"),
      (this.supabase as any).rpc("cleanup_expired_cached_listings"),
    ]);

    return {
      actions_deleted: (actionsResult.data as number) || 0,
      cache_deleted: (cacheResult.data as number) || 0,
    };
  }
}

// Singleton instance
export const pwaService = new PWAService();
