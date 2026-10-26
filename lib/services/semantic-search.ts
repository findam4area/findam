/**
 * Semantic Search Service
 * Requirements: 22.3, 22.4, 22.7, 22.9
 *
 * Implements hybrid search combining vector similarity search (pgvector)
 * with traditional keyword search and filters.
 */

import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "./embeddings";

export interface SearchFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  state?: string;
  condition?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail_url: string;
  location: string;
  state: string;
  lga: string;
  similarity?: number;
  relevance_score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  algorithm: "semantic" | "keyword" | "hybrid";
  total: number;
}

/**
 * Perform semantic search using vector similarity
 * Requirements: 22.3
 *
 * @param query - Search query text
 * @param filters - Optional filters (price, location, category)
 * @param limit - Maximum number of results
 * @returns Search results with similarity scores
 */
export async function searchSemantic(
  query: string,
  filters: SearchFilters = {},
  limit: number = 10,
): Promise<SearchResponse> {
  const supabase = await createClient();

  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Perform vector similarity search using database function
    const { data: vectorResults, error: vectorError } = await supabase.rpc(
      "match_listings",
      {
        query_embedding: JSON.stringify(queryEmbedding), // Convert to string for pgvector
        match_threshold: 0.7,
        match_count: limit * 2, // Get more results for filtering
      },
    );

    if (vectorError) {
      throw vectorError;
    }

    if (!vectorResults || vectorResults.length === 0) {
      // Fallback to keyword search if vector search returns no results
      return await searchKeyword(query, filters, limit);
    }

    // Apply additional filters
    let filteredResults = vectorResults;

    if (filters.categoryId) {
      filteredResults = filteredResults.filter(
        (r: any) => r.category_id === filters.categoryId,
      );
    }

    if (filters.minPrice !== undefined) {
      filteredResults = filteredResults.filter(
        (r: any) => r.price >= filters.minPrice!,
      );
    }

    if (filters.maxPrice !== undefined) {
      filteredResults = filteredResults.filter(
        (r: any) => r.price <= filters.maxPrice!,
      );
    }

    if (filters.location) {
      filteredResults = filteredResults.filter((r: any) =>
        r.location?.toLowerCase().includes(filters.location!.toLowerCase()),
      );
    }

    if (filters.state) {
      filteredResults = filteredResults.filter(
        (r: any) => r.state?.toLowerCase() === filters.state!.toLowerCase(),
      );
    }

    if (filters.condition) {
      filteredResults = filteredResults.filter(
        (r: any) => r.condition === filters.condition,
      );
    }

    // Limit results
    const results = filteredResults.slice(0, limit).map((r: any) => ({
      ...r,
      relevance_score: r.similarity || 0,
    }));

    return {
      results,
      algorithm: "semantic",
      total: results.length,
    };
  } catch (error) {
    console.error("Semantic search error:", error);
    // Fallback to keyword search on error (Requirement 22.8)
    return await searchKeyword(query, filters, limit);
  }
}

/**
 * Perform keyword search as fallback
 * Requirements: 22.8
 *
 * @param query - Search query text
 * @param filters - Optional filters
 * @param limit - Maximum number of results
 * @returns Search results
 */
