/**
 * Unit tests for POST /api/admin/business-profiles/[id]/verify
 * Task 11.1: Verification endpoint tests
 * Requirements: 14.1, 14.4, 14.5
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  checkAdminAuth: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { checkAdminAuth } from "@/lib/auth/admin";

describe("POST /api/admin/business-profiles/[id]/verify", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
      update: vi.fn(() => mockSupabase),
    };
    
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  it("should return 401 if user is not authenticated", async () => {
    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: false,
      error: "Unauthorized",
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({}),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "123e4567-e89b-12d3-a456-426614174000" }),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("should return 403 if user is not an admin", async () => {
    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: false,
      error: "Forbidden",
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({}),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "123e4567-e89b-12d3-a456-426614174000" }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("should return 400 for invalid UUID format", async () => {
    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123", email: "admin@findam.admin" },
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({}),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "invalid-uuid" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid business profile ID format");
  });

  it("should return 404 if business profile not found", async () => {
    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123", email: "admin@findam.admin" },
    });

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({}),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "123e4567-e89b-12d3-a456-426614174000" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Business profile not found");
  });

  it("should return 400 if business profile is already verified", async () => {
    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123", email: "admin@findam.admin" },
    });

    mockSupabase.single.mockResolvedValue({
      data: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        business_name: "Test Business",
        is_verified: true,
        verified_at: new Date().toISOString(),
      },
      error: null,
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({}),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: "123e4567-e89b-12d3-a456-426614174000" }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Business profile is already verified");
  });

  it("should successfully verify business profile with verification notes", async () => {
    const businessId = "123e4567-e89b-12d3-a456-426614174000";
    const adminEmail = "admin@findam.admin";

    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123", email: adminEmail },
    });

    // First call to select (fetch existing profile)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: businessId,
        business_name: "Test Business",
        is_verified: false,
      },
      error: null,
    });

    // Second call to select (after update)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: businessId,
        business_name: "Test Business",
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_documents: {
          verified_by: adminEmail,
          verified_at: expect.any(String),
          notes: "Valid business registration",
        },
      },
      error: null,
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        verification_notes: "Valid business registration",
      }),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: businessId }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.business_profile.is_verified).toBe(true);
    expect(body.message).toBe("Business profile verified successfully");
  });

  it("should successfully verify business profile without verification notes", async () => {
    const businessId = "123e4567-e89b-12d3-a456-426614174000";
    const adminEmail = "admin@findam.admin";

    (checkAdminAuth as any).mockResolvedValue({
      isAdmin: true,
      user: { id: "admin-123", email: adminEmail },
    });

    // First call to select (fetch existing profile)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: businessId,
        business_name: "Test Business",
        is_verified: false,
      },
      error: null,
    });

    // Second call to select (after update)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: businessId,
        business_name: "Test Business",
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_documents: {
          verified_by: adminEmail,
          verified_at: expect.any(String),
          notes: null,
        },
      },
      error: null,
    });

    const mockRequest = {
      json: vi.fn().mockResolvedValue({}),
    } as any;

    const response = await POST(mockRequest, {
      params: Promise.resolve({ id: businessId }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.business_profile.is_verified).toBe(true);
  });
});
