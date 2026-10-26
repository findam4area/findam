import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/listings/featured
 * 
 * Fetch featured listings for the homepage from new database schema.
 * 
 * Requirements:
 * - 3.1: Fetch and display 6-12 featured listings
 * - Combines products and services from new schema
 * - Includes business profile information
 * - Returns featured items with is_featured = true
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch featured products (6 items)
    const { data: products, error: productsError } = await supabase
      .from("product_listings")
      .select(
        `
        id,
        title,
        price,
        currency,
        primary_image_url,
        image_urls,
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
          is_premium,
          user:users!business_profiles_user_id_fkey(
            id,
            username,
            avatar_url
          )
        )
      `
      )
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (productsError) {
      console.error("Error fetching featured products:", productsError);
    }

    // Fetch featured services (6 items)
    const { data: services, error: servicesError } = await supabase
      .from("service_listings")
      .select(
        `
        id,
        title,
        price,
        pricing_model,
        currency,
        primary_image_url,
        image_urls,
        created_at,
        business_profile:business_profiles!service_listings_business_profile_id_fkey(
          id,
          business_name,
          display_name,
          city,
          state,
          average_rating,
          primary_photo_url,
          is_verified,
          is_premium,
          user:users!business_profiles_user_id_fkey(
            id,
            username,
            avatar_url
          )
        )
      `
      )
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (servicesError) {
      console.error("Error fetching featured services:", servicesError);
    }

    // Combine and transform data to match frontend Listing interface
    const allItems = [
      ...(products || []).map((product: any) => ({
        ...product,
        type: "product" as const,
      })),
      ...(services || []).map((service: any) => ({
        ...service,
        type: "service" as const,
      })),
    ];

    // Sort by created_at and limit to 12
    allItems.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const limitedItems = allItems.slice(0, 12);

    // Transform to match Listing interface from types.ts
    const transformedListings = limitedItems.map((item: any) => {
      const businessProfile = item.business_profile;
      const businessName =
        businessProfile?.display_name || businessProfile?.business_name || "Unknown Business";
      const location = `${businessProfile?.city || "N/A"}, ${businessProfile?.state || "Nigeria"}`;

      return {
        id: item.id,
        title: item.title,
        price: item.price || 0,
        currency: item.currency || "₦",
        location,
        thumbnail: item.primary_image_url || "/placeholder-listing.jpg",
        images: item.image_urls || [],
        video: undefined, // Videos not in current schema
        views: 0, // View tracking not in current schema
        likes: 0, // Like tracking not in current schema
        isBoosted: businessProfile?.is_premium || false,
        vendor: {
          id: businessProfile?.user?.id || "",
          name: businessProfile?.user?.username || businessName,
          avatar:
            businessProfile?.user?.avatar_url ||
            businessProfile?.primary_photo_url ||
            "/placeholder-avatar.jpg",
          isVerified: businessProfile?.is_verified || false,
        },
        createdAt: item.created_at,
      };
    });

    return NextResponse.json(transformedListings);
  } catch (error) {
    console.error("Unexpected error in featured listings API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
