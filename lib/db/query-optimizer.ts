import { createClient } from "@/lib/supabase/server";

/**
 * Database query optimization utilities
 * Requirements: Performance optimization
 */

/**
 * Batch loader for preventing N+1 queries
 */
export class DataLoader<K, V> {
  private cache = new Map<K, Promise<V>>();
  private queue: K[] = [];
  private batchFn: (keys: K[]) => Promise<V[]>;
  private batchScheduled = false;

  constructor(batchFn: (keys: K[]) => Promise<V[]>) {
    this.batchFn = batchFn;
  }

  load(key: K): Promise<V> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    // Create promise and add to queue
    const promise = new Promise<V>((resolve, reject) => {
      this.queue.push(key);

      // Schedule batch execution
      if (!this.batchScheduled) {
        this.batchScheduled = true;
        process.nextTick(() => this.executeBatch(resolve, reject));
      }
    });

    this.cache.set(key, promise);
    return promise;
  }

  private async executeBatch(
    resolve: (value: V) => void,
    reject: (reason?: any) => void,
  ) {
    const keys = [...this.queue];
    this.queue = [];
    this.batchScheduled = false;

    try {
      const results = await this.batchFn(keys);

      // Resolve all promises
      keys.forEach((key, index) => {
        const promise = this.cache.get(key);
        if (promise) {
          resolve(results[index]);
        }
      });
    } catch (error) {
      // Reject all promises
      keys.forEach((key) => {
        this.cache.delete(key);
      });
      reject(error);
    }
  }

  clear() {
    this.cache.clear();
    this.queue = [];
  }
}

/**
 * Create data loaders for common queries
 */
export async function createDataLoaders() {
  const supabase = await createClient();

  return {
    /**
     * Load users by IDs
     */
    userLoader: new DataLoader<string, any>(async (userIds) => {
      const { data } = await supabase
        .from("users")
        .select("*")
        .in("id", userIds);

      // Map results to maintain order
      return userIds.map((id) => data?.find((user: any) => user.id === id));
    }),

    /**
     * Load categories by IDs
     */
    categoryLoader: new DataLoader<string, any>(async (categoryIds) => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .in("id", categoryIds);

      return categoryIds.map((id) =>
        data?.find((category: any) => category.id === id),
      );
    }),

    /**
     * Load listings by IDs
     */
    listingLoader: new DataLoader<string, any>(async (listingIds) => {
      const { data } = await supabase
        .from("listings")
        .select("*")
        .in("id", listingIds);

      return listingIds.map((id) =>
        data?.find((listing: any) => listing.id === id),
      );
    }),
  };
}

/**
 * Query optimization helpers
 */
export const QueryOptimizer = {
  /**
   * Fetch listings with related data in a single query
   */
  async fetchListingsWithRelations(filters: {
    limit?: number;
    offset?: number;
    category_id?: string;
    user_id?: string;
  }) {
    const supabase = await createClient();

    let query = supabase
      .from("listings")
      .select(
        `
        *,
        user:users!listings_user_id_fkey(id, username, avatar_url, trust_score),
        category:categories!listings_category_id_fkey(id, name, icon),
        subcategory:subcategories!listings_subcategory_id_fkey(id, name)
      `,
      )
      .eq("is_active", true);

    if (filters.category_id) {
      query = query.eq("category_id", filters.category_id);
    }

    if (filters.user_id) {
      query = query.eq("user_id", filters.user_id);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 20) - 1,
      );
    }

    return query;
  },

  /**
   * Fetch user with all related data
   */
  async fetchUserProfile(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .select(
        `
        *,
        verification_badges(*),
        storefronts(*),
        listings:listings(count)
      `,
      )
      .eq("id", userId)
      .single();

    return { data, error };
  },

  /**
   * Batch update with transaction
   */
  async batchUpdate<T extends Record<string, any>>(
    table: string,
    updates: Array<{ id: string; data: Partial<T> }>,
  ) {
    const supabase = await createClient();

    // Use RPC for batch update to minimize round trips
    const { data, error } = await (supabase.rpc as any)("batch_update", {
      table_name: table,
      updates: updates,
    });

    return { data, error };
  },
};

/**
 * Index recommendations for common queries
 */
export const RECOMMENDED_INDEXES = `
-- Listings indexes
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_category_id ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_subcategory_id ON listings(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_state ON listings(state);
CREATE INDEX IF NOT EXISTS idx_listings_is_boosted ON listings(is_boosted);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_listings_active_category ON listings(is_active, category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_active_user ON listings(is_active, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_active_boosted ON listings(is_active, is_boosted, created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_buyer_id ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_seller_id ON escrow_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_auto_release_at ON escrow_transactions(auto_release_at);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_listings_title_search ON listings USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_listings_description_search ON listings USING gin(to_tsvector('english', description));
`;
