/**
 * Tests for GET /api/moderation/queue endpoint
 *
 * Requirements: 6.6
 * Task: 10.2
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";
import { NextRequest } from "next/server";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: "admin-user-id", email: "admin@findam.admin" } },
          error: null,
        }),
      ),
    },
    from: vi.fn((table: string) => {
      // Mock for users table
      if (table === "users") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { role: "admin", email: "admin@findam.admin" },
                  error: null,
                }),
              ),
            })),
          })),
        };
      }

      // Mock for flagged_listings_queue table
      return {
        select: vi.fn(() => {
          const mockData = [
            {
              moderation_id: "mod-1",
              listing_id: "listing-1",
              user_id: "user-1",
              confidence_score: 75.5,
              violations: [
                {
                  type: "scam_indicators",
                  severity: "medium",
                  details: "Suspicious pricing",
                  confidence: 75,
                },
              ],
              flagged_at: "2024-01-01T00:00:00Z",
              listing_title: "Test Listing",
              listing_price: 10000,
              category_id: "cat-1",
              seller_username: "testuser",
              seller_email: "test@example.com",
            },
          ];

          const chainable: any = {
            is: vi.fn(() => chainable),
            eq: vi.fn(() => chainable),
            order: vi.fn(() => chainable),
            range: vi.fn(() =>
              Promise.resolve({
                data: mockData,
                error: null,
                count: 1,
              }),
            ),
          };

          return chainable;
        }),
      };
    }),
  })),
}));

describe("GET /api/moderation/queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip("should return flagged listings for admin users", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/moderation/queue?status=pending&page=0&limit=20",
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("pagination");
    expect(Array.isArray(data.data)).toBe(true);
  });

  it.skip("should support pagination parameters", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/moderation/queue?page=1&limit=10",
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination).toHaveProperty("page");
    expect(data.pagination).toHaveProperty("limit");
    expect(data.pagination).toHaveProperty("total");
  });

  it.skip("should support status filtering", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/moderation/queue?status=reviewed",
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});
