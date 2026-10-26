/**
 * Business Profiles API Route
 * Task 5.3: Create POST /api/business-profiles endpoint
 * Task 14.2: Add category-specific fields to business profile creation
 * Requirements: 2.1, 2.2, 2.3, 2.4, 17.1, 18.5
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateProfileCompleteness } from "@/lib/utils/profile-completeness";
import { validateCategoryFields } from "@/lib/schemas/category-fields";

/**
 * POST /api/business-profiles
 * Create a new business profile
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to create a business profile." },
        { status: 401 },
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "business_name",
      "description",
      "primary_category_id",
      "city",
      "state",
    ];

    for (const field of requiredFields) {
      if (!body[field] || body[field].toString().trim().length === 0) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    // Check if user already has a business profile
    const { data: existingProfile, error: checkError } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which is expected
      throw checkError;
    }

    if (existingProfile) {
      return NextResponse.json(
        {
          error:
            "You already have a business profile. Each user can only create one business profile.",
        },
        { status: 409 }, // Conflict
      );
    }

    // Verify primary category exists and get its name for validation
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("id", body.primary_category_id)
      .single();

    if (categoryError || !categoryData) {
      return NextResponse.json(
        { error: "Invalid primary_category_id" },
        { status: 400 },
      );
    }

    // Validate category-specific fields if provided (Requirement 18.5)
    let validatedCategoryFields = {};
    if (body.category_specific_fields && Object.keys(body.category_specific_fields).length > 0) {
      const validation = validateCategoryFields(
        categoryData.name,
        body.category_specific_fields
      );

      if (!validation.success) {
        return NextResponse.json(
          {
            error: "Invalid category-specific fields",
            details: validation.error?.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 },
        );
      }

      validatedCategoryFields = validation.data || {};
    }

    // Build business profile data
    const profileData: any = {
      user_id: user.id,
      business_name: body.business_name.trim(),
      display_name: body.display_name?.trim() || null,
      description: body.description.trim(),
      business_type: body.business_type || "both",
      primary_category_id: body.primary_category_id,
      primary_subcategory_ids: body.primary_subcategory_ids || [],
      address: body.address?.trim() || null,
      city: body.city.trim(),
      state: body.state.trim(),
      postal_code: body.postal_code?.trim() || null,
      coordinates: body.coordinates
        ? `POINT(${body.coordinates.lng} ${body.coordinates.lat})`
        : null,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      website: body.website?.trim() || null,
      business_hours: body.business_hours || {},
      service_attributes: body.service_attributes || {},
      price_range: body.price_range || null,
      photo_urls: body.photo_urls || [],
      primary_photo_url: body.primary_photo_url || null,
      category_specific_fields: validatedCategoryFields,
      is_active: true,
    };

    // Calculate initial completeness (no products/services yet)
    const completeness = calculateProfileCompleteness({
      ...(profileData as any),
      coordinates: body.coordinates || undefined,
      products: [],
      services: [],
    });

    profileData.completeness_percentage = completeness;

    // Insert business profile
    const { data: newProfile, error: insertError } = await supabase
      .from("business_profiles")
      .insert(profileData)
      .select()
      .single();

    if (insertError) {
      console.error("Business profile insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create business profile" },
        { status: 500 },
      );
    }

    // Insert primary category tag into business_category_tags
    const { error: primaryTagError } = await supabase
      .from("business_category_tags")
      .insert({
        business_profile_id: newProfile.id,
        category_id: body.primary_category_id,
        subcategory_ids: body.primary_subcategory_ids || [],
        is_primary: true,
      });

    if (primaryTagError) {
      console.error("Primary category tag insert error:", primaryTagError);
      // Note: Profile is created but category tag failed
      // This is logged but we still return the profile
    }

    // Insert secondary category tags if provided
    if (body.secondary_categories && body.secondary_categories.length > 0) {
      const secondaryTags = body.secondary_categories.map((cat: {
        category_id: string;
        subcategory_ids: string[];
      }) => ({
        business_profile_id: newProfile.id,
        category_id: cat.category_id,
        subcategory_ids: cat.subcategory_ids || [],
        is_primary: false,
      }));

      const { error: secondaryTagsError } = await supabase
        .from("business_category_tags")
        .insert(secondaryTags);

      if (secondaryTagsError) {
        console.error("Secondary category tags insert error:", secondaryTagsError);
        // This is logged but we still return the profile
      }
    }

    // Return the created business profile
    return NextResponse.json(
      {
        business_profile: newProfile,
        message: "Business profile created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Business profile creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
