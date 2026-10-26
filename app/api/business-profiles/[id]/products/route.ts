/**
 * Product Listings API Route
 * Task 7.1: Create POST /api/business-profiles/[id]/products endpoint
 * Task 7.2: Create GET /api/business-profiles/[id]/products endpoint
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Maximum number of images per product
const MAX_PRODUCT_IMAGES = 10;
const MIN_PRODUCT_IMAGES = 1;

// Allowed MIME types
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * POST /api/business-profiles/[id]/products
 * Create a product listing for a business profile
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
export async function POST(
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
        { error: "Unauthorized. Please sign in to create a product listing." },
        { status: 401 },
      );
    }

    // Verify the business profile exists and belongs to the user
    const { data: businessProfile, error: profileError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profileError || !businessProfile) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 },
      );
    }

    if (businessProfile.user_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "Forbidden. You can only create products for your own business profile.",
        },
        { status: 403 },
      );
    }

    // Parse multipart form data
    const formData = await request.formData();

    // Extract product fields
    const title = formData.get("title")?.toString().trim();
    const description = formData.get("description")?.toString().trim();
    const product_type = formData.get("product_type")?.toString();
    const price = formData.get("price")?.toString();
    const currency = formData.get("currency")?.toString() || "NGN";
    const stock_quantity = formData.get("stock_quantity")?.toString();
    const low_stock_threshold =
      formData.get("low_stock_threshold")?.toString() || "5";

    // Validate required fields
    if (!title || !description || !product_type || !price) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, description, product_type, and price are required",
        },
        { status: 400 },
      );
    }

    // Validate product_type
    if (product_type !== "physical" && product_type !== "digital") {
      return NextResponse.json(
        { error: 'product_type must be either "physical" or "digital"' },
        { status: 400 },
      );
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { error: "Price must be a positive number" },
        { status: 400 },
      );
    }

    // Validate price has max 2 decimal places
    if (price.includes(".") && price.split(".")[1].length > 2) {
      return NextResponse.json(
        { error: "Price must have maximum 2 decimal places" },
        { status: 400 },
      );
    }

    // Validate stock_quantity for physical products
    let stockQuantityNum = 0;
    if (stock_quantity) {
      stockQuantityNum = parseInt(stock_quantity, 10);
      if (isNaN(stockQuantityNum) || stockQuantityNum < 0) {
        return NextResponse.json(
          { error: "stock_quantity must be a non-negative integer" },
          { status: 400 },
        );
      }
    }

    // Validate low_stock_threshold
    const lowStockThresholdNum = parseInt(low_stock_threshold, 10);
    if (isNaN(lowStockThresholdNum) || lowStockThresholdNum < 0) {
      return NextResponse.json(
        { error: "low_stock_threshold must be a non-negative integer" },
        { status: 400 },
      );
    }

    // Extract image files
    const images = formData.getAll("images") as File[];

    // Validate image count
    if (images.length < MIN_PRODUCT_IMAGES) {
      return NextResponse.json(
        { error: `At least ${MIN_PRODUCT_IMAGES} image is required` },
        { status: 400 },
      );
    }

    if (images.length > MAX_PRODUCT_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PRODUCT_IMAGES} images allowed per product` },
        { status: 400 },
      );
    }

    // Validate each image
    for (const image of images) {
      // Check file size
      if (image.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `Image "${image.name}" exceeds maximum size of 5MB (${(image.size / 1024 / 1024).toFixed(2)}MB)`,
          },
          { status: 400 },
        );
      }

      // Check file format
      if (!ALLOWED_MIME_TYPES.includes(image.type)) {
        return NextResponse.json(
          {
            error: `Image "${image.name}" has invalid format. Allowed formats: JPEG, PNG, WebP`,
          },
          { status: 400 },
        );
      }
    }

    // Upload images to Supabase Storage
    const uploadedUrls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const fileExt = image.name.split(".").pop();
      const fileName = `${id}-product-${Date.now()}-${i}.${fileExt}`;
      const filePath = `products/${id}/${fileName}`;

      // Convert File to ArrayBuffer then to Buffer for Supabase
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("listing-media")
        .upload(filePath, buffer, {
          contentType: image.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Image upload error:", uploadError);
        return NextResponse.json(
          { error: `Failed to upload image "${image.name}"` },
          { status: 500 },
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("listing-media").getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    // Insert product into database
    const { data: product, error: insertError } = await supabase
      .from("product_listings")
      .insert({
        business_profile_id: id,
        title,
        description,
        product_type,
        price: priceNum,
        currency,
        stock_quantity: stockQuantityNum,
        low_stock_threshold: lowStockThresholdNum,
        image_urls: uploadedUrls,
        primary_image_url: uploadedUrls[0], // First image is primary
        is_active: true,
        is_featured: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Product insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create product listing" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        product,
        message: "Product listing created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/business-profiles/[id]/products
 * Get all products for a business profile
 * Requirements: 9.5, 9.7
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("is_active");
    const isFeatured = searchParams.get("is_featured");

    // Build query
    let query = supabase
      .from("product_listings")
      .select("*")
      .eq("business_profile_id", id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    if (isFeatured !== null) {
      query = query.eq("is_featured", isFeatured === "true");
    }

    const { data: products, error } = await query;

    if (error) {
      console.error("Products fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      products: products || [],
      total: products?.length || 0,
    });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
