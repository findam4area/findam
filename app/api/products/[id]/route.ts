/**
 * Product Update API Route
 * Task 7.3: Create PATCH /api/products/[id] endpoint
 * Requirements: 9.6
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/products/[id]
 * Update a product listing
 * Requirements: 9.6
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
        { error: "Unauthorized. Please sign in to update a product listing." },
        { status: 401 },
      );
    }

    // Fetch the product and verify it exists
    const { data: product, error: productError } = await supabase
      .from("product_listings")
      .select("*, business_profiles!inner(user_id)")
      .eq("id", id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      );
    }

    // Verify the user owns the parent business profile
    // @ts-ignore - business_profiles is joined in the query
    if (product.business_profiles.user_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Forbidden. You can only update products for your own business profile.",
        },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();

    // Build update object with only allowed fields
    const updateData: Record<string, any> = {};

    // Validate and add title if provided
    if (body.title !== undefined) {
      const title = body.title.toString().trim();
      if (title.length === 0) {
        return NextResponse.json(
          { error: "Title cannot be empty" },
          { status: 400 },
        );
      }
      updateData.title = title;
    }

    // Validate and add description if provided
    if (body.description !== undefined) {
      const description = body.description.toString().trim();
      if (description.length === 0) {
        return NextResponse.json(
          { error: "Description cannot be empty" },
          { status: 400 },
        );
      }
      updateData.description = description;
    }

    // Validate and add price if provided
    if (body.price !== undefined) {
      const price = parseFloat(body.price);
      if (isNaN(price) || price < 0) {
        return NextResponse.json(
          { error: "Price must be a positive number" },
          { status: 400 },
        );
      }

      // Check decimal places
      const priceStr = body.price.toString();
      if (priceStr.includes(".") && priceStr.split(".")[1].length > 2) {
        return NextResponse.json(
          { error: "Price must have maximum 2 decimal places" },
          { status: 400 },
        );
      }

      updateData.price = price;
    }

    // Validate and add stock_quantity if provided
    if (body.stock_quantity !== undefined) {
      const stockQuantity = parseInt(body.stock_quantity, 10);
      if (isNaN(stockQuantity) || stockQuantity < 0) {
        return NextResponse.json(
          { error: "stock_quantity must be a non-negative integer" },
          { status: 400 },
        );
      }
      updateData.stock_quantity = stockQuantity;
      // Note: is_in_stock is a GENERATED ALWAYS column, so it will be
      // automatically recalculated when stock_quantity changes
    }

    // Validate and add low_stock_threshold if provided
    if (body.low_stock_threshold !== undefined) {
      const lowStockThreshold = parseInt(body.low_stock_threshold, 10);
      if (isNaN(lowStockThreshold) || lowStockThreshold < 0) {
        return NextResponse.json(
          { error: "low_stock_threshold must be a non-negative integer" },
          { status: 400 },
        );
      }
      updateData.low_stock_threshold = lowStockThreshold;
    }

    // Add is_active if provided
    if (body.is_active !== undefined) {
      if (typeof body.is_active !== "boolean") {
        return NextResponse.json(
          { error: "is_active must be a boolean" },
          { status: 400 },
        );
      }
      updateData.is_active = body.is_active;
    }

    // Add is_featured if provided
    if (body.is_featured !== undefined) {
      if (typeof body.is_featured !== "boolean") {
        return NextResponse.json(
          { error: "is_featured must be a boolean" },
          { status: 400 },
        );
      }
      updateData.is_featured = body.is_featured;
    }

    // Check if there are any fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 },
      );
    }

    // Update the product
    const { data: updatedProduct, error: updateError } = await supabase
      .from("product_listings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Product update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update product listing" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      product: updatedProduct,
      message: "Product listing updated successfully",
    });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
