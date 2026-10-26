/**
 * Comparison Store Tests
 * Tests for product comparison state management
 * Requirements: 3.1, 3.6, 3.7, 3.10
 * Tasks: 22.6
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useComparisonStore } from "../comparison";
import type { Listing } from "@/lib/types";

// Mock listing data
const createMockListing = (id: string, categoryId: string): Listing => ({
  id,
  user_id: "user-1",
  title: `Test Listing ${id}`,
  description: "Test description",
  price: 10000,
  category_id: categoryId,
  subcategory_id: "subcat-1",
  condition: "new",
  state: "Lagos",
  lga: "Ikeja",
  is_boosted: false,
  is_active: true,
  views_count: 0,
  likes_count: 0,
  saves_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

describe("Comparison Store", () => {
  beforeEach(() => {
    // Reset store to initial state
    const { result } = renderHook(() => useComparisonStore());
    act(() => {
      result.current.clearComparison();
    });
  });

  describe("Initial State", () => {
    it("should have empty selectedListings", () => {
      const { result } = renderHook(() => useComparisonStore());
      expect(result.current.selectedListings).toEqual([]);
    });

    it("should have null categoryId", () => {
      const { result } = renderHook(() => useComparisonStore());
      expect(result.current.categoryId).toBeNull();
    });
  });

  describe("Adding Listings", () => {
    it("should add a listing successfully", () => {
      const { result } = renderHook(() => useComparisonStore());
      const listing = createMockListing("1", "cat-1");

      act(() => {
        const response = result.current.addListing(listing);
        expect(response.success).toBe(true);
      });

      expect(result.current.selectedListings).toHaveLength(1);
      expect(result.current.selectedListings[0].id).toBe("1");
      expect(result.current.categoryId).toBe("cat-1");
    });

    it("should add multiple listings from same category", () => {
      const { result } = renderHook(() => useComparisonStore());
      const listing1 = createMockListing("1", "cat-1");
      const listing2 = createMockListing("2", "cat-1");

      act(() => {
        result.current.addListing(listing1);
        result.current.addListing(listing2);
      });

      expect(result.current.selectedListings).toHaveLength(2);
    });

    it("should reject duplicate listing (Requirement 3.6)", () => {
      const { result } = renderHook(() => useComparisonStore());
      const listing = createMockListing("1", "cat-1");

      act(() => {
        result.current.addListing(listing);
        const response = result.current.addListing(listing);
        expect(response.success).toBe(false);
        expect(response.error).toContain("already in comparison");
      });

      expect(result.current.selectedListings).toHaveLength(1);
    });

    it("should reject more than 4 listings (Requirement 3.1)", () => {
      const { result } = renderHook(() => useComparisonStore());

      act(() => {
        result.current.addListing(createMockListing("1", "cat-1"));
        result.current.addListing(createMockListing("2", "cat-1"));
        result.current.addListing(createMockListing("3", "cat-1"));
        result.current.addListing(createMockListing("4", "cat-1"));

        const response = result.current.addListing(
          createMockListing("5", "cat-1"),
        );
        expect(response.success).toBe(false);
        expect(response.error).toContain("Maximum 4 listings");
      });

      expect(result.current.selectedListings).toHaveLength(4);
    });

    it("should reject listing from different category (Requirement 3.10)", () => {
      const { result } = renderHook(() => useComparisonStore());
      const listing1 = createMockListing("1", "cat-1");
      const listing2 = createMockListing("2", "cat-2");

      act(() => {
        result.current.addListing(listing1);
        const response = result.current.addListing(listing2);
        expect(response.success).toBe(false);
        expect(response.error).toContain("same category");
      });

      expect(result.current.selectedListings).toHaveLength(1);
    });
  });

  describe("Removing Listings", () => {
    it("should remove a listing", () => {
      const { result } = renderHook(() => useComparisonStore());
      const listing = createMockListing("1", "cat-1");

      act(() => {
        result.current.addListing(listing);
        result.current.removeListing("1");
      });

      expect(result.current.selectedListings).toHaveLength(0);
    });

    it("should clear categoryId when last listing removed", () => {
      const { result } = renderHook(() => useComparisonStore());
      const listing = createMockListing("1", "cat-1");

      act(() => {
        result.current.addListing(listing);
        result.current.removeListing("1");
      });

      expect(result.current.categoryId).toBeNull();
    });

    it("should keep categoryId when listings remain", () => {
      const { result } = renderHook(() => useComparisonStore());
      const listing1 = createMockListing("1", "cat-1");
      const listing2 = createMockListing("2", "cat-1");

      act(() => {
        result.current.addListing(listing1);
        result.current.addListing(listing2);
        result.current.removeListing("1");
      });

      expect(result.current.selectedListings).toHaveLength(1);
      expect(result.current.categoryId).toBe("cat-1");
    });
  });

  describe("Clearing Comparison", () => {
    it("should clear all listings", () => {
      const { result } = renderHook(() => useComparisonStore());

      act(() => {
        result.current.addListing(createMockListing("1", "cat-1"));
        result.current.addListing(createMockListing("2", "cat-1"));
        result.current.clearComparison();
      });

      expect(result.current.selectedListings).toHaveLength(0);
      expect(result.current.categoryId).toBeNull();
    });
  });

  describe("Checking Comparison Status", () => {
    it("should correctly identify if listing is in comparison", () => {
      const { result } = renderHook(() => useComparisonStore());
      const listing = createMockListing("1", "cat-1");

      act(() => {
        result.current.addListing(listing);
      });

      expect(result.current.isInComparison("1")).toBe(true);
      expect(result.current.isInComparison("2")).toBe(false);
    });
  });

  describe("Can Add Listing Check", () => {
    it("should return true for valid listing", () => {
      const { result } = renderHook(() => useComparisonStore());
      const listing = createMockListing("1", "cat-1");

      const check = result.current.canAddListing(listing);
      expect(check.canAdd).toBe(true);
    });

    it("should return false for duplicate", () => {
      const { result } = renderHook(() => useComparisonStore());
      const listing = createMockListing("1", "cat-1");

      act(() => {
        result.current.addListing(listing);
      });

      const check = result.current.canAddListing(listing);
      expect(check.canAdd).toBe(false);
      expect(check.error).toContain("Already in comparison");
    });

    it("should return false when at maximum", () => {
      const { result } = renderHook(() => useComparisonStore());

      act(() => {
        result.current.addListing(createMockListing("1", "cat-1"));
        result.current.addListing(createMockListing("2", "cat-1"));
        result.current.addListing(createMockListing("3", "cat-1"));
        result.current.addListing(createMockListing("4", "cat-1"));
      });

      const check = result.current.canAddListing(
        createMockListing("5", "cat-1"),
      );
      expect(check.canAdd).toBe(false);
      expect(check.error).toContain("Maximum 4 listings");
    });

    it("should return false for different category", () => {
      const { result } = renderHook(() => useComparisonStore());

      act(() => {
        result.current.addListing(createMockListing("1", "cat-1"));
      });

      const check = result.current.canAddListing(
        createMockListing("2", "cat-2"),
      );
      expect(check.canAdd).toBe(false);
      expect(check.error).toContain("Different category");
    });
  });
});
