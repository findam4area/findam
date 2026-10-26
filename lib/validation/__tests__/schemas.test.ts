/**
 * Unit tests for Zod validation schemas
 * Tests all validation schemas defined in lib/validation/schemas.ts
 */

import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  createListingSchema,
  updateListingImagesSchema,
  imageUploadSchema,
  vendorApplicationSchema,
  browseFiltersSchema,
  rejectReasonSchema,
} from '../schemas';

describe('Authentication Schemas', () => {
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
        full_name: 'John Doe',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123',
        full_name: 'John Doe',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('email');
      }
    });

    it('should reject password without uppercase letter', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'John Doe',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('uppercase');
      }
    });

    it('should reject password without lowercase letter', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'PASSWORD123',
        full_name: 'John Doe',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('lowercase');
      }
    });

    it('should reject password without number', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'PasswordABC',
        full_name: 'John Doe',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('number');
      }
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Pass1',
        full_name: 'John Doe',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('8 characters');
      }
    });

    it('should reject full_name shorter than 2 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123',
        full_name: 'J',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2 characters');
      }
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'anypassword',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'anypassword',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Listing Schemas', () => {
  describe('createListingSchema', () => {
    it('should validate valid listing data with 3 images', () => {
      const validData = {
        title: 'Great Service',
        description: 'This is a detailed description of the service being offered.',
        price: 5000,
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
        primary_image_index: 0,
      };

      const result = createListingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate listing with nullable price', () => {
      const validData = {
        title: 'Great Service',
        description: 'This is a detailed description of the service being offered.',
        price: null,
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: ['https://example.com/image1.jpg'],
        primary_image_index: 0,
      };

      const result = createListingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject title shorter than 5 characters', () => {
      const invalidData = {
        title: 'Test',
        description: 'This is a detailed description of the service being offered.',
        price: 5000,
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: ['https://example.com/image1.jpg'],
        primary_image_index: 0,
      };

      const result = createListingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5 characters');
      }
    });

    it('should reject description shorter than 20 characters', () => {
      const invalidData = {
        title: 'Great Service',
        description: 'Short desc',
        price: 5000,
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: ['https://example.com/image1.jpg'],
        primary_image_index: 0,
      };

      const result = createListingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('20 characters');
      }
    });

    it('should reject more than 5 images', () => {
      const invalidData = {
        title: 'Great Service',
        description: 'This is a detailed description of the service being offered.',
        price: 5000,
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
          'https://example.com/image4.jpg',
          'https://example.com/image5.jpg',
          'https://example.com/image6.jpg',
        ],
        primary_image_index: 0,
      };

      const result = createListingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5 images');
      }
    });

    it('should reject listing with no images', () => {
      const invalidData = {
        title: 'Great Service',
        description: 'This is a detailed description of the service being offered.',
        price: 5000,
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: [],
        primary_image_index: 0,
      };

      const result = createListingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('1 image');
      }
    });

    it('should reject invalid primary_image_index (out of bounds)', () => {
      const invalidData = {
        title: 'Great Service',
        description: 'This is a detailed description of the service being offered.',
        price: 5000,
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
        ],
        primary_image_index: 5,
      };

      const result = createListingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // The validation fails with max(4) check first, showing "at most 4"
        expect(result.error.issues[0].message).toMatch(/at most 4|bounds/);
      }
    });

    it('should reject invalid category_id (not a UUID)', () => {
      const invalidData = {
        title: 'Great Service',
        description: 'This is a detailed description of the service being offered.',
        price: 5000,
        category_id: 'not-a-uuid',
        location_state: 'Lagos',
        location_city: 'Ikeja',
        images: ['https://example.com/image1.jpg'],
        primary_image_index: 0,
      };

      const result = createListingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateListingImagesSchema', () => {
    it('should validate valid image update', () => {
      const validData = {
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
        primary_image_index: 1,
      };

      const result = updateListingImagesSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject primary_image_index >= images.length', () => {
      const invalidData = {
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
        ],
        primary_image_index: 2,
      };

      const result = updateListingImagesSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than');
      }
    });
  });
});

describe('Vendor Application Schema', () => {
  describe('vendorApplicationSchema', () => {
    it('should validate valid vendor application', () => {
      const validData = {
        business_name: 'Tech Solutions Ltd',
        business_description: 'We provide innovative technology solutions for businesses.',
        contact_email: 'contact@techsolutions.com',
        contact_phone: '+2348012345678',
      };

      const result = vendorApplicationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate Nigerian phone starting with 0', () => {
      const validData = {
        business_name: 'Tech Solutions Ltd',
        business_description: 'We provide innovative technology solutions for businesses.',
        contact_email: 'contact@techsolutions.com',
        contact_phone: '08012345678',
      };

      const result = vendorApplicationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject business_name shorter than 2 characters', () => {
      const invalidData = {
        business_name: 'T',
        business_description: 'We provide innovative technology solutions for businesses.',
        contact_email: 'contact@techsolutions.com',
        contact_phone: '+2348012345678',
      };

      const result = vendorApplicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject business_description shorter than 20 characters', () => {
      const invalidData = {
        business_name: 'Tech Solutions Ltd',
        business_description: 'Short desc',
        contact_email: 'contact@techsolutions.com',
        contact_phone: '+2348012345678',
      };

      const result = vendorApplicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid Nigerian phone number', () => {
      const invalidData = {
        business_name: 'Tech Solutions Ltd',
        business_description: 'We provide innovative technology solutions for businesses.',
        contact_email: 'contact@techsolutions.com',
        contact_phone: '1234567890',
      };

      const result = vendorApplicationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Nigerian');
      }
    });
  });
});

describe('Browse Filters Schema', () => {
  describe('browseFiltersSchema', () => {
    it('should validate with all filters', () => {
      const validData = {
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        location_city: 'Lagos',
        search_query: 'tech services',
        sort_by: 'newest' as const,
        limit: 20,
        offset: 0,
      };

      const result = browseFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with minimal filters', () => {
      const validData = {
        sort_by: 'featured' as const,
      };

      const result = browseFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should use default values', () => {
      const validData = {};

      const result = browseFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort_by).toBe('newest');
      }
    });

    it('should reject search_query longer than 100 characters', () => {
      const invalidData = {
        search_query: 'a'.repeat(101),
        sort_by: 'newest' as const,
      };

      const result = browseFiltersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid sort_by value', () => {
      const invalidData = {
        sort_by: 'invalid',
      };

      const result = browseFiltersSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

describe('Reject Reason Schema', () => {
  describe('rejectReasonSchema', () => {
    it('should validate valid rejection reason', () => {
      const validData = {
        reason: 'This listing does not meet our quality standards.',
      };

      const result = rejectReasonSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject reason shorter than 10 characters', () => {
      const invalidData = {
        reason: 'Too short',
      };

      const result = rejectReasonSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('10 characters');
      }
    });

    it('should reject reason longer than 500 characters', () => {
      const invalidData = {
        reason: 'a'.repeat(501),
      };

      const result = rejectReasonSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('500 characters');
      }
    });
  });
});
