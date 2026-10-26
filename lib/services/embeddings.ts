/**
 * Embeddings Service
 * Requirements: 22.2, 22.6, 22.8
 *
 * Handles generation of vector embeddings using OpenAI's text-embedding-ada-002 model
 * for semantic search and recommendations.
 */

import OpenAI from "openai";

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    openaiClient = new OpenAI({
      apiKey,
    });
  }

  return openaiClient;
}

/**
 * Cache for embeddings (in-memory, 24 hours TTL)
 * Requirements: 22.7
 */
interface EmbeddingCacheEntry {
  embedding: number[];
  timestamp: number;
}

const embeddingCache = new Map<string, EmbeddingCacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate cache key from text
 */
function getCacheKey(text: string): string {
  // Simple hash function for cache key
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `emb_${hash}_${text.length}`;
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: EmbeddingCacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Generate embedding for text using OpenAI ada-002
 * Requirements: 22.2, 22.6
 *
 * @param text - Text to generate embedding for (title + description)
 * @param useCache - Whether to use cache (default: true)
 * @returns Array of 1536 floats representing the embedding
 */
export async function generateEmbedding(
  text: string,
  useCache: boolean = true,
): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty");
  }

  // Check cache first
  if (useCache) {
    const cacheKey = getCacheKey(text);
    const cached = embeddingCache.get(cacheKey);

    if (cached && isCacheValid(cached)) {
      return cached.embedding;
    }
  }

  try {
    const client = getOpenAIClient();

    // Generate embedding using OpenAI
    const response = await client.embeddings.create({
      model: "text-embedding-ada-002",
      input: text.substring(0, 8000), // Limit to 8000 chars to stay within token limits
    });

    const embedding = response.data[0].embedding;

    // Validate embedding dimensions
    if (embedding.length !== 1536) {
      throw new Error(
        `Invalid embedding dimensions: expected 1536, got ${embedding.length}`,
      );
    }

    // Cache the result
    if (useCache) {
      const cacheKey = getCacheKey(text);
      embeddingCache.set(cacheKey, {
        embedding,
        timestamp: Date.now(),
      });
    }

    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Generate embedding for a listing (title + description)
 * Requirements: 22.2
 *
 * @param title - Listing title
 * @param description - Listing description
 * @returns Array of 1536 floats representing the embedding
 */
export async function generateListingEmbedding(
  title: string,
  description: string,
): Promise<number[]> {
  // Combine title and description with title weighted more heavily
  const text = `${title}\n${title}\n${description}`;
  return generateEmbedding(text);
}

/**
 * Generate user embedding from browsing history
 * Requirements: 22.2
 *
 * @param listingTexts - Array of listing texts (title + description) from user's history
 * @returns Array of 1536 floats representing the user's preference embedding
 */
export async function generateUserEmbedding(
  listingTexts: string[],
): Promise<number[]> {
  if (listingTexts.length === 0) {
    throw new Error("Cannot generate user embedding from empty history");
  }

  // Combine recent listings (limit to last 10 for performance)
  const recentTexts = listingTexts.slice(-10);
  const combinedText = recentTexts.join("\n\n");

  return generateEmbedding(combinedText);
}

/**
 * Clear expired cache entries
 * Should be called periodically to prevent memory leaks
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of embeddingCache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL_MS) {
      embeddingCache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  validEntries: number;
  expiredEntries: number;
} {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  for (const entry of embeddingCache.values()) {
    if (now - entry.timestamp < CACHE_TTL_MS) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }

  return {
    size: embeddingCache.size,
    validEntries,
    expiredEntries,
  };
}

/**
 * Health check for OpenAI embeddings API
 */
export async function checkEmbeddingsHealth(): Promise<boolean> {
  try {
    const client = getOpenAIClient();

    // Simple test with minimal content
    await client.embeddings.create({
      model: "text-embedding-ada-002",
      input: "test",
    });

    return true;
  } catch (error) {
    console.error("Embeddings health check failed:", error);
    return false;
  }
}
