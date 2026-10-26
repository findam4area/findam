/**
 * Deals API Route
 * 
 * Fetches deals from product_listings table.
 * For now, we'll display featured products as deals until discount fields are added to product schema.
 * 
 * Requirements:
 * - 13.2: Fetch deals (currently showing featured products)
 * - 13.7: Sort deals by price or creation time
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "8");
    const sortBy = searchParams.get("sort") || "price"; // 'price' or 'recent'

    const supabase = await createClient();

    // Fetch products with business info
    // Note: Once discount fields are added to product_listings, 
    // we should filter by discount_percentage > 0
    let query = supabase
      .from("product_listings")
      .select(`
        id,
        title,
        price,
        currency,
        primary_image_url,
        stock_quantity,
        is_in_stock,
        created_at,
        business_profile:business_profiles!product_listings_business_profile_id_fkey(
          id,
          business_name,
          display_name,
          city,
          state,
          average_rating,
          primary_photo_url,
          is_verified,
          user:users!business_profiles_user_id_fkey(
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq("is_active", true)
      .eq("is_in_stock", true)
      .limit(limit);

    // Sort by price (ascending for deals) or recent
    if (sortBy === "recent") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("price", { ascending: true }); // Lowest prices first
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching deals:", error);
      return NextResponse.json(
        { error: "Failed to fetch deals" },
        { status: 500 }
      );
    }

    // Transform data to match Deal interface
    const deals = data?.map((product: any) => {
      const businessProfile = product.business_profile;
      const businessName =
        businessProfile?.display_name || businessProfile?.business_name || "Unknown";
      const location = businessProfile?.city
        ? `${businessProfile.city}, ${businessProfile.state}`
        : businessProfile?.state || "Nigeria";

      // Temporary: Since we don't have discount fields yet, 
      // we'll show products as deals with minimal transformation
      const originalPrice = product.price * 1.2; // Simulate 20% discount for display
      const discountedPrice = product.price;
      const discountPercentage = 20; // Simulated discount

      return {
        id: product.id,
        listing: {
          id: product.id,
          title: product.title,
          thumbnail: product.primary_image_url || "/placeholder-listing.jpg",
          location: location,
          views: 0, // Not tracked in new schema
          likes: 0, // Not tracked in new schema
          vendor: {
            id: businessProfile?.user?.id || "",
            name: businessProfile?.user?.username || businessName,
            avatar:
              businessProfile?.user?.avatar_url ||
              businessProfile?.primary_photo_url ||
              "/placeholder-avatar.jpg",
            isVerified: businessProfile?.is_verified || false,
          },
        },
        originalPrice,
        discountedPrice,
        discountPercentage,
        expiresAt: null, // Not tracked in new schema yet
      };
    }) || [];

    return NextResponse.json({ deals });
  } catch (error) {
    console.error("Unexpected error in deals API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
