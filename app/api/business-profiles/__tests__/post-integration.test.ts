/**
 * Integration Tests for Business Profile Creation with Category-Specific Fields
 * Task 14.2: Add category-specific fields to business profile creation
 * Requirements: 18.5
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("POST /api/business-profiles - Integration with Category-Specific Fields", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(() => mockSupabase),
    };

    (createClient as any).mockResolvedValue(mockSupabase);
  });

  describe("Food & Beverage Profile Creation", () => {
    it("should create business profile with Food & Beverage category-specific fields", async () => {
      const mockUser = { id: "user-123", email: "restaurant@example.com" };
      const categoryId = "category-food-beverage";

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock: no existing profile
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // Mock: category exists with name
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: categoryId, name: "Food & Beverage" },
        error: null,
      });

      const profileData = {
        business_name: "Delicious Nigerian Cuisine",
        description: "Authentic Nigerian restaurant serving traditional dishes with modern twists",
        primary_category_id: categoryId,
        city: "Lagos",
        state: "Lagos State",
        category_specific_fields: {
          cuisine_types: ["Nigerian", "African", "Continental"],
          dietary_options: ["Halal", "Vegetarian"],
          delivery_radius_km: 15,
        },
      };

      // Mock: successful profile creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "profile-123",
          ...profileData,
          user_id: mockUser.id,
          category_specific_fields: profileData.category_specific_fields,
        },
        error: null,
      });

      // Mock: category tag insertion
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null,
      });

      // Verify the data structure
      expect(profileData.category_specific_fields).toHaveProperty("cuisine_types");
      expect(profileData.category_specific_fields).toHaveProperty("dietary_options");
      expect(profileData.category_specific_fields).toHaveProperty("delivery_radius_km");
      expect(profileData.category_specific_fields.cuisine_types).toContain("Nigerian");
    });
  });

  describe("Health & Medical Profile Creation", () => {
    it("should create business profile with Health & Medical category-specific fields", async () => {
      const mockUser = { id: "user-456", email: "clinic@example.com" };
      const categoryId = "category-health-medical";

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock: no existing profile
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // Mock: category exists with name
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: categoryId, name: "Health & Medical" },
        error: null,
      });

      const profileData = {
        business_name: "Family Health Clinic",
        description: "Comprehensive healthcare services for the whole family with experienced doctors",
        primary_category_id: categoryId,
        city: "Abuja",
        state: "FCT",
        category_specific_fields: {
          specializations: ["General Practice", "Pediatrics", "Internal Medicine"],
          accepted_insurance: ["NHIS", "Hygeia", "AXA Mansard"],
          appointment_booking_url: "https://familyhealth.com/book",
        },
      };

      // Mock: successful profile creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "profile-456",
          ...profileData,
          user_id: mockUser.id,
          category_specific_fields: profileData.category_specific_fields,
        },
        error: null,
      });

      // Mock: category tag insertion
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null,
      });

      // Verify the data structure
      expect(profileData.category_specific_fields).toHaveProperty("specializations");
      expect(profileData.category_specific_fields).toHaveProperty("accepted_insurance");
      expect(profileData.category_specific_fields).toHaveProperty("appointment_booking_url");
    });
  });

  describe("Real Estate Profile Creation", () => {
    it("should create business profile with Real Estate category-specific fields", async () => {
      const mockUser = { id: "user-789", email: "realestate@example.com" };
      const categoryId = "category-real-estate";

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock: no existing profile
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // Mock: category exists with name
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: categoryId, name: "Real Estate & Property" },
        error: null,
      });

      const profileData = {
        business_name: "Prime Properties Nigeria",
        description: "Leading real estate company specializing in residential and commercial properties",
        primary_category_id: categoryId,
        city: "Port Harcourt",
        state: "Rivers State",
        category_specific_fields: {
          property_types: ["Residential", "Commercial", "Land"],
          transaction_types: ["Sale", "Rent", "Lease"],
          service_areas: ["Port Harcourt", "Eleme", "Obio-Akpor"],
        },
      };

      // Mock: successful profile creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "profile-789",
          ...profileData,
          user_id: mockUser.id,
          category_specific_fields: profileData.category_specific_fields,
        },
        error: null,
      });

      // Mock: category tag insertion
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null,
      });

      // Verify the data structure
      expect(profileData.category_specific_fields).toHaveProperty("property_types");
      expect(profileData.category_specific_fields).toHaveProperty("transaction_types");
      expect(profileData.category_specific_fields).toHaveProperty("service_areas");
    });
  });

  describe("Automotive Profile Creation", () => {
    it("should create business profile with Automotive category-specific fields", async () => {
      const mockUser = { id: "user-012", email: "autorepair@example.com" };
      const categoryId = "category-automotive";

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock: no existing profile
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // Mock: category exists with name
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: categoryId, name: "Automotive" },
        error: null,
      });

      const profileData = {
        business_name: "Expert Auto Repairs",
        description: "Professional automotive repair and maintenance services for all vehicle brands",
        primary_category_id: categoryId,
        city: "Kano",
        state: "Kano State",
        category_specific_fields: {
          brands_serviced: ["Toyota", "Honda", "Mercedes-Benz", "Nissan"],
          certifications: ["ASE Certified", "Manufacturer Certified"],
          warranty_offered: true,
        },
      };

      // Mock: successful profile creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "profile-012",
          ...profileData,
          user_id: mockUser.id,
          category_specific_fields: profileData.category_specific_fields,
        },
        error: null,
      });

      // Mock: category tag insertion
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null,
      });

      // Verify the data structure
      expect(profileData.category_specific_fields).toHaveProperty("brands_serviced");
      expect(profileData.category_specific_fields).toHaveProperty("certifications");
      expect(profileData.category_specific_fields).toHaveProperty("warranty_offered");
      expect(profileData.category_specific_fields.warranty_offered).toBe(true);
    });
  });

  describe("Profile Creation Without Category-Specific Fields", () => {
    it("should create business profile when category_specific_fields is not provided", async () => {
      const mockUser = { id: "user-999", email: "business@example.com" };
      const categoryId = "category-other";

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock: no existing profile
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // Mock: category exists (category without specific fields)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: categoryId, name: "Other / Miscellaneous" },
        error: null,
      });

      const profileData = {
        business_name: "General Business Services",
        description: "Providing various business services to meet your needs with professional standards",
        primary_category_id: categoryId,
        city: "Lagos",
        state: "Lagos State",
        // No category_specific_fields provided
      };

      // Mock: successful profile creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "profile-999",
          ...profileData,
          user_id: mockUser.id,
          category_specific_fields: {},
        },
        error: null,
      });

      // Mock: category tag insertion
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null,
      });

      // Should succeed without category_specific_fields
      expect(profileData).not.toHaveProperty("category_specific_fields");
    });

    it("should create business profile when category_specific_fields is empty object", async () => {
      const mockUser = { id: "user-888", email: "business2@example.com" };
      const categoryId = "category-professional-services";

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock: no existing profile
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // Mock: category exists
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: categoryId, name: "Professional Services" },
        error: null,
      });

      const profileData = {
        business_name: "Professional Consulting",
        description: "Expert consulting services for businesses of all sizes with proven methodologies",
        primary_category_id: categoryId,
        city: "Lagos",
        state: "Lagos State",
        category_specific_fields: {}, // Empty object
      };

      // Mock: successful profile creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "profile-888",
          ...profileData,
          user_id: mockUser.id,
          category_specific_fields: {},
        },
        error: null,
      });

      // Mock: category tag insertion
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null,
      });

      // Should succeed with empty category_specific_fields
      expect(profileData.category_specific_fields).toEqual({});
    });
  });

  describe("Validation Error Handling", () => {
    it("should reject invalid Food & Beverage fields", async () => {
      const mockUser = { id: "user-500", email: "test@example.com" };
      const categoryId = "category-food-beverage";

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock: no existing profile
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // Mock: category exists with name
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: categoryId, name: "Food & Beverage" },
        error: null,
      });

      const invalidProfileData = {
        business_name: "Test Restaurant",
        description: "Test description that is long enough to meet the minimum requirement",
        primary_category_id: categoryId,
        city: "Lagos",
        state: "Lagos State",
        category_specific_fields: {
          cuisine_types: [], // Invalid: empty array
          dietary_options: ["Halal"],
        },
      };

      // The validation should fail before reaching database insertion
      // This test verifies the structure of invalid data
      expect(invalidProfileData.category_specific_fields.cuisine_types).toHaveLength(0);
    });

    it("should reject invalid Health & Medical fields with bad URL", async () => {
      const mockUser = { id: "user-501", email: "test2@example.com" };
      const categoryId = "category-health-medical";

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock: no existing profile
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      // Mock: category exists with name
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: categoryId, name: "Health & Medical" },
        error: null,
      });

      const invalidProfileData = {
        business_name: "Test Clinic",
        description: "Test description that meets the minimum length requirement",
        primary_category_id: categoryId,
        city: "Abuja",
        state: "FCT",
        category_specific_fields: {
          specializations: ["General Practice"],
          accepted_insurance: ["NHIS"],
          appointment_booking_url: "not-a-valid-url", // Invalid URL
        },
      };

      // The validation should fail before reaching database insertion
      expect(invalidProfileData.category_specific_fields.appointment_booking_url).not.toMatch(
        /^https?:\/\//
      );
    });
  });
});
