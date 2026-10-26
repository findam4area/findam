// Core type definitions for FindAm

// Re-export all types from Advanced Category Taxonomy System
export * from "./category";
export * from "./business-profile";
export * from "./product";
export * from "./service";
export * from "./review";
export * from "./analytics";

// Import for internal use in this file
import type { Category } from "./category";

// Also export individual types for convenience
export type { Category, BusinessCategoryTag } from "./category";
export type { ProductListing } from "./product";
export type { ServiceListing } from "./service";
export type { BusinessReview } from "./review";
export type { CategoryAnalytics } from "./analytics";

export interface User {
  id: string;
  email: string;
  username: string;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  trust_score: number;
  is_premium: boolean;
  premium_tier?: "basic" | "pro" | "enterprise" | null;
  premium_expires_at?: string | null;
  phone_verified: boolean;
  nin_verified: boolean;
  video_verified: boolean;
  is_suspended: boolean;
  role?: string;
  tier?: string;
  cv_url?: string | null;
  skills?: string[] | null;
  is_service_provider: boolean;
  is_job_seeker: boolean;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price?: number;
  category_id: string;
  subcategory_id: string;
  condition?: "new" | "used" | "refurbished";
  state: string;
  lga: string; // Local Government Area
  ward?: string;
  location?: string; // Combined location string
  thumbnail_url?: string;
  is_boosted: boolean;
  boost_expires_at?: string;
  is_active: boolean;
  status?: string; // active, sold, etc.
  views_count: number;
  likes_count: number;
  saves_count: number;
  created_at: string;
  updated_at: string;
  media?: ListingMedia[];
  user?: User;
  category?: Category;
  subcategory?: Subcategory;
}

export interface ListingMedia {
  id: string;
  listing_id: string;
  media_url: string;
  media_type: "image" | "video";
  duration_seconds?: number;
  display_order: number;
  created_at: string;
}

// Category and Subcategory interfaces now imported from category.ts
// The new Category interface from Advanced Category Taxonomy System
// includes translations, descriptions, and hierarchical features

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  media_url?: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
}

export interface Conversation {
  id: string;
  listing_id?: string;
  created_at: string;
  participants?: User[];
  last_message?: Message;
  unread_count?: number;
}

