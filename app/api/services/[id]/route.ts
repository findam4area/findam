/**
 * Service Update API Route
 * Task 7.6: Create PATCH /api/services/[id] endpoint
 * Requirements: 10.1, 10.2
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/services/[id]
 * Update a service listing
 * Requirements: 10.1, 10.2
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
        { error: "Unauthorized. Please sign in to update a service listing." },
        { status: 401 },
      );
    }

    // Get the service to verify ownership
    const { data: service, error: serviceError } = await supabase
      .from("service_listings")
      .select(
        `
        *,
        business_profile:business_profile_id (
          id,
          user_id
        )
      `,
      )
      .eq("id", id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: "Service listing not found" },
        { status: 404 },
      );
    }

    // Verify the user owns the business profile
    if ((service.business_profile as any).user_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Forbidden. You can only update services for your own business profile.",
        },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();

    // Build update data (only include fields that are present in the request)
    const updateData: Record<string, any> = {};

    // Allowed fields for update
    const allowedFields = [
      "title",
      "description",
      "pricing_model",
      "price",
      "currency",
      "duration_text",
      "is_active",
      "is_featured",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Validate field-specific constraints
        if (field === "title" || field === "description") {
          const value = body[field].trim();
          if (!value) {
            return NextResponse.json(
              { error: `${field} cannot be empty` },
              { status: 400 },
            );
          }
          updateData[field] = value;
        } else if (field === "pricing_model") {
          if (
            body[field] !== "fixed" &&
            body[field] !== "hourly" &&
            body[field] !== "custom"
          ) {
            return NextResponse.json(
              {
                error:
                  'pricing_model must be either "fixed", "hourly", or "custom"',
              },
              { status: 400 },
            );
          }
          updateData[field] = body[field];
        } else if (field === "price") {
          if (body[field] === null) {
            updateData[field] = null;
          } else {
            const priceNum = parseFloat(body[field]);
            if (isNaN(priceNum) || priceNum < 0) {
              return NextResponse.json(
                { error: "Price must be a positive number" },
                { status: 400 },
              );
            }
            // Validate max 2 decimal places
            const priceStr = body[field].toString();
            if (priceStr.includes(".") && priceStr.split(".")[1].length > 2) {
              return NextResponse.json(
                { error: "Price must have maximum 2 decimal places" },
                { status: 400 },
              );
            }
            updateData[field] = priceNum;
          }
        } else if (field === "duration_text") {
          updateData[field] = body[field]?.trim() || null;
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    // Update the service
    const { data: updatedService, error: updateError } = await supabase
      .from("service_listings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Service update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update service listing" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      service: updatedService,
      message: "Service listing updated successfully",
    });
  } catch (error) {
    console.error("Service update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
