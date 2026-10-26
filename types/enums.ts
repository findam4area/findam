/**
 * Enum Type Definitions
 * 
 * This module defines TypeScript enums and constant types for
 * the FindAm marketplace platform.
 * 
 * Requirements: 14.3 (Enum type definitions)
 * Task: 1.3.3 Create types/enums.ts for enum definitions
 */

// ============================================================================
// User Role Enum
// ============================================================================

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export const USER_ROLES = ['user', 'admin'] as const;
export type UserRoleType = typeof USER_ROLES[number];

// ============================================================================
// Listing Status Enum
// ============================================================================

export enum ListingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export const LISTING_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ListingStatusType = typeof LISTING_STATUSES[number];

// ============================================================================
// Transaction Status Enum
// ============================================================================

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export const TRANSACTION_STATUSES = ['pending', 'completed', 'cancelled', 'refunded'] as const;
export type TransactionStatusType = typeof TRANSACTION_STATUSES[number];

// ============================================================================
// Payment Method Enum
// ============================================================================

export enum PaymentMethod {
  PAYSTACK = 'paystack',
  WALLET = 'wallet',
  CASH = 'cash',
}

export const PAYMENT_METHODS = ['paystack', 'wallet', 'cash'] as const;
export type PaymentMethodType = typeof PAYMENT_METHODS[number];

// ============================================================================
// Vendor Application Status Enum
// ============================================================================

export enum VendorApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export const VENDOR_APPLICATION_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type VendorApplicationStatusType = typeof VENDOR_APPLICATION_STATUSES[number];

// ============================================================================
// Vehicle Type Enums
// ============================================================================

export enum VehicleFuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
}

export const VEHICLE_FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid'] as const;
export type VehicleFuelTypeType = typeof VEHICLE_FUEL_TYPES[number];

export enum VehicleTransmission {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

export const VEHICLE_TRANSMISSIONS = ['automatic', 'manual'] as const;
export type VehicleTransmissionType = typeof VEHICLE_TRANSMISSIONS[number];

export enum VehicleCondition {
  NEW = 'new',
  USED = 'used',
  REFURBISHED = 'refurbished',
}

export const VEHICLE_CONDITIONS = ['new', 'used', 'refurbished'] as const;
export type VehicleConditionType = typeof VEHICLE_CONDITIONS[number];

// ============================================================================
// Sort Order Enum
// ============================================================================

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrderType = typeof SORT_ORDERS[number];

// ============================================================================
// Browse Sort Options
// ============================================================================

export enum BrowseSortBy {
  NEWEST = 'newest',
  FEATURED = 'featured',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
}

export const BROWSE_SORT_OPTIONS = ['newest', 'featured', 'price_asc', 'price_desc'] as const;
export type BrowseSortByType = typeof BROWSE_SORT_OPTIONS[number];

// ============================================================================
// Storage Bucket Enum
// ============================================================================

export enum StorageBucket {
  AVATARS = 'avatars',
  LISTINGS = 'listings',
}

export const STORAGE_BUCKETS = ['avatars', 'listings'] as const;
export type StorageBucketType = typeof STORAGE_BUCKETS[number];

// ============================================================================
// Image MIME Types
// ============================================================================

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedImageMimeType = typeof ALLOWED_IMAGE_MIME_TYPES[number];

// ============================================================================
// Nigerian States (for location filtering)
// ============================================================================

export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;

export type NigerianState = typeof NIGERIAN_STATES[number];

// ============================================================================
// Validation Constants
// ============================================================================

export const IMAGE_CONSTRAINTS = {
  MAX_IMAGES_PER_LISTING: 5,
  MIN_IMAGES_PER_LISTING: 1,
  MAX_IMAGE_SIZE_MB: 5,
  MAX_AVATAR_SIZE_MB: 2,
} as const;

export const PASSWORD_CONSTRAINTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
} as const;

export const LISTING_CONSTRAINTS = {
  MIN_TITLE_LENGTH: 5,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 2000,
} as const;

export const VENDOR_APPLICATION_CONSTRAINTS = {
  MIN_BUSINESS_NAME_LENGTH: 2,
  MAX_BUSINESS_NAME_LENGTH: 100,
  MIN_BUSINESS_DESCRIPTION_LENGTH: 20,
  MAX_BUSINESS_DESCRIPTION_LENGTH: 500,
  MIN_REJECTION_REASON_LENGTH: 10,
  MAX_REJECTION_REASON_LENGTH: 500,
} as const;

