/**
 * Logistics Service
 * Handles logistics integration and tracking (Requirement 8)
 *
 * Requirements:
 * - 8.1: Allow selection of logistics partner
 * - 8.2: Integrate with all 6 logistics partner APIs
 * - 8.3: Fetch and display real-time tracking status
 * - 8.4: Send push notifications for delivery milestones
 * - 8.5: Display estimated delivery time
 * - 8.6: Show delivery person contact info
 * - 8.7: Allow separate delivery rating
 * - 8.8: Notify on delivery failure
 * - 8.9: Maintain delivery history
 * - 8.10: Calculate and display shipping costs from each partner
 */

import { createClient } from "@/lib/supabase/server";
import type {
  LogisticsProvider,
  Shipment,
  TrackingInfo,
  TrackingEvent,
  ShippingQuote,
  CreateShipmentRequest,
  UpdateShipmentStatusRequest,
  RateDeliveryRequest,
  GetQuotesRequest,
  ProviderTrackingResponse,
  ProviderQuoteResponse,
  ProviderShipmentResponse,
  ShipmentStatus,
} from "@/lib/types/logistics";

export class LogisticsService {
  /**
   * Get all active logistics providers (Requirement 8.1, 8.2)
   */
  static async getProviders(): Promise<LogisticsProvider[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("logistics_providers")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      throw new Error(`Failed to fetch logistics providers: ${error.message}`);
    }

