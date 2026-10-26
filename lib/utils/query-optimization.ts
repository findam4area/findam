/**
 * Database query optimization utilities
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cursor-based pagination helper
 * More efficient than offset-based pagination for large datasets
 */
export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Apply cursor-based pagination to a Supabase query
 */
export function applyCursorPagination<T>(
  query: any,
  options: CursorPaginationOptions,
  cursorField: string = "created_at",
): any {
  const {
    cursor,
    limit = 20,
    orderBy = cursorField,
    ascending = false,
  } = options;

  // Apply cursor filter
  if (cursor) {
    if (ascending) {
      query = query.gt(cursorField, cursor);
    } else {
      query = query.lt(cursorField, cursor);
    }
  }

  // Apply ordering and limit
  query = query.order(orderBy, { ascending }).limit(limit);

  return query;
}

/**
 * Extract next cursor from results
 */
export function extractNextCursor<T extends Record<string, any>>(
  data: T[],
  limit: number,
  cursorField: string = "created_at",
): { nextCursor?: string; hasMore: boolean } {
  const hasMore = data.length === limit;
  const nextCursor =
    hasMore && data.length > 0 ? data[data.length - 1][cursorField] : undefined;

  return { nextCursor, hasMore };
}

/**
 * Optimized select fields for listings
 * Only fetch what's needed for each context
 */
export const ListingSelects = {
  // Minimal fields for cards in feed
  card: `
    id,
    title,
    price,
    thumbnail_url,
    is_boosted,
    created_at,
    state,
    user:users(id, username, avatar_url, trust_score)
  `,

  // Full details for listing page
  full: `
    *,
    user:users(*),
    category:categories(*),
    subcategory:subcategories(*),
    media:listing_media(*)
  `,

  // For search results
  search: `
    id,
    title,
    description,
    price,
    thumbnail_url,
    state,
    area,
    created_at,
    category:categories(id, name),
    subcategory:subcategories(id, name)
  `,

  // For user's own listings management
  manage: `
    id,
    title,
    price,
    thumbnail_url,
    is_active,
    is_boosted,
    boost_expires_at,
    views_count,
    likes_count,
    saves_count,
    created_at
  `,
};

/**
 * Batch fetch related data to reduce queries
 */
export async function batchFetchUsers(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<Map<string, any>> {
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("users")
    .select("id, username, avatar_url, trust_score, is_premium")
    .in("id", userIds);

  if (error) throw error;

  const userMap = new Map();
  data?.forEach((user) => userMap.set(user.id, user));

  return userMap;
}

/**
 * Batch fetch categories
 */
export async function batchFetchCategories(
  supabase: SupabaseClient,
  categoryIds: string[],
): Promise<Map<string, any>> {
  if (categoryIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, icon")
    .in("id", categoryIds);

  if (error) throw error;

  const categoryMap = new Map();
  data?.forEach((category) => categoryMap.set(category.id, category));

  return categoryMap;
}

/**
 * Query builder with automatic optimization
 */
export class OptimizedQueryBuilder {
  private query: any;
  private selectFields: string;

  constructor(supabase: SupabaseClient, table: string, selectFields: string) {
    this.query = supabase.from(table).select(selectFields, { count: "exact" });
    this.selectFields = selectFields;
  }

  /**
   * Add filters with automatic indexing hints
   */
  filter(column: string, operator: string, value: any): this {
    switch (operator) {
      case "eq":
        this.query = this.query.eq(column, value);
        break;
      case "neq":
        this.query = this.query.neq(column, value);
        break;
      case "gt":
        this.query = this.query.gt(column, value);
        break;
      case "gte":
        this.query = this.query.gte(column, value);
        break;
      case "lt":
        this.query = this.query.lt(column, value);
        break;
      case "lte":
        this.query = this.query.lte(column, value);
        break;
      case "in":
        this.query = this.query.in(column, value);
        break;
      case "like":
        this.query = this.query.ilike(column, `%${value}%`);
        break;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
    return this;
  }

  /**
   * Add cursor-based pagination
   */
  paginate(
    options: CursorPaginationOptions,
    cursorField: string = "created_at",
  ): this {
    this.query = applyCursorPagination(this.query, options, cursorField);
    return this;
  }

  /**
   * Execute query
   */
  async execute<T>(): Promise<{ data: T[]; count: number | null }> {
    const { data, error, count } = await this.query;
    if (error) throw error;
    return { data: data as T[], count };
  }
}

/**
 * Database connection pooling configuration
 * Note: Supabase handles connection pooling automatically,
 * but these are recommended settings for optimal performance
 */
export const DatabaseConfig = {
  // Recommended pool size for Supabase
  poolSize: 10,

  // Query timeout (30 seconds)
  queryTimeout: 30000,

  // Statement timeout (20 seconds)
  statementTimeout: 20000,

  // Idle timeout (10 minutes)
  idleTimeout: 600000,
};

/**
 * Query performance monitoring
 */
export class QueryMonitor {
  private static queries: Map<string, { count: number; totalTime: number }> =
    new Map();

  static start(queryName: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      const existing = this.queries.get(queryName) || {
        count: 0,
        totalTime: 0,
      };
      this.queries.set(queryName, {
        count: existing.count + 1,
        totalTime: existing.totalTime + duration,
      });

      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(
          `Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`,
        );
      }
    };
  }

  static getStats(): Record<string, { count: number; avgTime: number }> {
    const stats: Record<string, { count: number; avgTime: number }> = {};

    this.queries.forEach((value, key) => {
      stats[key] = {
        count: value.count,
        avgTime: value.totalTime / value.count,
      };
    });

    return stats;
  }

  static reset(): void {
    this.queries.clear();
  }
}
