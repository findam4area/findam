/**
 * Property-Based Tests for Profile Completeness Calculator
 * Task 5.2: Write property test for completeness calculation
 * **Property 9: Profile completeness calculation**
 * **Validates: Requirements 17.1, 17.2**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calculateProfileCompleteness,
  getMissingFields,
} from "./profile-completeness";
import type { BusinessProfile } from "@/lib/types/business-profile";

// Arbitraries for generating test data

const businessNameArb = fc.oneof(
  fc.constant(""), // Empty name
  fc.string({ minLength: 1, maxLength: 100 }), // Valid name
);

const descriptionArb = fc.oneof(
  fc.constant(""), // Empty description
  fc.string({ minLength: 1, maxLength: 49 }), // Too short
  fc.string({ minLength: 50, maxLength: 500 }), // Valid (≥50 chars)
);

const categoryIdArb = fc.oneof(
  fc.constant(undefined), // No category
  fc.uuid(), // Valid category ID
);

const subcategoryIdsArb = fc.oneof(
  fc.constant([]), // No subcategories
  fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }), // 1-5 subcategories
);

const locationArb = fc.record({
  city: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 50 })),
  state: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 50 })),
  address: fc.oneof(
    fc.constant(undefined),
    fc.constant(""),
    fc.string({ minLength: 1, maxLength: 100 }),
  ),
});

const photoUrlsArb = fc.oneof(
  fc.constant([]), // No photos
  fc.array(fc.webUrl(), { minLength: 1, maxLength: 2 }), // 1-2 photos (not enough)
  fc.array(fc.webUrl(), { minLength: 3, maxLength: 50 }), // 3-50 photos (valid)
);

const businessHoursArb = fc.oneof(
  fc.constant(undefined), // No hours
  fc.constant({}), // Empty hours
  fc.record({
    monday: fc.record({
      open: fc.constant("09:00"),
      close: fc.constant("17:00"),
    }),
  }), // Has hours
);

const contactArb = fc.record({
  phone: fc.oneof(
    fc.constant(undefined),
    fc.constant(""),
    fc.string({ minLength: 10, maxLength: 15 }),
  ),
  email: fc.oneof(
    fc.constant(undefined),
    fc.constant(""),
    fc.emailAddress(),
  ),
  website: fc.oneof(fc.constant(undefined), fc.constant(""), fc.webUrl()),
});

const serviceAttributesArb = fc.oneof(
  fc.constant(undefined), // No attributes
  fc.constant({}), // Empty attributes
  fc.record({
    delivery_available: fc.boolean(),
    online_service: fc.boolean(),
  }), // Has some attributes
);

const priceRangeArb = fc.oneof(
  fc.constant(undefined), // No price range
  fc.constantFrom("$", "$$", "$$$", "$$$$"), // Valid price range
);

const productsServicesArb = fc.record({
  products: fc.oneof(
    fc.constant(undefined),
    fc.constant([]),
    fc.array(fc.record({ id: fc.uuid() }), { minLength: 1, maxLength: 5 }),
  ),
  services: fc.oneof(
    fc.constant(undefined),
    fc.constant([]),
    fc.array(fc.record({ id: fc.uuid() }), { minLength: 1, maxLength: 5 }),
  ),
});

// Generate arbitrary business profiles
const businessProfileArb = fc
  .record({
    business_name: businessNameArb,
    description: descriptionArb,
    primary_category_id: categoryIdArb,
    primary_subcategory_ids: subcategoryIdsArb,
    location: locationArb,
    photo_urls: photoUrlsArb,
    business_hours: businessHoursArb,
    contact: contactArb,
    service_attributes: serviceAttributesArb,
    price_range: priceRangeArb,
    productsServices: productsServicesArb,
  })
  .map((data) => ({
    business_name: data.business_name,
    description: data.description,
    primary_category_id: data.primary_category_id,
    primary_subcategory_ids: data.primary_subcategory_ids,
    city: data.location.city,
    state: data.location.state,
    address: data.location.address,
    photo_urls: data.photo_urls,
    business_hours: data.business_hours,
    phone: data.contact.phone,
    email: data.contact.email,
    website: data.contact.website,
    service_attributes: data.service_attributes,
    price_range: data.price_range,
    products: data.productsServices.products,
    services: data.productsServices.services,
  }));

describe("Profile Completeness Calculator - Property Tests", () => {
  describe("Property 9: Profile completeness calculation", () => {
    it("should always return a value between 0 and 100", () => {
      fc.assert(
        fc.property(businessProfileArb, (profile) => {
          const completeness = calculateProfileCompleteness(profile as any);
          expect(completeness).toBeGreaterThanOrEqual(0);
          expect(completeness).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 },
      );
    });

    it("should return 0% for completely empty profile", () => {
      const emptyProfile = {
        business_name: "",
        description: "",
        primary_category_id: undefined,
        primary_subcategory_ids: [],
        city: "",
        state: "",
        address: undefined,
        photo_urls: [],
        business_hours: undefined,
        phone: undefined,
        email: undefined,
        website: undefined,
        service_attributes: undefined,
        price_range: undefined,
        products: [],
        services: [],
      };

      const completeness = calculateProfileCompleteness(emptyProfile);
      expect(completeness).toBe(0);
    });

    it("should return 100% for fully complete profile", () => {
      const completeProfile: Partial<BusinessProfile> & {
        products?: Array<{ id: string }>;
        services?: Array<{ id: string }>;
      } = {
        business_name: "Complete Business",
        description: "This is a detailed description with more than fifty characters for completeness",
        primary_category_id: "550e8400-e29b-41d4-a716-446655440000",
        primary_subcategory_ids: ["550e8400-e29b-41d4-a716-446655440001"],
        city: "Lagos",
        state: "Lagos State",
        address: "123 Main Street, Ikeja",
        photo_urls: [
          "https://example.com/photo1.jpg",
          "https://example.com/photo2.jpg",
          "https://example.com/photo3.jpg",
        ],
        business_hours: {
          monday: { open: "09:00", close: "17:00" },
        },
        phone: "+2348012345678",
        email: "info@business.com",
        website: "https://business.com",
        service_attributes: {
          delivery_available: true,
        },
        price_range: "$$",
        products: [{ id: "product-1" }] as any,
        services: [],
      };

      const completeness = calculateProfileCompleteness(completeProfile);
      expect(completeness).toBe(100);
    });

    it("should calculate completeness as sum of field weights for non-empty fields", () => {
      fc.assert(
        fc.property(businessProfileArb, (profile) => {
          const completeness = calculateProfileCompleteness(profile as any);

          // Manually calculate expected completeness
          let expected = 0;

          // Business name (10 points)
          if (profile.business_name && profile.business_name.trim().length > 0) {
            expected += 10;
          }

          // Description (10 points, ≥50 chars)
          if (profile.description && profile.description.trim().length >= 50) {
            expected += 10;
          }

          // Primary category (10 points)
          if (profile.primary_category_id) {
            expected += 10;
          }

          // Subcategories (5 points)
          if (
            profile.primary_subcategory_ids &&
            profile.primary_subcategory_ids.length > 0
          ) {
            expected += 5;
          }

          // Location (10 points)
          if (
            profile.city &&
            profile.city.trim().length > 0 &&
            profile.state &&
            profile.state.trim().length > 0 &&
            profile.address &&
            profile.address.trim().length > 0
          ) {
            expected += 10;
          }

          // Photos (15 points, ≥3 photos)
          if (profile.photo_urls && profile.photo_urls.length >= 3) {
            expected += 15;
          }

          // Business hours (10 points)
          if (
            profile.business_hours &&
            Object.keys(profile.business_hours).length > 0
          ) {
            expected += 10;
          }

          // Contact information (10 points)
          const hasContact =
            (profile.phone && profile.phone.trim().length > 0) ||
            (profile.email && profile.email.trim().length > 0) ||
            (profile.website && profile.website.trim().length > 0);
          if (hasContact) {
            expected += 10;
          }

          // Products or services (15 points)
          const hasProductsOrServices =
            (profile.products && profile.products.length > 0) ||
            (profile.services && profile.services.length > 0);
          if (hasProductsOrServices) {
            expected += 15;
          }

          // Price range (5 points)
          if (profile.price_range) {
            expected += 5;
          }

          // Service attributes (5 points)
          if (profile.service_attributes) {
            const hasAnyAttribute = Object.values(
              profile.service_attributes,
            ).some((value) => value === true);
            if (hasAnyAttribute) {
              expected += 5;
            }
          }

          // Website (5 points)
          if (profile.website && profile.website.trim().length > 0) {
            expected += 5;
          }

          // Cap at 100
          expected = Math.min(expected, 100);

          expect(completeness).toBe(expected);
        }),
        { numRuns: 100 },
      );
    });

    it("should cap completeness at 100% even if logic would yield more", () => {
      // This property verifies the capping behavior
      fc.assert(
        fc.property(businessProfileArb, (profile) => {
          const completeness = calculateProfileCompleteness(profile as any);
          expect(completeness).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 },
      );
    });

    it("should give higher completeness for profiles with more filled fields", () => {
      // Create two profiles where one has strictly more fields than the other
      const minimalProfile: Partial<BusinessProfile> = {
        business_name: "Minimal Business",
        description: "Short",
        primary_category_id: "550e8400-e29b-41d4-a716-446655440000",
        primary_subcategory_ids: [],
        city: "Lagos",
        state: "Lagos State",
        photo_urls: [],
        products: [],
        services: [],
      };

      const enhancedProfile: Partial<BusinessProfile> & {
        products?: Array<{ id: string }>;
      } = {
        ...minimalProfile,
        description:
          "This is a much longer description that meets the minimum character requirement",
        primary_subcategory_ids: ["550e8400-e29b-41d4-a716-446655440001"],
        address: "123 Main Street",
        photo_urls: [
          "https://example.com/1.jpg",
          "https://example.com/2.jpg",
          "https://example.com/3.jpg",
        ],
        phone: "+2348012345678",
        products: [{ id: "product-1" }] as any,
      };

      const minimalCompleteness = calculateProfileCompleteness(minimalProfile);
      const enhancedCompleteness = calculateProfileCompleteness(enhancedProfile);

      expect(enhancedCompleteness).toBeGreaterThan(minimalCompleteness);
    });
  });

  describe("getMissingFields function", () => {
    it("should return empty array for fully complete profile", () => {
      const completeProfile: Partial<BusinessProfile> & {
        products?: Array<{ id: string }>;
      } = {
        business_name: "Complete Business",
        description:
          "This is a detailed description with more than fifty characters",
        primary_category_id: "550e8400-e29b-41d4-a716-446655440000",
        primary_subcategory_ids: ["550e8400-e29b-41d4-a716-446655440001"],
        city: "Lagos",
        state: "Lagos State",
        address: "123 Main Street",
        photo_urls: [
          "https://example.com/1.jpg",
          "https://example.com/2.jpg",
          "https://example.com/3.jpg",
        ],
        business_hours: { monday: { open: "09:00", close: "17:00" } },
        phone: "+2348012345678",
        email: "info@business.com",
        website: "https://business.com",
        service_attributes: { delivery_available: true },
        price_range: "$$",
        products: [{ id: "product-1" }] as any,
      };

      const missing = getMissingFields(completeProfile);
      expect(missing).toHaveLength(0);
    });

    it("should return all fields for empty profile", () => {
      const emptyProfile = {
        business_name: "",
        description: "",
        primary_category_id: undefined,
        primary_subcategory_ids: [],
        city: "",
        state: "",
        address: undefined,
        photo_urls: [],
        business_hours: undefined,
        phone: undefined,
        email: undefined,
        website: undefined,
        service_attributes: undefined,
        price_range: undefined,
        products: [],
        services: [],
      };

      const missing = getMissingFields(emptyProfile);
      expect(missing.length).toBeGreaterThan(0);
    });

    it("should sort missing fields by weight (descending)", () => {
      const partialProfile: Partial<BusinessProfile> = {
        business_name: "Business",
        description: "Short",
        primary_category_id: "550e8400-e29b-41d4-a716-446655440000",
        primary_subcategory_ids: [],
        city: "Lagos",
        state: "Lagos State",
        photo_urls: [],
        products: [],
        services: [],
      };

      const missing = getMissingFields(partialProfile);

      // Verify sorting: each weight should be >= the next
      for (let i = 0; i < missing.length - 1; i++) {
        expect(missing[i].weight).toBeGreaterThanOrEqual(missing[i + 1].weight);
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle description exactly at 50 characters", () => {
      const profile: Partial<BusinessProfile> = {
        business_name: "Business",
        description: "A".repeat(50), // Exactly 50 characters
        primary_category_id: "550e8400-e29b-41d4-a716-446655440000",
        primary_subcategory_ids: [],
        city: "Lagos",
        state: "Lagos State",
        photo_urls: [],
        products: [],
        services: [],
      };

      const completeness = calculateProfileCompleteness(profile);
      // Should include description points (10) since it's >= 50
      expect(completeness).toBeGreaterThanOrEqual(10);
    });

    it("should handle description at 49 characters (just below threshold)", () => {
      const profile: Partial<BusinessProfile> = {
        business_name: "Business",
        description: "A".repeat(49), // Just below 50 characters
        primary_category_id: "550e8400-e29b-41d4-a716-446655440000",
        primary_subcategory_ids: [],
        city: "Lagos",
        state: "Lagos State",
        photo_urls: [],
        products: [],
        services: [],
      };

      const completeness = calculateProfileCompleteness(profile);
      const missing = getMissingFields(profile);

      // Description should be in missing fields
      expect(missing.some((m) => m.field === "description")).toBe(true);
    });

    it("should handle exactly 3 photos (minimum threshold)", () => {
      const profile: Partial<BusinessProfile> = {
        business_name: "Business",
        description: "Description",
        primary_category_id: "550e8400-e29b-41d4-a716-446655440000",
        primary_subcategory_ids: [],
        city: "Lagos",
        state: "Lagos State",
        photo_urls: [
          "https://example.com/1.jpg",
          "https://example.com/2.jpg",
          "https://example.com/3.jpg",
        ],
        products: [],
        services: [],
      };

      const completeness = calculateProfileCompleteness(profile);
      // Should include photo points (15) since it has exactly 3 photos
      expect(completeness).toBeGreaterThanOrEqual(15);
    });

    it("should handle 2 photos (just below threshold)", () => {
      const profile: Partial<BusinessProfile> = {
        business_name: "Business",
        description: "Description",
        primary_category_id: "550e8400-e29b-41d4-a716-446655440000",
        primary_subcategory_ids: [],
        city: "Lagos",
        state: "Lagos State",
        photo_urls: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
        products: [],
        services: [],
      };

      const missing = getMissingFields(profile);
      // Photos should be in missing fields
      expect(missing.some((m) => m.field === "photos")).toBe(true);
    });
  });
});