    return (data || []).map(this.mapProviderFromDb);
  }

  /**
   * Get shipping quotes from all providers (Requirement 8.10)
   */
  static async getQuotes(request: GetQuotesRequest): Promise<ShippingQuote[]> {
    const providers = await this.getProviders();
    const quotes: ShippingQuote[] = [];

    // Fetch quotes from all providers in parallel
    const quotePromises = providers.map(async (provider) => {
      try {
        const quote = await this.fetchQuoteFromProvider(provider, request);
        return quote;
      } catch (error) {
        console.error(`Failed to get quote from ${provider.name}:`, error);
        return null;
      }
    });

    const results = await Promise.all(quotePromises);
    quotes.push(...results.filter((q): q is ShippingQuote => q !== null));

    // Store quotes in database
    const supabase = await createClient();
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 24); // Quotes valid for 24 hours

    for (const quote of quotes) {
      await supabase.from("shipping_quotes").insert({
        provider_id: quote.providerId,
        pickup_address: quote.pickupAddress,
        delivery_address: quote.deliveryAddress,
        package_details: quote.packageDetails,
        quoted_price: quote.quotedPrice,
        estimated_delivery_time: quote.estimatedDeliveryTime,
        currency: quote.currency,
        valid_until: validUntil.toISOString(),
      } as any);
    }

    return quotes.sort((a, b) => a.quotedPrice - b.quotedPrice); // Sort by price
  }

  /**
   * Create a new shipment (Requirement 8.2)
   */
  static async createShipment(
    request: CreateShipmentRequest,
  ): Promise<Shipment> {
    const supabase = await createClient();

    // Get provider details
    const { data: providerData, error: providerError } = await supabase
      .from("logistics_providers")
      .select("*")
      .eq("id", request.providerId)
      .single();

    if (providerError || !providerData) {
      throw new Error("Invalid logistics provider");
    }

    const provider = this.mapProviderFromDb(providerData);

    // Create shipment with provider API
    const providerResponse = await this.createShipmentWithProvider(
      provider,
      request,
    );

    // Calculate estimated delivery (default to 3 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

    // Store shipment in database
    const { data, error } = await supabase
      .from("shipments")
      .insert({
        order_id: request.orderId,
        provider_id: request.providerId,
        tracking_number: providerResponse.trackingNumber,
        pickup_address: request.pickupAddress,
        delivery_address: request.deliveryAddress,
        package_details: request.packageDetails,
        status: providerResponse.status as ShipmentStatus,
        estimated_delivery:
          providerResponse.estimatedDelivery || estimatedDelivery.toISOString(),
        shipping_cost: 0, // Will be updated from quote
      } as any)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create shipment: ${error.message}`);
    }

    // Add initial tracking event
    await (supabase as any).rpc("add_shipment_tracking_event", {
      p_shipment_id: data.id,
      p_status: "pending",
      p_location: request.pickupAddress.city,
      p_description: "Shipment created and awaiting pickup",
    });

    return this.mapShipmentFromDb(data);
  }

  /**
   * Track a shipment (Requirement 8.3, 8.9)
   */
  static async trackShipment(shipmentId: string): Promise<TrackingInfo> {
    const supabase = await createClient();

    // Get shipment details
    const { data: shipmentData, error: shipmentError } = await supabase
      .from("shipments")
      .select("*, logistics_providers(*)")
      .eq("id", shipmentId)
      .single();

    if (shipmentError || !shipmentData) {
      throw new Error("Shipment not found");
    }

    const provider = this.mapProviderFromDb(shipmentData.logistics_providers);
    const shipment = this.mapShipmentFromDb(shipmentData);

    // Fetch latest tracking info from provider API
    try {
      const providerTracking = await this.fetchTrackingFromProvider(
        provider,
        shipment.trackingNumber,
      );

      // Update shipment with latest info
      await supabase
        .from("shipments")
        .update({
          status: this.mapProviderStatus(providerTracking.status),
          current_location: providerTracking.currentLocation,
          delivery_person: providerTracking.deliveryPerson,
        })
        .eq("id", shipmentId);

      // Add new tracking events
      for (const event of providerTracking.events) {
        await (supabase as any).rpc("add_shipment_tracking_event", {
          p_shipment_id: shipmentId,
          p_status: this.mapProviderStatus(event.status),
          p_location: event.location,
          p_description: event.description,
          p_timestamp: event.timestamp,
        });
      }
    } catch (error) {
      console.error("Failed to fetch tracking from provider:", error);
      // Continue with database data if provider API fails
    }

    // Get tracking history
    const { data: historyData, error: historyError } = await (
      supabase as any
    ).rpc("get_shipment_tracking_history", { p_shipment_id: shipmentId });

    if (historyError) {
      throw new Error(
        `Failed to fetch tracking history: ${historyError.message}`,
      );
    }

    const history: TrackingEvent[] = (historyData || []).map((event: any) => ({
      id: event.event_id,
      shipmentId,
      status: event.status,
      location: event.location ?? "",
      description: event.description ?? "",
      timestamp: new Date(event.timestamp),
      createdAt: new Date(event.timestamp),
    }));

    // Refresh shipment data
    const { data: updatedShipment } = await supabase
      .from("shipments")
      .select("*")
      .eq("id", shipmentId)
      .single();

    return {
      shipment: this.mapShipmentFromDb(updatedShipment || shipmentData),
      provider,
      history,
    };
  }

  /**
   * Update shipment status (Requirement 8.3, 8.4, 8.8)
   */
  static async updateShipmentStatus(
    request: UpdateShipmentStatusRequest,
  ): Promise<void> {
    const supabase = await createClient();

    // Add tracking event (this also updates the shipment status)
    await (supabase as any).rpc("add_shipment_tracking_event", {
      p_shipment_id: request.shipmentId,
      p_status: request.status,
      p_location: request.location || "",
      p_description: request.description,
    });

    // Update delivery person if provided
    if (request.deliveryPerson) {
      await supabase
        .from("shipments")
        .update({ delivery_person: request.deliveryPerson as any })
        .eq("id", request.shipmentId);
    }

    // Send notifications for milestones (Requirement 8.4, 8.8)
    await this.sendMilestoneNotification(request.shipmentId, request.status);
  }

  /**
   * Rate delivery experience (Requirement 8.7)
   */
  static async rateDelivery(request: RateDeliveryRequest): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("shipments")
      .update({
        delivery_rating: request.rating,
        delivery_review: request.review,
      })
      .eq("id", request.shipmentId);

    if (error) {
      throw new Error(`Failed to rate delivery: ${error.message}`);
    }
  }

  /**
   * Get shipment by order ID
   */
  static async getShipmentByOrderId(orderId: string): Promise<Shipment | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapShipmentFromDb(data);
  }

  // Private helper methods

  private static async fetchQuoteFromProvider(
    provider: LogisticsProvider,
    request: GetQuotesRequest,
  ): Promise<ShippingQuote> {
    // In production, this would call the actual provider API
    // For now, return mock data based on provider
    const mockPrices: Record<string, number> = {
      GIG: 2500,
      Kwik: 3000,
      Sendbox: 2800,
      Gokada: 2200,
      Redbox: 2600,
      Bolt: 3200,
    };

    const mockDeliveryTimes: Record<string, string> = {
      GIG: "2-3 days",
      Kwik: "1-2 days",
      Sendbox: "2-4 days",
      Gokada: "1 day",
      Redbox: "2-3 days",
      Bolt: "1-2 days",
    };

    return {
      id: crypto.randomUUID(),
      providerId: provider.id,
      providerName: provider.name,
      pickupAddress: request.pickupAddress,
      deliveryAddress: request.deliveryAddress,
      packageDetails: request.packageDetails,
      quotedPrice: mockPrices[provider.name] || 2500,
      estimatedDeliveryTime: mockDeliveryTimes[provider.name] || "2-3 days",
      currency: "NGN",
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };
  }

  private static async createShipmentWithProvider(
    provider: LogisticsProvider,
    request: CreateShipmentRequest,
  ): Promise<ProviderShipmentResponse> {
    // In production, this would call the actual provider API
    // For now, return mock data
    return {
      trackingNumber: `${provider.name.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      estimatedDelivery: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };
  }

  private static async fetchTrackingFromProvider(
    provider: LogisticsProvider,
    trackingNumber: string,
  ): Promise<ProviderTrackingResponse> {
    // In production, this would call the actual provider API
    // For now, return mock data
    return {
      trackingNumber,
      status: "in_transit",
      currentLocation: "Lagos Distribution Center",
      estimatedDelivery: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      events: [
        {
          status: "picked_up",
          location: "Pickup Location",
          description: "Package picked up from sender",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          status: "in_transit",
          location: "Lagos Distribution Center",
          description: "Package in transit",
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  private static async sendMilestoneNotification(
    shipmentId: string,
    status: ShipmentStatus,
  ): Promise<void> {
    // Requirement 8.4: Send push notifications for delivery milestones
    // Requirement 8.8: Notify on delivery failure
    const milestones: ShipmentStatus[] = [
      "picked_up",
      "in_transit",
      "out_for_delivery",
      "delivered",
      "failed",
    ];

    if (!milestones.includes(status)) {
      return;
    }

    const supabase = await createClient();

    // Get shipment and order details
    const { data: shipment } = await supabase
      .from("shipments")
      .select("*, escrow_transactions(buyer_id, seller_id)")
      .eq("id", shipmentId)
      .single();

    if (!shipment || !shipment.escrow_transactions) return;

    const notificationMessages: Record<ShipmentStatus, string> = {
      pending: "Your shipment is being prepared",
      picked_up: "Your package has been picked up",
      in_transit: "Your package is on its way",
      out_for_delivery: "Your package is out for delivery",
      delivered: "Your package has been delivered",
      failed: "Delivery attempt failed",
    };

    // Send notification to buyer
    await supabase.from("notifications").insert({
      user_id: (shipment.escrow_transactions as any).buyer_id,
      type: "delivery_update",
      title: "Delivery Update",
      message: notificationMessages[status],
      data: { shipmentId, status },
    });

    // Also notify seller for certain statuses
    if (["delivered", "failed"].includes(status)) {
      await supabase.from("notifications").insert({
        user_id: (shipment.escrow_transactions as any).seller_id,
        type: "delivery_update",
        title: "Delivery Update",
        message: notificationMessages[status],
        data: { shipmentId, status },
      });
    }
  }

  private static mapProviderStatus(providerStatus: string): ShipmentStatus {
    // Map provider-specific status to our standard status
    const statusMap: Record<string, ShipmentStatus> = {
      pending: "pending",
      "picked up": "picked_up",
      "in transit": "in_transit",
      "out for delivery": "out_for_delivery",
      delivered: "delivered",
      failed: "failed",
    };

    return statusMap[providerStatus.toLowerCase()] || "pending";
  }

  private static mapProviderFromDb(data: any): LogisticsProvider {
    return {
      id: data.id,
      name: data.name,
      apiEndpoint: data.api_endpoint,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private static mapShipmentFromDb(data: any): Shipment {
    return {
      id: data.id,
      orderId: data.order_id,
      providerId: data.provider_id,
      trackingNumber: data.tracking_number,
      pickupAddress: data.pickup_address,
      deliveryAddress: data.delivery_address,
      packageDetails: data.package_details,
      status: data.status,
      currentLocation: data.current_location ?? undefined,
      estimatedDelivery: data.estimated_delivery
        ? new Date(data.estimated_delivery)
        : undefined,
      actualDelivery: data.actual_delivery
        ? new Date(data.actual_delivery)
        : undefined,
      deliveryPerson: data.delivery_person ?? undefined,
      shippingCost: parseFloat(data.shipping_cost ?? "0"),
      currency: data.currency ?? "NGN",
      deliveryRating: data.delivery_rating ?? undefined,
      deliveryReview: data.delivery_review ?? undefined,
      failureReason: data.failure_reason ?? undefined,
      failureTimestamp: data.failure_timestamp
        ? new Date(data.failure_timestamp)
        : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
