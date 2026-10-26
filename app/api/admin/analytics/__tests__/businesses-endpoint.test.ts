/**
 * Unit Tests for Admin Business Analytics Endpoint
 * Task 15.5: Write unit tests for analytics endpoints
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";

// Mock dependencies
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/auth/admin");

describe("GET /api/admin/analytics/businesses", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn(),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue({
      isAdmin: false,
      error: "Unauthorized",
    } as any);

    const { GET } = await import("../businesses/route");
    const request = new NextRequest("http://localhost:3000/api/admin/analytics/businesses");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 403 when user is not admin", async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue({
      isAdmin: false,
      error: "Forbidden",
    } as any);

    const { GET } = await import("../businesses/route");
    const request = new NextRequest("http://localhost:3000/api/admin/analytics/businesses");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should return business analytics summary for admin users", async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-1" },
    } as any);

    const mockCategories = [
      { id: "cat-1", name: "Category 1" },
      { id: "cat-2", name: "Category 2" },
    ];

    const mockCompletenessData = [
      { completeness_percentage: 80 },
      { completeness_percentage: 90 },
      { completeness_percentage: 70 },
    ];

    const mockStatesData = [
      { state: "Lagos" },
      { state: "Lagos" },
      { state: "Abuja" },
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "business_profiles") {
        return {
          select: vi.fn((columns?: string) => {
            if (columns === "*") {
              return {
                count: "exact",
                head: true,
                eq: vi.fn().mockResolvedValue({
                  count: 50,
                  error: null,
                }),
              };
            }
            if (columns === "completeness_percentage") {
              return Promise.resolve({
                data: mockCompletenessData,
                error: null,
              });
            }
            if (columns === "state") {
              return Promise.resolve({
                data: mockStatesData,
                error: null,
              });
            }
            return {
              eq: vi.fn().mockResolvedValue({
                count: 10,
                error: null,
              }),
            };
          }),
        };
      }
      if (table === "categories") {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockCategories,
            error: null,
          }),
        };
      }
      return {};
    });

    const { GET } = await import("../businesses/route");
    const request = new NextRequest("http://localhost:3000/api/admin/analytics/businesses");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("total_businesses");
    expect(data).toHaveProperty("verified_businesses");
    expect(data).toHaveProperty("premium_businesses");
    expect(data).toHaveProperty("active_businesses");
    expect(data).toHaveProperty("average_completeness");
    expect(data).toHaveProperty("businesses_by_category");
    expect(data).toHaveProperty("businesses_by_state");
  });

  it("should calculate average completeness correctly", async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-1" },
    } as any);

    const mockCompletenessData = [
      { completeness_percentage: 80 },
      { completeness_percentage: 90 },
      { completeness_percentage: 70 },
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "business_profiles") {
        return {
          select: vi.fn((columns?: string) => {
            if (columns === "completeness_percentage") {
              return Promise.resolve({
                data: mockCompletenessData,
                error: null,
              });
            }
            if (columns === "state") {
              return Promise.resolve({
                data: [],
                error: null,
              });
            }
            return {
              eq: vi.fn().mockResolvedValue({
                count: 3,
                error: null,
              }),
            };
          }),
        };
      }
      if (table === "categories") {
        return {
          select: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      }
      return {};
    });

    const { GET } = await import("../businesses/route");
    const request = new NextRequest("http://localhost:3000/api/admin/analytics/businesses");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.average_completeness).toBe(80); // (80 + 90 + 70) / 3 = 80
  });

  it("should group businesses by state correctly", async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-1" },
    } as any);

    const mockStatesData = [
      { state: "Lagos" },
      { state: "Lagos" },
      { state: "Abuja" },
      { state: "Lagos" },
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "business_profiles") {
        return {
          select: vi.fn((columns?: string, options?: any) => {
            if (options?.count === "exact" && options?.head === true) {
              // Return count queries with proper .eq() chaining or direct promise
              const chainable: any = {
                eq: vi.fn((column: string, value: any) => {
                  if (column === "is_verified" && value === true) {
                    return Promise.resolve({ count: 0, error: null });
                  }
                  if (column === "is_premium" && value === true) {
                    return Promise.resolve({ count: 0, error: null });
                  }
                  if (column === "is_active" && value === true) {
                    return Promise.resolve({ count: 0, error: null });
                  }
                  if (column === "primary_category_id") {
                    return Promise.resolve({ count: 0, error: null });
                  }
                  return Promise.resolve({ count: 4, error: null });
                }),
              };
              // Make it thenable so it can be awaited directly
              chainable.then = (resolve: any) => resolve({ count: 4, error: null });
              return chainable;
            }
            if (columns === "state") {
              return Promise.resolve({
                data: mockStatesData,
                error: null,
              });
            }
            if (columns === "completeness_percentage") {
              return Promise.resolve({
                data: [],
                error: null,
              });
            }
            return {
              eq: vi.fn().mockResolvedValue({
                count: 0,
                error: null,
              }),
            };
          }),
        };
      }
      if (table === "categories") {
        return {
          select: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };
      }
      return {};
    });

    const { GET } = await import("../businesses/route");
    const request = new NextRequest("http://localhost:3000/api/admin/analytics/businesses");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.businesses_by_state).toHaveLength(2);
    
    const lagosState = data.businesses_by_state.find((s: any) => s.state === "Lagos");
    expect(lagosState.business_count).toBe(3);
    expect(lagosState.percentage).toBeGreaterThan(0);
    expect(lagosState.percentage).toBe(75); // 3/4 * 100 = 75%

    const abujaState = data.businesses_by_state.find((s: any) => s.state === "Abuja");
    expect(abujaState.business_count).toBe(1);
    expect(abujaState.percentage).toBeGreaterThan(0);
    expect(abujaState.percentage).toBe(25); // 1/4 * 100 = 25%
  });
});
