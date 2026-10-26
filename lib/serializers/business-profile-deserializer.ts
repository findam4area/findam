/**
 * Business Profile Deserializer
 * 
 * Parses JSON-formatted business profile data and validates field types.
 * Returns validation errors with field-specific messages for invalid data.
 * 
 * Requirements: 23.3, 23.2
 */

import type { BusinessProfile } from '@/lib/types/business-profile';

export interface ValidationError {
  field: string;
  error: string;
}

export interface DeserializeResult {
  success: boolean;
  profile: BusinessProfile | null;
  errors: ValidationError[];
}

/**
 * Deserializes JSON data to a BusinessProfile object with validation
 * 
 * @param jsonData - JSON string or object containing business profile data
 * @returns DeserializeResult with profile or validation errors
 * 
 * Validates:
 * - Required fields exist (Requirement 23.2)
 * - Field types match BusinessProfile interface (Requirement 23.3)
 * - Nested structures are properly formatted
 * - Returns field-specific error messages (Requirement 23.2)
 */
export function deserializeBusinessProfile(jsonData: string | object): DeserializeResult {
  const errors: ValidationError[] = [];
  
  // Parse JSON if string provided
  let data: any;
  try {
    data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
  } catch (e) {
    return {
      success: false,
      profile: null,
      errors: [{ field: 'root', error: 'Invalid JSON format' }]
    };
  }
  
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      success: false,
      profile: null,
      errors: [{ field: 'root', error: 'Data must be an object' }]
    };
  }
  
  // Validate required string fields
  const requiredStringFields = [
    'id',
    'user_id',
    'business_name',
    'description',
    'city',
    'state'
  ];
  
  for (const field of requiredStringFields) {
    if (data[field] === undefined || data[field] === null) {
      errors.push({ field, error: `Missing required field: ${field}` });
    } else if (typeof data[field] !== 'string') {
      errors.push({ field, error: `Field ${field} must be a string, got ${typeof data[field]}` });
    } else if (data[field].trim() === '') {
      errors.push({ field, error: `Field ${field} cannot be empty` });
    }
  }
  
  // Validate business_type enum
  if (data.business_type === undefined || data.business_type === null) {
    errors.push({ field: 'business_type', error: 'Missing required field: business_type' });
  } else if (!['product', 'service', 'both'].includes(data.business_type)) {
    errors.push({ 
      field: 'business_type', 
      error: `Field business_type must be one of: product, service, both. Got: ${data.business_type}` 
    });
  }
  
  // Validate primary_category_id
  if (data.primary_category_id === undefined || data.primary_category_id === null) {
    errors.push({ field: 'primary_category_id', error: 'Missing required field: primary_category_id' });
  } else if (typeof data.primary_category_id !== 'string') {
    errors.push({ 
      field: 'primary_category_id', 
      error: `Field primary_category_id must be a string, got ${typeof data.primary_category_id}` 
    });
  }
  
  // Validate primary_subcategory_ids array
  if (data.primary_subcategory_ids === undefined || data.primary_subcategory_ids === null) {
    errors.push({ field: 'primary_subcategory_ids', error: 'Missing required field: primary_subcategory_ids' });
  } else if (!Array.isArray(data.primary_subcategory_ids)) {
    errors.push({ 
      field: 'primary_subcategory_ids', 
      error: `Field primary_subcategory_ids must be an array, got ${typeof data.primary_subcategory_ids}` 
    });
  } else {
    // Validate array elements are strings
    data.primary_subcategory_ids.forEach((id: any, idx: number) => {
      if (typeof id !== 'string') {
        errors.push({ 
          field: `primary_subcategory_ids[${idx}]`, 
          error: `Array element must be a string, got ${typeof id}` 
        });
      }
    });
  }
  
  // Validate photo_urls array
  if (data.photo_urls === undefined || data.photo_urls === null) {
    errors.push({ field: 'photo_urls', error: 'Missing required field: photo_urls' });
  } else if (!Array.isArray(data.photo_urls)) {
    errors.push({ 
      field: 'photo_urls', 
      error: `Field photo_urls must be an array, got ${typeof data.photo_urls}` 
    });
  } else {
    data.photo_urls.forEach((url: any, idx: number) => {
      if (typeof url !== 'string') {
        errors.push({ 
          field: `photo_urls[${idx}]`, 
          error: `Array element must be a string, got ${typeof url}` 
        });
      }
    });
  }
  
  // Validate boolean fields
  const requiredBooleanFields = ['is_verified', 'is_premium', 'is_active'];
  
  for (const field of requiredBooleanFields) {
    if (data[field] === undefined || data[field] === null) {
      errors.push({ field, error: `Missing required field: ${field}` });
    } else if (typeof data[field] !== 'boolean') {
      errors.push({ field, error: `Field ${field} must be a boolean, got ${typeof data[field]}` });
    }
  }
  
  // Validate numeric fields
  const requiredNumericFields = [
    'average_rating',
    'review_count',
    'completeness_percentage',
    'view_count'
  ];
  
  for (const field of requiredNumericFields) {
    if (data[field] === undefined || data[field] === null) {
      errors.push({ field, error: `Missing required field: ${field}` });
    } else if (typeof data[field] !== 'number') {
      errors.push({ field, error: `Field ${field} must be a number, got ${typeof data[field]}` });
    } else if (isNaN(data[field])) {
      errors.push({ field, error: `Field ${field} cannot be NaN` });
    }
  }
  
  // Validate average_rating range
  if (typeof data.average_rating === 'number' && !isNaN(data.average_rating)) {
    if (data.average_rating < 0 || data.average_rating > 5) {
      errors.push({ 
        field: 'average_rating', 
        error: `Field average_rating must be between 0 and 5, got ${data.average_rating}` 
      });
    }
  }
  
  // Validate review_count is non-negative
  if (typeof data.review_count === 'number' && !isNaN(data.review_count)) {
    if (data.review_count < 0) {
      errors.push({ 
        field: 'review_count', 
        error: `Field review_count must be non-negative, got ${data.review_count}` 
      });
    }
  }
  
  // Validate completeness_percentage range
  if (typeof data.completeness_percentage === 'number' && !isNaN(data.completeness_percentage)) {
    if (data.completeness_percentage < 0 || data.completeness_percentage > 100) {
      errors.push({ 
        field: 'completeness_percentage', 
        error: `Field completeness_percentage must be between 0 and 100, got ${data.completeness_percentage}` 
      });
    }
  }
  
  // Validate view_count is non-negative
  if (typeof data.view_count === 'number' && !isNaN(data.view_count)) {
    if (data.view_count < 0) {
      errors.push({ 
        field: 'view_count', 
        error: `Field view_count must be non-negative, got ${data.view_count}` 
      });
    }
  }
  
  // Validate timestamp fields
  const requiredTimestampFields = ['created_at', 'updated_at'];
  
  for (const field of requiredTimestampFields) {
    if (data[field] === undefined || data[field] === null) {
      errors.push({ field, error: `Missing required field: ${field}` });
    } else if (typeof data[field] !== 'string') {
      errors.push({ field, error: `Field ${field} must be a string, got ${typeof data[field]}` });
    } else {
      // Validate it's a valid date string
      const date = new Date(data[field]);
      if (isNaN(date.getTime())) {
        errors.push({ field, error: `Field ${field} must be a valid date string` });
      }
    }
  }
  
  // Validate optional string fields
  const optionalStringFields = [
    'display_name',
    'address',
    'postal_code',
    'phone',
    'email',
    'website',
    'primary_photo_url',
    'verified_at',
    'premium_expires_at'
  ];
  
  for (const field of optionalStringFields) {
    if (data[field] !== undefined && data[field] !== null && typeof data[field] !== 'string') {
      errors.push({ field, error: `Field ${field} must be a string, got ${typeof data[field]}` });
    }
  }
  
  // Validate optional timestamp fields
  const optionalTimestampFields = ['verified_at', 'premium_expires_at'];
  
  for (const field of optionalTimestampFields) {
    if (data[field] !== undefined && data[field] !== null) {
      if (typeof data[field] !== 'string') {
        errors.push({ field, error: `Field ${field} must be a string, got ${typeof data[field]}` });
      } else {
        const date = new Date(data[field]);
        if (isNaN(date.getTime())) {
          errors.push({ field, error: `Field ${field} must be a valid date string` });
        }
      }
    }
  }
  
  // Validate price_range enum
  if (data.price_range !== undefined && data.price_range !== null) {
    if (!['$', '$$', '$$$', '$$$$'].includes(data.price_range)) {
      errors.push({ 
        field: 'price_range', 
        error: `Field price_range must be one of: $, $$, $$$, $$$$. Got: ${data.price_range}` 
      });
    }
  }
  
  // Validate premium_tier enum
  if (data.premium_tier !== undefined && data.premium_tier !== null) {
    if (!['basic', 'pro', 'enterprise'].includes(data.premium_tier)) {
      errors.push({ 
        field: 'premium_tier', 
        error: `Field premium_tier must be one of: basic, pro, enterprise. Got: ${data.premium_tier}` 
      });
    }
  }
  
  // Validate coordinates object
  if (data.coordinates !== undefined && data.coordinates !== null) {
    if (typeof data.coordinates !== 'object') {
      errors.push({ 
        field: 'coordinates', 
        error: `Field coordinates must be an object, got ${typeof data.coordinates}` 
      });
    } else {
      if (data.coordinates.lat === undefined || data.coordinates.lat === null) {
        errors.push({ field: 'coordinates.lat', error: 'Missing required field: coordinates.lat' });
      } else if (typeof data.coordinates.lat !== 'number') {
        errors.push({ 
          field: 'coordinates.lat', 
          error: `Field coordinates.lat must be a number, got ${typeof data.coordinates.lat}` 
        });
      } else if (data.coordinates.lat < -90 || data.coordinates.lat > 90) {
        errors.push({ 
          field: 'coordinates.lat', 
          error: `Field coordinates.lat must be between -90 and 90, got ${data.coordinates.lat}` 
        });
      }
      
      if (data.coordinates.lng === undefined || data.coordinates.lng === null) {
        errors.push({ field: 'coordinates.lng', error: 'Missing required field: coordinates.lng' });
      } else if (typeof data.coordinates.lng !== 'number') {
        errors.push({ 
          field: 'coordinates.lng', 
          error: `Field coordinates.lng must be a number, got ${typeof data.coordinates.lng}` 
        });
      } else if (data.coordinates.lng < -180 || data.coordinates.lng > 180) {
        errors.push({ 
          field: 'coordinates.lng', 
          error: `Field coordinates.lng must be between -180 and 180, got ${data.coordinates.lng}` 
        });
      }
    }
  }
  
  // Validate business_hours object
  if (data.business_hours !== undefined && data.business_hours !== null) {
    if (typeof data.business_hours !== 'object') {
      errors.push({ 
        field: 'business_hours', 
        error: `Field business_hours must be an object, got ${typeof data.business_hours}` 
      });
    } else {
      for (const [day, hours] of Object.entries(data.business_hours)) {
        if (typeof hours !== 'object' || hours === null) {
          errors.push({ 
            field: `business_hours.${day}`, 
            error: `Day hours must be an object, got ${typeof hours}` 
          });
        } else {
          const hoursObj = hours as any;
          if (typeof hoursObj.open !== 'string') {
            errors.push({ 
              field: `business_hours.${day}.open`, 
              error: `Open time must be a string, got ${typeof hoursObj.open}` 
            });
          }
          if (typeof hoursObj.close !== 'string') {
            errors.push({ 
              field: `business_hours.${day}.close`, 
              error: `Close time must be a string, got ${typeof hoursObj.close}` 
            });
          }
        }
      }
    }
  }
  
  // Validate service_attributes object
  if (data.service_attributes !== undefined && data.service_attributes !== null) {
    if (typeof data.service_attributes !== 'object') {
      errors.push({ 
        field: 'service_attributes', 
        error: `Field service_attributes must be an object, got ${typeof data.service_attributes}` 
      });
    } else {
      const validAttributes = [
        'delivery_available',
        'online_service',
        'in_person_service',
        'availability_24_7',
        'emergency_service'
      ];
      
      for (const [key, value] of Object.entries(data.service_attributes)) {
        if (!validAttributes.includes(key)) {
          errors.push({ 
            field: `service_attributes.${key}`, 
            error: `Unknown service attribute: ${key}. Valid attributes: ${validAttributes.join(', ')}` 
          });
        } else if (typeof value !== 'boolean') {
          errors.push({ 
            field: `service_attributes.${key}`, 
            error: `Service attribute must be a boolean, got ${typeof value}` 
          });
        }
      }
    }
  }
  
  // Validate verification_documents object
  if (data.verification_documents !== undefined && data.verification_documents !== null) {
    if (typeof data.verification_documents !== 'object') {
      errors.push({ 
        field: 'verification_documents', 
        error: `Field verification_documents must be an object, got ${typeof data.verification_documents}` 
      });
    }
  }
  
  // If there are validation errors, return them
  if (errors.length > 0) {
    return {
      success: false,
      profile: null,
      errors
    };
  }
  
  // Construct the BusinessProfile object
  const profile: BusinessProfile = {
    id: data.id,
    user_id: data.user_id,
    business_name: data.business_name,
    display_name: data.display_name,
    description: data.description,
    business_type: data.business_type,
    primary_category_id: data.primary_category_id,
    primary_subcategory_ids: data.primary_subcategory_ids,
    address: data.address,
    city: data.city,
    state: data.state,
    postal_code: data.postal_code,
    coordinates: data.coordinates,
    phone: data.phone,
    email: data.email,
    website: data.website,
    business_hours: data.business_hours,
    service_attributes: data.service_attributes,
    price_range: data.price_range,
    primary_photo_url: data.primary_photo_url,
    photo_urls: data.photo_urls,
    is_verified: data.is_verified,
    verified_at: data.verified_at,
    verification_documents: data.verification_documents,
    is_premium: data.is_premium,
    premium_tier: data.premium_tier,
    premium_expires_at: data.premium_expires_at,
    is_active: data.is_active,
    average_rating: data.average_rating,
    review_count: data.review_count,
    completeness_percentage: data.completeness_percentage,
    view_count: data.view_count,
    created_at: data.created_at,
    updated_at: data.updated_at,
    // Optional relations
    user: data.user,
    primary_category: data.primary_category,
    secondary_categories: data.secondary_categories,
    products: data.products,
    services: data.services,
    reviews: data.reviews
  };
  
  return {
    success: true,
    profile,
    errors: []
  };
}
