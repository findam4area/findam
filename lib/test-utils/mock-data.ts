/**
 * Test Utilities - Mock Data Helpers
 * Provides consistent mock data for tests
 */

import type { User, Category, Listing, ListingWithRelations } from "@/lib/types/core";

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: "test-user-id",
    email: "test@example.com",
    phone: "+2348012345678",
    username: "testuser",
    full_name: "Test User",
    avatar_url: null,
    role: "user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockAdmin(overrides: Partial<User> = {}): User {
  return createMockUser({
    id: "test-admin-id",
    email: "admin@example.com",
    username: "adminuser",
    full_name: "Admin User",
    role: "admin",
    ...overrides,
  });
}

export function createMockCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "test-category-id",
    name: "Test Category",
    slug: "test-category",
    parent_id: null,
    description: "Test category description",
    image_url: null,
    display_order: 0,
    listing_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
