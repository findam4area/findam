import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/vendors/featured
 * 
 * Fetch featured vendors from business_profiles table.
 * Requirements: 4.1, 4.2
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch featured business profiles (8-12 vendors)
    const { data: businesses, error } = await supabase
      .from("business_profiles")
      .select(
        `
        id,
        business_name,
        display_name,
        description,
        city,
        state,
        average_rating,
        review_count,
        is_verified,
        is_premium,
        premium_tier,
        primary_photo_url,
        user:users!business_profiles_user_id_fkey(
          id,
          username,
          avatar_url
        ),
        products:product_listings(id),
        services:service_listings(id)
      `
      )
      .eq("is_active", true)
      .gte("average_rating", 4.0)
      .order("average_rating", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Error fetching featured vendors:", error);
      return NextResponse.json(
        { error: "Failed to fetch vendors" },
        { status: 500 }
      );
    }

    // Transform to match Vendor interface from types.ts
    const transformedVendors = (businesses || []).map((business: any) => {
      // Count total listings (products + services)
      const productCount = business.products?.length || 0;
      const serviceCount = business.services?.length || 0;
      const listingCount = productCount + serviceCount;

      // Determine specialties from description (simplified)
      // In a real scenario, you might have a specialties field or derive from categories
      const specialties = business.description
        ? [business.description.split(" ").slice(0, 3).join(" ") + "..."]
        : [];

      return {
        id: business.id,
        name: business.display_name || business.business_name,
        avatar: business.primary_photo_url || business.user?.avatar_url || "/images/default-avatar.png",
        rating: business.average_rating || 0,
        reviewCount: business.review_count || 0,
        listingCount,
        specialties,
        verification: {
          phone: business.is_verified, // Simplified: using is_verified for all
          nin: business.is_verified,
          video: business.is_verified,
        },
        responseTime: 24, // Default response time (could be added to schema later)
      };
    });

    return NextResponse.json(transformedVendors);
  } catch (error) {
    console.error("Unexpected error in featured vendors API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
