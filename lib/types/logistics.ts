/**
 * Logistics and Tracking Types
 * Requirements: 8.1-8.10
 */

export interface LogisticsProvider {
  id: string;
  name: "GIG" | "Kwik" | "Sendbox" | "Gokada" | "Redbox" | "Bolt";
  apiEndpoint: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  contactName: string;
  contactPhone: string;
}

export interface PackageDetails {
  weight: number; // in kg
  dimensions: {
    length: number; // in cm
    width: number; // in cm
    height: number; // in cm
  };
  value: number; // in NGN
  description: string;
}

export interface DeliveryPerson {
  name: string;
  phone: string;
  photo?: string;
}

export type ShipmentStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed";

export interface Shipment {
  id: string;
  orderId: string;
  providerId: string;
  trackingNumber: string;
  pickupAddress: Address;
  deliveryAddress: Address;
  packageDetails: PackageDetails;
  status: ShipmentStatus;
  currentLocation?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  deliveryPerson?: DeliveryPerson;
  shippingCost: number;
  currency: string;
  deliveryRating?: number;
  deliveryReview?: string;
  failureReason?: string;
  failureTimestamp?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  status: string;
  location: string;
  description: string;
  timestamp: Date;
  createdAt: Date;
}

export interface TrackingInfo {
  shipment: Shipment;
  provider: LogisticsProvider;
  history: TrackingEvent[];
}

export interface ShippingQuote {
  id: string;
  providerId: string;
  providerName: string;
  pickupAddress: Address;
  deliveryAddress: Address;
  packageDetails: PackageDetails;
  quotedPrice: number;
  estimatedDeliveryTime: string;
  currency: string;
  validUntil: Date;
  createdAt: Date;
}

export interface ShippingRequest {
  orderId: string;
  providerId: string;
  pickup: Address;
  delivery: Address;
  packageDetails: PackageDetails;
}

export interface CreateShipmentRequest {
  orderId: string;
  providerId: string;
  pickupAddress: Address;
  deliveryAddress: Address;
  packageDetails: PackageDetails;
}

export interface UpdateShipmentStatusRequest {
  shipmentId: string;
  status: ShipmentStatus;
  location?: string;
  description: string;
  deliveryPerson?: DeliveryPerson;
}

export interface RateDeliveryRequest {
  shipmentId: string;
  rating: number; // 1-5
  review?: string;
}

export interface GetQuotesRequest {
  pickupAddress: Address;
  deliveryAddress: Address;
  packageDetails: PackageDetails;
}

// Provider-specific API response types (to be mapped to our internal types)
export interface ProviderTrackingResponse {
  trackingNumber: string;
  status: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  events: Array<{
    status: string;
    location: string;
    description: string;
    timestamp: string;
  }>;
  deliveryPerson?: {
    name: string;
    phone: string;
    photo?: string;
  };
}

export interface ProviderQuoteResponse {
  price: number;
  estimatedDeliveryTime: string;
  currency: string;
}

export interface ProviderShipmentResponse {
  trackingNumber: string;
  status: string;
  estimatedDelivery?: string;
}
