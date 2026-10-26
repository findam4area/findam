import { NextRequest, NextResponse } from "next/server";
import { getAutocompleteSuggestions } from "@/lib/typesense/queries";
import { createClient } from "@/lib/supabase/server";
import { createRateLimitMiddleware } from "@/lib/middleware/rate-limit-middleware";

// Rate limiter for autocomplete endpoint - 100 requests per minute (Requirement 31.2)
const rateLimitMiddleware = createRateLimitMiddleware({
  uniqueTokenPerInterval: 100,
  interval: 60000, // 1 minute
});

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (Requirement 31.2, 31.11)
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse; // Returns 429 if limit exceeded
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const type = searchParams.get("type"); // Optional: 'listings' or 'businesses'

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const supabase = await createClient();
    const suggestions: any[] = [];

    // Get listing suggestions from Typesense (only if not specifically searching for businesses)
    if (type !== 'businesses') {
      const listingSuggestions = await getAutocompleteSuggestions(query, 5);
      suggestions.push(...listingSuggestions);
    }

    // Get business profile suggestions (Requirements 4.4, 4.5)
    if (type !== 'listings') {
      const { data: businessResults, error: businessError } = await supabase
        .from("business_profiles")
        .select("id, business_name, city, state, average_rating")
        .eq("is_active", true)
        .ilike("business_name", `${query}%`)
        .order("average_rating", { ascending: false })
        .order("review_count", { ascending: false })
        .limit(3);

      if (businessError) {
        console.error("Business autocomplete error:", businessError);
      } else if (businessResults) {
        suggestions.push(
          ...businessResults.map((item) => ({
            type: "business" as const,
            id: item.id,
            text: item.business_name,
            location: `${item.city}, ${item.state}`,
            rating: item.average_rating,
          }))
        );
      }
    }

    // Search in categories
    const { data: categoryResults, error: categoryError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("is_hidden", false)
      .ilike("name", `%${query}%`)
      .limit(3);

    if (categoryError) {
      console.error("Category autocomplete error:", categoryError);
    } else if (categoryResults) {
      suggestions.push(
        ...(categoryResults || []).map((item) => ({
          type: "category" as const,
          id: item.id,
          text: item.name,
        }))
      );
    }

    // Search for location suggestions (cities)
    const { data: locationResults, error: locationError } = await supabase
      .from("business_profiles")
      .select("city, state")
      .eq("is_active", true)
      .ilike("city", `${query}%`)
      .limit(3);

    if (locationError) {
      console.error("Location autocomplete error:", locationError);
    } else if (locationResults) {
      // Deduplicate cities
      const uniqueCities = Array.from(
        new Set(locationResults.map((item) => `${item.city}, ${item.state}`))
      );
      suggestions.push(
        ...uniqueCities.slice(0, 3).map((location) => ({
          type: "location" as const,
          id: null,
          text: location,
        }))
      );
    }

    // Limit total suggestions to 10
    const limitedSuggestions = suggestions.slice(0, 10);

    return NextResponse.json({ suggestions: limitedSuggestions });
  } catch (error) {
    console.error("Autocomplete error:", error);
    return NextResponse.json(
      { error: "Failed to fetch autocomplete suggestions" },
      { status: 500 },
    );
  }
}
