// Tests for business features
// Requirements: 21.1, 21.2, 21.3, 21.4, 21.5

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createBusiness,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  getBusinesses,
  linkListingToBusiness,
  getBusinessListings,
  submitBusinessVerification,
} from "../business";
import * as supabaseModule from "@/lib/supabase/client";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

describe("Business Service", () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create a chainable mock that returns itself for most methods
    // and properly handles being awaited
    const createChainableMock = () => {
      const chain: any = {
        auth: {
          getUser: vi.fn(),
        },
        // Make the chain thenable so it can be awaited
        then: vi.fn((resolve) => {
          resolve({ data: null, error: null });
          return Promise.resolve({ data: null, error: null });
        }),
        from: vi.fn(() => chain),
        select: vi.fn(() => chain),
        insert: vi.fn(() => chain),
        update: vi.fn(() => chain),
        delete: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        or: vi.fn(() => chain),
        range: vi.fn(() => chain),
        order: vi.fn(() => chain),
        single: vi.fn(() => chain),
        limit: vi.fn(() => chain),
      };
      return chain;
    };

    mockSupabase = createChainableMock();
    vi.mocked(supabaseModule.createClient).mockReturnValue(mockSupabase);
  });

  describe("createBusiness", () => {
    it("should create a business with valid data", async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const mockBusiness = {
        id: "business-123",
        owner_id: "user-123",
        name: "Test Business",
        description: "A test business",
        category_id: "cat-123",
        state: "Lagos",
        lga: "Ikeja",
        phone: "+2348012345678",
        is_active: true,
        is_verified: false,
        created_at: new Date().toISOString(),
      };

      mockSupabase.single.mockResolvedValue({
        data: mockBusiness,
        error: null,
      });

      const result = await createBusiness({
        name: "Test Business",
        description: "A test business",
        category_id: "cat-123",
        state: "Lagos",
        lga: "Ikeja",
        phone: "08012345678",
      });

      expect(result).toEqual(mockBusiness);
      expect(mockSupabase.from).toHaveBeenCalledWith("businesses");
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it("should throw error when user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Not authenticated"),
      });

      await expect(
        createBusiness({
          name: "Test Business",
          description: "A test business",
          category_id: "cat-123",
          state: "Lagos",
          lga: "Ikeja",
          phone: "08012345678",
        })
      ).rejects.toThrow("User must be authenticated");
    });

    it("should format phone number to +234 format", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: {
          id: "business-123",
          phone: "+2348012345678",
        },
        error: null,
      });

      await createBusiness({
        name: "Test Business",
        description: "A test business",
        category_id: "cat-123",
        state: "Lagos",
        lga: "Ikeja",
        phone: "08012345678",
      });

      // Check that insert was called with formatted phone
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: expect.stringContaining("+234"),
        })
      );
    });
  });

  describe("getBusinessById", () => {
    it("should retrieve a business by ID", async () => {
      const mockBusiness = {
        id: "business-123",
        name: "Test Business",
        description: "A test business",
        state: "Lagos",
        lga: "Ikeja",
        owner: {
          id: "user-123",
          username: "testuser",
          avatar_url: null,
          trust_score: 50,
        },
      };

      mockSupabase.single.mockResolvedValue({
        data: mockBusiness,
        error: null,
      });

      const result = await getBusinessById("business-123");

      expect(result).toEqual(mockBusiness);
      expect(mockSupabase.from).toHaveBeenCalledWith("businesses");
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "business-123");
    });

    it("should return null if business is not found", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116" },
      });

      const result = await getBusinessById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("getBusinesses", () => {
    it("should retrieve businesses with category filter", async () => {
      const mockBusinesses = [
        {
          id: "business-1",
          name: "Business 1",
          category_id: "cat-123",
          state: "Lagos",
          lga: "Ikeja",
          is_verified: true,
        },
        {
          id: "business-2",
          name: "Business 2",
          category_id: "cat-123",
          state: "Lagos",
          lga: "Surulere",
          is_verified: false,
        },
      ];

      // Mock the query being awaited - update the `then` method
      mockSupabase.then.mockImplementation((resolve) => {
        resolve({ data: mockBusinesses, error: null });
        return Promise.resolve({ data: mockBusinesses, error: null });
      });

      const result = await getBusinesses({
        category_id: "cat-123",
      });

      expect(result).toEqual(mockBusinesses);
      expect(mockSupabase.eq).toHaveBeenCalledWith("category_id", "cat-123");
      expect(mockSupabase.eq).toHaveBeenCalledWith("is_active", true);
    });

    it("should filter by location (state and LGA)", async () => {
      mockSupabase.then.mockImplementation((resolve) => {
        resolve({ data: [], error: null });
        return Promise.resolve({ data: [], error: null });
      });

      await getBusinesses({
        state: "Lagos",
        lga: "Ikeja",
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith("state", "Lagos");
      expect(mockSupabase.eq).toHaveBeenCalledWith("lga", "Ikeja");
    });

    it("should filter by verified status", async () => {
      mockSupabase.then.mockImplementation((resolve) => {
        resolve({ data: [], error: null });
        return Promise.resolve({ data: [], error: null });
      });

      await getBusinesses({
        is_verified: true,
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith("is_verified", true);
    });

    it("should search by name or description", async () => {
      mockSupabase.then.mockImplementation((resolve) => {
        resolve({ data: [], error: null });
        return Promise.resolve({ data: [], error: null });
      });

      await getBusinesses({
        search: "electronics",
      });

      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.stringContaining("electronics")
      );
    });
  });

  describe("linkListingToBusiness", () => {
    it("should link a listing to a business", async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      // For the ownership checks, we need to mock the `then` method responses
      // First call: business ownership check
      let callCount = 0;
      mockSupabase.then.mockImplementation((resolve) => {
        callCount++;
        if (callCount === 1) {
          // First: business ownership check
          resolve({ data: { owner_id: "user-123" }, error: null });
          return Promise.resolve({ data: { owner_id: "user-123" }, error: null });
        } else if (callCount === 2) {
          // Second: listing ownership check
          resolve({ data: { user_id: "user-123" }, error: null });
          return Promise.resolve({ data: { user_id: "user-123" }, error: null });
        } else {
          // Third: update operation
          resolve({ data: null, error: null });
          return Promise.resolve({ data: null, error: null });
        }
      });

      await linkListingToBusiness("listing-123", "business-123");

      expect(mockSupabase.update).toHaveBeenCalledWith({
        business_id: "business-123",
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "listing-123");
    });

    it("should throw error if user doesn't own the business", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      mockSupabase.then.mockImplementation((resolve) => {
        resolve({ data: { owner_id: "different-user" }, error: null });
        return Promise.resolve({ data: { owner_id: "different-user" }, error: null });
      });

      await expect(
        linkListingToBusiness("listing-123", "business-123")
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("submitBusinessVerification", () => {
    it("should submit verification documents", async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      // Mock business ownership check
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { owner_id: "user-123" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: "business-123",
            verification_documents: {
              documentType: "cac",
              status: "pending",
            },
          },
          error: null,
        });

      const verificationData = {
        documentType: "cac" as const,
        documentNumber: "RC123456",
        documentUrl: "https://example.com/doc.pdf",
        businessAddress: "123 Business St, Lagos",
      };

      const result = await submitBusinessVerification(
        "business-123",
        verificationData
      );

      expect(result.verification_documents).toBeDefined();
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          verification_documents: expect.objectContaining({
            documentType: "cac",
            documentNumber: "RC123456",
            status: "pending",
          }),
        })
      );
    });
  });

  describe("getBusinessListings", () => {
    it("should retrieve listings for a business", async () => {
      const mockListings = [
        {
          id: "listing-1",
          title: "Product 1",
          price: 10000,
          business_id: "business-123",
        },
        {
          id: "listing-2",
          title: "Product 2",
          price: 20000,
          business_id: "business-123",
        },
      ];

      mockSupabase.then.mockImplementation((resolve) => {
        resolve({ data: mockListings, error: null });
        return Promise.resolve({ data: mockListings, error: null });
      });

      const result = await getBusinessListings("business-123");

      expect(result).toEqual(mockListings);
      expect(mockSupabase.eq).toHaveBeenCalledWith("business_id", "business-123");
      expect(mockSupabase.eq).toHaveBeenCalledWith("is_active", true);
    });

    it("should limit results when limit is specified", async () => {
      mockSupabase.then.mockImplementation((resolve) => {
        resolve({ data: [], error: null });
        return Promise.resolve({ data: [], error: null });
      });

      await getBusinessListings("business-123", 5);

      expect(mockSupabase.limit).toHaveBeenCalledWith(5);
    });
  });

  describe("updateBusiness", () => {
    it("should update business information", async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      // Mock ownership check
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { owner_id: "user-123" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: "business-123",
            name: "Updated Business",
          },
          error: null,
        });

      const result = await updateBusiness("business-123", {
        name: "Updated Business",
      });

      expect(result.name).toBe("Updated Business");
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it("should format phone numbers in updates", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      mockSupabase.single
        .mockResolvedValueOnce({
          data: { owner_id: "user-123" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "business-123" },
          error: null,
        });

      await updateBusiness("business-123", {
        phone: "08012345678",
      });

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: expect.stringContaining("+234"),
        })
      );
    });
  });

  describe("deleteBusiness", () => {
    it("should delete a business", async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      // Mock the chain: first call is ownership check, second is delete
      let callCount = 0;
      mockSupabase.then.mockImplementation((resolve) => {
        callCount++;
        if (callCount === 1) {
          // First: ownership check
          resolve({ data: { owner_id: "user-123" }, error: null });
          return Promise.resolve({ data: { owner_id: "user-123" }, error: null });
        } else {
          // Second: delete operation
          resolve({ data: null, error: null });
          return Promise.resolve({ data: null, error: null });
        }
      });

      await deleteBusiness("business-123");

      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "business-123");
    });

    it("should throw error if user doesn't own the business", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      mockSupabase.then.mockImplementation((resolve) => {
        resolve({ data: { owner_id: "different-user" }, error: null });
        return Promise.resolve({ data: { owner_id: "different-user" }, error: null });
      });

      await expect(deleteBusiness("business-123")).rejects.toThrow(
        "Unauthorized"
      );
    });
  });
});
