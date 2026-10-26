/**
 * Semantic Search API Route
 * Requirements: 22.3, 22.4, 22.7, 22.9
 *
 * Provides hybrid search combining vector similarity with keyword search.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  searchHybrid,
  searchSemantic,
  searchKeyword,
  searchAutocomplete,
} from "@/lib/services/semantic-search";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const mode = searchParams.get("mode") || "hybrid"; // hybrid, semantic, keyword, autocomplete
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 },
      );
    }

    // Parse filters
    const filters = {
      categoryId: searchParams.get("category") || undefined,
      minPrice: searchParams.get("min_price")
        ? parseFloat(searchParams.get("min_price")!)
        : undefined,
      maxPrice: searchParams.get("max_price")
        ? parseFloat(searchParams.get("max_price")!)
        : undefined,
      location: searchParams.get("location") || undefined,
      state: searchParams.get("state") || undefined,
      condition: searchParams.get("condition") || undefined,
    };

    // Perform search based on mode
    let results;
    switch (mode) {
      case "semantic":
        results = await searchSemantic(query, filters, limit);
        break;
      case "keyword":
        results = await searchKeyword(query, filters, limit);
        break;
      case "autocomplete":
        const suggestions = await searchAutocomplete(query, limit);
        return NextResponse.json({ suggestions });
      case "hybrid":
      default:
        results = await searchHybrid(query, filters, limit);
        break;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
