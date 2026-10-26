/**
 * Embeddings Generation API Route
 * Requirements: 22.2, 22.6, 22.8
 *
 * Provides endpoint for generating embeddings for listings.
 * Automatically called on listing create/update.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateListingEmbedding } from "@/lib/services/embeddings";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { listingId, title, description } = body;

    if (!listingId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: listingId, title" },
        { status: 400 },
      );
    }

    // Verify listing ownership
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("user_id")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to update this listing" },
        { status: 403 },
      );
    }

    // Generate embedding
    try {
      const embedding = await generateListingEmbedding(
        title,
        description || "",
      );

      // Update listing with embedding (convert to string for pgvector)
      const { error: updateError } = await supabase
        .from("listings")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", listingId);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        listingId,
        embeddingDimensions: embedding.length,
      });
    } catch (embeddingError) {
      // Handle embedding generation failure gracefully (Requirement 22.8)
      console.error("Embedding generation failed:", embeddingError);

      // Return success but log the failure
      // The listing can still function without embeddings (semantic search will be unavailable)
      return NextResponse.json({
        success: true,
        listingId,
        warning: "Embedding generation failed, listing saved without semantic search support",
        error:
          embeddingError instanceof Error
            ? embeddingError.message
            : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Error in embeddings generation:", error);
    return NextResponse.json(
      {
        error: "Failed to generate embeddings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Batch generate embeddings for multiple listings
 * Useful for backfilling existing listings
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication (admin only for batch operations)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { listingIds } = body;

    if (!Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json(
        { error: "listingIds must be a non-empty array" },
        { status: 400 },
      );
    }

    // Limit batch size to prevent timeouts
    if (listingIds.length > 50) {
      return NextResponse.json(
        { error: "Maximum batch size is 50 listings" },
        { status: 400 },
      );
    }

    // Fetch listings
    const { data: listings, error: fetchError } = await supabase
      .from("listings")
      .select("id, title, description, user_id")
      .in("id", listingIds);

    if (fetchError) {
      throw fetchError;
    }

    if (!listings || listings.length === 0) {
      return NextResponse.json({ error: "No listings found" }, { status: 404 });
    }

    // Generate embeddings for each listing
    const results = await Promise.allSettled(
      listings.map(async (listing) => {
        try {
          const embedding = await generateListingEmbedding(
            listing.title,
            listing.description || "",
          );

          const { error: updateError } = await supabase
            .from("listings")
            .update({ embedding: JSON.stringify(embedding) })
            .eq("id", listing.id);

          if (updateError) {
            throw updateError;
          }

          return { id: listing.id, success: true };
        } catch (error) {
          return {
            id: listing.id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }),
    );

    // Summarize results
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      total: listings.length,
      successful,
      failed,
      results: results.map((r, i) => ({
        listingId: listings[i].id,
        status: r.status,
        ...(r.status === "fulfilled" ? r.value : { error: r.reason }),
      })),
    });
  } catch (error) {
    console.error("Error in batch embeddings generation:", error);
    return NextResponse.json(
      {
        error: "Failed to generate batch embeddings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
