/**
 * Profile Completeness Calculator
 * Task 5.1: Create profile completeness calculator
 * Requirements: 17.1, 17.2, 17.3
 *
 * This module calculates the completeness percentage of a business profile
 * based on filled profile fields with assigned weights.
 */

import type { BusinessProfile } from "@/lib/types/business-profile";

// Field weights for completeness calculation (total: 100)
const FIELD_WEIGHTS = {
  business_name: 10, // Required field
  description: 10, // Required field (min 50 chars)
  primary_category: 10, // Required field
  subcategories: 5, // At least one subcategory
  location: 10, // city, state, address
  photos: 15, // At least 3 photos
  business_hours: 10, // Business hours defined
  contact_information: 10, // phone, email, or website
  product_or_service_listing: 15, // At least one product or service
  price_range: 5, // Price range indicator
  service_attributes: 5, // At least one service attribute
  website: 5, // Website URL
} as const;

/**
 * Calculate the completeness percentage of a business profile
 *
 * @param profile - The business profile to evaluate
 * @returns Completeness percentage (0-100)
 *
 * Scoring criteria:
 * - business_name: 10 points (always present as required)
 * - description: 10 points (≥50 chars)
 * - primary_category: 10 points (always present as required)
 * - subcategories: 5 points (≥1 subcategory)
 * - location: 10 points (city, state, and address filled)
 * - photos: 15 points (≥3 photos)
 * - business_hours: 10 points (has business hours)
 * - contact_information: 10 points (phone, email, or website)
 * - product_or_service_listing: 15 points (≥1 product or service)
 * - price_range: 5 points (price range set)
 * - service_attributes: 5 points (≥1 service attribute)
 * - website: 5 points (website URL)
 */
export function calculateProfileCompleteness(
  profile: Partial<BusinessProfile> & {
    products?: Array<{ id: string }>;
    services?: Array<{ id: string }>;
  },
): number {
  let completeness = 0;

  // 1. Business name (10 points) - required field
  if (profile.business_name && profile.business_name.trim().length > 0) {
    completeness += FIELD_WEIGHTS.business_name;
  }

  // 2. Description (10 points) - must be at least 50 characters
  if (profile.description && profile.description.trim().length >= 50) {
    completeness += FIELD_WEIGHTS.description;
  }

  // 3. Primary category (10 points) - required field
  if (profile.primary_category_id) {
    completeness += FIELD_WEIGHTS.primary_category;
  }

  // 4. Subcategories (5 points) - at least one subcategory
  if (
    profile.primary_subcategory_ids &&
    profile.primary_subcategory_ids.length > 0
  ) {
    completeness += FIELD_WEIGHTS.subcategories;
  }

  // 5. Location (10 points) - city, state, and address
  if (
    profile.city &&
    profile.city.trim().length > 0 &&
    profile.state &&
    profile.state.trim().length > 0 &&
    profile.address &&
    profile.address.trim().length > 0
  ) {
    completeness += FIELD_WEIGHTS.location;
  }

  // 6. Photos (15 points) - at least 3 photos
  if (profile.photo_urls && profile.photo_urls.length >= 3) {
    completeness += FIELD_WEIGHTS.photos;
  }

  // 7. Business hours (10 points) - has defined business hours
  if (
    profile.business_hours &&
    Object.keys(profile.business_hours).length > 0
  ) {
    completeness += FIELD_WEIGHTS.business_hours;
  }

  // 8. Contact information (10 points) - phone, email, or website
  const hasContact =
    (profile.phone && profile.phone.trim().length > 0) ||
    (profile.email && profile.email.trim().length > 0) ||
    (profile.website && profile.website.trim().length > 0);

  if (hasContact) {
    completeness += FIELD_WEIGHTS.contact_information;
  }

  // 9. Product or service listing (15 points) - at least one product or service
  const hasProductsOrServices =
    (profile.products && profile.products.length > 0) ||
    (profile.services && profile.services.length > 0);

  if (hasProductsOrServices) {
    completeness += FIELD_WEIGHTS.product_or_service_listing;
  }

  // 10. Price range (5 points)
  if (profile.price_range) {
    completeness += FIELD_WEIGHTS.price_range;
  }

  // 11. Service attributes (5 points) - at least one attribute set to true
  if (profile.service_attributes) {
    const hasAnyAttribute = Object.values(profile.service_attributes).some(
      (value) => value === true,
    );
    if (hasAnyAttribute) {
      completeness += FIELD_WEIGHTS.service_attributes;
    }
  }

  // 12. Website (5 points)
  if (profile.website && profile.website.trim().length > 0) {
    completeness += FIELD_WEIGHTS.website;
  }

  // Ensure completeness is capped at 100
  return Math.min(completeness, 100);
}

