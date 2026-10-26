/**
 * Tests for Business Profile Serializer
 * 
 * Requirements: 23.1, 23.5, 23.6
 */

import { describe, it, expect } from 'vitest';
import { serializeBusinessProfile } from './business-profile-serializer';
import { deserializeBusinessProfile } from './business-profile-deserializer';
import type { BusinessProfile } from '@/lib/types/business-profile';
import type { ProductListing } from '@/lib/types/product';
import type { ServiceListing } from '@/lib/types/service';
import type { BusinessReview } from '@/lib/types/review';
import type { Category } from '@/lib/types/category';
import type { User } from '@/lib/types';

describe('serializeBusinessProfile', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'user@example.com',
    username: 'testuser',
    phone: '+234-123-456-7890',
    avatar_url: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    trust_score: 95,
    is_premium: true,
    premium_tier: 'pro',
    premium_expires_at: '2024-12-31T23:59:59Z',
    phone_verified: true,
    nin_verified: true,
    video_verified: false,
    is_suspended: false,
    role: 'user',
    tier: 'gold',
    cv_url: null,
    skills: ['skill1', 'skill2'],
    is_service_provider: false,
    is_job_seeker: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  };

  const mockCategory: Category = {
    id: 'cat-123',
    name: 'Food & Beverage',
    name_translations: { yo: 'Ounjẹ', ig: 'Nri', ha: 'Abinci' },
    description: 'Food and beverage services',
    description_translations: {},
    icon: 'restaurant',
    parent_id: null,
    display_order: 1,
    is_hidden: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockProduct: ProductListing = {
    id: 'prod-123',
    business_profile_id: 'biz-123',
    title: 'Test Product',
    description: 'A test product',
    product_type: 'physical',
    price: 100.50,
    currency: 'NGN',
    stock_quantity: 10,
    low_stock_threshold: 5,
    is_in_stock: true,
    image_urls: ['https://example.com/prod1.jpg'],
    primary_image_url: 'https://example.com/prod1.jpg',
    is_active: true,
    is_featured: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockService: ServiceListing = {
    id: 'serv-123',
    business_profile_id: 'biz-123',
    title: 'Test Service',
    description: 'A test service',
    pricing_model: 'hourly',
    price: 50,
    currency: 'NGN',
    duration_text: '2 hours',
    image_urls: ['https://example.com/serv1.jpg'],
    primary_image_url: 'https://example.com/serv1.jpg',
    is_active: true,
    is_featured: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockReview: BusinessReview = {
    id: 'rev-123',
    business_profile_id: 'biz-123',
    reviewer_id: 'user-456',
    rating: 5,
    comment: 'Excellent service!',
    owner_response: 'Thank you!',
    responded_at: '2024-01-03T00:00:00Z',
    is_flagged: false,
    flagged_reason: undefined,
    flagged_at: undefined,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  };

  const validProfile: BusinessProfile = {
    id: 'biz-123',
    user_id: 'user-123',
    business_name: 'Test Business',
    display_name: 'Test Display Name',
    description: 'A test business description',
    business_type: 'both',
    primary_category_id: 'cat-123',
    primary_subcategory_ids: ['subcat-123'],
    address: '123 Test St',
    city: 'Lagos',
    state: 'Lagos',
    postal_code: '100001',
    coordinates: { lat: 6.5244, lng: 3.3792 },
    phone: '+234-123-456-7890',
    email: 'test@example.com',
    website: 'https://example.com',
    business_hours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' }
    },
    service_attributes: {
      delivery_available: true,
      online_service: false,
      in_person_service: true,
      availability_24_7: false,
      emergency_service: false
    },
    price_range: '$$',
    primary_photo_url: 'https://example.com/photo.jpg',
    photo_urls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    is_verified: true,
    verified_at: '2024-01-01T00:00:00Z',
    verification_documents: { doc1: 'url1' },
    is_premium: false,
    premium_tier: 'basic',
    premium_expires_at: '2024-12-31T23:59:59Z',
    is_active: true,
    average_rating: 4.5,
    review_count: 10,
    completeness_percentage: 85,
    view_count: 100,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  };

  describe('basic serialization', () => {
    it('should serialize a valid BusinessProfile to JSON-compatible object', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(result).toBeDefined();
      expect(result.id).toBe('biz-123');
      expect(result.business_name).toBe('Test Business');
      expect(result.description).toBe('A test business description');
    });

    it('should preserve required string fields', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(result.business_name).toBe(validProfile.business_name);
      expect(result.description).toBe(validProfile.description);
      expect(result.city).toBe(validProfile.city);
      expect(result.state).toBe(validProfile.state);
    });

    it('should preserve required boolean fields', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(result.is_verified).toBe(true);
      expect(result.is_premium).toBe(false);
      expect(result.is_active).toBe(true);
    });

    it('should preserve required numeric fields', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(result.average_rating).toBe(4.5);
      expect(result.review_count).toBe(10);
      expect(result.completeness_percentage).toBe(85);
      expect(result.view_count).toBe(100);
    });

    it('should convert numbers to Number type', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(typeof result.average_rating).toBe('number');
      expect(typeof result.review_count).toBe('number');
      expect(typeof result.completeness_percentage).toBe('number');
      expect(typeof result.view_count).toBe('number');
    });

    it('should convert booleans to Boolean type', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(typeof result.is_verified).toBe('boolean');
      expect(typeof result.is_premium).toBe('boolean');
      expect(typeof result.is_active).toBe('boolean');
    });
  });

  describe('optional fields', () => {
    it('should handle null optional fields', () => {
      const profileWithNulls: BusinessProfile = {
        ...validProfile,
        display_name: undefined,
        address: undefined,
        postal_code: undefined,
        phone: undefined,
        email: undefined,
        website: undefined
      };

      const result = serializeBusinessProfile(profileWithNulls);

      expect(result.display_name).toBeNull();
      expect(result.address).toBeNull();
      expect(result.postal_code).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.email).toBeNull();
      expect(result.website).toBeNull();
    });

    it('should preserve optional fields when present', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(result.display_name).toBe('Test Display Name');
      expect(result.address).toBe('123 Test St');
      expect(result.postal_code).toBe('100001');
      expect(result.phone).toBe('+234-123-456-7890');
    });
  });

  describe('array handling (Requirement 23.5)', () => {
    it('should serialize photo_urls array', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(Array.isArray(result.photo_urls)).toBe(true);
      expect(result.photo_urls).toHaveLength(2);
      expect(result.photo_urls[0]).toBe('https://example.com/photo1.jpg');
      expect(result.photo_urls[1]).toBe('https://example.com/photo2.jpg');
    });

    it('should serialize primary_subcategory_ids array', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(Array.isArray(result.primary_subcategory_ids)).toBe(true);
      expect(result.primary_subcategory_ids).toHaveLength(1);
      expect(result.primary_subcategory_ids[0]).toBe('subcat-123');
    });

    it('should create new array instances (not references)', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(result.photo_urls).not.toBe(validProfile.photo_urls);
      expect(result.primary_subcategory_ids).not.toBe(validProfile.primary_subcategory_ids);
    });
  });

  describe('nested objects (Requirement 23.5)', () => {
    it('should serialize coordinates object', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(result.coordinates).toBeDefined();
      expect(result.coordinates.lat).toBe(6.5244);
      expect(result.coordinates.lng).toBe(3.3792);
      expect(typeof result.coordinates.lat).toBe('number');
      expect(typeof result.coordinates.lng).toBe('number');
    });

    it('should serialize business_hours object', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(result.business_hours).toBeDefined();
      expect(result.business_hours.monday).toEqual({ open: '09:00', close: '17:00' });
      expect(result.business_hours.tuesday).toEqual({ open: '09:00', close: '17:00' });
    });

    it('should serialize service_attributes object', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(result.service_attributes).toBeDefined();
      expect(result.service_attributes.delivery_available).toBe(true);
      expect(result.service_attributes.online_service).toBe(false);
      expect(result.service_attributes.in_person_service).toBe(true);
      expect(typeof result.service_attributes.delivery_available).toBe('boolean');
    });
  });

  describe('related entities (Requirement 23.5)', () => {
    it('should serialize products array when present', () => {
      const profileWithProducts: BusinessProfile = {
        ...validProfile,
        products: [mockProduct]
      };

      const result = serializeBusinessProfile(profileWithProducts);

      expect(result.products).toBeDefined();
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.products).toHaveLength(1);
      expect(result.products[0].id).toBe('prod-123');
      expect(result.products[0].title).toBe('Test Product');
    });

    it('should serialize services array when present', () => {
      const profileWithServices: BusinessProfile = {
        ...validProfile,
        services: [mockService]
      };

      const result = serializeBusinessProfile(profileWithServices);

      expect(result.services).toBeDefined();
      expect(Array.isArray(result.services)).toBe(true);
      expect(result.services).toHaveLength(1);
      expect(result.services[0].id).toBe('serv-123');
      expect(result.services[0].title).toBe('Test Service');
    });

    it('should serialize reviews array when present', () => {
      const profileWithReviews: BusinessProfile = {
        ...validProfile,
        reviews: [mockReview]
      };

      const result = serializeBusinessProfile(profileWithReviews);

      expect(result.reviews).toBeDefined();
      expect(Array.isArray(result.reviews)).toBe(true);
      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0].id).toBe('rev-123');
      expect(result.reviews[0].rating).toBe(5);
    });

    it('should not include relation fields when undefined', () => {
      const result = serializeBusinessProfile(validProfile);

      expect('products' in result).toBe(false);
      expect('services' in result).toBe(false);
      expect('reviews' in result).toBe(false);
    });
  });

  describe('data type preservation (Requirement 23.6)', () => {
    it('should preserve string data types', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(typeof result.id).toBe('string');
      expect(typeof result.business_name).toBe('string');
      expect(typeof result.description).toBe('string');
      expect(typeof result.city).toBe('string');
    });

    it('should preserve number data types', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(typeof result.average_rating).toBe('number');
      expect(typeof result.review_count).toBe('number');
      expect(typeof result.completeness_percentage).toBe('number');
    });

    it('should preserve boolean data types', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(typeof result.is_verified).toBe('boolean');
      expect(typeof result.is_premium).toBe('boolean');
      expect(typeof result.is_active).toBe('boolean');
    });

    it('should preserve date string data types', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(typeof result.created_at).toBe('string');
      expect(typeof result.updated_at).toBe('string');
      expect(result.created_at).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('round-trip property (Requirement 23.4)', () => {
    it('should satisfy round-trip: serialize -> deserialize -> serialize produces equivalent JSON', () => {
      // First serialization
      const serialized1 = serializeBusinessProfile(validProfile);
      const json1 = JSON.stringify(serialized1);

      // Deserialize
      const deserialized = deserializeBusinessProfile(json1);
      expect(deserialized.success).toBe(true);
      expect(deserialized.profile).not.toBeNull();

      // Second serialization
      const serialized2 = serializeBusinessProfile(deserialized.profile!);
      const json2 = JSON.stringify(serialized2);

      // Compare JSON strings
      expect(json2).toBe(json1);
    });

    it('should handle complete profile with all relations in round-trip', () => {
      const completeProfile: BusinessProfile = {
        ...validProfile,
        user: mockUser,
        primary_category: mockCategory,
        secondary_categories: [mockCategory],
        products: [mockProduct],
        services: [mockService],
        reviews: [mockReview]
      };

      const serialized1 = serializeBusinessProfile(completeProfile);
      const json1 = JSON.stringify(serialized1);

      const deserialized = deserializeBusinessProfile(json1);
      expect(deserialized.success).toBe(true);

      const serialized2 = serializeBusinessProfile(deserialized.profile!);
      const json2 = JSON.stringify(serialized2);

      expect(json2).toBe(json1);
    });
  });

  describe('JSON compatibility', () => {
    it('should produce JSON-serializable output', () => {
      const result = serializeBusinessProfile(validProfile);

      expect(() => JSON.stringify(result)).not.toThrow();

      const jsonString = JSON.stringify(result);
      expect(typeof jsonString).toBe('string');
      expect(jsonString.length).toBeGreaterThan(0);
    });

    it('should produce parseable JSON', () => {
      const result = serializeBusinessProfile(validProfile);
      const jsonString = JSON.stringify(result);

      expect(() => JSON.parse(jsonString)).not.toThrow();

      const parsed = JSON.parse(jsonString);
      expect(parsed.business_name).toBe('Test Business');
    });
  });

  describe('edge cases', () => {
    it('should handle profile with empty arrays', () => {
      const profileWithEmptyArrays: BusinessProfile = {
        ...validProfile,
        primary_subcategory_ids: [],
        photo_urls: []
      };

      const result = serializeBusinessProfile(profileWithEmptyArrays);

      expect(Array.isArray(result.primary_subcategory_ids)).toBe(true);
      expect(result.primary_subcategory_ids).toHaveLength(0);
      expect(Array.isArray(result.photo_urls)).toBe(true);
      expect(result.photo_urls).toHaveLength(0);
    });

    it('should handle profile with zero numeric values', () => {
      const profileWithZeros: BusinessProfile = {
        ...validProfile,
        average_rating: 0,
        review_count: 0,
        completeness_percentage: 0,
        view_count: 0
      };

      const result = serializeBusinessProfile(profileWithZeros);

      expect(result.average_rating).toBe(0);
      expect(result.review_count).toBe(0);
      expect(result.completeness_percentage).toBe(0);
      expect(result.view_count).toBe(0);
    });

    it('should handle profile with null coordinates', () => {
      const profileWithoutCoordinates: BusinessProfile = {
        ...validProfile,
        coordinates: undefined
      };

      const result = serializeBusinessProfile(profileWithoutCoordinates);

      expect(result.coordinates).toBeNull();
    });

    it('should handle profile with null nested objects', () => {
      const profileWithNullObjects: BusinessProfile = {
        ...validProfile,
        business_hours: undefined,
        service_attributes: undefined
      };

      const result = serializeBusinessProfile(profileWithNullObjects);

      expect(result.business_hours).toBeNull();
      expect(result.service_attributes).toBeNull();
    });
  });
});
