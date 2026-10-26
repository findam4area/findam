/**
 * Type Definitions Tests
 * 
 * Unit tests to verify TypeScript type definitions work correctly
 * 
 * Task: 1.3 Create core TypeScript type definitions
 */

import { describe, it, expect } from 'vitest';
import {
  // Database types
  type DbListing,
  type DbUser,
  type DbVehicle,
  type DbTransaction,
  isDbListing,
  isDbUser,
  isDbVehicle,
  // Enum types
  ListingStatus,
  TransactionStatus,
  VendorApplicationStatus,
  LISTING_STATUSES,
  TRANSACTION_STATUSES,
  isListingStatus,
  isTransactionStatus,
  validateImageCount,
  validatePassword,
  validateEmail,
  validateNigerianPhone,
  // API types
  type ApiResponse,
  type CreateListingRequest,
  type LoginRequest,
  isApiError,
  isApiSuccess,
} from '../index';

describe('Database Type Definitions', () => {
  it('should validate DbListing type guard correctly', () => {
    const validListing: DbListing = {
      id: '123',
      title: 'Test Listing',
      description: 'Test description',
      price: 1000,
      category_id: 'cat-123',
      user_id: 'user-123',
      location_state: 'Lagos',
      location_city: 'Ikeja',
      images: ['image1.jpg', 'image2.jpg'],
      primary_image_index: 0,
      is_featured: false,
      status: 'pending',
      rejection_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(isDbListing(validListing)).toBe(true);
    expect(isDbListing({})).toBe(false);
    expect(isDbListing(null)).toBe(false);
  });

  it('should validate DbUser type guard correctly', () => {
    const validUser: DbUser = {
      id: 'user-123',
      email: 'test@example.com',
      phone: '+2348012345678',
      full_name: 'Test User',
      avatar_url: null,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(isDbUser(validUser)).toBe(true);
    expect(isDbUser({})).toBe(false);
  });

  it('should validate DbVehicle type guard correctly', () => {
    const validVehicle: DbVehicle = {
      id: 'vehicle-123',
      listing_id: 'listing-123',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      mileage: 50000,
      fuel_type: 'petrol',
      transmission: 'automatic',
      body_type: 'sedan',
      color: 'black',
      condition: 'used',
      vin: null,
      engine_size: '2.5L',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(isDbVehicle(validVehicle)).toBe(true);
    expect(isDbVehicle({})).toBe(false);
  });
});

describe('Enum Type Definitions', () => {
  it('should define ListingStatus enum correctly', () => {
    expect(ListingStatus.PENDING).toBe('pending');
    expect(ListingStatus.APPROVED).toBe('approved');
    expect(ListingStatus.REJECTED).toBe('rejected');
  });

  it('should define TransactionStatus enum correctly', () => {
    expect(TransactionStatus.PENDING).toBe('pending');
    expect(TransactionStatus.COMPLETED).toBe('completed');
    expect(TransactionStatus.CANCELLED).toBe('cancelled');
    expect(TransactionStatus.REFUNDED).toBe('refunded');
  });

  it('should validate listing status type guard', () => {
    expect(isListingStatus('pending')).toBe(true);
    expect(isListingStatus('approved')).toBe(true);
    expect(isListingStatus('rejected')).toBe(true);
    expect(isListingStatus('invalid')).toBe(false);
  });

  it('should validate transaction status type guard', () => {
    expect(isTransactionStatus('pending')).toBe(true);
    expect(isTransactionStatus('completed')).toBe(true);
    expect(isTransactionStatus('invalid')).toBe(false);
  });

  it('should validate image count correctly', () => {
    expect(validateImageCount(1)).toBe(true);
    expect(validateImageCount(3)).toBe(true);
    expect(validateImageCount(5)).toBe(true);
    expect(validateImageCount(0)).toBe(false);
    expect(validateImageCount(6)).toBe(false);
  });

  it('should validate password correctly', () => {
    const validPassword = validatePassword('Password123');
    expect(validPassword.valid).toBe(true);
    expect(validPassword.errors).toHaveLength(0);

    const invalidPassword = validatePassword('weak');
    expect(invalidPassword.valid).toBe(false);
    expect(invalidPassword.errors.length).toBeGreaterThan(0);
  });

  it('should validate email correctly', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
  });

  it('should validate Nigerian phone number correctly', () => {
    expect(validateNigerianPhone('+2348012345678')).toBe(true);
    expect(validateNigerianPhone('08012345678')).toBe(true);
    expect(validateNigerianPhone('07012345678')).toBe(true);
    expect(validateNigerianPhone('09012345678')).toBe(true);
    expect(validateNigerianPhone('1234567890')).toBe(false);
    expect(validateNigerianPhone('0612345678')).toBe(false);
  });
});

describe('API Type Definitions', () => {
  it('should validate CreateListingRequest type', () => {
    const validRequest: CreateListingRequest = {
      title: 'Test Listing',
      description: 'This is a test listing description with enough characters',
      price: 1000,
      category_id: 'cat-123',
      location_state: 'Lagos',
      location_city: 'Ikeja',
      images: ['image1.jpg', 'image2.jpg'],
      primary_image_index: 0,
    };

    expect(validRequest.images.length).toBeGreaterThan(0);
    expect(validRequest.images.length).toBeLessThanOrEqual(5);
  });

  it('should validate LoginRequest type', () => {
    const validRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'Password123',
    };

    expect(validRequest.email).toBeTruthy();
    expect(validRequest.password).toBeTruthy();
  });

  it('should validate ApiError type guard', () => {
    const error = {
      success: false,
      error: 'Something went wrong',
    };

    const success = {
      success: true,
      data: { id: '123' },
    };

    expect(isApiError(error)).toBe(true);
    expect(isApiError(success)).toBe(false);
  });

  it('should validate ApiSuccess type guard', () => {
    const success = {
      success: true,
      data: { id: '123' },
    };

    const error = {
      success: false,
      error: 'Something went wrong',
    };

    expect(isApiSuccess(success)).toBe(true);
    expect(isApiSuccess(error)).toBe(false);
  });
});

describe('Type Exports', () => {
  it('should export all database types', () => {
    expect(LISTING_STATUSES).toBeDefined();
    expect(TRANSACTION_STATUSES).toBeDefined();
  });

  it('should export all enum constants', () => {
    expect(ListingStatus).toBeDefined();
    expect(TransactionStatus).toBeDefined();
    expect(VendorApplicationStatus).toBeDefined();
  });

  it('should export all validation functions', () => {
    expect(typeof validateImageCount).toBe('function');
    expect(typeof validatePassword).toBe('function');
    expect(typeof validateEmail).toBe('function');
    expect(typeof validateNigerianPhone).toBe('function');
  });
});
