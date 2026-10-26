/**
 * Types for Homepage Components
 * Based on Design Document for Sophisticated Marketplace Homepage
 */

/**
 * Platform statistics for Hero Section
 * Requirements: 1.2, 1.4
 */
export interface PlatformStats {
  totalUsers: number;
  totalListings: number;
  averageRating: number;
}

/**
 * Hero Section Props
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */
export interface HeroSectionProps {
  stats: PlatformStats;
  className?: string;
}

/**
 * Vendor information for autocomplete
 */
export interface AutocompleteVendor {
  id: string;
  name: string;
  avatar: string | null;
  rating: number;
  isVerified: boolean;
}

/**
 * Autocomplete result item
 * Requirements: 12.3, 12.4, 12.5
 */
export interface AutocompleteResult {
  type: "listing" | "category" | "vendor";
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  url: string;
  highlight?: string; // The matching text portion to highlight
}

/**
 * Hero Search Bar Props
 * Requirements: 12.1, 12.2, 12.7, 12.9
 */
export interface HeroSearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

/**
 * Floating badge for hero section animations
 * Requirements: 1.6
 */
export interface FloatingBadge {
  id: string;
  icon: string;
  label: string;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  delay: number;
}

/**
 * Animation configuration for staggered effects
 * Requirements: 1.3
 */
export interface AnimationConfig {
  duration: number;
  delay: number;
  easing: string;
}

/**
 * Stats counter configuration
 * Requirements: 1.4
 */
export interface StatsCounterConfig {
  targetValue: number;
  duration: number; // in milliseconds
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

/**
 * Category for showcase
 * Requirements: 2.1, 2.3, 2.7
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  itemCount: number;
  accentColor: string; // Single accent color instead of gradient
}

/**
 * Category Showcase Props
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */
export interface CategoryShowcaseProps {
  categories?: Category[];
  className?: string;
}

/**
 * Listing for featured section
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export interface Listing {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  thumbnail: string;
  images: string[];
  video?: string;
  views: number;
  likes: number;
  isBoosted: boolean;
  vendor: {
    id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  createdAt: string;
}

/**
 * Featured Listings Props
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */
export interface FeaturedListingsProps {
  initialListings?: Listing[];
  className?: string;
}

/**
 * Listing Card Props
 * Requirements: 3.2, 3.3, 3.4, 3.10
 */
export interface ListingCardProps {
  listing: Listing;
  variant?: "default" | "compact" | "featured";
  showVendor?: boolean;
  onLike?: (listingId: string) => void;
  onSave?: (listingId: string) => void;
  className?: string;
}

/**
 * Vendor verification status
 * Requirements: 4.3
 */
export interface VendorVerification {
  phone: boolean;
  nin: boolean;
  video: boolean;
}

/**
 * Vendor for directory
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export interface Vendor {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  listingCount: number;
  specialties: string[];
  verification: VendorVerification;
  responseTime: number; // in hours
}

/**
 * Vendor Directory Props
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */
export interface VendorDirectoryProps {
  initialVendors?: Vendor[];
  className?: string;
}

/**
 * Verification Badge Props
 * Requirements: 4.3, 4.9
 */
export interface VerificationBadgeProps {
  type: "phone" | "nin" | "video" | "full";
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

/**
 * Activity user information
 * Requirements: 5.3, 5.6
 */
export interface ActivityUser {
  name: string;
  avatar: string;
}

/**
 * Activity for feed
 * Requirements: 5.1, 5.2, 5.3
 */
export interface Activity {
  id: string;
  type: "listing" | "purchase" | "registration" | "review";
  user: ActivityUser;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Activity Feed Props
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */
export interface ActivityFeedProps {
  initialActivities?: Activity[];
  className?: string;
}