export async function searchKeyword(
  query: string,
  filters: SearchFilters = {},
  limit: number = 10,
): Promise<SearchResponse> {
  const supabase = await createClient();

  try {
    // Build query
    let dbQuery = supabase
      .from("listings")
      .select(
        `
        id,
        title,
        description,
        price,
        thumbnail_url,
        location,
        state,
        lga,
        category_id,
        condition
      `,
      )
      .eq("status", "active")
      .is("deleted_at", null)
      .eq("is_active", true);

    // Apply text search
    if (query && query.trim().length > 0) {
      dbQuery = dbQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%`,
      );
    }

    // Apply filters
    if (filters.categoryId) {
      dbQuery = dbQuery.eq("category_id", filters.categoryId);
    }

    if (filters.minPrice !== undefined) {
      dbQuery = dbQuery.gte("price", filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      dbQuery = dbQuery.lte("price", filters.maxPrice);
    }

    if (filters.location) {
      dbQuery = dbQuery.ilike("location", `%${filters.location}%`);
    }

    if (filters.state) {
      dbQuery = dbQuery.eq("state", filters.state);
    }

    if (filters.condition) {
      dbQuery = dbQuery.eq("condition", filters.condition);
    }

    // Order by relevance (views count as proxy) and limit
    const { data: results, error } = await dbQuery
      .order("views_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Calculate simple relevance score based on keyword matches
    const scoredResults = (results || []).map((r: any) => {
      let score = 0;
      const lowerQuery = query.toLowerCase();
      const lowerTitle = r.title?.toLowerCase() || "";
      const lowerDesc = r.description?.toLowerCase() || "";

      // Title exact match
      if (lowerTitle.includes(lowerQuery)) {
        score += 1.0;
      }

      // Description match
      if (lowerDesc.includes(lowerQuery)) {
        score += 0.5;
      }

      // Normalize score to 0-1 range
      score = Math.min(score, 1.0);

      return {
        ...r,
        relevance_score: score,
      };
    });

    return {
      results: scoredResults,
      algorithm: "keyword",
      total: scoredResults.length,
    };
  } catch (error) {
    console.error("Keyword search error:", error);
    return {
      results: [],
      algorithm: "keyword",
      total: 0,
    };
  }
}

/**
 * Perform hybrid search combining semantic and keyword search
 * Requirements: 22.4
 *
 * @param query - Search query text
 * @param filters - Optional filters
 * @param limit - Maximum number of results
 * @returns Combined search results
 */
export async function searchHybrid(
  query: string,
  filters: SearchFilters = {},
  limit: number = 10,
): Promise<SearchResponse> {
  try {
    // Run both searches in parallel
    const [semanticResults, keywordResults] = await Promise.all([
      searchSemantic(query, filters, limit),
      searchKeyword(query, filters, limit),
    ]);

    // Combine and deduplicate results
    const resultMap = new Map<string, SearchResult>();

    // Add semantic results with higher weight
    semanticResults.results.forEach((result) => {
      resultMap.set(result.id, {
        ...result,
        relevance_score: result.relevance_score * 0.7, // 70% weight for semantic
      });
    });

    // Add keyword results with lower weight, or boost if already present
    keywordResults.results.forEach((result) => {
      const existing = resultMap.get(result.id);
      if (existing) {
        // Boost score if found in both
        existing.relevance_score += result.relevance_score * 0.3; // 30% weight for keyword
      } else {
        resultMap.set(result.id, {
          ...result,
          relevance_score: result.relevance_score * 0.3,
        });
      }
    });

    // Sort by combined relevance score
    const combinedResults = Array.from(resultMap.values())
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);

    return {
      results: combinedResults,
      algorithm: "hybrid",
      total: combinedResults.length,
    };
  } catch (error) {
    console.error("Hybrid search error:", error);
    // Final fallback to keyword search
    return await searchKeyword(query, filters, limit);
  }
}

/**
 * Search for autocomplete suggestions
 * Combines semantic search with category/vendor suggestions
 *
 * @param query - Partial search query
 * @param limit - Maximum number of suggestions
 * @returns Autocomplete suggestions
 */
export async function searchAutocomplete(
  query: string,
  limit: number = 8,
): Promise<Array<{
  type: "listing" | "category" | "vendor";
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  url: string;
}>> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const supabase = await createClient();

  try {
    // Try semantic search first for listings
    let listingResults: SearchResult[] = [];
    try {
      const semanticResponse = await searchSemantic(query, {}, 5);
      listingResults = semanticResponse.results;
    } catch {
      // Fallback to keyword search
      const keywordResponse = await searchKeyword(query, {}, 5);
      listingResults = keywordResponse.results;
    }

    // Search categories
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name")
      .ilike("name", `%${query}%`)
      .limit(3);

    // Combine results
    const suggestions = [
      ...listingResults.map((listing) => ({
        type: "listing" as const,
        id: listing.id,
        title: listing.title,
        subtitle: listing.location,
        thumbnail: listing.thumbnail_url,
        url: `/listing/${listing.id}`,
      })),
      ...(categories || []).map((cat) => ({
        type: "category" as const,
        id: cat.id,
        title: cat.name,
        url: `/categories/${cat.id}`,
      })),
    ];

    return suggestions.slice(0, limit);
  } catch (error) {
    console.error("Autocomplete search error:", error);
    return [];
  }
}
