/**
 * Tests for Business Profile Deserializer
 * 
 * Requirements: 23.3, 23.2
 */

import { describe, it, expect } from 'vitest';
import { deserializeBusinessProfile } from './business-profile-deserializer';
import type { BusinessProfile } from '@/lib/types/business-profile';

describe('deserializeBusinessProfile', () => {
  const validProfileData: BusinessProfile = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    business_name: 'Test Business',
    display_name: 'Test Display Name',
    description: 'A test business description',
    business_type: 'both',
    primary_category_id: '123e4567-e89b-12d3-a456-426614174002',
    primary_subcategory_ids: ['123e4567-e89b-12d3-a456-426614174003'],
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
      online_service: false
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

  describe('valid data', () => {
    it('should successfully deserialize valid profile data from object', () => {
      const result = deserializeBusinessProfile(validProfileData);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.profile).not.toBeNull();
      expect(result.profile?.business_name).toBe('Test Business');
    });

    it('should successfully deserialize valid profile data from JSON string', () => {
      const jsonString = JSON.stringify(validProfileData);
      const result = deserializeBusinessProfile(jsonString);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.profile).not.toBeNull();
      expect(result.profile?.business_name).toBe('Test Business');
    });

    it('should preserve all required fields', () => {
      const result = deserializeBusinessProfile(validProfileData);
      
      expect(result.profile?.id).toBe(validProfileData.id);
      expect(result.profile?.user_id).toBe(validProfileData.user_id);
      expect(result.profile?.business_name).toBe(validProfileData.business_name);
      expect(result.profile?.description).toBe(validProfileData.description);
      expect(result.profile?.city).toBe(validProfileData.city);
      expect(result.profile?.state).toBe(validProfileData.state);
    });

    it('should preserve nested structures', () => {
      const result = deserializeBusinessProfile(validProfileData);
      
      expect(result.profile?.coordinates).toEqual({ lat: 6.5244, lng: 3.3792 });
      expect(result.profile?.business_hours).toEqual({
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' }
      });
      expect(result.profile?.service_attributes).toEqual({
        delivery_available: true,
        online_service: false
      });
    });
  });

  describe('invalid JSON', () => {
    it('should return error for invalid JSON string', () => {
      const result = deserializeBusinessProfile('invalid json {');
      
      expect(result.success).toBe(false);
      expect(result.profile).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('root');
      expect(result.errors[0].error).toBe('Invalid JSON format');
    });

    it('should return error for non-object data', () => {
      const result = deserializeBusinessProfile('[]');
      
      expect(result.success).toBe(false);
      expect(result.profile).toBeNull();
      expect(result.errors[0].field).toBe('root');
    });
  });

  describe('missing required fields', () => {
    it('should return error for missing business_name', () => {
      const data = { ...validProfileData };
      delete (data as any).business_name;
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'business_name')).toBe(true);
      expect(result.errors.find(e => e.field === 'business_name')?.error).toContain('Missing required field');
    });

    it('should return error for missing description', () => {
      const data = { ...validProfileData };
      delete (data as any).description;
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'description')).toBe(true);
    });

    it('should return error for missing city', () => {
      const data = { ...validProfileData };
      delete (data as any).city;
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'city')).toBe(true);
    });
  });

  describe('invalid field types', () => {
    it('should return error for non-string business_name', () => {
      const data = { ...validProfileData, business_name: 123 };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'business_name')).toBe(true);
      expect(result.errors.find(e => e.field === 'business_name')?.error).toContain('must be a string');
    });

    it('should return error for non-boolean is_verified', () => {
      const data = { ...validProfileData, is_verified: 'yes' };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'is_verified')).toBe(true);
      expect(result.errors.find(e => e.field === 'is_verified')?.error).toContain('must be a boolean');
    });

    it('should return error for non-number average_rating', () => {
      const data = { ...validProfileData, average_rating: '4.5' };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'average_rating')).toBe(true);
      expect(result.errors.find(e => e.field === 'average_rating')?.error).toContain('must be a number');
    });

    it('should return error for non-array photo_urls', () => {
      const data = { ...validProfileData, photo_urls: 'not-an-array' };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'photo_urls')).toBe(true);
      expect(result.errors.find(e => e.field === 'photo_urls')?.error).toContain('must be an array');
    });
  });

  describe('field validation', () => {
    it('should return error for invalid business_type', () => {
      const data = { ...validProfileData, business_type: 'invalid' };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'business_type')).toBe(true);
      expect(result.errors.find(e => e.field === 'business_type')?.error).toContain('must be one of');
    });

    it('should return error for invalid price_range', () => {
      const data = { ...validProfileData, price_range: '$$$$$' };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'price_range')).toBe(true);
    });

    it('should return error for invalid premium_tier', () => {
      const data = { ...validProfileData, premium_tier: 'platinum' };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'premium_tier')).toBe(true);
    });

    it('should return error for average_rating out of range', () => {
      const data = { ...validProfileData, average_rating: 6.0 };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'average_rating')).toBe(true);
      expect(result.errors.find(e => e.field === 'average_rating')?.error).toContain('between 0 and 5');
    });

    it('should return error for negative review_count', () => {
      const data = { ...validProfileData, review_count: -5 };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'review_count')).toBe(true);
      expect(result.errors.find(e => e.field === 'review_count')?.error).toContain('non-negative');
    });

    it('should return error for completeness_percentage out of range', () => {
      const data = { ...validProfileData, completeness_percentage: 150 };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'completeness_percentage')).toBe(true);
      expect(result.errors.find(e => e.field === 'completeness_percentage')?.error).toContain('between 0 and 100');
    });

    it('should return error for empty string in required field', () => {
      const data = { ...validProfileData, business_name: '   ' };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'business_name')).toBe(true);
      expect(result.errors.find(e => e.field === 'business_name')?.error).toContain('cannot be empty');
    });
  });

  describe('coordinates validation', () => {
    it('should validate coordinates lat range', () => {
      const data = { ...validProfileData, coordinates: { lat: 100, lng: 0 } };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'coordinates.lat')).toBe(true);
      expect(result.errors.find(e => e.field === 'coordinates.lat')?.error).toContain('between -90 and 90');
    });

    it('should validate coordinates lng range', () => {
      const data = { ...validProfileData, coordinates: { lat: 0, lng: 200 } };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'coordinates.lng')).toBe(true);
      expect(result.errors.find(e => e.field === 'coordinates.lng')?.error).toContain('between -180 and 180');
    });

    it('should return error for non-number coordinates', () => {
      const data = { ...validProfileData, coordinates: { lat: '6.5', lng: '3.3' } };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field.startsWith('coordinates.'))).toBe(true);
    });
  });

  describe('business_hours validation', () => {
    it('should validate business_hours structure', () => {
      const data = { 
        ...validProfileData, 
        business_hours: { 
          monday: { open: 123, close: '17:00' } 
        } 
      };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'business_hours.monday.open')).toBe(true);
    });

    it('should return error for invalid business_hours type', () => {
      const data = { ...validProfileData, business_hours: 'invalid' };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'business_hours')).toBe(true);
    });
  });

  describe('service_attributes validation', () => {
    it('should validate service_attributes boolean values', () => {
      const data = { 
        ...validProfileData, 
        service_attributes: { 
          delivery_available: 'yes' 
        } 
      };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'service_attributes.delivery_available')).toBe(true);
      expect(result.errors.find(e => e.field === 'service_attributes.delivery_available')?.error).toContain('must be a boolean');
    });

    it('should return error for unknown service attribute', () => {
      const data = { 
        ...validProfileData, 
        service_attributes: { 
          unknown_attribute: true 
        } 
      };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'service_attributes.unknown_attribute')).toBe(true);
      expect(result.errors.find(e => e.field === 'service_attributes.unknown_attribute')?.error).toContain('Unknown service attribute');
    });
  });

  describe('array element validation', () => {
    it('should validate photo_urls array elements are strings', () => {
      const data = { 
        ...validProfileData, 
        photo_urls: ['valid-url', 123, 'another-url'] 
      };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'photo_urls[1]')).toBe(true);
      expect(result.errors.find(e => e.field === 'photo_urls[1]')?.error).toContain('must be a string');
    });

    it('should validate primary_subcategory_ids array elements are strings', () => {
      const data = { 
        ...validProfileData, 
        primary_subcategory_ids: ['valid-id', null, 'another-id'] 
      };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'primary_subcategory_ids[1]')).toBe(true);
    });
  });

  describe('date validation', () => {
    it('should return error for invalid date string in created_at', () => {
      const data = { ...validProfileData, created_at: 'not-a-date' };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.field === 'created_at')).toBe(true);
      expect(result.errors.find(e => e.field === 'created_at')?.error).toContain('valid date string');
    });

    it('should accept valid ISO date strings', () => {
      const data = { ...validProfileData };
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(true);
      expect(result.profile?.created_at).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('multiple validation errors', () => {
    it('should return all validation errors for invalid data', () => {
      const data = {
        ...validProfileData,
        business_name: 123,
        is_verified: 'yes',
        average_rating: 10,
        photo_urls: 'not-array'
      };
      
      const result = deserializeBusinessProfile(data);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
      expect(result.errors.some(e => e.field === 'business_name')).toBe(true);
      expect(result.errors.some(e => e.field === 'is_verified')).toBe(true);
      expect(result.errors.some(e => e.field === 'average_rating')).toBe(true);
      expect(result.errors.some(e => e.field === 'photo_urls')).toBe(true);
    });
  });
});
