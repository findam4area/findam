// Business service for CRUD operations and verification
// Requirements: 21.1, 21.2, 21.5, 21.6

import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { formatNigerianPhone } from "@/lib/utils/phone";

type Business = Database["public"]["Tables"]["businesses"]["Row"];
type BusinessInsert = Database["public"]["Tables"]["businesses"]["Insert"];
type BusinessUpdate = Database["public"]["Tables"]["businesses"]["Update"];

export interface BusinessVerificationData {
  documentType: "cac" | "trade_license" | "tax_id";
  documentNumber: string;
  documentUrl: string;
  businessAddress: string;
}

export interface BusinessLocationData {
  state: string;
  lga: string;
  ward?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Create a new business profile
 * Requirements: 21.1, 21.6
 */
export async function createBusiness(data: {
  name: string;
  description: string;
  category_id: string;
  state: string;
  lga: string;
  ward?: string;
  phone: string;
  email?: string;
  website?: string;
  whatsapp?: string;
  logo_url?: string;
  cover_url?: string;
  coordinates?: { lat: number; lng: number };
  city?: string;
  address?: string;
}): Promise<Business> {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User must be authenticated");
  }

  // Format phone number to +234 format
  const formattedPhone = formatNigerianPhone(data.phone);
  const formattedWhatsapp = data.whatsapp
    ? formatNigerianPhone(data.whatsapp)
    : undefined;

  // Prepare coordinates in PostGIS format
  const coordinates = data.coordinates
    ? `POINT(${data.coordinates.lng} ${data.coordinates.lat})`
    : undefined;

  const businessData: BusinessInsert = {
    owner_id: user.id,
    name: data.name,
    description: data.description,
    category_id: data.category_id,
    state: data.state,
    lga: data.lga,
    ward: data.ward,
    phone: formattedPhone,
    email: data.email,
    website: data.website,
    whatsapp: formattedWhatsapp,
    logo_url: data.logo_url,
    cover_url: data.cover_url,
    coordinates: coordinates as any,
    city: data.city || data.lga, // Default city to LGA if not provided
    address: data.address,
    is_active: true,
    is_verified: false,
  };

  const { data: business, error } = await supabase
    .from("businesses")
    .insert(businessData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create business: ${error.message}`);
  }

  return business;
}

/**
 * Get a business by ID
 * Requirements: 21.1, 21.3
 */
export async function getBusinessById(id: string): Promise<Business | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select(
      `
      *,
      owner:users!businesses_owner_id_fkey(id, username, avatar_url, trust_score)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to fetch business: ${error.message}`);
  }

  return data;
}

/**
 * Update business information
 * Requirements: 21.1, 21.6
 */
export async function updateBusiness(
  id: string,
  data: Partial<BusinessUpdate>
): Promise<Business> {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User must be authenticated");
  }

  // Verify ownership
  const { data: business, error: fetchError } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", id)
    .single();

  if (fetchError || !business) {
    throw new Error("Business not found");
  }

  if (business.owner_id !== user.id) {
    throw new Error("Unauthorized: You can only update your own business");
  }

  // Format phone numbers if provided
  const updateData: Partial<BusinessUpdate> = { ...data };
  if (data.phone) {
    updateData.phone = formatNigerianPhone(data.phone);
  }
  if (data.whatsapp) {
    updateData.whatsapp = formatNigerianPhone(data.whatsapp);
  }

  const { data: updatedBusiness, error } = await supabase
    .from("businesses")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update business: ${error.message}`);
  }

  return updatedBusiness;
}

/**
 * Delete a business
 * Requirements: 21.1
 */
export async function deleteBusiness(id: string): Promise<void> {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User must be authenticated");
  }

  // Verify ownership
  const { data: business, error: fetchError } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", id)
    .single();

  if (fetchError || !business) {
    throw new Error("Business not found");
  }

  if (business.owner_id !== user.id) {
    throw new Error("Unauthorized: You can only delete your own business");
  }

  const { error } = await supabase.from("businesses").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete business: ${error.message}`);
  }
}

/**
 * Submit business verification documents
 * Requirements: 21.2
 */
export async function submitBusinessVerification(
  businessId: string,
  verificationData: BusinessVerificationData
): Promise<Business> {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User must be authenticated");
  }

  // Verify ownership
  const { data: business, error: fetchError } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .single();

  if (fetchError || !business) {
    throw new Error("Business not found");
  }

  if (business.owner_id !== user.id) {
    throw new Error(
      "Unauthorized: You can only verify your own business"
    );
  }

  // Store verification documents as JSONB
  const { data: updatedBusiness, error } = await supabase
    .from("businesses")
    .update({
      verification_documents: {
        documentType: verificationData.documentType,
        documentNumber: verificationData.documentNumber,
        documentUrl: verificationData.documentUrl,
        businessAddress: verificationData.businessAddress,
        submittedAt: new Date().toISOString(),
        status: "pending",
      },
    })
    .eq("id", businessId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit verification: ${error.message}`);
  }

  return updatedBusiness;
}

/**
 * Get all businesses with filtering
 * Requirements: 21.3, 21.4
 */
export async function getBusinesses(filters?: {
  category_id?: string;
  state?: string;
  lga?: string;
  is_verified?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Business[]> {
  const supabase = createClient();

  let query = supabase
    .from("businesses")
    .select(
      `
      *,
      owner:users!businesses_owner_id_fkey(id, username, avatar_url, trust_score)
    `
    )
    .eq("is_active", true);

  // Apply filters
  if (filters?.category_id) {
    query = query.eq("category_id", filters.category_id);
  }

  if (filters?.state) {
    query = query.eq("state", filters.state);
  }

  if (filters?.lga) {
    query = query.eq("lga", filters.lga);
  }

  if (filters?.is_verified !== undefined) {
    query = query.eq("is_verified", filters.is_verified);
  }

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  // Add pagination
  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  // Order by verified businesses first, then by rating
  query = query.order("is_verified", { ascending: false });
  query = query.order("average_rating", { ascending: false, nullsFirst: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch businesses: ${error.message}`);
  }

  return data || [];
}

/**
 * Get businesses by owner
 * Requirements: 21.1
 */
export async function getBusinessesByOwner(
  ownerId: string
): Promise<Business[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch businesses: ${error.message}`);
  }

  return data || [];
}

/**
 * Link a listing to a business
 * Requirements: 21.5
 */
export async function linkListingToBusiness(
  listingId: string,
  businessId: string
): Promise<void> {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User must be authenticated");
  }

  // Verify business ownership
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    throw new Error("Business not found");
  }

  if (business.owner_id !== user.id) {
    throw new Error("Unauthorized: You can only link to your own business");
  }

  // Verify listing ownership
  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    throw new Error("Listing not found");
  }

  if (listing.user_id !== user.id) {
    throw new Error("Unauthorized: You can only link your own listings");
  }

  // Update listing with business_id
  const { error } = await supabase
    .from("listings")
    .update({ business_id: businessId })
    .eq("id", listingId);

  if (error) {
    throw new Error(`Failed to link listing: ${error.message}`);
  }
}

/**
 * Get listings for a business
 * Requirements: 21.5
 */
export async function getBusinessListings(
  businessId: string,
  limit?: number
): Promise<any[]> {
  const supabase = createClient();

  let query = supabase
    .from("listings")
    .select(
      `
      id,
      title,
      description,
      price,
      thumbnail_url,
      state,
      lga,
      condition,
      created_at,
      views_count,
      likes_count
    `
    )
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch business listings: ${error.message}`);
  }

  return data || [];
}
