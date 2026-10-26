/**
 * Business Profile by ID API Route
 * Task 5.4: Create GET /api/business-profiles/[id] endpoint
 * Task 5.5: Create PATCH /api/business-profiles/[id] endpoint
 * Task 14.3: Display category-specific fields on business profile page
 * Requirements: 2.2, 2.3, 2.4, 2.7, 12.5, 17.4, 18.6
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateProfileCompleteness } from "@/lib/utils/profile-completeness";

/**
 * GET /api/business-profiles/[id]
 * Get a single business profile with all related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Query business profile by ID
    const { data: profile, error: profileError } = await supabase
      .from("business_profiles")
      .select(
        `
        *,
        user:user_id (
          id,
          full_name,
          username,
          avatar_url
        ),
        primary_category:primary_category_id (
          id,
          name,
          icon
        )
      `,
      )
      .eq("id", id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 },
      );
    }

    // Query secondary categories from business_category_tags
    const { data: categoryTags, error: tagsError } = await supabase
      .from("business_category_tags")
      .select(
        `
        category_id,
        subcategory_ids,
        is_primary,
        category:category_id (
          id,
          name,
          icon
        )
      `,
      )
      .eq("business_profile_id", id)
      .eq("is_primary", false);

    if (tagsError) {
      console.error("Category tags fetch error:", tagsError);
    }

    const secondary_categories = categoryTags?.map((tag) => tag.category) || [];

    // Query products
    const { data: products, error: productsError } = await supabase
      .from("product_listings")
      .select("*")
      .eq("business_profile_id", id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (productsError) {
      console.error("Products fetch error:", productsError);
    }

    // Query services
    const { data: services, error: servicesError } = await supabase
      .from("service_listings")
      .select("*")
      .eq("business_profile_id", id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (servicesError) {
      console.error("Services fetch error:", servicesError);
    }

    // Query recent reviews (limit to 10 most recent)
    const { data: reviews, error: reviewsError } = await supabase
      .from("business_reviews")
      .select(
        `
        *,
        reviewer:reviewer_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `,
      )
      .eq("business_profile_id", id)
      .eq("is_flagged", false)
      .order("created_at", { ascending: false })
      .limit(10);

    if (reviewsError) {
      console.error("Reviews fetch error:", reviewsError);
    }

    // Calculate rating breakdown
    const { data: allReviews, error: allReviewsError } = await supabase
      .from("business_reviews")
      .select("rating")
      .eq("business_profile_id", id)
      .eq("is_flagged", false);

    let rating_breakdown = {
      five_star: 0,
      four_star: 0,
      three_star: 0,
      two_star: 0,
      one_star: 0,
    };

    if (!allReviewsError && allReviews) {
      allReviews.forEach((review) => {
        switch (review.rating) {
          case 5:
            rating_breakdown.five_star++;
            break;
          case 4:
            rating_breakdown.four_star++;
            break;
          case 3:
            rating_breakdown.three_star++;
            break;
          case 2:
            rating_breakdown.two_star++;
            break;
          case 1:
            rating_breakdown.one_star++;
            break;
        }
      });
    }

    // Increment view_count
    const { error: viewError } = await supabase
      .from("business_profiles")
      .update({ view_count: (profile.view_count || 0) + 1 })
      .eq("id", id);

    if (viewError) {
      console.error("View count update error:", viewError);
      // Don't fail the request if view count update fails
    }

    // Build comprehensive response
    const response = {
      business_profile: {
        ...profile,
        secondary_categories,
        category_specific_fields: (profile as any).category_specific_fields || {},
      },
      products: products || [],
      services: services || [],
      reviews: reviews || [],
      rating_breakdown,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Business profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/business-profiles/[id]
 * Update a business profile
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to update a business profile." },
        { status: 401 },
      );
    }

    // Verify the profile exists and belongs to the user
    const { data: existingProfile, error: profileError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profileError || !existingProfile) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 },
      );
    }

    if (existingProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. You can only update your own business profile." },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();

    // Build update data (only include fields that are present in the request)
    const updateData: Record<string, any> = {};

    // Allowed fields for update
    const allowedFields = [
      "business_name",
      "display_name",
      "description",
      "business_type",
      "primary_category_id",
      "primary_subcategory_ids",
      "address",
      "city",
      "state",
      "postal_code",
      "coordinates",
      "phone",
      "email",
      "website",
      "business_hours",
      "service_attributes",
      "price_range",
      "photo_urls",
      "primary_photo_url",
      "is_active",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "coordinates" && body[field]) {
          // Convert coordinates to PostGIS format
          updateData[field] = `POINT(${body[field].lng} ${body[field].lat})`;
        } else if (typeof body[field] === "string") {
          updateData[field] = body[field].trim();
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // If primary_category_id changed, verify it exists
    if (body.primary_category_id) {
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", body.primary_category_id)
        .single();

      if (categoryError || !categoryData) {
        return NextResponse.json(
          { error: "Invalid primary_category_id" },
          { status: 400 },
        );
      }
    }

    // Recalculate completeness_percentage
    // First, get products and services count for completeness calculation
    const { data: products } = await supabase
      .from("product_listings")
      .select("id")
      .eq("business_profile_id", id)
      .eq("is_active", true);

    const { data: services } = await supabase
      .from("service_listings")
      .select("id")
      .eq("business_profile_id", id)
      .eq("is_active", true);

    const profileForCompleteness = {
      ...existingProfile,
      ...updateData,
      products: products || [],
      services: services || [],
    } as any;

    updateData.completeness_percentage = calculateProfileCompleteness(
      profileForCompleteness,
    );

    // Update business profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("business_profiles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Business profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update business profile" },
        { status: 500 },
      );
    }

    // Update category tags if categories changed
    if (
      body.primary_category_id ||
      body.primary_subcategory_ids ||
      body.secondary_categories !== undefined
    ) {
      // Delete all existing category tags
      const { error: deleteTagsError } = await supabase
        .from("business_category_tags")
        .delete()
        .eq("business_profile_id", id);

      if (deleteTagsError) {
        console.error("Category tags delete error:", deleteTagsError);
      }

      // Insert primary category tag
      const primaryCategoryId =
        body.primary_category_id || existingProfile.primary_category_id;
      const primarySubcategoryIds =
        body.primary_subcategory_ids || existingProfile.primary_subcategory_ids;

      const { error: primaryTagError } = await supabase
        .from("business_category_tags")
        .insert({
          business_profile_id: id,
          category_id: primaryCategoryId,
          subcategory_ids: primarySubcategoryIds || [],
          is_primary: true,
        });

      if (primaryTagError) {
        console.error("Primary category tag insert error:", primaryTagError);
      }

      // Insert secondary category tags if provided
      if (body.secondary_categories && body.secondary_categories.length > 0) {
        const secondaryTags = body.secondary_categories.map((cat: {
          category_id: string;
          subcategory_ids: string[];
        }) => ({
          business_profile_id: id,
          category_id: cat.category_id,
          subcategory_ids: cat.subcategory_ids || [],
          is_primary: false,
        }));

        const { error: secondaryTagsError } = await supabase
          .from("business_category_tags")
          .insert(secondaryTags);

        if (secondaryTagsError) {
          console.error(
            "Secondary category tags insert error:",
            secondaryTagsError,
          );
        }
      }
    }

    return NextResponse.json({
      business_profile: updatedProfile,
      message: "Business profile updated successfully",
    });
  } catch (error) {
    console.error("Business profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
