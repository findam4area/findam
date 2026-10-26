/**
 * Service Listings API Route
 * Task 7.4: Create POST /api/business-profiles/[id]/services endpoint
 * Task 7.5: Create GET /api/business-profiles/[id]/services endpoint
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Maximum number of images per service
const MAX_SERVICE_IMAGES = 5;
const MIN_SERVICE_IMAGES = 1;

// Allowed MIME types
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * POST /api/business-profiles/[id]/services
 * Create a service listing for a business profile
 * Requirements: 10.1, 10.2, 10.3, 10.4
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
        { error: "Unauthorized. Please sign in to create a service listing." },
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
            "Forbidden. You can only create services for your own business profile.",
        },
        { status: 403 },
      );
    }

    // Parse multipart form data
    const formData = await request.formData();

    // Extract service fields
    const title = formData.get("title")?.toString().trim();
    const description = formData.get("description")?.toString().trim();
    const pricing_model = formData.get("pricing_model")?.toString();
    const price = formData.get("price")?.toString();
    const currency = formData.get("currency")?.toString() || "NGN";
    const duration_text = formData.get("duration_text")?.toString().trim();

    // Validate required fields
    if (!title || !description || !pricing_model) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, description, and pricing_model are required",
        },
        { status: 400 },
      );
    }

    // Validate pricing_model
    if (
      pricing_model !== "fixed" &&
      pricing_model !== "hourly" &&
      pricing_model !== "custom"
    ) {
      return NextResponse.json(
        {
          error: 'pricing_model must be either "fixed", "hourly", or "custom"',
        },
        { status: 400 },
      );
    }

    // Validate price if provided
    let priceNum: number | null = null;
    if (price) {
      priceNum = parseFloat(price);
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
    }

    // Extract image files
    const images = formData.getAll("images") as File[];

    // Validate image count
    if (images.length < MIN_SERVICE_IMAGES) {
      return NextResponse.json(
        { error: `At least ${MIN_SERVICE_IMAGES} image is required` },
        { status: 400 },
      );
    }

    if (images.length > MAX_SERVICE_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_SERVICE_IMAGES} images allowed per service` },
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
      const fileName = `${id}-service-${Date.now()}-${i}.${fileExt}`;
      const filePath = `services/${id}/${fileName}`;

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

    // Insert service into database
    const serviceData: Record<string, any> = {
      business_profile_id: id,
      title,
      description,
      pricing_model,
      currency,
      image_urls: uploadedUrls,
      primary_image_url: uploadedUrls[0], // First image is primary
      is_active: true,
      is_featured: false,
    };

    // Add optional fields
    if (priceNum !== null) {
      serviceData.price = priceNum;
    }

    if (duration_text) {
      serviceData.duration_text = duration_text;
    }

    const { data: service, error: insertError } = await supabase
      .from("service_listings")
      .insert(serviceData as any)
      .select()
      .single();

    if (insertError) {
      console.error("Service insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create service listing" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        service,
        message: "Service listing created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Service creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/business-profiles/[id]/services
 * Get all services for a business profile
 * Requirements: 10.5, 10.6
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
      .from("service_listings")
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

    const { data: services, error } = await query;

    if (error) {
      console.error("Services fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch services" },
        { status: 500 },
      );
    }

    // Format services to display "Contact for Quote" for custom pricing
    const formattedServices = services?.map((service) => ({
      ...service,
      display_price:
        service.pricing_model === "custom"
          ? "Contact for Quote"
          : service.price
            ? `${service.currency} ${service.price}`
            : "Contact for Quote",
    }));

    return NextResponse.json({
      services: formattedServices || [],
      total: formattedServices?.length || 0,
    });
  } catch (error) {
    console.error("Services fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
