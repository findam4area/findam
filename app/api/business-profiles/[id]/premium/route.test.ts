/**
 * Unit tests for POST /api/business-profiles/[id]/premium
 * Task 11.2: Premium upgrade endpoint tests
 * Requirements: 15.1, 15.5, 15.6
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

describe("POST /api/business-profiles/[id]/premium", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
      update: vi.fn(() => mockSupabase),
      auth: {
        getUser: vi.fn(),
      },
    };
    
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  it("should return 401 if user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        tier: "basic",
        duration_months: 1,
        payment_method: "card",
      }),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "123e4567-e89b-12d3-a456-426614174000" }),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toContain("Unauthorized");
  });

  it("should return 400 for invalid UUID format", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        tier: "basic",
        duration_months: 1,
        payment_method: "card",
      }),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "invalid-uuid" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid business profile ID format");
  });

  it("should return 400 if required fields are missing", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        tier: "basic",
        // missing duration_months and payment_method
      }),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "123e4567-e89b-12d3-a456-426614174000" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("required");
  });

  it("should return 400 for invalid tier value", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        tier: "invalid",
        duration_months: 1,
        payment_method: "card",
      }),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "123e4567-e89b-12d3-a456-426614174000" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("tier must be one of");
  });

  it("should return 400 for invalid duration_months value", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        tier: "basic",
        duration_months: 5,
        payment_method: "card",
      }),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "123e4567-e89b-12d3-a456-426614174000" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("duration_months must be one of");
  });

  it("should return 404 if business profile not found", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        tier: "basic",
        duration_months: 1,
        payment_method: "card",
      }),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "123e4567-e89b-12d3-a456-426614174000" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Business profile not found");
  });

  it("should return 403 if user does not own the business profile", async () => {
    const userId = "user-123";
    const ownerId = "owner-456";

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    mockSupabase.single.mockResolvedValue({
      data: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: ownerId,
        business_name: "Test Business",
      },
      error: null,
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        tier: "basic",
        duration_months: 1,
        payment_method: "card",
      }),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "123e4567-e89b-12d3-a456-426614174000" }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain("Forbidden");
  });

  it("should return 400 if business already has active premium subscription", async () => {
    const userId = "user-123";
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 2);

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    mockSupabase.single.mockResolvedValue({
      data: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: userId,
        business_name: "Test Business",
        is_premium: true,
        premium_expires_at: futureDate.toISOString(),
      },
      error: null,
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        tier: "basic",
        duration_months: 1,
        payment_method: "card",
      }),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "123e4567-e89b-12d3-a456-426614174000" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("already has an active premium subscription");
  });

  it("should successfully upgrade to premium for basic tier", async () => {
    const userId = "user-123";
    const businessId = "123e4567-e89b-12d3-a456-426614174000";

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // First call to select (fetch existing profile)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: businessId,
        user_id: userId,
        business_name: "Test Business",
        is_premium: false,
      },
      error: null,
    });

    // Second call to select (after update)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: businessId,
        user_id: userId,
        business_name: "Test Business",
        is_premium: true,
        premium_tier: "basic",
        premium_expires_at: expect.any(String),
      },
      error: null,
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        tier: "basic",
        duration_months: 1,
        payment_method: "card",
      }),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: businessId }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.payment_url).toBeDefined();
    expect(body.subscription_id).toBeDefined();
    expect(body.business_profile.is_premium).toBe(true);
    expect(body.business_profile.premium_tier).toBe("basic");
  });

  it("should successfully upgrade to premium for pro tier with 12 months duration", async () => {
    const userId = "user-123";
    const businessId = "123e4567-e89b-12d3-a456-426614174000";

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // First call to select (fetch existing profile)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: businessId,
        user_id: userId,
        business_name: "Test Business",
        is_premium: false,
      },
      error: null,
    });

    // Second call to select (after update)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: businessId,
        user_id: userId,
        business_name: "Test Business",
        is_premium: true,
        premium_tier: "pro",
        premium_expires_at: expect.any(String),
      },
      error: null,
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        tier: "pro",
        duration_months: 12,
        payment_method: "bank_transfer",
      }),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: businessId }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.business_profile.premium_tier).toBe("pro");
  });

  it("should allow upgrade if previous premium subscription expired", async () => {
    const userId = "user-123";
    const businessId = "123e4567-e89b-12d3-a456-426614174000";
    const pastDate = new Date();
    pastDate.setMonth(pastDate.getMonth() - 1);

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // First call to select (fetch existing profile)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: businessId,
        user_id: userId,
        business_name: "Test Business",
        is_premium: true,
        premium_expires_at: pastDate.toISOString(),
      },
      error: null,
    });

    // Second call to select (after update)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: businessId,
        user_id: userId,
        business_name: "Test Business",
        is_premium: true,
        premium_tier: "basic",
        premium_expires_at: expect.any(String),
      },
      error: null,
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        tier: "basic",
        duration_months: 3,
        payment_method: "card",
      }),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: businessId }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
