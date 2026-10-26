/**
 * Unit Tests for Category-Specific Fields in Business Profile Creation (POST)
 * Task 14.2: Add category-specific fields to business profile creation
 * Requirements: 18.5
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { validateCategoryFields } from "@/lib/schemas/category-fields";

describe("POST /api/business-profiles - Category-Specific Fields Validation", () => {
  describe("Food & Beverage Category Fields", () => {
    it("should validate valid Food & Beverage fields", () => {
      const validFields = {
        cuisine_types: ["Nigerian", "Continental", "Chinese"],
        dietary_options: ["Vegetarian", "Halal", "Vegan"],
        delivery_radius_km: 10,
      };

      const result = validateCategoryFields("Food & Beverage", validFields);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validFields);
      expect(result.error).toBeUndefined();
    });

    it("should reject Food & Beverage fields with empty cuisine_types", () => {
      const invalidFields = {
        cuisine_types: [],
        dietary_options: ["Vegetarian"],
        delivery_radius_km: 10,
      };

      const result = validateCategoryFields("Food & Beverage", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.errors[0].message).toContain("At least one cuisine type");
    });

    it("should reject Food & Beverage fields with negative delivery radius", () => {
      const invalidFields = {
        cuisine_types: ["Nigerian"],
        dietary_options: ["Halal"],
        delivery_radius_km: -5,
      };

      const result = validateCategoryFields("Food & Beverage", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject Food & Beverage fields with delivery radius exceeding 100km", () => {
      const invalidFields = {
        cuisine_types: ["Nigerian"],
        dietary_options: ["Halal"],
        delivery_radius_km: 150,
      };

      const result = validateCategoryFields("Food & Beverage", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.errors[0].message).toContain("cannot exceed 100km");
    });

    it("should accept Food & Beverage fields without optional delivery radius", () => {
      const validFields = {
        cuisine_types: ["Nigerian", "Italian"],
        dietary_options: [],
      };

      const result = validateCategoryFields("Food & Beverage", validFields);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe("Health & Medical Category Fields", () => {
    it("should validate valid Health & Medical fields", () => {
      const validFields = {
        specializations: ["General Practice", "Pediatrics", "Cardiology"],
        accepted_insurance: ["NHIS", "Hygeia", "AXA Mansard"],
        appointment_booking_url: "https://example.com/book",
      };

      const result = validateCategoryFields("Health & Medical", validFields);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validFields);
    });

    it("should reject Health & Medical fields with empty specializations", () => {
      const invalidFields = {
        specializations: [],
        accepted_insurance: ["NHIS"],
      };

      const result = validateCategoryFields("Health & Medical", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.errors[0].message).toContain("At least one specialization");
    });

    it("should reject Health & Medical fields with invalid URL", () => {
      const invalidFields = {
        specializations: ["General Practice"],
        accepted_insurance: ["NHIS"],
        appointment_booking_url: "not-a-valid-url",
      };

      const result = validateCategoryFields("Health & Medical", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.errors[0].message).toContain("valid URL");
    });

    it("should accept Health & Medical fields without optional appointment URL", () => {
      const validFields = {
        specializations: ["Dentistry", "Orthodontics"],
        accepted_insurance: [],
      };

      const result = validateCategoryFields("Health & Medical", validFields);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe("Real Estate & Property Category Fields", () => {
    it("should validate valid Real Estate fields", () => {
      const validFields = {
        property_types: ["Residential", "Commercial", "Land"],
        transaction_types: ["Sale", "Rent", "Lease"],
        service_areas: ["Lekki", "Victoria Island", "Ikoyi"],
      };

      const result = validateCategoryFields("Real Estate & Property", validFields);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validFields);
    });

    it("should reject Real Estate fields with empty property types", () => {
      const invalidFields = {
        property_types: [],
        transaction_types: ["Sale"],
        service_areas: ["Lagos"],
      };

      const result = validateCategoryFields("Real Estate & Property", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.errors[0].message).toContain("At least one property type");
    });

    it("should reject Real Estate fields with empty transaction types", () => {
      const invalidFields = {
        property_types: ["Residential"],
        transaction_types: [],
        service_areas: ["Lagos"],
      };

      const result = validateCategoryFields("Real Estate & Property", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject Real Estate fields with empty service areas", () => {
      const invalidFields = {
        property_types: ["Commercial"],
        transaction_types: ["Rent"],
        service_areas: [],
      };

      const result = validateCategoryFields("Real Estate & Property", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Automotive Category Fields", () => {
    it("should validate valid Automotive fields", () => {
      const validFields = {
        brands_serviced: ["Toyota", "Honda", "Mercedes-Benz", "Innoson"],
        certifications: ["ASE Certified", "Manufacturer Certified"],
        warranty_offered: true,
      };

      const result = validateCategoryFields("Automotive", validFields);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validFields);
    });

    it("should reject Automotive fields with empty brands", () => {
      const invalidFields = {
        brands_serviced: [],
        certifications: ["ASE Certified"],
        warranty_offered: true,
      };

      const result = validateCategoryFields("Automotive", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.errors[0].message).toContain("At least one brand");
    });

    it("should accept Automotive fields with empty certifications array", () => {
      const validFields = {
        brands_serviced: ["Toyota", "Nissan"],
        certifications: [],
        warranty_offered: false,
      };

      const result = validateCategoryFields("Automotive", validFields);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should require warranty_offered as boolean", () => {
      const invalidFields = {
        brands_serviced: ["Toyota"],
        certifications: [],
        warranty_offered: "yes", // Invalid: should be boolean
      };

      const result = validateCategoryFields("Automotive", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Unknown Category Handling", () => {
    it("should handle unknown category names gracefully", () => {
      const fields = {
        some_field: "value",
      };

      expect(() => {
        validateCategoryFields("Unknown Category", fields);
      }).toThrow("Unknown category");
    });
  });

  describe("Field Type Validation", () => {
    it("should reject fields with incorrect types", () => {
      const invalidFields = {
        cuisine_types: "Nigerian", // Should be array, not string
        dietary_options: ["Vegetarian"],
      };

      const result = validateCategoryFields("Food & Beverage", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject extra fields not defined in schema", () => {
      const invalidFields = {
        cuisine_types: ["Nigerian"],
        dietary_options: ["Halal"],
        extra_field: "should not be here", // Not in schema
      };

      const result = validateCategoryFields("Food & Beverage", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Array Length Validation", () => {
    it("should reject too many cuisine types (max 10)", () => {
      const invalidFields = {
        cuisine_types: [
          "Type1",
          "Type2",
          "Type3",
          "Type4",
          "Type5",
          "Type6",
          "Type7",
          "Type8",
          "Type9",
          "Type10",
          "Type11", // 11th item exceeds limit
        ],
        dietary_options: [],
      };

      const result = validateCategoryFields("Food & Beverage", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.errors[0].message).toContain("Maximum 10");
    });

    it("should reject too many specializations (max 20)", () => {
      const specializations = Array.from({ length: 21 }, (_, i) => `Spec${i + 1}`);
      const invalidFields = {
        specializations,
        accepted_insurance: [],
      };

      const result = validateCategoryFields("Health & Medical", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.errors[0].message).toContain("Maximum 20");
    });
  });

  describe("String Length Validation", () => {
    it("should reject empty strings in arrays", () => {
      const invalidFields = {
        cuisine_types: ["Nigerian", ""], // Empty string not allowed
        dietary_options: [],
      };

      const result = validateCategoryFields("Food & Beverage", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject strings exceeding maximum length", () => {
      const longString = "A".repeat(101); // Exceeds 100 char limit for specializations
      const invalidFields = {
        specializations: [longString],
        accepted_insurance: [],
      };

      const result = validateCategoryFields("Health & Medical", invalidFields);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
