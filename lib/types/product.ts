// Product Listing types for Advanced Category Taxonomy System
// Requirements: 18.1, 18.3

export interface ProductListing {
  id: string;
  business_profile_id: string;

  // Product details
  title: string;
  description: string;
  product_type: "physical" | "digital";

  // Pricing
  price: number;
  currency: string;

  // Inventory (for physical products)
  stock_quantity: number;
  low_stock_threshold: number;
  is_in_stock: boolean;

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
