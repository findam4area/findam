// Business Profile types for Advanced Category Taxonomy System
// Requirements: 18.1, 18.2, 18.3, 18.4

import { Category } from "./category";
import { ProductListing } from "./product";
import { ServiceListing } from "./service";
import { BusinessReview } from "./review";
import { User } from "./index";

export interface BusinessProfile {
  id: string;
  user_id: string;

  // Basic information
  business_name: string;
  display_name?: string;
  description: string;
  business_type: "product" | "service" | "both";

  // Category relationships
  primary_category_id: string;
  primary_subcategory_ids: string[];

  // Location
  address?: string;
  city: string;
  state: string;
  postal_code?: string;
  coordinates?: { lat: number; lng: number };

  // Contact information
  phone?: string;
  email?: string;
  website?: string;
  business_hours?: Record<string, { open: string; close: string }>;

  // Service type attributes
  service_attributes?: {
    delivery_available?: boolean;
    online_service?: boolean;
    in_person_service?: boolean;
    availability_24_7?: boolean;
    emergency_service?: boolean;
  };

  // Price range indicator
  price_range?: "$" | "$$" | "$$$" | "$$$$";

  // Media
  primary_photo_url?: string;
  photo_urls: string[];

  // Status and verification
  is_verified: boolean;
  verified_at?: string;
  verification_documents?: Record<string, any>;

  is_premium: boolean;
  premium_tier?: "basic" | "pro" | "enterprise";
  premium_expires_at?: string;

  is_active: boolean;

  // Ratings (denormalized for performance)
  average_rating: number;
  review_count: number;

  // Profile completeness
  completeness_percentage: number;

  // Metadata
  view_count: number;
  created_at: string;
  updated_at: string;

  // Relations (populated in queries)
  user?: User;
  primary_category?: Category;
  secondary_categories?: Category[];
  products?: ProductListing[];
  services?: ServiceListing[];
  reviews?: BusinessReview[];
}

export interface BusinessSearchFilters {
  query?: string;
  category_id?: string;
  subcategory_id?: string;
  location?: {
    lat: number;
    lng: number;
    radius_km: 5 | 10 | 25 | 50 | 80;
  };
  city?: string;
  state?: string;
  min_rating?: 3.0 | 3.5 | 4.0 | 4.5 | 5.0;
  price_range?: "$" | "$$" | "$$$" | "$$$$";
  service_attributes?: {
    delivery_available?: boolean;
    online_service?: boolean;
    in_person_service?: boolean;
    availability_24_7?: boolean;
    emergency_service?: boolean;
  };
  sort_by?: "relevance" | "rating" | "review_count" | "distance" | "name";
  only_verified?: boolean;
  only_premium?: boolean;
}

// Category-specific field types
export interface FoodBeverageFields {
  cuisine_types: string[];
  dietary_options: string[]; // vegan, vegetarian, halal, etc.
  delivery_radius_km?: number;
}

export interface HealthMedicalFields {
  specializations: string[];
  accepted_insurance: string[];
  appointment_booking_url?: string;
}

export interface RealEstateFields {
  property_types: string[]; // residential, commercial, land
  transaction_types: string[]; // sale, rent, lease
  service_areas: string[];
}

export interface AutomotiveFields {
  brands_serviced: string[];
  certifications: string[];
  warranty_offered: boolean;
}
