// Service Listing types for Advanced Category Taxonomy System
// Requirements: 18.1, 18.3

export interface ServiceListing {
  id: string;
  business_profile_id: string;

  // Service details
  title: string;
  description: string;

  // Pricing
  pricing_model: "fixed" | "hourly" | "custom";
  price?: number;
  currency: string;

  // Service duration
  duration_text?: string; // e.g., "2-3 hours", "1 week"

  // Media
  image_urls: string[];
  primary_image_url: string;

  // Status
  is_active: boolean;
  is_featured: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}