// ============================================================================
// Pagination Constants
// ============================================================================

export const PAGINATION_DEFAULTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

// ============================================================================
// Type Guard Functions
// ============================================================================

export function isListingStatus(value: unknown): value is ListingStatusType {
  return typeof value === 'string' && LISTING_STATUSES.includes(value as ListingStatusType);
}

export function isTransactionStatus(value: unknown): value is TransactionStatusType {
  return typeof value === 'string' && TRANSACTION_STATUSES.includes(value as TransactionStatusType);
}

export function isVendorApplicationStatus(value: unknown): value is VendorApplicationStatusType {
  return typeof value === 'string' && VENDOR_APPLICATION_STATUSES.includes(value as VendorApplicationStatusType);
}

export function isPaymentMethod(value: unknown): value is PaymentMethodType {
  return typeof value === 'string' && PAYMENT_METHODS.includes(value as PaymentMethodType);
}

export function isVehicleFuelType(value: unknown): value is VehicleFuelTypeType {
  return typeof value === 'string' && VEHICLE_FUEL_TYPES.includes(value as VehicleFuelTypeType);
}

export function isVehicleTransmission(value: unknown): value is VehicleTransmissionType {
  return typeof value === 'string' && VEHICLE_TRANSMISSIONS.includes(value as VehicleTransmissionType);
}

export function isVehicleCondition(value: unknown): value is VehicleConditionType {
  return typeof value === 'string' && VEHICLE_CONDITIONS.includes(value as VehicleConditionType);
}

export function isStorageBucket(value: unknown): value is StorageBucketType {
  return typeof value === 'string' && STORAGE_BUCKETS.includes(value as StorageBucketType);
}

export function isBrowseSortBy(value: unknown): value is BrowseSortByType {
  return typeof value === 'string' && BROWSE_SORT_OPTIONS.includes(value as BrowseSortByType);
}

export function isNigerianState(value: unknown): value is NigerianState {
  return typeof value === 'string' && NIGERIAN_STATES.includes(value as NigerianState);
}

export function isAllowedImageMimeType(value: unknown): value is AllowedImageMimeType {
  return typeof value === 'string' && ALLOWED_IMAGE_MIME_TYPES.includes(value as AllowedImageMimeType);
}

// ============================================================================
// Validation Helper Functions
// ============================================================================

export function validateImageCount(count: number): boolean {
  return (
    count >= IMAGE_CONSTRAINTS.MIN_IMAGES_PER_LISTING &&
    count <= IMAGE_CONSTRAINTS.MAX_IMAGES_PER_LISTING
  );
}

export function validateImageSize(sizeInBytes: number, isAvatar: boolean = false): boolean {
  const maxSizeBytes = isAvatar
    ? IMAGE_CONSTRAINTS.MAX_AVATAR_SIZE_MB * 1024 * 1024
    : IMAGE_CONSTRAINTS.MAX_IMAGE_SIZE_MB * 1024 * 1024;
  return sizeInBytes <= maxSizeBytes;
}

export function validatePrimaryImageIndex(index: number, imagesLength: number): boolean {
  return index >= 0 && index < imagesLength;
}

export function validatePaginationLimit(limit: number): boolean {
  return (
    limit >= PAGINATION_DEFAULTS.MIN_LIMIT &&
    limit <= PAGINATION_DEFAULTS.MAX_LIMIT
  );
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < PASSWORD_CONSTRAINTS.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_CONSTRAINTS.MIN_LENGTH} characters`);
  }

  if (PASSWORD_CONSTRAINTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_CONSTRAINTS.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_CONSTRAINTS.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateEmail(email: string): boolean {
  // RFC 5322 simplified email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateNigerianPhone(phone: string): boolean {
  // Nigerian phone number format: +234XXXXXXXXXX or 0XXXXXXXXXXX
  const phoneRegex = /^(\+?234|0)[789]\d{9}$/;
  return phoneRegex.test(phone);
}

export function validateListingTitle(title: string): boolean {
  return (
    title.length >= LISTING_CONSTRAINTS.MIN_TITLE_LENGTH &&
    title.length <= LISTING_CONSTRAINTS.MAX_TITLE_LENGTH
  );
}

export function validateListingDescription(description: string): boolean {
  return (
    description.length >= LISTING_CONSTRAINTS.MIN_DESCRIPTION_LENGTH &&
    description.length <= LISTING_CONSTRAINTS.MAX_DESCRIPTION_LENGTH
  );
}
