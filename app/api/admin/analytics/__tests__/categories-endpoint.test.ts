/**
 * Unit Tests for Admin Category Analytics Endpoint
 * Task 15.5: Write unit tests for analytics endpoints
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";

// Mock dependencies
vi.mock("@/lib/supabase/server");
vi.mock("@/lib/auth/admin");

describe("GET /api/admin/analytics/categories", () => {
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

    const { GET } = await import("../categories/route");
    const request = new NextRequest("http://localhost:3000/api/admin/analytics/categories");

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

    const { GET } = await import("../categories/route");
    const request = new NextRequest("http://localhost:3000/api/admin/analytics/categories");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Forbidden");
  });

  it("should return category analytics for admin users", async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-1" },
    } as any);

    const mockCategories = [
      { id: "cat-1", name: "Category 1", parent_id: null },
      { id: "cat-2", name: "Category 2", parent_id: null },
    ];

    const mockAnalytics = [
      {
        category_id: "cat-1",
        business_count: 10,
        search_count: 50,
        view_count: 100,
        period_date: "2024-01-01",
        period_type: "daily",
      },
      {
        category_id: "cat-2",
        business_count: 0,
        search_count: 5,
        view_count: 10,
        period_date: "2024-01-01",
        period_type: "daily",
      },
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "categories") {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockCategories,
            error: null,
          }),
        };
      }
      if (table === "category_analytics") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({
                  data: mockAnalytics,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const { GET } = await import("../categories/route");
    const request = new NextRequest("http://localhost:3000/api/admin/analytics/categories");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("top_by_business_count");
    expect(data).toHaveProperty("top_by_search_count");
    expect(data).toHaveProperty("empty_categories");
    expect(data).toHaveProperty("trending_categories");
    expect(data.total_categories).toBe(2);
  });

  it("should identify empty categories correctly", async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-1" },
    } as any);

    const mockCategories = [
      { id: "cat-1", name: "Category 1", parent_id: null },
      { id: "cat-2", name: "Empty Category", parent_id: null },
    ];

    const mockAnalytics = [
      {
        category_id: "cat-1",
        business_count: 10,
        search_count: 50,
        view_count: 100,
        period_date: "2024-01-01",
        period_type: "daily",
      },
      {
        category_id: "cat-2",
        business_count: 0,
        search_count: 0,
        view_count: 0,
        period_date: "2024-01-01",
        period_type: "daily",
      },
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "categories") {
        return {
          select: vi.fn().mockResolvedValue({
            data: mockCategories,
            error: null,
          }),
        };
      }
      if (table === "category_analytics") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({
                  data: mockAnalytics,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const { GET } = await import("../categories/route");
    const request = new NextRequest("http://localhost:3000/api/admin/analytics/categories");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.empty_categories).toHaveLength(1);
    expect(data.empty_categories[0].category_name).toBe("Empty Category");
  });

  it("should validate period_type parameter", async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-1" },
    } as any);

    const { GET } = await import("../categories/route");
    const request = new NextRequest(
      "http://localhost:3000/api/admin/analytics/categories?period_type=invalid",
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Invalid period_type");
  });
});
