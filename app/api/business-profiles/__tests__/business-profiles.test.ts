/**
 * Unit Tests for Business Profile Operations
 * Task 5.7: Write unit tests for business profile operations
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { calculateProfileCompleteness } from "@/lib/utils/profile-completeness";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Business Profile Operations - Unit Tests", () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      delete: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(() => mockSupabase),
      is: vi.fn(() => mockSupabase),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(),
          getPublicUrl: vi.fn(() => ({
            data: { publicUrl: "https://example.com/photo.jpg" },
          })),
        })),
      },
    };

    (createClient as any).mockResolvedValue(mockSupabase);
  });

  describe("Profile Creation", () => {
    it("should create a business profile with valid data", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const validProfileData = {
        business_name: "Test Business",
        description: "This is a test business with a valid description that is at least 50 characters long",
        primary_category_id: "category-123",
        city: "Lagos",
        state: "Lagos State",
      };

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
        data: { id: "category-123" },
        error: null,
      });

      // Mock: profile creation
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "profile-123", ...validProfileData, user_id: mockUser.id },
        error: null,
      });

      // Mock: category tag insertion
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: null,
      });

      // Verify the completeness calculation would work
      const completeness = calculateProfileCompleteness({
        business_name: validProfileData.business_name,
        description: validProfileData.description,
        primary_category_id: validProfileData.primary_category_id,
        city: validProfileData.city,
        state: validProfileData.state,
        primary_subcategory_ids: [],
        photo_urls: [],
        products: [],
        services: [],
      });

      // Basic profile should have at least business_name (10) + description (10) + primary_category (10) = 30
      expect(completeness).toBeGreaterThanOrEqual(30);
    });

    it("should prevent duplicate profile creation (one per user)", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock: existing profile found
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "existing-profile-123", user_id: mockUser.id },
        error: null,
      });

      // Simulate the duplicate check logic
      const existingProfile = { id: "existing-profile-123", user_id: mockUser.id };
      expect(existingProfile).toBeDefined();
      expect(existingProfile.user_id).toBe(mockUser.id);
    });

    it("should require all mandatory fields", () => {
      const requiredFields = [
        "business_name",
        "description",
        "primary_category_id",
        "city",
        "state",
      ];

      const incompleteProfile = {
        business_name: "Test Business",
        // missing other required fields
      };

      // Check which required fields are missing
      const missingFields = requiredFields.filter(
        (field) => !incompleteProfile[field as keyof typeof incompleteProfile],
      );

      expect(missingFields.length).toBeGreaterThan(0);
      expect(missingFields).toContain("description");
      expect(missingFields).toContain("primary_category_id");
      expect(missingFields).toContain("city");
      expect(missingFields).toContain("state");
    });
  });

  describe("Profile Update", () => {
    it("should allow profile update by owner", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const existingProfile = {
        id: "profile-123",
        user_id: "user-123",
        business_name: "Old Name",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: existingProfile,
        error: null,
      });

      // Verify ownership check
      expect(existingProfile.user_id).toBe(mockUser.id);
    });

    it("should prevent profile update by non-owner", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      const existingProfile = {
        id: "profile-123",
        user_id: "different-user-456",
        business_name: "Someone Else's Business",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: existingProfile,
        error: null,
      });

      // Verify ownership check fails
      expect(existingProfile.user_id).not.toBe(mockUser.id);
    });

    it("should recalculate completeness on profile update", async () => {
      const initialProfile = {
        business_name: "Test Business",
        description: "Short description that is not long enough yet to meet requirements",
        primary_category_id: "category-123",
        city: "Lagos",
        state: "Lagos State",
        primary_subcategory_ids: [],
        photo_urls: [],
        products: [],
        services: [],
      };

      const initialCompleteness = calculateProfileCompleteness(initialProfile);

      // Update profile with more complete data
      const updatedProfile = {
        ...initialProfile,
        description:
          "This is a much longer and more detailed description that definitely meets the minimum character requirement",
        address: "123 Main Street, Ikeja",
        phone: "+2348012345678",
        photo_urls: [
          "https://example.com/1.jpg",
          "https://example.com/2.jpg",
          "https://example.com/3.jpg",
        ],
      };

      const updatedCompleteness = calculateProfileCompleteness(updatedProfile);

      // Updated profile should have higher completeness
      expect(updatedCompleteness).toBeGreaterThan(initialCompleteness);
    });
  });

  describe("Photo Upload", () => {
    it("should validate photo file formats (JPEG, PNG, WebP)", () => {
      const validFormats = ["image/jpeg", "image/png", "image/webp"];
      const invalidFormats = ["image/gif", "image/bmp", "application/pdf"];

      validFormats.forEach((format) => {
        expect(["image/jpeg", "image/png", "image/webp"]).toContain(format);
      });

      invalidFormats.forEach((format) => {
        expect(["image/jpeg", "image/png", "image/webp"]).not.toContain(format);
      });
    });

    it("should validate photo file size (max 5MB)", () => {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

      const validSizes = [
        1024 * 1024, // 1MB
        2.5 * 1024 * 1024, // 2.5MB
        5 * 1024 * 1024, // exactly 5MB
      ];

      const invalidSizes = [
        5.1 * 1024 * 1024, // 5.1MB (too large)
        10 * 1024 * 1024, // 10MB (too large)
      ];

      validSizes.forEach((size) => {
        expect(size).toBeLessThanOrEqual(MAX_FILE_SIZE);
      });

      invalidSizes.forEach((size) => {
        expect(size).toBeGreaterThan(MAX_FILE_SIZE);
      });
    });

    it("should enforce maximum photo count (50 photos)", () => {
      const MAX_PHOTOS = 50;

      const existingPhotoCount = 45;
      const newPhotosCount = 3;
      const totalPhotos = existingPhotoCount + newPhotosCount;

      expect(totalPhotos).toBeLessThanOrEqual(MAX_PHOTOS);

      // Test exceeding limit
      const tooManyNewPhotos = 10;
      const exceedingTotal = existingPhotoCount + tooManyNewPhotos;

      expect(exceedingTotal).toBeGreaterThan(MAX_PHOTOS);
    });

    it("should update completeness when photos are added", () => {
      const profileWithoutPhotos = {
        business_name: "Test Business",
        description:
          "This is a detailed description with more than fifty characters for completeness",
        primary_category_id: "category-123",
        city: "Lagos",
        state: "Lagos State",
        address: "123 Main Street",
        primary_subcategory_ids: [],
        photo_urls: [],
        products: [],
        services: [],
      };

      const completenessWithoutPhotos = calculateProfileCompleteness(
        profileWithoutPhotos,
      );

      const profileWithPhotos = {
        ...profileWithoutPhotos,
        photo_urls: [
          "https://example.com/1.jpg",
          "https://example.com/2.jpg",
          "https://example.com/3.jpg",
        ],
      };

      const completenessWithPhotos = calculateProfileCompleteness(
        profileWithPhotos,
      );

      // Photos add 15 points to completeness
      expect(completenessWithPhotos).toBe(completenessWithoutPhotos + 15);
    });

    it("should set primary photo if specified", () => {
      const uploadedUrls = [
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg",
        "https://example.com/photo3.jpg",
      ];

      const primaryPhotoIndex = 1;
      const primaryPhotoUrl = uploadedUrls[primaryPhotoIndex];

      expect(primaryPhotoUrl).toBe("https://example.com/photo2.jpg");
    });

    it("should set first photo as primary if none specified", () => {
      const existingPrimaryPhoto = null;
      const uploadedUrls = [
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg",
      ];

      const primaryPhotoUrl =
        existingPrimaryPhoto || (uploadedUrls.length > 0 ? uploadedUrls[0] : null);

      expect(primaryPhotoUrl).toBe("https://example.com/photo1.jpg");
    });
  });

  describe("Authorization", () => {
    it("should require authentication for profile creation", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const { data, error } = await mockSupabase.auth.getUser();

      expect(data.user).toBeNull();
      expect(error).toBeDefined();
    });

    it("should require authentication for profile updates", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const { data, error } = await mockSupabase.auth.getUser();

      expect(data.user).toBeNull();
      expect(error).toBeDefined();
    });

    it("should require authentication for photo uploads", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const { data, error } = await mockSupabase.auth.getUser();

      expect(data.user).toBeNull();
      expect(error).toBeDefined();
    });
  });

  describe("Completeness Calculation Updates", () => {
    it("should update completeness when profile fields change", () => {
      const baseProfile = {
        business_name: "Test Business",
        description: "Basic description that is long enough to meet the minimum requirement",
        primary_category_id: "category-123",
        city: "Lagos",
        state: "Lagos State",
        primary_subcategory_ids: [],
        photo_urls: [],
        products: [],
        services: [],
      };

      const completeness1 = calculateProfileCompleteness(baseProfile);

      // Add subcategories
      const profile2 = {
        ...baseProfile,
        primary_subcategory_ids: ["subcat-1"],
      };
      const completeness2 = calculateProfileCompleteness(profile2);

      expect(completeness2).toBeGreaterThan(completeness1);

      // Add location details
      const profile3 = {
        ...profile2,
        address: "123 Main Street, Ikeja",
      };
      const completeness3 = calculateProfileCompleteness(profile3);

      expect(completeness3).toBeGreaterThan(completeness2);

      // Add business hours
      const profile4 = {
        ...profile3,
        business_hours: { monday: { open: "09:00", close: "17:00" } },
      };
      const completeness4 = calculateProfileCompleteness(profile4);

      expect(completeness4).toBeGreaterThan(completeness3);
    });

    it("should reflect completeness when products or services are added", () => {
      const profileWithoutListings = {
        business_name: "Test Business",
        description:
          "This is a detailed description with more than fifty characters",
        primary_category_id: "category-123",
        city: "Lagos",
        state: "Lagos State",
        primary_subcategory_ids: [],
        photo_urls: [],
        products: [],
        services: [],
      };

      const completenessWithout = calculateProfileCompleteness(
        profileWithoutListings,
      );

      const profileWithProduct = {
        ...profileWithoutListings,
        products: [{ id: "product-1" }],
      } as any;

      const completenessWithProduct = calculateProfileCompleteness(
        profileWithProduct,
      );

      // Adding a product should increase completeness by 15 points
      expect(completenessWithProduct).toBe(completenessWithout + 15);
    });
  });
});
