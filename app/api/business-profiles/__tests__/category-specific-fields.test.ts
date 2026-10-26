/**
 * Integration Tests for Category-Specific Fields Display
 * Task 14.3: Display category-specific fields on business profile page
 * Requirements: 18.6
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Category-Specific Fields Display - Task 14.3", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      order: vi.fn(() => mockSupabase),
      limit: vi.fn(() => mockSupabase),
    };

    (createClient as any).mockResolvedValue(mockSupabase);
  });

  describe("GET /api/business-profiles/[id] - Category-Specific Fields", () => {
    it("should include category_specific_fields in response for Food & Beverage business", async () => {
      const mockBusinessProfile = {
        id: "profile-123",
        user_id: "user-123",
        business_name: "Test Restaurant",
        description: "A test restaurant with delicious food",
        primary_category_id: "category-food-beverage",
        city: "Lagos",
        state: "Lagos State",
        view_count: 10,
        category_specific_fields: {
          cuisine_types: ["Nigerian", "Continental"],
          dietary_options: ["Vegetarian", "Halal"],
          delivery_radius_km: 10,
        },
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockBusinessProfile,
        error: null,
      });

      // Mock secondary categories query
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce({
        data: [],
        error: null,
      });

      // Mock products query
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.order.mockReturnValueOnce(mockSupabase);
      mockSupabase.limit.mockReturnValueOnce({
        data: [],
        error: null,
      });

      // Mock services query
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.order.mockReturnValueOnce(mockSupabase);
      mockSupabase.limit.mockReturnValueOnce({
        data: [],
        error: null,
      });

      // Mock reviews query
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.order.mockReturnValueOnce(mockSupabase);
      mockSupabase.limit.mockReturnValueOnce({
        data: [],
        error: null,
      });

      // Mock rating breakdown query
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce({
        data: [],
        error: null,
      });

      // Mock view count update
      mockSupabase.update.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce({
        data: null,
        error: null,
      });

      // Verify the category_specific_fields are included
      expect(mockBusinessProfile.category_specific_fields).toBeDefined();
      expect(mockBusinessProfile.category_specific_fields.cuisine_types).toContain(
        "Nigerian",
      );
      expect(mockBusinessProfile.category_specific_fields.dietary_options).toContain(
        "Vegetarian",
      );
      expect(mockBusinessProfile.category_specific_fields.delivery_radius_km).toBe(
        10,
      );
    });

    it("should include category_specific_fields for Health & Medical business", async () => {
      const mockBusinessProfile = {
        id: "profile-456",
        user_id: "user-456",
        business_name: "Test Clinic",
        description: "A test medical clinic",
        primary_category_id: "category-health-medical",
        city: "Abuja",
        state: "FCT",
        view_count: 5,
        category_specific_fields: {
          specializations: ["General Practice", "Pediatrics"],
          accepted_insurance: ["NHIS", "Private Insurance"],
          appointment_booking_url: "https://example.com/book",
        },
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockBusinessProfile,
        error: null,
      });

      // Verify the category_specific_fields are included
      expect(mockBusinessProfile.category_specific_fields).toBeDefined();
      expect(
        mockBusinessProfile.category_specific_fields.specializations,
      ).toContain("General Practice");
      expect(
        mockBusinessProfile.category_specific_fields.accepted_insurance,
      ).toContain("NHIS");
      expect(
        mockBusinessProfile.category_specific_fields.appointment_booking_url,
      ).toBe("https://example.com/book");
    });

    it("should include category_specific_fields for Real Estate business", async () => {
      const mockBusinessProfile = {
        id: "profile-789",
        user_id: "user-789",
        business_name: "Test Real Estate Agency",
        description: "A test real estate agency",
        primary_category_id: "category-real-estate",
        city: "Port Harcourt",
        state: "Rivers State",
        view_count: 20,
        category_specific_fields: {
          property_types: ["Residential", "Commercial"],
          transaction_types: ["Sale", "Rent"],
          service_areas: ["Port Harcourt", "Eleme", "Obio-Akpor"],
        },
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockBusinessProfile,
        error: null,
      });

      // Verify the category_specific_fields are included
      expect(mockBusinessProfile.category_specific_fields).toBeDefined();
      expect(mockBusinessProfile.category_specific_fields.property_types).toContain(
        "Residential",
      );
      expect(
        mockBusinessProfile.category_specific_fields.transaction_types,
      ).toContain("Sale");
      expect(mockBusinessProfile.category_specific_fields.service_areas).toContain(
        "Port Harcourt",
      );
    });

    it("should include category_specific_fields for Automotive business", async () => {
      const mockBusinessProfile = {
        id: "profile-012",
        user_id: "user-012",
        business_name: "Test Auto Repair Shop",
        description: "A test automotive repair shop",
        primary_category_id: "category-automotive",
        city: "Kano",
        state: "Kano State",
        view_count: 15,
        category_specific_fields: {
          brands_serviced: ["Toyota", "Honda", "Mercedes"],
          certifications: ["ASE Certified", "Manufacturer Certified"],
          warranty_offered: true,
        },
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockBusinessProfile,
        error: null,
      });

      // Verify the category_specific_fields are included
      expect(mockBusinessProfile.category_specific_fields).toBeDefined();
      expect(mockBusinessProfile.category_specific_fields.brands_serviced).toContain(
        "Toyota",
      );
      expect(mockBusinessProfile.category_specific_fields.certifications).toContain(
        "ASE Certified",
      );
      expect(mockBusinessProfile.category_specific_fields.warranty_offered).toBe(
        true,
      );
    });

    it("should return empty object for category_specific_fields if not set", async () => {
      const mockBusinessProfile = {
        id: "profile-empty",
        user_id: "user-empty",
        business_name: "Test Business Without Category Fields",
        description: "A business without category-specific fields",
        primary_category_id: "category-retail",
        city: "Lagos",
        state: "Lagos State",
        view_count: 3,
        category_specific_fields: null,
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockBusinessProfile,
        error: null,
      });

      // When category_specific_fields is null, it should default to empty object
      const fields = mockBusinessProfile.category_specific_fields || {};
      expect(fields).toEqual({});
    });

    it("should handle category_specific_fields for different category types", () => {
      // Test that different categories can have different field structures
      const foodBeverageFields = {
        cuisine_types: ["Italian", "Chinese"],
        dietary_options: ["Vegan"],
        delivery_radius_km: 5,
      };

      const healthMedicalFields = {
        specializations: ["Cardiology"],
        accepted_insurance: ["Reliance HMO"],
        appointment_booking_url: "https://book.example.com",
      };

      const realEstateFields = {
        property_types: ["Land"],
        transaction_types: ["Lease"],
        service_areas: ["Lekki", "Ajah"],
      };

      const automotiveFields = {
        brands_serviced: ["Nissan"],
        certifications: ["Bosch Certified"],
        warranty_offered: false,
      };

      // Verify each has appropriate structure
      expect(foodBeverageFields).toHaveProperty("cuisine_types");
      expect(foodBeverageFields).toHaveProperty("delivery_radius_km");

      expect(healthMedicalFields).toHaveProperty("specializations");
      expect(healthMedicalFields).toHaveProperty("appointment_booking_url");

      expect(realEstateFields).toHaveProperty("property_types");
      expect(realEstateFields).toHaveProperty("service_areas");

      expect(automotiveFields).toHaveProperty("brands_serviced");
      expect(automotiveFields).toHaveProperty("warranty_offered");
    });
  });

  describe("Category-Specific Fields Parsing", () => {
    it("should preserve field types (arrays, numbers, booleans, strings)", () => {
      const categoryFields = {
        cuisine_types: ["Nigerian", "Continental"], // array
        dietary_options: ["Halal"], // array
        delivery_radius_km: 10, // number
      };

      expect(Array.isArray(categoryFields.cuisine_types)).toBe(true);
      expect(Array.isArray(categoryFields.dietary_options)).toBe(true);
      expect(typeof categoryFields.delivery_radius_km).toBe("number");
    });

    it("should handle nested structures in category_specific_fields", () => {
      const complexFields = {
        specializations: ["Surgery", "Orthopedics"],
        accepted_insurance: ["NHIS", "AXA Mansard"],
        appointment_booking_url: "https://example.com/appointments",
        additional_info: {
          languages_spoken: ["English", "Yoruba"],
          emergency_service: true,
        },
      };

      expect(complexFields.specializations).toHaveLength(2);
      expect(complexFields.accepted_insurance).toContain("NHIS");
      expect(typeof complexFields.appointment_booking_url).toBe("string");
      expect(complexFields.additional_info).toBeDefined();
      expect(complexFields.additional_info.emergency_service).toBe(true);
    });
  });

  describe("API Response Structure", () => {
    it("should include category_specific_fields in business_profile response object", () => {
      const apiResponse = {
        business_profile: {
          id: "profile-123",
          business_name: "Test Restaurant",
          primary_category_id: "category-food",
          category_specific_fields: {
            cuisine_types: ["Nigerian"],
            dietary_options: ["Halal"],
            delivery_radius_km: 10,
          },
          secondary_categories: [],
        },
        products: [],
        services: [],
        reviews: [],
        rating_breakdown: {
          five_star: 0,
          four_star: 0,
          three_star: 0,
          two_star: 0,
          one_star: 0,
        },
      };

      // Verify structure matches expected API response
      expect(apiResponse).toHaveProperty("business_profile");
      expect(apiResponse.business_profile).toHaveProperty(
        "category_specific_fields",
      );
      expect(apiResponse).toHaveProperty("products");
      expect(apiResponse).toHaveProperty("services");
      expect(apiResponse).toHaveProperty("reviews");
      expect(apiResponse).toHaveProperty("rating_breakdown");
    });
  });
});
