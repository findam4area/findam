/**
 * Business Profile Serializer
 * 
 * Serializes BusinessProfile objects to JSON format with proper handling of:
 * - Nested objects and arrays
 * - Data type preservation (numbers, strings, booleans, dates)
 * - Optional fields
 * - Related entities (products, services, reviews)
 * 
 * Requirements: 23.1, 23.5, 23.6
 */

import { BusinessProfile } from '../types/business-profile';
import { ProductListing } from '../types/product';
import { ServiceListing } from '../types/service';
import { BusinessReview } from '../types/review';
import { Category } from '../types/category';
import { User } from '../types';

/**
 * Serializes a BusinessProfile object to JSON
 * 
 * This function converts a BusinessProfile object (which may include nested
 * related entities) into a JSON-compatible object with all data types preserved.
 * 
 * @param profile - The BusinessProfile object to serialize
 * @returns A JSON-serializable object representing the business profile
 * 
 * @example
 * ```typescript
 * const profile: BusinessProfile = {
 *   id: "123",
 *   business_name: "Joe's Pizza",
 *   products: [...],
 *   services: [...],
 *   // ... other fields
 * };
 * 
 * const json = serializeBusinessProfile(profile);
 * const jsonString = JSON.stringify(json);
 * ```
 */
export function serializeBusinessProfile(profile: BusinessProfile): Record<string, any> {
  // Serialize the main profile fields
  const serialized: Record<string, any> = {
    id: profile.id,
    user_id: profile.user_id,
    
    // Basic information
    business_name: profile.business_name,
    display_name: profile.display_name ?? null,
    description: profile.description,
    business_type: profile.business_type,
    
    // Category relationships
    primary_category_id: profile.primary_category_id,
    primary_subcategory_ids: [...profile.primary_subcategory_ids],
    
    // Location
    address: profile.address ?? null,
    city: profile.city,
    state: profile.state,
    postal_code: profile.postal_code ?? null,
    coordinates: profile.coordinates ? { 
      lat: Number(profile.coordinates.lat), 
      lng: Number(profile.coordinates.lng) 
    } : null,
    
    // Contact information
    phone: profile.phone ?? null,
    email: profile.email ?? null,
    website: profile.website ?? null,
    business_hours: profile.business_hours ? 
      serializeBusinessHours(profile.business_hours) : null,
    
    // Service type attributes
    service_attributes: profile.service_attributes ? 
      serializeServiceAttributes(profile.service_attributes) : null,
    
    // Price range indicator
    price_range: profile.price_range ?? null,
    
    // Media
    primary_photo_url: profile.primary_photo_url ?? null,
    photo_urls: [...profile.photo_urls],
    
    // Status and verification
    is_verified: Boolean(profile.is_verified),
    verified_at: profile.verified_at ?? null,
    verification_documents: profile.verification_documents ?? null,
    
    is_premium: Boolean(profile.is_premium),
    premium_tier: profile.premium_tier ?? null,
    premium_expires_at: profile.premium_expires_at ?? null,
    
    is_active: Boolean(profile.is_active),
    
    // Ratings
    average_rating: Number(profile.average_rating),
    review_count: Number(profile.review_count),
    
    // Profile completeness
    completeness_percentage: Number(profile.completeness_percentage),
    
    // Metadata
    view_count: Number(profile.view_count),
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
  
  // Serialize relations if present
  if (profile.user !== undefined) {
    serialized.user = profile.user ? serializeUser(profile.user) : null;
  }
  
  if (profile.primary_category !== undefined) {
    serialized.primary_category = profile.primary_category ? 
      serializeCategory(profile.primary_category) : null;
  }
  
  if (profile.secondary_categories !== undefined) {
    serialized.secondary_categories = profile.secondary_categories ? 
      profile.secondary_categories.map(serializeCategory) : [];
  }
  
  if (profile.products !== undefined) {
    serialized.products = profile.products ? 
      profile.products.map(serializeProduct) : [];
  }
  
  if (profile.services !== undefined) {
    serialized.services = profile.services ? 
      profile.services.map(serializeService) : [];
  }
  
  if (profile.reviews !== undefined) {
    serialized.reviews = profile.reviews ? 
      profile.reviews.map(serializeReview) : [];
  }
  
  return serialized;
}

/**
 * Serializes business hours object
 */
function serializeBusinessHours(
  hours: Record<string, { open: string; close: string }>
): Record<string, { open: string; close: string }> {
  const serialized: Record<string, { open: string; close: string }> = {};
  
  for (const [day, times] of Object.entries(hours)) {
    serialized[day] = {
      open: String(times.open),
      close: String(times.close),
    };
  }
  
  return serialized;
}

/**
 * Serializes service attributes object
 */
function serializeServiceAttributes(
  attributes: {
    delivery_available?: boolean;
    online_service?: boolean;
    in_person_service?: boolean;
    availability_24_7?: boolean;
    emergency_service?: boolean;
  }
): Record<string, boolean> {
  return {
    delivery_available: Boolean(attributes.delivery_available ?? false),
    online_service: Boolean(attributes.online_service ?? false),
    in_person_service: Boolean(attributes.in_person_service ?? false),
    availability_24_7: Boolean(attributes.availability_24_7 ?? false),
    emergency_service: Boolean(attributes.emergency_service ?? false),
  };
}

/**
 * Serializes a User object
 */
function serializeUser(user: User): Record<string, any> {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    phone: user.phone ?? null,
    avatar_url: user.avatar_url ?? null,
    bio: user.bio ?? null,
    trust_score: Number(user.trust_score),
    is_premium: Boolean(user.is_premium),
    premium_tier: user.premium_tier ?? null,
    premium_expires_at: user.premium_expires_at ?? null,
    phone_verified: Boolean(user.phone_verified),
    nin_verified: Boolean(user.nin_verified),
    video_verified: Boolean(user.video_verified),
    is_suspended: Boolean(user.is_suspended),
    role: user.role ?? null,
    tier: user.tier ?? null,
    cv_url: user.cv_url ?? null,
    skills: user.skills ? [...user.skills] : null,
    is_service_provider: Boolean(user.is_service_provider),
    is_job_seeker: Boolean(user.is_job_seeker),
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

/**
 * Serializes a Category object
 */
function serializeCategory(category: Category): Record<string, any> {
  const serialized: Record<string, any> = {
    id: category.id,
    name: category.name,
    description: category.description ?? null,
    icon: category.icon,
    parent_id: category.parent_id ?? null,
    display_order: Number(category.display_order),
    is_hidden: Boolean(category.is_hidden),
    created_at: category.created_at,
    updated_at: category.updated_at,
  };
  
  if (category.subcategories !== undefined) {
    serialized.subcategories = category.subcategories ? 
      category.subcategories.map(serializeCategory) : [];
  }
  
  if (category.business_count !== undefined) {
    serialized.business_count = Number(category.business_count);
  }
  
  return serialized;
}

/**
 * Serializes a ProductListing object
 */
function serializeProduct(product: ProductListing): Record<string, any> {
  return {
    id: product.id,
    business_profile_id: product.business_profile_id,
    title: product.title,
    description: product.description,
    product_type: product.product_type,
    price: Number(product.price),
    currency: product.currency,
    stock_quantity: Number(product.stock_quantity),
    low_stock_threshold: Number(product.low_stock_threshold),
    is_in_stock: Boolean(product.is_in_stock),
    image_urls: [...product.image_urls],
    primary_image_url: product.primary_image_url,
    is_active: Boolean(product.is_active),
    is_featured: Boolean(product.is_featured),
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
}

/**
 * Serializes a ServiceListing object
 */
function serializeService(service: ServiceListing): Record<string, any> {
  return {
    id: service.id,
    business_profile_id: service.business_profile_id,
    title: service.title,
    description: service.description,
    pricing_model: service.pricing_model,
    price: service.price !== undefined ? Number(service.price) : null,
    currency: service.currency,
    duration_text: service.duration_text ?? null,
    image_urls: [...service.image_urls],
    primary_image_url: service.primary_image_url,
    is_active: Boolean(service.is_active),
    is_featured: Boolean(service.is_featured),
    created_at: service.created_at,
    updated_at: service.updated_at,
  };
}

/**
 * Serializes a BusinessReview object
 */
function serializeReview(review: BusinessReview): Record<string, any> {
  const serialized: Record<string, any> = {
    id: review.id,
    business_profile_id: review.business_profile_id,
    reviewer_id: review.reviewer_id,
    rating: Number(review.rating),
    comment: review.comment,
    owner_response: review.owner_response ?? null,
    responded_at: review.responded_at ?? null,
    is_flagged: Boolean(review.is_flagged),
    flagged_reason: review.flagged_reason ?? null,
    flagged_at: review.flagged_at ?? null,
    created_at: review.created_at,
    updated_at: review.updated_at,
  };
  
  if (review.reviewer !== undefined) {
    serialized.reviewer = review.reviewer ? serializeUser(review.reviewer) : null;
  }
  
  return serialized;
}