export interface Story {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url?: string;
  views_count: number;
  expires_at: string;
  created_at: string;
  user?: User;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  listing_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  reviewer?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export type NotificationType =
  | "new_listing"
  | "new_message"
  | "listing_like"
  | "listing_save"
  | "boost_expired"
  | "premium_expiring"
  | "review_received"
  | "listing_approved"
  | "listing_removed"
  | "delivery_update";

export interface NotificationPreferences {
  user_id: string;
  new_listing: boolean;
  new_message: boolean;
  listing_interactions: boolean;
  payment_updates: boolean;
  admin_updates: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  listing_id?: string;
  amount: number;
  currency: string;
  payment_type: "boost" | "premium";
  paystack_reference?: string;
  status: "pending" | "success" | "failed";
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  media_url: string;
  media_type: "image" | "video";
  display_order: number;
  created_at: string;
}

// Filter and search types
export interface ListingFilters {
  category_id?: string;
  subcategory_id?: string;
  min_price?: number;
  max_price?: number;
  condition?: "new" | "used" | "refurbished";
  state?: string;
  area?: string;
  lga?: string; // Legacy field, maps to area
  ward?: string; // Legacy field
  search_query?: string;
  sort_by?: "price_asc" | "price_desc" | "date_desc" | "date_asc" | "relevance";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Admin types
export interface Report {
  id: string;
  reporter_id: string;
  listing_id: string;
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved";
  admin_notes?: string;
  created_at: string;
  resolved_at?: string;
  reporter?: User;
  listing?: Listing;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalListings: number;
  activeListings: number;
  totalRevenue: number;
  pendingReports: number;
  suspendedUsers: number;
  premiumUsers: number;
}

export interface CategoryStats {
  category_id: string;
  category_name: string;
  listing_count: number;
  percentage: number;
}

export interface EngagementStats {
  date: string;
  new_users: number;
  new_listings: number;
  messages_sent: number;
  stories_posted: number;
}

export interface ConversionStats {
  total_boosts: number;
  total_premium_subscriptions: number;
  boost_revenue: number;
  premium_revenue: number;
  conversion_rate: number;
}

export interface UserManagementFilters {
  search_query?: string;
  is_premium?: boolean;
  is_suspended?: boolean;
  phone_verified?: boolean;
  nin_verified?: boolean;
  min_trust_score?: number;
  max_trust_score?: number;
  sort_by?: "created_at" | "trust_score" | "listings_count";
  sort_order?: "asc" | "desc";
}

export interface UserWithStats extends User {
  listings_count: number;
  active_listings_count: number;
  reviews_count: number;
  average_rating?: number;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  trust_score: number;
  is_premium: boolean;
  premium_expires_at: string | null;
  phone_verified: boolean;
  nin_verified: boolean;
  video_verified: boolean;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
  listings_count: number;
  active_listings_count: number;
  reviews_count: number;
  average_rating?: number;
}

// ============================================================================
// ESCROW AND WALLET TYPES (Requirements 4 & 5)
// ============================================================================

export interface EscrowTransaction {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  amount: number;
  fee: number;
  status: "pending" | "held" | "released" | "refunded" | "disputed";
  paystack_reference: string | null;
  estimated_delivery_date: string | null;
  auto_release_at: string | null;
  dispute_reason: string | null;
  dispute_evidence: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  released_at: string | null;
  // Relations
  listing?: Listing;
  buyer?: User;
  seller?: User;
}

export interface Wallet {
  id: string;
  user_id: string;
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  currency: string;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: "credit" | "debit";
  amount: number;
  fee: number;
  balance_after: number;
  description: string;
  category:
    | "escrow_release"
    | "withdrawal"
    | "refund"
    | "purchase"
    | "fee"
    | "adjustment"
    | null;
  status: "pending" | "completed" | "failed" | "reversed";
  reference: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  // Relations
  wallet?: Wallet;
  user?: User;
}

export interface Withdrawal {
  id: string;
  wallet_id: string;
  user_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  bank_code: string;
  account_number: string;
  account_name: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  paystack_reference: string | null;
  paystack_transfer_code: string | null;
  failure_reason: string | null;
  requires_verification: boolean;
  verified_at: string | null;
  verified_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  wallet?: Wallet;
  user?: User;
  verifier?: User;
}

// Request/Response types for API endpoints
export interface CreateEscrowRequest {
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  estimated_delivery_date?: string;
}

export interface ConfirmDeliveryRequest {
  escrow_transaction_id: string;
  rating?: number;
  review?: string;
}

export interface DisputeEscrowRequest {
  escrow_transaction_id: string;
  reason: string;
  evidence?: Record<string, any>;
}

export interface WithdrawalRequest {
  amount: number;
  bank_code: string;
  account_number: string;
  account_name: string;
}

export interface WalletBalance {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  currency: string;
}

export interface WalletTransactionFilters {
  type?: "credit" | "debit";
  category?:
    | "escrow_release"
    | "withdrawal"
    | "refund"
    | "purchase"
    | "fee"
    | "adjustment";
  status?: "pending" | "completed" | "failed" | "reversed";
  start_date?: string;
  end_date?: string;
}

// ============================================================================
// SELLER STOREFRONT TYPES (Requirements 9, 10, 11)
// Tasks: 12.1, 12.2, 12.3
// ============================================================================

// ============================================================================
// STOREFRONT TYPES (Task 12.1 - Requirement 9)
// ============================================================================

export interface Storefront {
  id: string;
  user_id: string;
  custom_url: string; // e.g., "johndoe" for findamng.com/store/johndoe
  display_name: string | null;
  bio: string | null;
  banner_url: string | null;
  theme_color: string; // Hex color code, default '#3B82F6'
  featured_listings: string[]; // Array of up to 6 listing IDs
  custom_domain: string | null; // Premium feature
  follower_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
  listings?: Listing[];
  followers?: StorefrontFollower[];
}

export interface StorefrontFollower {
  id: string;
  storefront_id: string;
  follower_user_id: string;
  followed_at: string;
  // Relations
  storefront?: Storefront;
  follower?: User;
}

export interface StorefrontData {
  storefront: Storefront;
  seller: User;
  listings: Listing[];
  featuredListings: Listing[];
  reviews: Review[];
  stats: {
    totalSales: number;
    responseTime: string;
    memberSince: string;
    followerCount: number;
    averageRating: number;
    reviewCount: number;
  };
}

export interface UpdateStorefrontRequest {
  display_name?: string;
  bio?: string;
  banner_url?: string;
  theme_color?: string;
  featured_listings?: string[];
  custom_domain?: string;
}

// ============================================================================
// SELLER ANALYTICS TYPES (Task 12.2 - Requirement 10)
// ============================================================================

export interface SellerAnalytics {
  id: string;
  user_id: string;
  date: string; // ISO date string
  period_type: "daily" | "weekly" | "monthly";
  // Core metrics
  total_views: number;
  total_impressions: number;
  total_clicks: number;
  click_through_rate: number; // Percentage
  // Conversion metrics
  total_messages: number;
  total_sales: number;
  conversion_rate: number; // Percentage (views to sales)
  message_conversion_rate: number; // Percentage (messages to sales)
  // Response metrics
  average_response_time_minutes: number;
  response_rate: number; // Percentage
  // Revenue metrics
  total_revenue: number;
  average_order_value: number;
  // Geographic breakdown
  geographic_data: Record<string, number>; // { "Lagos": 150, "Abuja": 75, ... }
  // Traffic sources
  traffic_sources: {
    direct: number;
    search: number;
    social: number;
    referral: number;
  };
  // Top performing listings
  top_listings: TopListingMetric[];
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
}

export interface TopListingMetric {
  listing_id: string;
  title: string;
  views: number;
  sales: number;
  revenue: number;
}

export interface AnalyticsDashboardData {
  overview: {
    totalViews: number;
    totalImpressions: number;
    clickThroughRate: number;
    conversionRate: number;
    averageResponseTime: number;
    responseRate: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  listingPerformance: ListingMetrics[];
  geographic: {
    state: Record<string, number>;
    city: Record<string, number>;
  };
  timeSeries: TimeSeriesData[];
  trafficSources: {
    direct: number;
    search: number;
    social: number;
    referral: number;
  };
  categoryAverages: {
    averagePrice: number;
    averageViews: number;
    averageSales: number;
  };
}

export interface ListingMetrics {
  listingId: string;
  title: string;
  views: number;
  impressions: number;
  ctr: number;
  messages: number;
  sales: number;
  conversionRate: number;
  revenue: number;
}

export interface TimeSeriesData {
  date: string;
  views: number;
  sales: number;
  revenue: number;
}

export interface AnalyticsFilters {
  start_date?: string;
  end_date?: string;
  period_type?: "daily" | "weekly" | "monthly";
  listing_id?: string;
}

// ============================================================================
// INVENTORY TYPES (Task 12.3 - Requirement 11)
// ============================================================================

export interface InventoryItem {
  id: string;
  listing_id: string;
  user_id: string;
  // Stock tracking
  stock_quantity: number;
  low_stock_threshold: number;
  is_sold_out: boolean; // Computed: stock_quantity = 0
  // Variant support
  variants: InventoryVariant[];
  has_variants: boolean;
  // Stock history
  last_stock_update: string;
  last_restock_date: string | null;
  // Inventory value
  unit_price: number;
  total_value: number; // Computed: stock_quantity * unit_price
  created_at: string;
  updated_at: string;
  // Relations
  listing?: Listing;
  user?: User;
  history?: StockHistory[];
}

export interface InventoryVariant {
  id: string;
  name: string; // e.g., "Red - Large"
  attributes: Record<string, string>; // { color: "Red", size: "Large" }
  stock: number;
  sku?: string;
}

export interface StockHistory {
  id: string;
  inventory_id: string;
  listing_id: string;
  user_id: string;
  // Change details
  previous_quantity: number;
  new_quantity: number;
  change_amount: number; // Computed: new_quantity - previous_quantity
  change_reason: "sale" | "restock" | "adjustment" | "return" | "initial";
  // Variant tracking
  variant_id: string | null;
  variant_name: string | null;
  // Metadata
  notes: string | null;
  changed_by: string | null;
  created_at: string;
  // Relations
  inventory?: InventoryItem;
  listing?: Listing;
  user?: User;
  changer?: User;
}

export interface CreateInventoryRequest {
  listing_id: string;
  stock_quantity: number;
  low_stock_threshold?: number;
  unit_price: number;
  variants?: InventoryVariant[];
}

export interface UpdateInventoryRequest {
  stock_quantity?: number;
  low_stock_threshold?: number;
  unit_price?: number;
  variants?: InventoryVariant[];
}

export interface BulkStockUpdate {
  listing_id: string;
  stock_quantity: number;
  change_reason?: "restock" | "adjustment";
  notes?: string;
}

export interface InventoryFilters {
  is_sold_out?: boolean;
  is_low_stock?: boolean;
  has_variants?: boolean;
  min_stock?: number;
  max_stock?: number;
}

export interface InventorySummary {
  totalItems: number;
  totalValue: number;
  soldOutItems: number;
  lowStockItems: number;
  itemsWithVariants: number;
}

// Validation functions
export function validateStorefrontUrl(url: string): boolean {
  return /^[a-z0-9_-]{3,30}$/.test(url);
}

export function validateThemeColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function validateFeaturedListings(listings: string[]): boolean {
  return listings.length <= 6;
}

export function validateStockQuantity(quantity: number): boolean {
  return quantity >= 0 && Number.isInteger(quantity);
}

// ============================================================================
// LIVE STREAMING TYPES (Requirements 2.1-2.10)
// Tasks: 18.1, 18.2, 18.3
// ============================================================================

export interface LiveSession {
  id: string;
  user_id: string;
  // Stream configuration
  stream_url: string | null;
  stream_key: string | null; // Private key for broadcaster
  stream_status: "scheduled" | "live" | "ended" | "terminated";
  // Session metadata
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  // Engagement metrics
  viewer_count: number;
  peak_viewer_count: number;
  total_views: number;
  // Pinned products (max 5 as per Requirement 2.4)
  pinned_products: PinnedProduct[];
  // Recording (available for 24 hours after broadcast - Requirement 2.8)
  recording_url: string | null;
  recording_expires_at: string | null;
  // Session timing (max 120 minutes - Requirement 2.9)
  scheduled_start_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  // Moderation (Requirement 2.10)
  is_flagged: boolean;
  flagged_reason: string | null;
  flagged_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
  chat_messages?: LiveChatMessage[];
}

export interface PinnedProduct {
  listing_id: string;
  pinned_at: string;
}

export interface LiveChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  message: string;
  is_flagged: boolean;
  is_deleted: boolean;
  created_at: string;
  // Relations
  user?: User;
  session?: LiveSession;
}

export interface LiveSessionWithSeller extends LiveSession {
  seller_username: string;
  seller_avatar_url: string | null;
  seller_trust_score: number;
}

// Request/Response types for Live Streaming API

export interface CreateLiveSessionRequest {
  title: string;
  description?: string;
  thumbnail_url?: string;
  scheduled_start_at?: string;
}

export interface UpdateLiveSessionRequest {
  title?: string;
  description?: string;
  thumbnail_url?: string;
  stream_status?: "scheduled" | "live" | "ended" | "terminated";
}

export interface PinProductRequest {
  listing_id: string;
}

export interface SendChatMessageRequest {
  message: string;
}

export interface LiveStreamCredentials {
  stream_url: string;
  stream_key: string;
  rtmp_url: string;
  playback_url: string;
}

export interface LiveSessionFilters {
  status?: "scheduled" | "live" | "ended" | "terminated";
  user_id?: string;
  start_date?: string;
  end_date?: string;
}

// Validation functions for live streaming

export function validatePinnedProducts(products: PinnedProduct[]): boolean {
  return products.length <= 5;
}

export function validateSessionDuration(durationMinutes: number): boolean {
  return durationMinutes <= 120;
}

export function validateChatMessage(message: string): boolean {
  return message.length > 0 && message.length <= 500;
}

// ============================================================================
// PRODUCT COMPARISON TYPES (Requirement 3)
// Tasks: 21.1, 21.2
// ============================================================================

export interface ComparisonSet {
  id: string;
  user_id: string;
  listing_ids: string[]; // Array of 2-4 listing IDs (Requirement 3.1)
  category_id: string; // All listings must be in same category (Requirement 3.10)
  name: string | null; // Optional name for saved comparisons (Requirement 3.8)
  is_saved: boolean; // Session vs saved comparison (Requirements 3.7, 3.8)
  created_at: string;
  updated_at: string;
  // Relations
  listings?: Listing[];
  category?: Category;
}

export interface ComparisonProduct {
  id: string;
  title: string;
  price: number;
  condition: string;
  location: string;
  seller: {
    id: string;
    username: string;
    avatar_url: string | null;
    trust_score: number;
    rating: number;
    responseTime: string;
  };
  specifications: Record<string, string>;
  images: string[];
  thumbnail_url: string | null;
}

export interface ComparisonHighlight {
  field: string;
  bestProductId: string;
  reason: string;
}

// Request/Response types for Comparison API

export interface CreateComparisonSetRequest {
  user_id: string;
  listing_ids: string[]; // Must be 2-4 listings
  name?: string;
  is_saved?: boolean;
}

export interface UpdateComparisonSetRequest {
  listing_ids?: string[];
  name?: string;
  is_saved?: boolean;
}

export interface AddToComparisonRequest {
  listing_id: string;
  comparison_set_id?: string;
}

export interface RemoveFromComparisonRequest {
  listing_id: string;
  comparison_set_id: string;
}

export interface SaveComparisonRequest {
  comparison_set_id: string;
  name: string;
}

// Validation functions for comparison

export function validateComparisonListingCount(count: number): boolean {
  return count >= 2 && count <= 4;
}

export function validateComparisonName(name: string): boolean {
  return name.trim().length > 0 && name.length <= 100;
}

// ============================================================================
// PREMIUM LISTING BOOSTS TYPES (Requirement 14)
// Tasks: 33.1, 34.1-34.10
// ============================================================================

export interface Boost {
  id: string;
  listing_id: string;
  user_id: string;
  // Package details
  package_type: "basic" | "standard" | "premium";
  // basic: ₦500/24h, standard: ₦1,000/72h, premium: ₦2,000/7 days
  price: number;
  duration_hours: number;
  // Timing
  started_at: string;
  expires_at: string;
  status: "active" | "expired" | "cancelled";
  // Performance tracking
  views_gained: number;
  impressions_gained: number;
  messages_received: number;
  // Payment details
  paystack_reference: string;
  payment_status: "pending" | "completed" | "failed" | "refunded";
  // Notifications
  expiration_notification_sent: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  listing?: Listing;
  user?: User;
}

export interface BoostPackage {
  id: "basic" | "standard" | "premium";
  name: string;
  price: number; // ₦500, ₦1000, ₦2000
  duration: number; // 24, 72, 168 hours
  estimatedViews: number;
  features: string[];
}

export interface BoostPerformance {
  boost_id: string;
  listing_id: string;
  views_gained: number;
  impressions_gained: number;
  messages_received: number;
  started_at: string;
  expires_at: string;
  status: string;
}

// Request/Response types for Boost API

export interface PurchaseBoostRequest {
  listing_id: string;
  package_type: "basic" | "standard" | "premium";
}

export interface PurchaseBoostResponse {
  boost: Boost;
  payment_url: string;
  access_code: string;
  reference: string;
}

export interface BoostAnalytics {
  total_boosts: number;
  active_boosts: number;
  total_views_gained: number;
  total_impressions_gained: number;
  total_messages_received: number;
  total_spent: number;
  average_performance: {
    views_per_boost: number;
    impressions_per_boost: number;
    messages_per_boost: number;
  };
}

// Validation functions for boosts

export function validateBoostPackage(
  packageType: string,
): packageType is "basic" | "standard" | "premium" {
  return ["basic", "standard", "premium"].includes(packageType);
}

export function getBoostPackageDetails(
  packageType: "basic" | "standard" | "premium",
): BoostPackage {
  const packages: Record<string, BoostPackage> = {
    basic: {
      id: "basic",
      name: "24-Hour Boost",
      price: 500,
      duration: 24,
      estimatedViews: 500,
      features: [
        "Top placement for 24 hours",
        "Boosted badge",
        "Performance analytics",
      ],
    },
    standard: {
      id: "standard",
      name: "72-Hour Boost",
      price: 1000,
      duration: 72,
      estimatedViews: 2000,
      features: [
        "Top placement for 72 hours",
        "Boosted badge",
        "Performance analytics",
        "Priority in search results",
      ],
    },
    premium: {
      id: "premium",
      name: "7-Day Boost",
      price: 2000,
      duration: 168,
      estimatedViews: 5000,
      features: [
        "Top placement for 7 days",
        "Boosted badge",
        "Performance analytics",
        "Priority in search results",
        "Featured in category",
      ],
    },
  };
  return packages[packageType];
}

// ============================================================================
// SUBSCRIPTION TYPES (Requirement 16)
// Tasks: 35.1-35.9
// ============================================================================

export interface Subscription {
  id: string;
  user_id: string;
  plan: "basic" | "pro" | "business";
  price: number;
  status: "active" | "cancelled" | "expired" | "trial";
  features: {
    unlimited_listings: boolean;
    advanced_analytics: boolean;
    priority_support: boolean;
    custom_domain: boolean;
    csv_export: boolean;
  };
  free_boosts_per_month: number;
  free_boosts_remaining: number;
  boosts_reset_at: string | null;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  paystack_subscription_code: string | null;
  paystack_customer_code: string | null;
  paystack_email_token: string | null;
  next_billing_date: string | null;
  last_billing_date: string | null;
  billing_cycle: "monthly" | "yearly";
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
}

export interface SubscriptionPlanDetails {
  id: "basic" | "pro" | "business";
  name: string;
  price: number; // 0, 2999, 5999
  interval: "month";
  features: {
    maxListings: number | "unlimited";
    advancedAnalytics: boolean;
    csvExport: boolean;
    prioritySupport: boolean;
    freeBoosts: number;
    customDomain: boolean;
    savedSearches: number | "unlimited";
  };
}

// Request/Response types for Subscription API

export interface CreateSubscriptionRequest {
  plan: "pro" | "business";
  callback_url?: string;
}

export interface CreateSubscriptionResponse {
  subscription: Subscription;
  authorization_url: string;
}

export interface UpdateSubscriptionRequest {
  action: "upgrade" | "downgrade";
  new_plan: "basic" | "pro" | "business";
}

export interface CancelSubscriptionRequest {
  reason?: string;
}

// Validation functions for subscriptions

export function validateSubscriptionPlan(
  plan: string,
): plan is "basic" | "pro" | "business" {
  return ["basic", "pro", "business"].includes(plan);
}

export function getSubscriptionPlanDetails(
  plan: "basic" | "pro" | "business",
): SubscriptionPlanDetails {
  const plans: Record<string, SubscriptionPlanDetails> = {
    basic: {
      id: "basic",
      name: "Basic",
      price: 0,
      interval: "month",
      features: {
        maxListings: 10,
        advancedAnalytics: false,
        csvExport: false,
        prioritySupport: false,
        freeBoosts: 0,
        customDomain: false,
        savedSearches: 3,
      },
    },
    pro: {
      id: "pro",
      name: "Pro",
      price: 2999,
      interval: "month",
      features: {
        maxListings: "unlimited",
        advancedAnalytics: true,
        csvExport: true,
        prioritySupport: false,
        freeBoosts: 2,
        customDomain: false,
        savedSearches: "unlimited",
      },
    },
    business: {
      id: "business",
      name: "Business",
      price: 5999,
      interval: "month",
      features: {
        maxListings: "unlimited",
        advancedAnalytics: true,
        csvExport: true,
        prioritySupport: true,
        freeBoosts: 5,
        customDomain: true,
        savedSearches: "unlimited",
      },
    },
  };
  return plans[plan];
}