/**
 * Get missing fields for a business profile
 *
 * @param profile - The business profile to evaluate
 * @returns Array of missing field descriptions with prompts
 */
export function getMissingFields(
  profile: Partial<BusinessProfile> & {
    products?: Array<{ id: string }>;
    services?: Array<{ id: string }>;
  },
): Array<{ field: string; prompt: string; weight: number }> {
  const missing: Array<{ field: string; prompt: string; weight: number }> = [];

  // Check business name (though it's required)
  if (!profile.business_name || profile.business_name.trim().length === 0) {
    missing.push({
      field: "business_name",
      prompt: "Add your business name",
      weight: FIELD_WEIGHTS.business_name,
    });
  }

  // Check description length
  if (!profile.description || profile.description.trim().length < 50) {
    missing.push({
      field: "description",
      prompt: "Write a detailed description (at least 50 characters)",
      weight: FIELD_WEIGHTS.description,
    });
  }

  // Check primary category (though it's required)
  if (!profile.primary_category_id) {
    missing.push({
      field: "primary_category",
      prompt: "Select your primary business category",
      weight: FIELD_WEIGHTS.primary_category,
    });
  }

  // Check subcategories
  if (
    !profile.primary_subcategory_ids ||
    profile.primary_subcategory_ids.length === 0
  ) {
    missing.push({
      field: "subcategories",
      prompt: "Add at least one subcategory",
      weight: FIELD_WEIGHTS.subcategories,
    });
  }

  // Check location
  if (
    !profile.city ||
    !profile.state ||
    !profile.address ||
    profile.city.trim().length === 0 ||
    profile.state.trim().length === 0 ||
    profile.address.trim().length === 0
  ) {
    missing.push({
      field: "location",
      prompt: "Complete your business address (city, state, and street address)",
      weight: FIELD_WEIGHTS.location,
    });
  }

  // Check photos
  if (!profile.photo_urls || profile.photo_urls.length < 3) {
    const currentCount = profile.photo_urls?.length || 0;
    missing.push({
      field: "photos",
      prompt: `Add ${3 - currentCount} more photo${3 - currentCount > 1 ? "s" : ""} (${currentCount}/3 minimum)`,
      weight: FIELD_WEIGHTS.photos,
    });
  }

  // Check business hours
  if (
    !profile.business_hours ||
    Object.keys(profile.business_hours).length === 0
  ) {
    missing.push({
      field: "business_hours",
      prompt: "Set your business hours",
      weight: FIELD_WEIGHTS.business_hours,
    });
  }

  // Check contact information
  const hasContact =
    (profile.phone && profile.phone.trim().length > 0) ||
    (profile.email && profile.email.trim().length > 0) ||
    (profile.website && profile.website.trim().length > 0);

  if (!hasContact) {
    missing.push({
      field: "contact_information",
      prompt: "Add contact information (phone, email, or website)",
      weight: FIELD_WEIGHTS.contact_information,
    });
  }

  // Check products or services
  const hasProductsOrServices =
    (profile.products && profile.products.length > 0) ||
    (profile.services && profile.services.length > 0);

  if (!hasProductsOrServices) {
    missing.push({
      field: "product_or_service_listing",
      prompt: "Add at least one product or service listing",
      weight: FIELD_WEIGHTS.product_or_service_listing,
    });
  }

  // Check price range
  if (!profile.price_range) {
    missing.push({
      field: "price_range",
      prompt: "Set your price range indicator ($, $$, $$$, or $$$$)",
      weight: FIELD_WEIGHTS.price_range,
    });
  }

  // Check service attributes
  if (profile.service_attributes) {
    const hasAnyAttribute = Object.values(profile.service_attributes).some(
      (value) => value === true,
    );
    if (!hasAnyAttribute) {
      missing.push({
        field: "service_attributes",
        prompt:
          "Set at least one service attribute (delivery, online service, etc.)",
        weight: FIELD_WEIGHTS.service_attributes,
      });
    }
  } else {
    missing.push({
      field: "service_attributes",
      prompt:
        "Set at least one service attribute (delivery, online service, etc.)",
      weight: FIELD_WEIGHTS.service_attributes,
    });
  }

  // Check website (separate from contact_information)
  if (!profile.website || profile.website.trim().length === 0) {
    missing.push({
      field: "website",
      prompt: "Add your business website URL",
      weight: FIELD_WEIGHTS.website,
    });
  }

  // Sort by weight (descending) to show most important missing fields first
  return missing.sort((a, b) => b.weight - a.weight);
}
