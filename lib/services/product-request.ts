/**
 * Product Request Service
 * Handles product request creation, offer submission, and offer management
*/

import { createClient } from "@/lib/supabase/server";

export interface ProductRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category_id: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  status: "active" | "fulfilled" | "expired";
  offers_count: number;
  expires_at: string;
  fulfilled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestOffer {
  id: string;
  request_id: string;
  seller_id: string;
  listing_id: string | null;
  price: number;
  message: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface CreateRequestParams {
  user_id: string;
  title: string;
  description: string;
  category_id?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
}

export interface SubmitOfferParams {
  request_id: string;
  seller_id: string;
  listing_id?: string;
  price: number;
  message?: string;
}

export interface RequestFilters {
  category_id?: string;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  search?: string;
}

export class ProductRequestService {
  /**
   * Create a new product request
   * Requirements: 19.1, 19.9
   */
  async createRequest(params: CreateRequestParams): Promise<ProductRequest> {
    const supabase = await createClient();

    // Validate required fields
    if (!params.title?.trim()) {
      throw new Error("Title is required");
    }

    if (!params.description?.trim()) {
      throw new Error("Description is required");
    }

    // Validate budget range if provided
    if (params.budget_min !== undefined && params.budget_max !== undefined) {
      if (params.budget_min < 0 || params.budget_max < 0) {
        throw new Error("Budget values must be non-negative");
      }
      if (params.budget_max < params.budget_min) {
        throw new Error(
          "Maximum budget must be greater than or equal to minimum budget",
        );
      }
    }

    // Create the request
    const { data, error } = await (supabase as any)
      .from("product_requests")
      .insert({
        user_id: params.user_id,
        title: params.title.trim(),
        description: params.description.trim(),
        category_id: params.category_id || null,
        budget_min: params.budget_min || null,
        budget_max: params.budget_max || null,
        preferred_location: params.preferred_location?.trim() || null,
        status: "active",
        offers_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product request: ${error.message}`);
    }

    return data as ProductRequest;
  }

  /**
   * Submit an offer for a product request
   * Requirements: 19.3, 19.4
   */
  async submitOffer(params: SubmitOfferParams): Promise<RequestOffer> {
    const supabase = await createClient();

    // Validate price
    if (params.price < 0) {
      throw new Error("Price must be non-negative");
    }

    // Check if request exists and is active
    const { data: request, error: requestError } = await (supabase as any)
      .from("product_requests")
      .select("id, user_id, status, expires_at")
      .eq("id", params.request_id)
      .single();

    if (requestError) {
      throw new Error(`Product request not found: ${requestError.message}`);
    }

    if (request.status !== "active") {
      throw new Error(`Cannot submit offer for ${request.status} request`);
    }

    if (new Date(request.expires_at) <= new Date()) {
      throw new Error("Cannot submit offer for expired request");
    }

    // Prevent self-offers (seller cannot offer on own request)
    if (request.user_id === params.seller_id) {
      throw new Error("Cannot submit offer on your own request");
    }

    // If listing_id provided, verify it exists and belongs to seller
    if (params.listing_id) {
      const { data: listing, error: listingError } = await (supabase as any)
        .from("listings")
        .select("id, user_id")
        .eq("id", params.listing_id)
        .single();

      if (listingError) {
        throw new Error(`Listing not found: ${listingError.message}`);
      }

      if (listing.user_id !== params.seller_id) {
        throw new Error("Listing does not belong to seller");
      }
    }

    // Create the offer
    const { data, error } = await (supabase as any)
      .from("request_offers")
      .insert({
        request_id: params.request_id,
        seller_id: params.seller_id,
        listing_id: params.listing_id || null,
        price: params.price,
        message: params.message?.trim() || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit offer: ${error.message}`);
    }

    // Create notification for requester (Requirement 19.4)
    await this.createOfferNotification({
      request_id: params.request_id,
      requester_id: request.user_id,
      seller_id: params.seller_id,
      offer_id: data.id,
    });

    return data as RequestOffer;
  }

  /**
   * Accept an offer
   * Requirements: 19.5
   */
  async acceptOffer(params: {
    offer_id: string;
    requester_id: string;
  }): Promise<RequestOffer> {
    const supabase = await createClient();

    // Get the offer with request details
    const { data: offer, error: offerError } = await (supabase as any)
      .from("request_offers")
      .select("*, product_requests!inner(user_id, status)")
      .eq("id", params.offer_id)
      .single();

    if (offerError) {
      throw new Error(`Offer not found: ${offerError.message}`);
    }

    // Verify requester owns the request
    if (offer.product_requests.user_id !== params.requester_id) {
      throw new Error("Only the requester can accept offers");
    }

    // Verify request is still active
    if (offer.product_requests.status !== "active") {
      throw new Error("Cannot accept offer for inactive request");
    }

    // Verify offer is pending
    if (offer.status !== "pending") {
      throw new Error(`Cannot accept offer with status: ${offer.status}`);
    }

    // Update offer status to accepted
    const { data: updatedOffer, error: updateError } = await (supabase as any)
      .from("request_offers")
      .update({ status: "accepted" })
      .eq("id", params.offer_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to accept offer: ${updateError.message}`);
    }

    // Create notification for seller
    await this.createOfferStatusNotification({
      offer_id: params.offer_id,
      seller_id: offer.seller_id,
      status: "accepted",
    });

    return updatedOffer as RequestOffer;
  }

  /**
   * Reject an offer
   * Requirements: 19.5
   */
  async rejectOffer(params: {
    offer_id: string;
    requester_id: string;
  }): Promise<RequestOffer> {
    const supabase = await createClient();

    // Get the offer with request details
    const { data: offer, error: offerError } = await (supabase as any)
      .from("request_offers")
      .select("*, product_requests!inner(user_id, status)")
      .eq("id", params.offer_id)
      .single();

    if (offerError) {
      throw new Error(`Offer not found: ${offerError.message}`);
    }

    // Verify requester owns the request
    if (offer.product_requests.user_id !== params.requester_id) {
      throw new Error("Only the requester can reject offers");
    }

    // Verify offer is pending
    if (offer.status !== "pending") {
      throw new Error(`Cannot reject offer with status: ${offer.status}`);
    }

    // Update offer status to rejected
    const { data: updatedOffer, error: updateError } = await (supabase as any)
      .from("request_offers")
      .update({ status: "rejected" })
      .eq("id", params.offer_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to reject offer: ${updateError.message}`);
    }

    // Create notification for seller
    await this.createOfferStatusNotification({
      offer_id: params.offer_id,
      seller_id: offer.seller_id,
      status: "rejected",
    });

    return updatedOffer as RequestOffer;
  }

  /**
   * Get user's product requests
   */
  async getUserRequests(params: {
    user_id: string;
    status?: "active" | "fulfilled" | "expired";
    limit?: number;
    offset?: number;
  }): Promise<ProductRequest[]> {
    const supabase = await createClient();

    let query = (supabase as any)
      .from("product_requests")
      .select("*")
      .eq("user_id", params.user_id);

    if (params.status) {
      query = query.eq("status", params.status);
    }

    query = query
      .order("created_at", { ascending: false })
      .limit(params.limit || 50)
      .range(
        params.offset || 0,
        (params.offset || 0) + (params.limit || 50) - 1,
      );

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch user requests: ${error.message}`);
    }

    return (data as ProductRequest[]) || [];
  }

  /**
   * Get all active product requests (for feed)
   * Requirements: 19.2
   */
  async getActiveRequests(params: {
    filters?: RequestFilters;
    limit?: number;
    offset?: number;
  }): Promise<ProductRequest[]> {
    const supabase = await createClient();

    let query = (supabase as any)
      .from("product_requests")
      .select(
        "*, users!inner(username, avatar_url, trust_score), categories(name)",
      )
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString());

    // Apply filters
    if (params.filters?.category_id) {
      query = query.eq("category_id", params.filters.category_id);
    }

    if (params.filters?.budget_min !== undefined) {
      query = query.gte("budget_max", params.filters.budget_min);
    }

    if (params.filters?.budget_max !== undefined) {
      query = query.lte("budget_min", params.filters.budget_max);
    }

    if (params.filters?.location) {
      query = query.ilike("preferred_location", `%${params.filters.location}%`);
    }

    if (params.filters?.search) {
      query = query.or(
        `title.ilike.%${params.filters.search}%,description.ilike.%${params.filters.search}%`,
      );
    }

    query = query
      .order("created_at", { ascending: false })
      .limit(params.limit || 20)
      .range(
        params.offset || 0,
        (params.offset || 0) + (params.limit || 20) - 1,
      );

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch active requests: ${error.message}`);
    }

    return (data as ProductRequest[]) || [];
  }

  /**
   * Get offers for a specific request
   * Requirements: 19.5
   */
  async getRequestOffers(params: {
    request_id: string;
    status?: "pending" | "accepted" | "rejected";
  }): Promise<RequestOffer[]> {
    const supabase = await createClient();

    let query = (supabase as any)
      .from("request_offers")
      .select(
        `
        *,
        users!seller_id(username, avatar_url, trust_score, phone_verified, nin_verified),
        listings(id, title, thumbnail_url, condition, state, lga)
      `,
      )
      .eq("request_id", params.request_id);

    if (params.status) {
      query = query.eq("status", params.status);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch request offers: ${error.message}`);
    }

    return (data as RequestOffer[]) || [];
  }

  /**
   * Mark request as fulfilled
   * Requirements: 19.7
   */
  async markRequestFulfilled(params: {
    request_id: string;
    user_id: string;
  }): Promise<ProductRequest> {
    const supabase = await createClient();

    // Get the request
    const { data: request, error: requestError } = await (supabase as any)
      .from("product_requests")
      .select("user_id, status")
      .eq("id", params.request_id)
      .single();

    if (requestError) {
      throw new Error(`Request not found: ${requestError.message}`);
    }

    // Verify user owns the request
    if (request.user_id !== params.user_id) {
      throw new Error("Only the requester can mark request as fulfilled");
    }

    // Verify request is active
    if (request.status !== "active") {
      throw new Error(`Cannot fulfill request with status: ${request.status}`);
    }

    // Update request status
    const { data: updatedRequest, error: updateError } = await (supabase as any)
      .from("product_requests")
      .update({
        status: "fulfilled",
        fulfilled_at: new Date().toISOString(),
      })
      .eq("id", params.request_id)
      .select()
      .single();

    if (updateError) {
      throw new Error(
        `Failed to mark request as fulfilled: ${updateError.message}`,
      );
    }

    return updatedRequest as ProductRequest;
  }

  /**
   * Get a single request by ID
   */
  async getRequestById(request_id: string): Promise<ProductRequest | null> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("product_requests")
      .select(
        `
        *,
        users!inner(username, avatar_url, trust_score),
        categories(name)
      `,
      )
      .eq("id", request_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch request: ${error.message}`);
    }

    return data as ProductRequest;
  }

  /**
   * Create notification when new offer is submitted
   * Requirements: 19.4
   */
  private async createOfferNotification(params: {
    request_id: string;
    requester_id: string;
    seller_id: string;
    offer_id: string;
  }): Promise<void> {
    const supabase = await createClient();

    try {
      // Get request title for notification
      const { data: request } = await (supabase as any)
        .from("product_requests")
        .select("title")
        .eq("id", params.request_id)
        .single();

      // Get seller username
      const { data: seller } = await (supabase as any)
        .from("users")
        .select("username")
        .eq("id", params.seller_id)
        .single();

      await (supabase as any).from("notifications").insert({
        user_id: params.requester_id,
        type: "new_offer",
        title: "New Offer Received",
        message: `${seller?.username || "A seller"} submitted an offer for "${request?.title || "your request"}"`,
        link: `/product-requests/${params.request_id}`,
        read: false,
      });
    } catch (error) {
      console.error("Failed to create offer notification:", error);
      // Don't throw - notification failure shouldn't block offer submission
    }
  }

  /**
   * Create notification when offer status changes
   */
  private async createOfferStatusNotification(params: {
    offer_id: string;
    seller_id: string;
    status: "accepted" | "rejected";
  }): Promise<void> {
    const supabase = await createClient();

    try {
      const statusText = params.status === "accepted" ? "accepted" : "rejected";
      const title =
        params.status === "accepted" ? "Offer Accepted!" : "Offer Rejected";

      await (supabase as any).from("notifications").insert({
        user_id: params.seller_id,
        type: "offer_status",
        title,
        message: `Your offer has been ${statusText}`,
        link: `/product-requests/offers/${params.offer_id}`,
        read: false,
      });
    } catch (error) {
      console.error("Failed to create offer status notification:", error);
      // Don't throw - notification failure shouldn't block status update
    }
  }
}

// Export singleton instance
export const productRequestService = new ProductRequestService();
