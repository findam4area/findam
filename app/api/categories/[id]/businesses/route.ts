import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BusinessProfile } from "@/lib/types/business-profile";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const { id: categoryId } = await params;

    // Parse query parameters
    const subcategoryId = searchParams.get("subcategory_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sort_by") || "rating"; // rating, review_count, name

    // Calculate pagination offset
    const offset = (page - 1) * limit;

    // Build the query to find businesses with this category
    // Businesses can have this category as primary or secondary
    let businessTagsQuery = supabase
      .from("business_category_tags")
      .select("business_profile_id")
      .eq("category_id", categoryId);

    // Filter by subcategory if provided
    if (subcategoryId) {
      businessTagsQuery = businessTagsQuery.contains("subcategory_ids", [
        subcategoryId,
      ]);
    }

    const { data: businessTags, error: tagsError } =
      await businessTagsQuery;

    if (tagsError) throw tagsError;

    // Extract unique business profile IDs
    const businessIds = [
      ...new Set(businessTags?.map((tag) => tag.business_profile_id) || []),
    ];

    if (businessIds.length === 0) {
      return NextResponse.json({
        businesses: [],
        total: 0,
        page,
        limit,
        hasMore: false,
      });
    }

    // Build the business profiles query
    let businessQuery = supabase
      .from("business_profiles")
      .select(
        `
        id,
        user_id,
        business_name,
        display_name,
        description,
        business_type,
        primary_category_id,
        primary_subcategory_ids,
        address,
        city,
        state,
        postal_code,
        coordinates,
        phone,
        email,
        website,
        business_hours,
        service_attributes,
        price_range,
        primary_photo_url,
        photo_urls,
        is_verified,
        verified_at,
        is_premium,
        premium_tier,
        premium_expires_at,
        is_active,
        average_rating,
        review_count,
        completeness_percentage,
        view_count,
        created_at,
        updated_at
      `,
        { count: "exact" },
      )
      .in("id", businessIds)
      .eq("is_active", true);

    // Apply sorting
    switch (sortBy) {
      case "rating":
        businessQuery = businessQuery.order("average_rating", {
          ascending: false,
        });
        break;
      case "review_count":
        businessQuery = businessQuery.order("review_count", {
          ascending: false,
        });
        break;
      case "name":
        businessQuery = businessQuery.order("business_name", {
          ascending: true,
        });
        break;
      default:
        businessQuery = businessQuery.order("average_rating", {
          ascending: false,
        });
    }

    // Apply pagination
    businessQuery = businessQuery.range(offset, offset + limit - 1);

    const { data: businesses, error: businessError, count } =
      await businessQuery;

    if (businessError) throw businessError;

    // Transform the businesses to match the BusinessProfile interface
    const businessProfiles: BusinessProfile[] = (businesses || []).map(
      (business) => ({
        ...(business as any),
        display_name: business.display_name ?? undefined,
        coordinates: business.coordinates
          ? {
              lat: (business.coordinates as any).coordinates?.[1] || 0,
              lng: (business.coordinates as any).coordinates?.[0] || 0,
            }
          : undefined,
      }),
    );

    const total = count || 0;
    const hasMore = offset + limit < total;

    return NextResponse.json({
      businesses: businessProfiles,
      total,
      page,
      limit,
      hasMore,
    });
  } catch (error) {
    console.error("Category businesses fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 },
    );
  }
}
