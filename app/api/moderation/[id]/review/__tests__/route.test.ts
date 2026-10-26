/**
 * Tests for POST /api/moderation/:id/review endpoint
 *
 * Requirements: 6.6
 * Task: 10.3
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

// Mock admin auth
vi.mock("@/lib/auth/admin", () => ({
  requireAdmin: vi.fn(() => Promise.resolve(null)), // null means admin check passed
}));

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: "admin-user-id" } },
          error: null,
        }),
      ),
    },
    from: vi.fn((table: string) => {
      if (table === "moderation_results") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      listing_id: "listing-1",
                      user_id: "user-1",
                    },
                    error: null,
                  }),
                ),
              })),
            })),
          })),
        };
      }
      if (table === "listings") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: null,
              }),
            ),
          })),
        };
      }
      return {};
    }),
  })),
}));

describe("POST /api/moderation/:id/review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should approve a flagged listing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/moderation/mod-1/review",
      {
        method: "POST",
        body: JSON.stringify({
          decision: "approve",
          notes: "Looks legitimate",
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "mod-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.decision).toBe("approve");
  });

  it("should reject a flagged listing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/moderation/mod-1/review",
      {
        method: "POST",
        body: JSON.stringify({
          decision: "reject",
          notes: "Violates policy",
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "mod-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.decision).toBe("reject");
  });

  it("should reject invalid decision values", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/moderation/mod-1/review",
      {
        method: "POST",
        body: JSON.stringify({
          decision: "invalid",
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "mod-1" }),
    });

    expect(response.status).toBe(400);
  });

  it("should allow optional notes", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/moderation/mod-1/review",
      {
        method: "POST",
        body: JSON.stringify({
          decision: "approve",
        }),
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ id: "mod-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
