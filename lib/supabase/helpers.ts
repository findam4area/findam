/**
 * Supabase Database Helper Functions
 * Common database operations and utilities for FindAm
 */

import { Database } from "./database.types";

// Type aliases for convenience
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Insertable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Updatable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Specific table types
export type User = Tables<"users">;
// export type Category = Tables<"categories">;
// export type Subcategory = Tables<"subcategories">;
export type Listing = Tables<"listings">;
// export type ListingMedia = Tables<"listing_media">;
// export type Conversation = Tables<"conversations">;
// export type ConversationParticipant = Tables<"conversation_participants">;
// export type Message = Tables<"messages">;
// export type Story = Tables<"stories">;
// export type Review = Tables<"reviews">;
// export type Notification = Tables<"notifications">;
// export type Payment = Tables<"payments">;
// export type Report = Tables<"reports">;
// export type UserLike = Tables<"user_likes">;
// export type UserSave = Tables<"user_saves">;
// export type PortfolioItem = Tables<"portfolio_items">;
// export type NigerianState = Tables<"nigerian_states">;
// export type NigerianArea = Tables<"nigerian_areas">;

// Insert types
export type InsertUser = Insertable<"users">;
export type InsertListing = Insertable<"listings">;
// export type InsertMessage = Insertable<"messages">;
// export type InsertReview = Insertable<"reviews">;

// Update types
export type UpdateUser = Updatable<"users">;
export type UpdateListing = Updatable<"listings">;

// Extended types with relations (commented out until tables are added)
// export type ListingWithUser = Listing & {
//   user: User;
// };

// export type ListingWithMedia = Listing & {
//   media: ListingMedia[];
// };

// export type ListingWithAll = Listing & {
//   user: User;
//   media: ListingMedia[];
//   category: Category;
//   subcategory: Subcategory;
// };

// export type MessageWithSender = Message & {
//   sender: User;
// };

// export type ConversationWithParticipants = Conversation & {
//   participants: (ConversationParticipant & { user: User })[];
// };

// export type ReviewWithReviewer = Review & {
//   reviewer: User;
// };

// export type UserWithStats = User & {
//   listings_count: number;
//   reviews_count: number;
//   average_rating: number;
// };

// Enums
export type ListingCondition = "new" | "used" | "refurbished";
export type MediaType = "image" | "video";
export type PaymentType = "boost" | "premium";
export type PaymentStatus = "pending" | "success" | "failed";
export type ReportStatus = "pending" | "reviewed" | "resolved";

// Storage bucket names
export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
  LISTING_MEDIA: "listing-media",
  STORY_VIDEOS: "story-videos",
  PORTFOLIO: "portfolio",
} as const;

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  AVATAR: 2 * 1024 * 1024, // 2MB
  LISTING_IMAGE: 5 * 1024 * 1024, // 5MB
  LISTING_VIDEO: 50 * 1024 * 1024, // 50MB
  STORY_VIDEO: 20 * 1024 * 1024, // 20MB
  PORTFOLIO: 10 * 1024 * 1024, // 10MB
} as const;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  IMAGES: ["image/jpeg", "image/png", "image/webp"],
  VIDEOS: ["video/mp4"],
} as const;

// Business logic constants
export const BUSINESS_RULES = {
  FREE_TIER_LISTING_LIMIT: 3,
  PREMIUM_TIER_LISTING_LIMIT: 30,
  BOOST_PRICE_NGN: 500,
  PREMIUM_PRICE_NGN: 5999,
  STORY_DURATION_HOURS: 24,
  MAX_VIDEO_DURATION_SECONDS: 30,
  MIN_PASSWORD_LENGTH: 8,
  MIN_TRUST_SCORE: 0,
  MAX_TRUST_SCORE: 100,
} as const;

// Helper function to check if user is premium
export function isPremiumUser(user: User): boolean {
  if (!user.is_premium) return false;
  if (!user.premium_expires_at) return false;
  return new Date(user.premium_expires_at) > new Date();
}

// Helper function to check if listing is boosted
export function isListingBoosted(listing: Listing): boolean {
  if (!listing.is_boosted) return false;
  if (!listing.boost_expires_at) return false;
  return new Date(listing.boost_expires_at) > new Date();
}

// Helper function to check if story is active
// export function isStoryActive(story: Story): boolean {
//   return new Date(story.expires_at) > new Date();
// }

// Helper function to calculate trust score badge
export function getTrustBadge(user: User): string | null {
  if (user.nin_verified && user.video_verified) {
    return "100% Trusted";
  }
  if (user.phone_verified) {
    return "Phone Verified";
  }
  return null;
}

// Helper function to get verification level
export function getVerificationLevel(user: User): "none" | "phone" | "full" {
  if (user.nin_verified && user.video_verified) return "full";
  if (user.phone_verified) return "phone";
  return "none";
}

// Helper function to format price in Naira
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
}

// Helper function to get storage path for user files
export function getUserStoragePath(
  userId: string,
  bucket: string,
  filename: string,
): string {
  return `${userId}/${filename}`;
}

// Helper function to validate file size
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

// Helper function to validate MIME type
export function validateMimeType(
  file: File,
  allowedTypes: readonly string[],
): boolean {
  return allowedTypes.includes(file.type);
}

// Helper function to generate story expiration date
export function getStoryExpirationDate(): Date {
  const now = new Date();
  now.setHours(now.getHours() + BUSINESS_RULES.STORY_DURATION_HOURS);
  return now;
}

// Helper function to generate boost expiration date (7 days)
export function getBoostExpirationDate(): Date {
  const now = new Date();
  now.setDate(now.getDate() + 7);
  return now;
}

// Helper function to generate premium expiration date (30 days)
export function getPremiumExpirationDate(): Date {
  const now = new Date();
  now.setDate(now.getDate() + 30);
  return now;
}
